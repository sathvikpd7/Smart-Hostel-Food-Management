import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import net from 'net';
import { getDatabase, initializeDatabase as initializeDb } from './src/config/database.js';
import { z } from 'zod';
import type { Pool } from 'pg';
import { analyzeSentiment } from './src/services/sentimentAnalysis.js';
import { generateRecommendations } from './src/services/mealRecommendation.js';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { logger } from './src/utils/logger.js';
import { validate, RegisterSchema, LoginSchema, CreateBookingSchema, CreateFeedbackSchema, VerifyQRSchema, UpdateBookingStatusSchema, RateMealSchema, ResetPasswordSchema, UpdateUserSchema } from './src/middleware/validate.js';
import { getCached, setCache, invalidateCache, CacheKeys, CacheTTL } from './src/services/cache.service.js';

const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? '' : 'dev-secret');
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}
if (!process.env.JWT_SECRET && !isProduction) {
  console.warn('JWT_SECRET not set; using insecure dev secret');
}

const app = express();

// Simple Server-Sent Events (SSE) hub for realtime dashboard updates
const sseClients = new Set<Response>();

const broadcastEvent = (event: string, payload: Record<string, unknown> = {}) => {
  const data = JSON.stringify(payload);
  const deadClients: Response[] = [];

  for (const client of sseClients) {
    try {
      // Check if connection is still writable
      if (!client.writableEnded && !client.destroyed) {
        client.write(`event: ${event}\n`);
        client.write(`data: ${data}\n\n`);
      } else {
        deadClients.push(client);
      }
    } catch (err) {
      deadClients.push(client);
    }
  }

  // Remove dead clients
  deadClients.forEach(client => {
    sseClients.delete(client);
    try {
      if (!client.destroyed) {
        client.end();
      }
    } catch (e) {
      // Ignore errors when ending dead connections
    }
  });
};

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
const rawCorsOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '';
const corsOrigins = rawCorsOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isCorsOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true;
  if (corsOrigins.length === 0) return true;
  return corsOrigins.includes(origin);
};

app.use(cors({
  origin: (origin, callback) => {
    callback(null, isCorsOriginAllowed(origin));
  },
  credentials: true,
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// --- Rate Limiters ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true, legacyHeaders: false,
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 5,
  message: { message: 'AI rate limit exceeded. Please wait.' },
  standardHeaders: true, legacyHeaders: false,
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true, legacyHeaders: false,
});
app.use('/auth', authLimiter);
app.use('/api/ai', aiLimiter);
app.use(apiLimiter);

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const authenticateToken = async (req: Request, res: Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user as User;
    next();
  });
};

// --- Role-Based Access Control (RBAC) ---
const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: express.NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// --- Secure QR Code Generation (HMAC-signed) ---
const QR_SECRET = process.env.QR_SIGNING_SECRET || JWT_SECRET;

const generateSecureQR = (bookingId: string, userId: string, mealId: string): string => {
  const payload = JSON.stringify({
    bid: bookingId, uid: userId, mid: mealId,
    iat: Date.now(), nonce: crypto.randomBytes(8).toString('hex'),
  });
  const signature = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ d: payload, s: signature })).toString('base64url');
};

const verifySecureQR = (qrCode: string): { bookingId: string; userId: string; mealId: string } | null => {
  try {
    const decoded = JSON.parse(Buffer.from(qrCode, 'base64url').toString());
    const expectedSig = crypto.createHmac('sha256', QR_SECRET).update(decoded.d).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(decoded.s, 'hex'), Buffer.from(expectedSig, 'hex'))) return null;
    const p = JSON.parse(decoded.d);
    if (Date.now() - p.iat > 24 * 60 * 60 * 1000) return null;
    return { bookingId: p.bid, userId: p.uid, mealId: p.mid };
  } catch {
    return null;
  }
};

// Avoid favicon noise in dev
app.get('/favicon.ico', (req: Request, res: Response) => {
  res.status(204).end();
});

// Realtime updates via SSE
// EventSource API doesn't support custom headers, so accept token from query param
const authenticateSSE = (req: Request, res: Response, next: express.NextFunction) => {
  // Try Authorization header first, then fall back to query param
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || (req.query.token as string);
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user as User;
    next();
  });
};

app.get('/events', authenticateSSE, (req: Request, res: Response) => {
  try {
    const requestOrigin = req.headers.origin;
    if (!isCorsOriginAllowed(requestOrigin)) {
      return res.status(403).json({ message: 'CORS origin not allowed for SSE' });
    }

    // Prevent request timeout and optimize socket
    req.socket.setTimeout(0);
    req.socket.setNoDelay(true);
    req.socket.setKeepAlive(true, 30000); // Enable TCP keep-alive with 30s initial delay

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (requestOrigin) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.status(200);

    // Send initial connection message as a single write
    const initialMessage = `event: connected\ndata: ${JSON.stringify({ ok: true, timestamp: new Date().toISOString() })}\n\n`;
    res.write(initialMessage);

    // Add client to the set
    sseClients.add(res);

    // Send keep-alive ping every 20 seconds
    const keepAliveInterval = setInterval(() => {
      try {
        if (!res.writableEnded && !res.destroyed && !req.socket.destroyed) {
          res.write(`:ping\n\n`);
        } else {
          clearInterval(keepAliveInterval);
          sseClients.delete(res);
        }
      } catch (err) {
        console.error('Keep-alive write error:', err);
        clearInterval(keepAliveInterval);
        sseClients.delete(res);
      }
    }, 20000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(keepAliveInterval);
      sseClients.delete(res);
    });

    // Handle connection errors
    req.on('error', () => {
      clearInterval(keepAliveInterval);
      sseClients.delete(res);
    });

    // Handle response errors
    res.on('error', () => {
      clearInterval(keepAliveInterval);
      sseClients.delete(res);
    });

    // Handle response finish
    res.on('finish', () => {
      clearInterval(keepAliveInterval);
      sseClients.delete(res);
    });

  } catch (error) {
    console.error('Error setting up SSE connection:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to establish SSE connection' });
    }
  }
});

// Serve static files for frontend build/assets (production only)
if (isProduction) {
  // dist/public is where Vite MPA builds both index.html and admin.html
  app.use(express.static(path.join(__dirname, 'dist', 'public'), { index: false }));
  app.use(express.static(path.join(__dirname, 'dist'), { index: false }));
  app.use(express.static(path.join(__dirname, 'public'), { index: false }));
}

// Validation schema
const UserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roomNumber: z.string().min(1, 'Room number is required')
});

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  room_number: string;
  status: 'active' | 'inactive';
}

const MEAL_CUTOFFS: Record<'breakfast' | 'lunch' | 'dinner', { h: number; m: number }> = {
  breakfast: { h: 9, m: 30 },   // 09:30
  lunch: { h: 15, m: 0 },       // 15:00 (3 PM)
  dinner: { h: 22, m: 0 },      // 22:00 (10 PM)
};

const normalizeDateOnly = (value: string | Date) => {
  if (!value) return '';
  try {
    if (typeof value === 'string') {
      if (value.includes('T')) return value.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const date = new Date(value);
      return date.toISOString().split('T')[0];
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return String(value).split('T')[0];
  } catch (e) {
    console.error('Error normalizing date:', e);
    return '';
  }
};

const isBookingClosed = (date: string) => {
  const normalizedDate = normalizeDateOnly(date);
  const todayStr = new Date().toISOString().split('T')[0];
  if (!normalizedDate) return false;
  return normalizedDate < todayStr;
};

// Database holder (assigned after initializeDb)
let db: Pool | null = null;

// Initialize DB and admin, then start server
async function initializeDatabaseAndStart() {
  try {
    await initializeDb();
    db = getDatabase();
    if (!db) throw new Error('Database instance not available after initialization');

    // verify connection
    const client = await db.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('Database connection verified');

    await initializeAdmin();
    logger.info('Admin user ensured');

    await initializeWeeklyMenu();
    logger.info('Weekly menu ensured');

    // start server on available port
    const startPort = Number(process.env.PORT) || 3001;
    const availablePort = await findAvailablePort(startPort);
    app.listen(availablePort, () => {
      logger.info({ port: availablePort }, `Server running at http://localhost:${availablePort}`);
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to initialize database or start server');
    process.exit(1);
  }
}

const findAvailablePort = async (startPort: number): Promise<number> => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.on('error', () => {
      server.close();
      resolve(startPort + 1);
    });
    server.listen(startPort, () => {
      server.close();
      resolve(startPort);
    });
  });
};

// Health check endpoint for Render
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected'
  });
});

// Routes (use db! or check db present before queries)
app.post('/auth/register', validate(RegisterSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, password, roomNumber } = UserSchema.parse(req.body);
    if (!db) throw new Error('Database not initialized');

    // Sanitize and validate email
    const sanitizedEmail = email.trim().toLowerCase();

    const existingUser = await db.query('SELECT id FROM users WHERE LOWER(email) = $1', [sanitizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await db.query(
      'INSERT INTO users (id, name, email, password, role, room_number, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, name.trim(), sanitizedEmail, hashedPassword, 'student', roomNumber.trim(), 'active']
    );

    broadcastEvent('user-created', { id: userId, role: 'student' });

    const token = jwt.sign(
      {
        id: userId,
        email: sanitizedEmail,
        role: 'student',
        roomNumber: roomNumber.trim(),
        status: 'active'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      id: userId,
      name: name.trim(),
      email: sanitizedEmail,
      role: 'student',
      roomNumber: roomNumber.trim(),
      status: 'active'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
});

app.post('/users/:id/reset-password', authenticateToken, requireRole('admin'), validate(ResetPasswordSchema), async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { id } = req.params;
    const { newPassword } = req.body as { newPassword?: string };
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const check = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, id]);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

app.post('/users/bulk', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const users = req.body as Array<{ name: string; email: string; password: string; roomNumber: string; status?: 'active' | 'inactive' }>;
    if (!Array.isArray(users) || users.length === 0) return res.status(400).json({ message: 'Invalid payload' });

    const client = await db.connect();
    let created = 0;
    let skipped = 0;
    try {
      await client.query('BEGIN');
      for (const u of users) {
        if (!u.name || !u.email || !u.password || !u.roomNumber) { skipped++; continue; }
        const exists = await client.query('SELECT 1 FROM users WHERE email = $1', [u.email]);
        if (exists.rows.length > 0) { skipped++; continue; }
        const id = uuidv4();
        const hashed = await bcrypt.hash(u.password, 10);
        await client.query(
          'INSERT INTO users (id, name, email, password, role, room_number, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [id, u.name, u.email, hashed, 'student', u.roomNumber, u.status || 'active']
        );
        created++;
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Bulk create error:', e);
      return res.status(500).json({ message: 'Failed bulk import' });
    } finally {
      client.release();
    }
    if (created > 0) {
      broadcastEvent('user-created', { count: created });
    }
    res.status(201).json({ created, skipped });
  } catch (error) {
    console.error('Error in bulk users endpoint:', error);
    res.status(500).json({ message: 'Failed bulk import' });
  }
});

async function initializeAdmin() {
  try {
    if (!db) throw new Error('Database not initialized');
    console.log('Checking for admin user...');
    const adminResult = await db.query('SELECT * FROM users WHERE email = $1', ['admin@hostel.com']);
    const admin = adminResult.rows[0];
    if (!admin) {
      console.log('Admin user not found. Creating default admin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminId = uuidv4();
      await db.query(`
        INSERT INTO users (id, name, email, password, role, room_number, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [adminId, 'Admin', 'admin@hostel.com', hashedPassword, 'admin', '000', 'active']);
      console.log('✅ Admin user created successfully');
      console.log('📧 Email: admin@hostel.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('✅ Admin user already exists');
      console.log('📧 Email:', admin.email);
      console.log('👤 Name:', admin.name);
      console.log('📊 Status:', admin.status);
    }
  } catch (error) {
    console.error('❌ Failed to initialize admin user:', error);
  }
}

async function initializeWeeklyMenu() {
  try {
    if (!db) throw new Error('Database not initialized');

    // Check if menu already exists
    const menuResult = await db.query('SELECT COUNT(*) FROM weekly_menu');
    const menuCount = parseInt(menuResult.rows[0].count, 10);

    if (menuCount === 0) {
      console.log('Initializing default weekly menu...');

      const defaultMenu = [
        {
          day: 'monday',
          breakfast: ['Scrambled Eggs', 'Toast', 'Fruit Bowl', 'Coffee/Tea'],
          lunch: ['Grilled Chicken Sandwich', 'Fries', 'Green Salad', 'Iced Tea'],
          dinner: ['Spaghetti Bolognese', 'Garlic Bread', 'Caesar Salad', 'Ice Cream']
        },
        {
          day: 'tuesday',
          breakfast: ['Pancakes', 'Maple Syrup', 'Yogurt', 'Coffee/Tea'],
          lunch: ['Vegetable Curry', 'Rice', 'Naan Bread', 'Mango Lassi'],
          dinner: ['Grilled Salmon', 'Roasted Potatoes', 'Steamed Broccoli', 'Chocolate Cake']
        },
        {
          day: 'wednesday',
          breakfast: ['Oatmeal', 'Mixed Berries', 'Honey', 'Coffee/Tea'],
          lunch: ['Beef Burrito Bowl', 'Tortilla Chips', 'Guacamole', 'Lemonade'],
          dinner: ['Margherita Pizza', 'Garden Salad', 'Garlic Knots', 'Tiramisu']
        },
        {
          day: 'thursday',
          breakfast: ['Avocado Toast', 'Poached Eggs', 'Fruit Smoothie', 'Coffee/Tea'],
          lunch: ['Club Sandwich', 'Potato Chips', 'Coleslaw', 'Iced Tea'],
          dinner: ['Chicken Stir Fry', 'Steamed Rice', 'Spring Rolls', 'Fruit Salad']
        },
        {
          day: 'friday',
          breakfast: ['French Toast', 'Banana', 'Maple Syrup', 'Coffee/Tea'],
          lunch: ['Fish Tacos', 'Mexican Rice', 'Refried Beans', 'Horchata'],
          dinner: ['Beef Lasagna', 'Garlic Bread', 'Mixed Greens', 'Cheesecake']
        },
        {
          day: 'saturday',
          breakfast: ['Belgian Waffles', 'Whipped Cream', 'Fresh Berries', 'Coffee/Tea'],
          lunch: ['Chicken Caesar Wrap', 'Sweet Potato Fries', 'Fruit Cup', 'Iced Coffee'],
          dinner: ['BBQ Ribs', 'Corn on the Cob', 'Baked Beans', 'Apple Pie']
        },
        {
          day: 'sunday',
          breakfast: ['Breakfast Burrito', 'Salsa', 'Hash Browns', 'Coffee/Tea'],
          lunch: ['Mushroom Risotto', 'Garlic Bread', 'Rocket Salad', 'Tiramisu'],
          dinner: ['Roast Chicken', 'Mashed Potatoes', 'Gravy', 'Steamed Vegetables', 'Chocolate Mousse']
        }
      ];

      for (const menu of defaultMenu) {
        await db.query(
          `INSERT INTO weekly_menu (day, breakfast, lunch, dinner)
           VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb)
           ON CONFLICT (day) DO NOTHING`,
          [menu.day, JSON.stringify(menu.breakfast), JSON.stringify(menu.lunch), JSON.stringify(menu.dinner)]
        );
      }

      console.log('Default weekly menu initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize weekly menu:', error);
  }
}

app.post('/auth/login', validate(LoginSchema), async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      logger.warn('Login attempt failed: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase();

    if (!sanitizedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      logger.warn({ email: sanitizedEmail }, 'Login attempt failed: Invalid email format');
      return res.status(400).json({ message: 'Invalid email format' });
    }

    logger.info({ email: sanitizedEmail }, 'Login attempt');
    const result = await db.query('SELECT * FROM users WHERE LOWER(email) = $1', [sanitizedEmail]);
    const user = result.rows[0] as User | undefined;

    if (!user) {
      logger.warn({ email: sanitizedEmail }, 'Login failed: User not found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    logger.debug({ email: user.email, status: user.status, role: user.role }, 'User found');

    if (user.status === 'inactive') {
      logger.warn({ email: sanitizedEmail }, 'Login failed: Account inactive');
      return res.status(403).json({ message: 'Account is inactive. Please contact administrator.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      logger.warn({ email: sanitizedEmail }, 'Login failed: Invalid password');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        roomNumber: user.room_number,
        status: user.status
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info({ email: sanitizedEmail, role: user.role }, 'Login successful');
    res.json({
      token,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roomNumber: user.room_number,
      status: user.status
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/users', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const page = Math.max(parseInt((req.query.page as string) || '1'), 1);
    const pageSize = Math.min(Math.max(parseInt((req.query.pageSize as string) || '10'), 1), 100);
    const allowedSort = new Set(['name', 'email', 'room_number', 'status']);
    const sortBy = (req.query.sortBy as string) || 'name';
    const sortOrder = ((req.query.sortOrder as string) || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const search = (req.query.search as string) || '';

    const sortColumn = allowedSort.has(sortBy) ? sortBy : 'name';
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: (string | number)[] = [];
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      whereClause = `WHERE LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length}`;
    }

    // Use Promise.all for parallel execution
    const [totalRes, usersRes] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM users ${whereClause}`, params),
      db.query(
        `SELECT id, name, email, role, room_number, status
         FROM users
         ${whereClause}
         ORDER BY ${sortColumn} ${sortOrder}
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize, offset]
      )
    ]);

    res.json({
      data: usersRes.rows,
      total: parseInt(totalRes.rows[0].count, 10),
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.get('/users/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { id } = req.params;
    const result = await db.query('SELECT id, name, email, role, room_number, status FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

app.put('/users/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { id } = req.params;
    const { name, email, roomNumber, status } = req.body;
    if (!name || !email || !roomNumber || !status) return res.status(400).json({ message: 'All fields are required' });

    const checkResult = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    await db.query(
      'UPDATE users SET name = $1, email = $2, room_number = $3, status = $4 WHERE id = $5',
      [name, email, roomNumber, status, id]
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

app.delete('/users/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { id } = req.params;

    // Validate UUID format
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const checkResult = await db.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of admin users
    if (checkResult.rows[0].role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM feedbacks WHERE user_id = $1', [id]);
      await client.query('DELETE FROM bookings WHERE user_id = $1', [id]);
      await client.query('DELETE FROM users WHERE id = $1', [id]);
      await client.query('COMMIT');

      broadcastEvent('user-deleted', { id });
    } catch (txErr) {
      await client.query('ROLLBACK');
      console.error('Transaction error deleting user:', txErr);
      return res.status(500).json({ message: 'Failed to delete user due to related records' });
    } finally {
      client.release();
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

app.get('/meals', async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');

    // Check cache first
    const cached = getCached<any[]>(CacheKeys.MEALS_LIST);
    if (cached) return res.json(cached);

    const result = await db.query('SELECT * FROM meals');
    setCache(CacheKeys.MEALS_LIST, result.rows, CacheTTL.MEALS_LIST);
    res.json(result.rows);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching meals');
    res.status(500).json({ message: 'Failed to fetch meals' });
  }
});

interface MenuItem {
  items?: string[];
  [key: string]: unknown;
}

interface MenuRow {
  day: string;
  breakfast: string[] | MenuItem;
  lunch: string[] | MenuItem;
  dinner: string[] | MenuItem;
}

app.get('/menu/weekly', async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');

    // Check cache first
    const cached = getCached<any[]>(CacheKeys.WEEKLY_MENU);
    if (cached) return res.json(cached);

    const result = await db.query('SELECT day, breakfast, lunch, dinner FROM weekly_menu');

    const menu = result.rows.map((row: MenuRow) => ({
      day: row.day,
      breakfast: Array.isArray(row.breakfast) ? row.breakfast : (row.breakfast as MenuItem)?.items || [],
      lunch: Array.isArray(row.lunch) ? row.lunch : (row.lunch as MenuItem)?.items || [],
      dinner: Array.isArray(row.dinner) ? row.dinner : (row.dinner as MenuItem)?.items || [],
    }));

    setCache(CacheKeys.WEEKLY_MENU, menu, CacheTTL.WEEKLY_MENU);
    res.json(menu);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching weekly menu');
    res.status(500).json({ message: 'Failed to fetch weekly menu' });
  }
});

app.put('/menu/weekly', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const menuItems = req.body as Array<{ day: string; breakfast: string[]; lunch: string[]; dinner: string[] }>;
    if (!Array.isArray(menuItems) || menuItems.length === 0) return res.status(400).json({ message: 'Invalid menu payload' });

    for (const item of menuItems) {
      await db.query(
        `INSERT INTO weekly_menu (day, breakfast, lunch, dinner)
         VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb)
         ON CONFLICT (day) DO UPDATE SET
           breakfast = EXCLUDED.breakfast,
           lunch = EXCLUDED.lunch,
           dinner = EXCLUDED.dinner`,
        [item.day, JSON.stringify(item.breakfast), JSON.stringify(item.lunch), JSON.stringify(item.dinner)]
      );
    }

    // Invalidate menu cache on update
    invalidateCache(CacheKeys.WEEKLY_MENU);
    res.json({ message: 'Weekly menu updated successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Error updating weekly menu');
    res.status(500).json({ message: 'Failed to update weekly menu' });
  }
});

app.get('/bookings', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');

    // Pagination + optional filters
    const page = Math.max(parseInt((req.query.page as string) || '1'), 1);
    const pageSize = Math.min(Math.max(parseInt((req.query.pageSize as string) || '50'), 1), 200);
    const offset = (page - 1) * pageSize;
    const userId = req.query.userId as string;
    const status = req.query.status as string;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (userId) {
      params.push(userId);
      conditions.push(`user_id = $${params.length}`);
    }
    if (status && ['booked', 'consumed', 'cancelled'].includes(status)) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRes, dataRes] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM bookings ${whereClause}`, params),
      db.query(
        `SELECT id, user_id, meal_id, date::text as date, type, status, qr_code, created_at
         FROM bookings ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize, offset]
      ),
    ]);

    res.json({
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count, 10),
      page,
      pageSize,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching bookings');
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

app.post('/bookings', authenticateToken, validate(CreateBookingSchema), async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { userId, mealId, date, type } = req.body;
    if (!userId || !mealId || !date || !type) {
      return res.status(400).json({ message: 'userId, mealId, date, and type are required' });
    }
    if (!['breakfast', 'lunch', 'dinner'].includes(type)) {
      return res.status(400).json({ message: 'Invalid meal type' });
    }
    const normalizedDate = normalizeDateOnly(date);
    if (!normalizedDate) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    if (isBookingClosed(normalizedDate)) {
      return res.status(400).json({ message: `Booking closed for ${type}` });
    }

    // Check if booking already exists for this user, meal, and date
    const existingBooking = await db.query(
      'SELECT id FROM bookings WHERE user_id = $1 AND meal_id = $2 AND date = $3 AND status != $4',
      [userId, mealId, normalizedDate, 'cancelled']
    );
    if (existingBooking.rows.length > 0) {
      return res.status(400).json({ message: 'You have already booked this meal' });
    }

    const bookingId = uuidv4();
    const qrCode = generateSecureQR(bookingId, userId, mealId);

    const result = await db.query(
      `INSERT INTO bookings (id, user_id, meal_id, date, type, status, qr_code, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, timezone('Asia/Kolkata', NOW())) 
       RETURNING 
         id, 
         user_id, 
         meal_id, 
         date::text as date, 
         type, 
         status, 
         qr_code, 
         created_at`,
      [bookingId, userId, mealId, normalizedDate, type, 'booked', qrCode]
    );

    broadcastEvent('booking-created', { id: bookingId });
    invalidateCache(CacheKeys.DASHBOARD_STATS);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error({ err: error }, 'Error creating booking');
    res.status(500).json({ message: 'Failed to create booking' });
  }
});

app.patch('/bookings/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { id } = req.params;
    const { status } = req.body;

    if (!['booked', 'consumed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const result = await db.query(
      `UPDATE bookings SET status = $1 WHERE id = $2 
       RETURNING 
         id, 
         user_id, 
         meal_id, 
         date::text as date, 
         type, 
         status, 
         qr_code, 
         created_at`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    broadcastEvent('booking-updated', { id: result.rows[0]?.id, status });
    invalidateCache(CacheKeys.DASHBOARD_STATS);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error({ err: error }, 'Error updating booking');
    res.status(500).json({ message: 'Failed to update booking' });
  }
});

app.put('/bookings/:id/consume', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { id } = req.params;
    const result = await db.query(
      `UPDATE bookings SET status = $1 WHERE id = $2 
       RETURNING 
         id, 
         user_id, 
         meal_id, 
         date::text as date, 
         type, 
         status, 
         qr_code, 
         created_at`,
      ['consumed', id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    broadcastEvent('booking-updated', { id: result.rows[0]?.id, status: 'consumed' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking booking as consumed:', error);
    res.status(500).json({ message: 'Failed to mark booking as consumed' });
  }
});

// Verify QR code (admin endpoint for scanning)
app.post('/bookings/verify-qr', authenticateToken, requireRole('admin'), validate(VerifyQRSchema), async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { qrCode } = req.body;
    if (!qrCode) return res.status(400).json({ message: 'QR code is required' });

    const decoded = verifySecureQR(qrCode);
    if (!decoded) return res.status(400).json({ message: 'Invalid or expired QR code' });

    const result = await db.query(
      `SELECT b.id, b.user_id, b.meal_id, b.date::text as date, b.type, b.status,
              u.name as user_name, u.room_number
       FROM bookings b JOIN users u ON b.user_id = u.id
       WHERE b.id = $1`,
      [decoded.bookingId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    const booking = result.rows[0];
    if (booking.status === 'consumed') return res.status(400).json({ message: 'Meal already consumed' });
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking was cancelled' });

    res.json({
      valid: true,
      booking: {
        id: booking.id, userName: booking.user_name, roomNumber: booking.room_number,
        type: booking.type, date: booking.date, status: booking.status,
      },
    });
  } catch (error) {
    console.error('Error verifying QR code:', error);
    res.status(500).json({ message: 'Failed to verify QR code' });
  }
});

app.post('/bookings/:id/rate', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { id } = req.params;
    const { rating, comment } = req.body as { rating: number; comment?: string };
    if (typeof rating !== 'number' || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });

    const bookingRes = await db.query('SELECT user_id, meal_id FROM bookings WHERE id = $1', [id]);
    if (bookingRes.rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    const { user_id, meal_id } = bookingRes.rows[0];

    const insertRes = await db.query(
      'INSERT INTO feedbacks (id, user_id, meal_id, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [uuidv4(), user_id, meal_id, rating, comment || null]
    );
    res.status(201).json(insertRes.rows[0]);
  } catch (error) {
    console.error('Error rating meal:', error);
    res.status(500).json({ message: 'Failed to rate meal' });
  }
});

app.get('/feedbacks', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const result = await db.query('SELECT * FROM feedbacks');

    // Add sentiment analysis to existing feedbacks if they don't have it
    const feedbacksWithSentiment = result.rows.map((feedback: any) => {
      if (!feedback.sentiment && (feedback.comment || feedback.rating)) {
        const sentiment = analyzeSentiment(feedback.comment || '', feedback.rating);
        return { ...feedback, sentiment };
      }
      return feedback;
    });

    res.json(feedbacksWithSentiment);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ message: 'Failed to fetch feedbacks' });
  }
});

app.post('/feedbacks', authenticateToken, validate(CreateFeedbackSchema), async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { userId, mealId, rating, comment } = req.body;

    // Validate inputs
    if (!userId || !mealId || !rating) {
      return res.status(400).json({ message: 'userId, mealId, and rating are required' });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    // Check if user already gave feedback for this meal
    const existingFeedback = await db.query(
      'SELECT id FROM feedbacks WHERE user_id = $1 AND meal_id = $2',
      [userId, mealId]
    );

    if (existingFeedback.rows.length > 0) {
      return res.status(400).json({ message: 'You have already provided feedback for this meal' });
    }

    // Analyze sentiment before storing
    const sentiment = analyzeSentiment(comment || '', rating);

    const feedbackId = uuidv4();
    const result = await db.query(
      'INSERT INTO feedbacks (id, user_id, meal_id, rating, comment, sentiment) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [feedbackId, userId, mealId, rating, comment ? comment.trim().substring(0, 500) : null, JSON.stringify(sentiment)]
    );

    const feedback = result.rows[0];
    // Parse sentiment back to object for response
    if (feedback.sentiment && typeof feedback.sentiment === 'string') {
      feedback.sentiment = JSON.parse(feedback.sentiment);
    }

    broadcastEvent('feedback-created', { id: feedback?.id });
    invalidateCache(CacheKeys.DASHBOARD_STATS);
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ message: 'Failed to create feedback' });
  }
});

// AI Sentiment Analysis endpoint - analyze text without storing
app.post('/api/analyze-sentiment', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { text, rating } = req.body;

    if (!text && !rating) {
      return res.status(400).json({ message: 'Text or rating is required' });
    }

    const sentiment = analyzeSentiment(text || '', rating);
    res.json(sentiment);
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ message: 'Failed to analyze sentiment' });
  }
});

// Analytics Dashboard endpoint - get aggregated statistics (SQL-optimized + cached)
app.get('/api/dashboard-stats', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');

    // Check cache first
    const cached = getCached<object>(CacheKeys.DASHBOARD_STATS);
    if (cached) return res.json(cached);

    // Push ALL aggregation to PostgreSQL — zero rows loaded into Node.js
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'student')::int AS total_students,
        (SELECT COUNT(*) FROM bookings WHERE status != 'cancelled')::int AS total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE date = CURRENT_DATE AND status != 'cancelled')::int AS today_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'consumed')::int AS consumed_meals,
        (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled')::int AS cancelled_bookings,
        COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM feedbacks), 0) AS average_rating,
        (SELECT COUNT(*) FROM feedbacks)::int AS total_feedbacks
    `);

    const row = result.rows[0];
    const stats = {
      totalStudents: row.total_students,
      totalBookings: row.total_bookings,
      todayBookings: row.today_bookings,
      consumedMeals: row.consumed_meals,
      cancelledBookings: row.cancelled_bookings,
      averageRating: parseFloat(row.average_rating).toFixed(2),
      totalFeedbacks: row.total_feedbacks,
      timestamp: new Date().toISOString(),
    };

    // Cache for 30 seconds
    setCache(CacheKeys.DASHBOARD_STATS, stats, CacheTTL.DASHBOARD_STATS);
    res.json(stats);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching dashboard stats');
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// AI Feedback Summary endpoint (Groq - Fast & Free)
app.post('/api/ai/feedback-summary', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const apiKey = process.env.GROQ_API_KEY;

    // If no API key, return a mock summary instead of error
    if (!apiKey) {
      console.warn('⚠️ Groq API key not configured - returning mock summary');
      const mockSummary = `**Overall Summary:**
Based on the feedback received, students generally appreciate the meal quality but have concerns about variety and timing.

**Top Complaints:**
• Limited variety in daily menu options
• Meal portions could be more consistent
• Temperature of food needs improvement during service

**Action Items:**
• Introduce more diverse menu options weekly
• Review and standardize portion sizes
• Implement better hot food holding procedures`;

      const insertRes = await db.query(
        `INSERT INTO ai_summaries (id, summary, created_at) VALUES ($1, $2, timezone('Asia/Kolkata', NOW())) 
         RETURNING id, summary, created_at`,
        [uuidv4(), mockSummary]
      );

      return res.json(insertRes.rows[0]);
    }

    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    const feedbacks = Array.isArray(req.body?.feedbacks) ? req.body.feedbacks : [];

    if (feedbacks.length === 0) {
      return res.status(400).json({ message: 'feedbacks array is required' });
    }

    console.log(`🤖 Generating AI summary using Groq API with model: ${model}`);
    console.log(`📊 Processing ${feedbacks.length} feedback entries`);

    const items = feedbacks
      .slice(0, 30)
      .map((f: { rating?: number; comment?: string; date?: string }, i: number) => {
        const rating = typeof f.rating === 'number' ? `Rating: ${f.rating}/5` : 'Rating: N/A';
        const comment = (f.comment || '').trim();
        const date = f.date ? `Date: ${f.date}` : '';
        return `${i + 1}. ${rating}${date ? ` | ${date}` : ''} | Comment: ${comment || 'No comment'}`;
      })
      .join('\n');

    const prompt = [
      'You are an assistant summarizing hostel meal feedback for admins.',
      'Summarize the feedback into 3 sections:',
      '1) Overall summary (2-3 sentences).',
      '2) Top complaints (3 bullets).',
      '3) Action items (3 bullets).',
      'Use concise, actionable language. Avoid personal data.',
      '',
      'Feedback list:',
      items
    ].join('\n');

    const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes meal feedback for hostel administrators.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!aiRes.ok) {
      const err: any = await aiRes.json().catch(() => ({}));
      console.error('❌ Groq API error:', {
        status: aiRes.status,
        statusText: aiRes.statusText,
        model: model,
        error: err
      });

      // Return mock summary on API error
      console.warn('⚠️ Falling back to mock summary due to API error');
      const mockSummary = `**Overall Summary:**
Based on ${feedbacks.length} feedback entries, the meal service shows mixed reviews. Students appreciate the effort but suggest improvements in consistency and variety.

**Top Complaints:**
• Inconsistent food quality across different meal times
• Limited options for dietary restrictions
• Service timing could be more flexible

**Action Items:**
• Implement quality control measures
• Expand menu to include more dietary options
• Review serving schedules based on student feedback`;

      const insertRes = await db.query(
        `INSERT INTO ai_summaries (id, summary, created_at) VALUES ($1, $2, timezone('Asia/Kolkata', NOW())) 
         RETURNING id, summary, created_at`,
        [uuidv4(), mockSummary]
      );

      return res.json(insertRes.rows[0]);
    }

    const data: any = await aiRes.json();
    const summary = data.choices?.[0]?.message?.content?.trim() || 'No summary generated';

    console.log('✅ Real AI summary generated successfully!');
    console.log('📝 Summary length:', summary.length, 'characters');

    const insertRes = await db.query(
      `INSERT INTO ai_summaries (id, summary, created_at) VALUES ($1, $2, timezone('Asia/Kolkata', NOW())) 
       RETURNING id, summary, created_at`,
      [uuidv4(), summary]
    );

    res.json(insertRes.rows[0]);
  } catch (error) {
    console.error('Error generating feedback summary:', error);

    // Return a fallback response instead of error
    try {
      if (!db) throw error;
      const fallbackSummary = `**Overall Summary:**
An error occurred while generating the AI summary. Manual review of feedback is recommended.

**Top Complaints:**
• Unable to process feedback automatically
• Please review individual feedback entries
• System experiencing technical difficulties

**Action Items:**
• Check OpenAI API configuration
• Review feedback entries manually
• Contact system administrator for assistance`;

      const insertRes = await db.query(
        `INSERT INTO ai_summaries (id, summary, created_at) VALUES ($1, $2, timezone('Asia/Kolkata', NOW())) 
         RETURNING id, summary, created_at`,
        [uuidv4(), fallbackSummary]
      );

      res.json(insertRes.rows[0]);
    } catch (dbError) {
      res.status(500).json({ message: 'Failed to generate feedback summary' });
    }
  }
});

// AI Feedback Summary history
app.get('/api/ai/feedback-summary', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const result = await db.query(
      `SELECT 
         id, 
         summary, 
         created_at
       FROM ai_summaries 
       ORDER BY created_at DESC 
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching AI summaries:', error);
    res.status(500).json({ message: 'Failed to fetch AI summaries' });
  }
});

// AI Menu Planner endpoint (Groq - Generate weekly menu)
app.post('/api/ai/menu-planner', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const apiKey = process.env.GROQ_API_KEY;

    const {
      budgetPerMeal = 50,
      dietaryPreferences = ['Vegetarian', 'Non-Vegetarian'],
      seasonalPreference = true,
      optimizeFor = 'satisfaction',
      excludeIngredients = []
    } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        message: 'Groq API key not configured. Please add GROQ_API_KEY to environment variables.'
      });
    }

    console.log('🍽️ Generating AI menu planner with parameters:', {
      budgetPerMeal,
      dietaryPreferences,
      seasonalPreference,
      optimizeFor
    });

    // Get recent feedback data to understand preferences
    const feedbackResult = await db.query(
      `SELECT rating, comment, date
       FROM feedbacks 
       WHERE rating IS NOT NULL 
       ORDER BY date DESC 
       LIMIT 50`
    );

    // Calculate average rating from all feedback
    const ratings = feedbackResult.rows
      .map((f: any) => f.rating)
      .filter((r: number) => r > 0);

    const avgRating = ratings.length > 0
      ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1)
      : '0';

    const avgRatings = `Overall: ${avgRating}/5 stars (${ratings.length} reviews)`;

    // Extract common themes from feedback
    const comments = feedbackResult.rows
      .filter((f: any) => f.comment && f.comment.trim())
      .map((f: any) => f.comment)
      .slice(0, 20)
      .join('; ');

    // Determine seasonal ingredients
    const month = new Date().getMonth();
    let seasonalIngredients = '';
    if (seasonalPreference) {
      if (month >= 2 && month <= 5) {
        seasonalIngredients = 'Summer: cucumber, watermelon, mango, tomatoes, capsicum, bottle gourd';
      } else if (month >= 6 && month <= 9) {
        seasonalIngredients = 'Monsoon: corn, leafy greens, ridge gourd, bitter gourd, snake gourd';
      } else {
        seasonalIngredients = 'Winter: carrots, cauliflower, peas, beans, spinach, radish';
      }
    }

    const excludeText = excludeIngredients.length > 0
      ? `Avoid these ingredients: ${excludeIngredients.join(', ')}.`
      : '';

    const prompt = `You are a professional hostel menu planner. Create a weekly menu (Monday-Sunday) optimized for student satisfaction.

**Requirements:**
- Budget per meal: ₹${budgetPerMeal}
- Dietary preferences: ${dietaryPreferences.join(', ')}
- Optimize for: ${optimizeFor}
${excludeText}
${seasonalPreference ? `- Use seasonal ingredients: ${seasonalIngredients}` : ''}

**Student Feedback Context:**
- Recent average ratings: ${avgRatings || 'No data'}
- Common feedback themes: ${comments || 'Good variety needed'}

**For each day, provide:**
1. Breakfast items (2-3 items)
2. Lunch items (3-4 items including dal, sabzi, rice/roti, dessert)
3. Dinner items (3-4 items including dal, sabzi, rice/roti, side)

**Format your response as JSON:**
{
  "menus": [
    {
      "day": "Monday",
      "breakfast": ["Poha", "Tea/Coffee", "Banana"],
      "lunch": ["Dal Tadka", "Mix Veg Curry", "Rice", "Chapati", "Pickle"],
      "dinner": ["Rajma", "Aloo Gobi", "Rice", "Chapati", "Raita"],
      "estimatedCost": 45,
      "nutritionScore": 85
    }
    // ... repeat for all 7 days
  ],
  "insights": {
    "recommendations": [
      "Include more protein-rich options",
      "Add variety in breakfast menu",
      "Consider student preferences from feedback"
    ]
  }
}

Generate the complete 7-day menu now.`;

    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert hostel food menu planner. Always respond with valid JSON only, no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    });

    if (!aiRes.ok) {
      const err: any = await aiRes.json().catch(() => ({}));
      console.error('❌ Groq API error:', {
        status: aiRes.status,
        error: err
      });
      return res.status(500).json({
        message: 'Failed to generate menu from AI',
        error: err
      });
    }

    const data: any = await aiRes.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return res.status(500).json({ message: 'No content generated from AI' });
    }

    console.log('✅ AI menu generated successfully');

    // Parse JSON response
    let menuData;
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonString = jsonMatch[1] || content;
      menuData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return res.status(500).json({
        message: 'Failed to parse AI menu response',
        rawContent: content
      });
    }

    // Calculate total cost and nutrition score
    const totalCost = menuData.menus?.reduce((sum: number, m: any) => sum + (m.estimatedCost || 0), 0) || 0;
    const avgNutrition = menuData.menus?.reduce((sum: number, m: any) => sum + (m.nutritionScore || 0), 0) / 7 || 0;

    const response = {
      menus: menuData.menus || [],
      insights: {
        totalEstimatedCost: totalCost,
        avgNutritionScore: Math.round(avgNutrition),
        recommendations: menuData.insights?.recommendations || []
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating menu plan:', error);
    res.status(500).json({ message: 'Failed to generate menu plan' });
  }
});

// AI Meal Recommendations endpoint
app.post('/api/recommendations', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { userId, availableMeals, topN = 5 } = req.body;

    if (!userId || !availableMeals) {
      return res.status(400).json({ message: 'userId and availableMeals are required' });
    }

    // Fetch user's bookings
    const bookingsResult = await db.query(
      `SELECT 
         id, 
         user_id, 
         meal_id, 
         date::text as date, 
         type, 
         status, 
         qr_code, 
         created_at
       FROM bookings 
       WHERE user_id = $1`,
      [userId]
    );
    const userBookings = bookingsResult.rows.map((b: any) => ({
      id: b.id,
      userId: b.user_id,
      mealId: b.meal_id,
      date: b.date,
      type: b.type,
      status: b.status,
      qrCode: b.qr_code,
      createdAt: b.created_at
    }));

    // Fetch user's feedbacks
    const feedbacksResult = await db.query(
      'SELECT * FROM feedbacks WHERE user_id = $1',
      [userId]
    );
    const userFeedbacks = feedbacksResult.rows.map((f: any) => ({
      id: f.id,
      userId: f.user_id,
      mealId: f.meal_id,
      rating: f.rating,
      comment: f.comment,
      date: f.date || new Date().toISOString(),
      sentiment: f.sentiment ? (typeof f.sentiment === 'string' ? JSON.parse(f.sentiment) : f.sentiment) : undefined
    }));

    // Fetch user's dietary preferences
    const userResult = await db.query(
      'SELECT dietary_preferences FROM users WHERE id = $1',
      [userId]
    );
    const dietaryPreferences = userResult.rows[0]?.dietary_preferences
      ? (typeof userResult.rows[0].dietary_preferences === 'string'
        ? JSON.parse(userResult.rows[0].dietary_preferences)
        : userResult.rows[0].dietary_preferences)
      : undefined;

    // Generate recommendations
    const recommendations = generateRecommendations(
      availableMeals,
      userBookings,
      userFeedbacks,
      dietaryPreferences,
      topN
    );

    res.json(recommendations);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ message: 'Failed to generate recommendations' });
  }
});

// Update user dietary preferences
app.patch('/api/users/:userId/preferences', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { userId } = req.params;
    const { dietaryPreferences } = req.body;

    await db.query(
      'UPDATE users SET dietary_preferences = $1 WHERE id = $2',
      [JSON.stringify(dietaryPreferences), userId]
    );

    res.json({ message: 'Dietary preferences updated successfully' });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
});

// === Notification endpoints ===

// Send meal reminder notification (for scheduling)
app.post('/api/notifications/meal-reminder', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId, mealType, mealTime, mealDate } = req.body;

    // Store notification in database
    if (db) {
      const notificationId = uuidv4();
      await db.query(
        `INSERT INTO notifications (id, user_id, message, read, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          notificationId,
          userId,
          `Reminder: Your ${mealType} is ready in 30 minutes at ${mealTime} for ${mealDate}`,
          false,
          new Date().toISOString()
        ]
      );
    }

    res.json({
      success: true,
      message: 'Meal reminder notification scheduled'
    });
  } catch (error) {
    console.error('Error sending meal reminder:', error);
    res.status(500).json({ message: 'Failed to send meal reminder' });
  }
});

// Get user notifications
app.get('/api/notifications/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { userId } = req.params;

    const result = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:notificationId/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { notificationId } = req.params;

    await db.query(
      'UPDATE notifications SET read = true WHERE id = $1',
      [notificationId]
    );

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// Root route for API-only dev experience
if (!isProduction) {
  app.get('/', (req: Request, res: Response) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Backend Running</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background: #f7fafc; color: #1f2937; margin: 0; }
            .container { max-width: 720px; margin: 10vh auto; padding: 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; }
            h1 { margin: 0 0 12px; font-size: 24px; }
            p { margin: 0 0 8px; line-height: 1.5; }
            code { background: #eef2ff; padding: 2px 6px; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Backend is running</h1>
            <p>This server provides the API for Smart Hostel Food Management.</p>
            <p>Open the frontend at <code>http://localhost:5173</code>.</p>
          </div>
        </body>
      </html>
    `);
  });
}

// Serve frontend - catch all routes and return the correct HTML page (for React Router)
// Admin routes (/admin/*) → admin.html  |  Everything else → index.html
if (isProduction) {
  const resolveFrontendFile = (filename: string): string | null => {
    const candidates = [
      path.join(__dirname, 'dist', 'public', filename),
      path.join(__dirname, 'dist', filename),
      path.join(__dirname, 'public', filename),
      path.join(__dirname, filename),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
    return null;
  };

  // Admin routes: serve admin.html
  app.get(['/admin', '/admin/*'], (req: Request, res: Response) => {
    const adminHtml = resolveFrontendFile('admin.html');
    if (adminHtml) return res.sendFile(adminHtml);
    return res.status(404).json({ message: 'Admin frontend not built. Run npm run build:frontend.' });
  });

  // All other routes: serve index.html (student / public app)
  app.get('*', (req: Request, res: Response) => {
    const indexHtml = resolveFrontendFile('index.html');
    if (indexHtml) return res.sendFile(indexHtml);
    return res.status(404).json({ message: 'Frontend not built. Run npm run build:frontend.' });
  });
}

// Global error handler (moved to end so it handles errors from routes/middleware)
app.use((err: unknown, req: Request, res: Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ message: 'Internal server error' });
});

// Initialize database and start server
initializeDatabaseAndStart();
