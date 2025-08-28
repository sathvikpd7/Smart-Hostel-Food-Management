import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import net from 'net';
import { getDatabase, initializeDatabase as initializeDb } from './src/config/database';
import { z } from 'zod';
import type { Pool } from 'pg';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Database holder (assigned after initializeDb)
let db: Pool | null = null;

// Initialize DB and admin, then start server
async function initializeDatabaseAndStart() {
  try {
    await initializeDb(); // expected to setup pool / tables as implemented in src/config/database
    db = getDatabase();
    if (!db) throw new Error('Database instance not available after initialization');

    // verify connection
    const client = await db.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database connection verified');

    await initializeAdmin();
    console.log('Admin user ensured');

    // start server on available port
    const startPort = Number(process.env.PORT) || 3001;
    const availablePort = await findAvailablePort(startPort);
    app.listen(availablePort, () => {
      console.log(`Server running at http://localhost:${availablePort}`);
    });
  } catch (err) {
    console.error('Failed to initialize database or start server:', err);
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

// Routes (use db! or check db present before queries)
app.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, roomNumber } = UserSchema.parse(req.body);
    if (!db) throw new Error('Database not initialized');

    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    await db.query(
      'INSERT INTO users (id, name, email, password, role, room_number, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, name, email, hashedPassword, 'student', roomNumber, 'active']
    );

    res.status(201).json({
      id: userId,
      name,
      email,
      role: 'student',
      room_number: roomNumber,
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

app.post('/users/:id/reset-password', async (req: Request, res: Response) => {
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

app.post('/users/bulk', async (req: Request, res: Response) => {
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
    res.status(201).json({ created, skipped });
  } catch (error) {
    console.error('Error in bulk users endpoint:', error);
    res.status(500).json({ message: 'Failed bulk import' });
  }
});

async function initializeAdmin() {
  try {
    if (!db) throw new Error('Database not initialized');
    const adminResult = await db.query('SELECT * FROM users WHERE email = $1', ['admin@example.com']);
    const admin = adminResult.rows[0];
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.query(`
        INSERT INTO users (id, name, email, password, role, room_number, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [uuidv4(), 'Admin', 'admin@example.com', hashedPassword, 'admin', '000', 'active']);
      console.log('Admin user initialized');
    }
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
  }
}

app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0] as User | undefined;
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
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

app.get('/users', async (req: Request, res: Response) => {
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

    const totalRes = await db.query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
    params.push(pageSize, offset);
    const usersRes = await db.query(
      `SELECT id, name, email, role, room_number, status
       FROM users
       ${whereClause}
       ORDER BY ${sortColumn} ${sortOrder}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

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

app.get('/users/:id', async (req: Request, res: Response) => {
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

app.put('/users/:id', async (req: Request, res: Response) => {
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

app.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { id } = req.params;
    const checkResult = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM bookings WHERE user_id = $1', [id]);
      await client.query('DELETE FROM feedbacks WHERE user_id = $1', [id]);
      await client.query('DELETE FROM users WHERE id = $1', [id]);
      await client.query('COMMIT');
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
    const result = await db.query('SELECT * FROM meals');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching meals:', error);
    res.status(500).json({ message: 'Failed to fetch meals' });
  }
});

app.get('/menu/weekly', async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const result = await db.query('SELECT day, breakfast, lunch, dinner FROM weekly_menu');
    const menu = result.rows.map((row: { day: string; breakfast: unknown; lunch: unknown; dinner: unknown }) => ({
      day: row.day,
      breakfast: Array.isArray(row.breakfast) ? row.breakfast : row.breakfast?.items || row.breakfast || [],
      lunch: Array.isArray(row.lunch) ? row.lunch : row.lunch?.items || row.lunch || [],
      dinner: Array.isArray(row.dinner) ? row.dinner : row.dinner?.items || row.dinner || [],
    }));
    res.json(menu);
  } catch (error) {
    console.error('Error fetching weekly menu:', error);
    res.status(500).json({ message: 'Failed to fetch weekly menu' });
  }
});

app.put('/menu/weekly', async (req: Request, res: Response) => {
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

    res.json({ message: 'Weekly menu updated successfully' });
  } catch (error) {
    console.error('Error updating weekly menu:', error);
    res.status(500).json({ message: 'Failed to update weekly menu' });
  }
});

app.get('/bookings', async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const result = await db.query('SELECT * FROM bookings');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

app.post('/bookings', async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { userId, mealId, date, type } = req.body;
    const qrCode = `${userId}-${mealId}-${Date.now()}`;
    const result = await db.query(
      'INSERT INTO bookings (id, user_id, meal_id, date, type, status, qr_code) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [uuidv4(), userId, mealId, date, type, 'booked', qrCode]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
});

app.patch('/bookings/:id', async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { id } = req.params;
    const { status } = req.body;
    const result = await db.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Failed to update booking' });
  }
});

app.put('/bookings/:id/consume', async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { id } = req.params;
    const result = await db.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      ['consumed', id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking booking as consumed:', error);
    res.status(500).json({ message: 'Failed to mark booking as consumed' });
  }
});

app.post('/bookings/:id/rate', async (req: Request, res: Response) => {
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

app.get('/feedbacks', async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const result = await db.query('SELECT * FROM feedbacks');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ message: 'Failed to fetch feedbacks' });
  }
});

app.post('/feedbacks', async (req: Request, res: Response) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const { userId, mealId, rating, comment } = req.body;
    const result = await db.query(
      'INSERT INTO feedbacks (id, user_id, meal_id, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [uuidv4(), userId, mealId, rating, comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ message: 'Failed to create feedback' });
  }
});

// Global error handler (moved to end so it handles errors from routes/middleware)
app.use((err: unknown, req: Request, res: Response) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Initialize database and start server
initializeDatabaseAndStart();
