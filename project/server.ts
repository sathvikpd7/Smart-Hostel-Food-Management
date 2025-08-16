import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import net from 'net';
import { getDatabase, initializeDatabase as initializeDb } from './src/config/database';
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
  status: 'active' | 'inactive';
}

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Initialize database once at startup
let db = getDatabase();

async function initializeDatabase() {
  try {
    await initializeDb();
    console.log('Database connection verified');
    
    // Initialize admin if needed
    await initializeAdmin();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Start the server only after database is initialized
initializeDatabase().then(() => {
  // Use a function to find an available port
  const findAvailablePort = async (startPort: number): Promise<number> => {
    return new Promise((resolve, reject) => {
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

  // Find an available port starting from 3001
  findAvailablePort(3001).then((availablePort) => {
    app.listen(availablePort, () => {
      console.log(`Server running at http://localhost:${availablePort}`);
    });
  }).catch((error) => {
    console.error('Failed to find available port:', error);
    process.exit(1);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Register endpoint
app.post('/auth/register', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { name, email, password, roomNumber } = UserSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const userId = uuidv4();
    await db.query(
      'INSERT INTO users (id, name, email, password, role, room_number, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, name, email, hashedPassword, 'student', roomNumber, 'active']
    );

    // Return success response
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

// Reset user password
app.post('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body as { newPassword?: string };
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const check = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, id]);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Bulk create users
app.post('/users/bulk', async (req: Request, res: Response) => {
  try {
    const users = req.body as Array<{ name: string; email: string; password: string; roomNumber: string; status?: 'active' | 'inactive' }>; 
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

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

// Initialize admin user if not exists
async function initializeAdmin() {
  try {
    const adminResult = await db.query('SELECT * FROM users WHERE email = $1', ['admin@example.com']);
    const admin = adminResult.rows[0];
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.query(`
        INSERT INTO users (id, name, email, password, role, room_number)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [uuidv4(), 'Admin', 'admin@example.com', hashedPassword, 'admin', '000']);
      console.log('Admin user initialized');
    }
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
  }
}

// Initialize database
// Removed duplicate server startup

// Login endpoint
app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0] as User | undefined;
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
      roomNumber: user.room_number,
      status: user.status
    };

    res.json(userData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Users endpoints

// Get all users with optional server-side pagination and sorting
// Query params: page, pageSize, sortBy (name,email,room_number,status), sortOrder (asc,desc), search
app.get('/users', async (req: Request, res: Response) => {
  try {
    const page = Math.max(parseInt((req.query.page as string) || '1'), 1);
    const pageSize = Math.min(Math.max(parseInt((req.query.pageSize as string) || '10'), 1), 100);
    const allowedSort = new Set(['name', 'email', 'room_number', 'status']);
    const sortBy = (req.query.sortBy as string) || 'name';
    const sortOrder = ((req.query.sortOrder as string) || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const search = (req.query.search as string) || '';

    const sortColumn = allowedSort.has(sortBy) ? sortBy : 'name';
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    let params: any[] = [];
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

// Get user by ID
app.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT id, name, email, role, room_number, status FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update user
app.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, roomNumber, status } = req.body;

    // Validate input
    if (!name || !email || !roomNumber || !status) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    const checkResult = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user
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

// Delete user
app.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const checkResult = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete related data first to satisfy FK constraints, within a transaction
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

// Meal endpoints
app.get('/meals', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM meals');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching meals:', error);
    res.status(500).json({ message: 'Failed to fetch meals' });
  }
});

// Weekly menu endpoints
app.get('/menu/weekly', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT day, breakfast, lunch, dinner FROM weekly_menu');
    // Ensure arrays are returned for JSONB fields
    const menu = result.rows.map((row: any) => ({
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
    const menuItems = req.body as Array<{ day: string; breakfast: string[]; lunch: string[]; dinner: string[] }>;
    if (!Array.isArray(menuItems) || menuItems.length === 0) {
      return res.status(400).json({ message: 'Invalid menu payload' });
    }

    // Upsert each day (cast to JSONB to avoid incorrect text storage)
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

// Booking endpoints
app.get('/bookings', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM bookings');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

app.post('/bookings', async (req: Request, res: Response) => {
  try {
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

// Mark booking as consumed
app.put('/bookings/:id/consume', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      ['consumed', id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking booking as consumed:', error);
    res.status(500).json({ message: 'Failed to mark booking as consumed' });
  }
});

// Rate a meal by booking id
app.post('/bookings/:id/rate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // booking id
    const { rating, comment } = req.body as { rating: number; comment?: string };
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }

    // Find booking to derive user_id and meal_id
    const bookingRes = await db.query('SELECT user_id, meal_id FROM bookings WHERE id = $1', [id]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
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

// Feedback endpoints
app.get('/feedbacks', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM feedbacks');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ message: 'Failed to fetch feedbacks' });
  }
});

app.post('/feedbacks', async (req: Request, res: Response) => {
  try {
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
