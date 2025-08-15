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
    // 1) Safe migrations to ensure compatibility with frontend mock meal IDs
    // Drop FK constraint on bookings.meal_id if exists (name may vary, try common patterns)
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_type = 'FOREIGN KEY' 
            AND table_name = 'bookings'
        ) THEN
          -- Try to drop by known default name; ignore errors
          BEGIN
            ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_meal_id_fkey;
          EXCEPTION WHEN others THEN NULL; END;
        END IF;
      END$$;
    `);

    // Convert meals.id and bookings.meal_id to TEXT if they exist as UUID
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meals' AND column_name='id' AND data_type <> 'text') THEN
          BEGIN
            ALTER TABLE meals ALTER COLUMN id TYPE TEXT USING id::text;
          EXCEPTION WHEN others THEN NULL; END;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='meal_id' AND data_type <> 'text') THEN
          BEGIN
            ALTER TABLE bookings ALTER COLUMN meal_id TYPE TEXT USING meal_id::text;
          EXCEPTION WHEN others THEN NULL; END;
        END IF;
      END$$;
    `);

    // 2) Create users table
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

    // 3) Create meals table (id as TEXT to support non-UUID mock IDs)
    await client.query(`
      CREATE TABLE IF NOT EXISTS meals (
        id TEXT PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        date TIMESTAMP NOT NULL,
        menu TEXT NOT NULL
      );
    `);

    // 4) Create bookings table (meal_id as TEXT and no FK)
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        meal_id TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        qr_code TEXT NOT NULL
      );
    `);

    // 5) Create feedbacks table (meal_id as TEXT for consistency)
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        meal_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT
      );
    `);

    // 6) Create weekly_menu table to store menu items for each day
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