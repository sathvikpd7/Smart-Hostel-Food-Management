import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Database connection
let db;

async function initializeDatabase() {
  try {
    // Ensure the database directory exists
    const dbDir = path.join(__dirname, '..');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, 'database.sqlite');
    console.log('Database path:', dbPath);

    // Initialize database
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('Database connection established');

    // Drop existing tables if they exist
    await db.exec(`
      DROP TABLE IF EXISTS orders;
      DROP TABLE IF EXISTS meals;
      DROP TABLE IF EXISTS users;
    `);

    // Create tables with updated schema
    await db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        roomNumber TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        meal_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (meal_id) REFERENCES meals (id)
      );
    `);

    console.log('Database tables created successfully');

    // Create an admin user if it doesn't exist
    const adminExists = await db.get('SELECT * FROM users WHERE email = ?', 'admin@example.com');
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.run(
        'INSERT INTO users (name, email, password, role, roomNumber) VALUES (?, ?, ?, ?, ?)',
        ['Admin User', 'admin@example.com', hashedPassword, 'admin', 'ADMIN']
      );
      console.log('Admin user created');
    }

  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, roomNumber } = req.body;
    
    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run(
      'INSERT INTO users (name, email, password, role, roomNumber) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, roomNumber]
    );
    
    // Fetch the newly created user (excluding password)
    const newUser = await db.get('SELECT id, name, email, role, roomNumber, created_at FROM users WHERE id = ?', result.lastID);
    res.json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: error.message });
  }
});

// API Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.all('SELECT * FROM users');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, role, roomNumber } = req.body;
    
    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const result = await db.run(
      'INSERT INTO users (name, email, role, roomNumber) VALUES (?, ?, ?, ?)',
      [name, email, role, roomNumber]
    );
    
    // Fetch the newly created user
    const newUser = await db.get('SELECT * FROM users WHERE id = ?', result.lastID);
    res.json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/meals', async (req, res) => {
  try {
    const meals = await db.all('SELECT * FROM meals');
    res.json(meals);
  } catch (error) {
    console.error('Error fetching meals:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/meals', async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const result = await db.run(
      'INSERT INTO meals (name, description, price) VALUES (?, ?, ?)',
      [name, description, price]
    );
    
    const newMeal = await db.get('SELECT * FROM meals WHERE id = ?', result.lastID);
    res.json(newMeal);
  } catch (error) {
    console.error('Error creating meal:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.all(`
      SELECT o.*, u.name as user_name, m.name as meal_name 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      JOIN meals m ON o.meal_id = m.id
    `);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { user_id, meal_id, quantity, status } = req.body;
    const result = await db.run(
      'INSERT INTO orders (user_id, meal_id, quantity, status) VALUES (?, ?, ?, ?)',
      [user_id, meal_id, quantity, status]
    );
    
    const newOrder = await db.get('SELECT * FROM orders WHERE id = ?', result.lastID);
    res.json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  }); 