import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getDatabase } from './src/config/database.js';
import { z } from 'zod';

// User schema validation
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
}

const app = express();
const port = 3001;

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Initialize database
let db: any;

async function initializeDatabase() {
  try {
    db = await getDatabase();
    await initializeAdmin(); // Move initializeAdmin here
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Start the server only after database is initialized
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Initialize database middleware
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    db = await getDatabase();
    next();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    res.status(500).json({ message: 'Database initialization failed' });
  }
});

// Register endpoint
app.post('/auth/register', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { name, email, password, roomNumber } = UserSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const role = 'student'; // Default role for new registrations

    await db.run(`
      INSERT INTO users (id, name, email, password, role, room_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, name, email, hashedPassword, role, roomNumber]);

    // Return success response without password
    const user = {
      id: userId,
      name,
      email,
      role,
      room_number: roomNumber
    };

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
});

// Initialize admin user if not exists
async function initializeAdmin() {
  try {
    const admin = await db.get('SELECT * FROM users WHERE email = ?', ['admin@example.com']);
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.run(`
        INSERT INTO users (id, name, email, password, role, room_number)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [uuidv4(), 'Admin', 'admin@example.com', hashedPassword, 'admin', '000']);
      console.log('Admin user initialized');
    }
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
  }
}

// Initialize database
initializeDatabase();

// Start server
app.listen(port, async () => {
  try {
    console.log(`Server running at http://localhost:${port}`);
    await initializeAdmin();
  } catch (error) {
    console.error('Failed to start server:', error);
  }
});

// Login endpoint
app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Return user data (excluding password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roomNumber: user.room_number
    };

    res.json(userData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});


