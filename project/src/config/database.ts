import { Pool } from 'pg';
import dotenv from 'dotenv';
// Removed the unused path import

// Load environment variables
dotenv.config();

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'hostel_food_management',
  password: process.env.POSTGRES_PASSWORD || '1978',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

// Initialize database with required tables
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        room_number VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'active'
      );
    `);

    // Create meals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS meals (
        id UUID PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        date TIMESTAMP NOT NULL,
        menu TEXT NOT NULL
      );
    `);

    // Create bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        meal_id UUID NOT NULL REFERENCES meals(id),
        date TIMESTAMP NOT NULL,
        type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        qr_code TEXT NOT NULL
      );
    `);

    // Create feedbacks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        meal_id UUID NOT NULL REFERENCES meals(id),
        rating INTEGER NOT NULL,
        comment TEXT
      );
    `);

    // Create weekly_menu table to store menu items for each day
    await client.query(`
      CREATE TABLE IF NOT EXISTS weekly_menu (
        day TEXT PRIMARY KEY,
        breakfast JSONB NOT NULL,
        lunch JSONB NOT NULL,
        dinner JSONB NOT NULL
      );
    `);

    console.log('Database tables initialized successfully');
    return client;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get database connection
function getDatabase() {
  return pool;
}

export { pool, initializeDatabase, getDatabase };