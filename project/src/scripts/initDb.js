import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

// Database connection configuration
const dbConfig = {
  filename: './database.sqlite'
};

// Initialize database
const db = new Database(dbConfig.filename);

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    room_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meals (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    menu TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    meal_id TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    qr_code TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (meal_id) REFERENCES meals(id)
  );
`);

// Insert sample data
try {
  // Insert sample users
  db.prepare(`
    INSERT INTO users (id, name, email, password, role, room_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    'John Doe',
    'john@example.com',
    'hashed_password_here',
    'student',
    '101'
  );

  // Insert sample meals
  db.prepare(`
    INSERT INTO meals (id, type, date, menu)
    VALUES (?, ?, ?, ?)
  `).run(
    uuidv4(),
    'breakfast',
    new Date().toISOString(),
    'Oatmeal, Fruits, Toast'
  );

  console.log('Sample data inserted successfully!');
} catch (error) {
  console.error('Error inserting sample data:', error);
}

// Close the database connection
db.close(); 