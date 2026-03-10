import { Pool } from 'pg';
import dotenv from 'dotenv';
// Removed the unused path import

// Load environment variables
dotenv.config();

// PostgreSQL connection pool configuration
// Render provides DATABASE_URL, but we also support individual env vars for local development
const getDatabaseConfig = () => {
  // If DATABASE_URL is provided (typical for Render), use it
  if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL connection string');
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum pool size
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection not established
      allowExitOnIdle: false,
    };
  }

  // Otherwise, use individual environment variables (for local development)
  const rawPassword = process.env.POSTGRES_PASSWORD;
  const password = rawPassword == null ? undefined : String(rawPassword);
  const port = parseInt(process.env.POSTGRES_PORT || '5432', 10);

  // Optional debug: prints DB config without exposing password value
  if (process.env.DEBUG_DB === 'true') {
    console.log('DB config:', {
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      port,
      passwordSet: rawPassword ? true : false,
    });
  }

  console.log('Using individual environment variables for database connection');
  return {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password,
    port,
    max: 20, // Maximum pool size
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection not established
    allowExitOnIdle: false,
  };
};

// PostgreSQL connection pool
const pool = new Pool(getDatabaseConfig());

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit the process, let the pool handle reconnection
});

// Connection health check
pool.on('connect', (client) => {
  console.log('New client connected to database');
});

// Monitor pool statistics
pool.on('acquire', () => {
  if (process.env.DEBUG_DB === 'true') {
    console.log('Client acquired from pool. Total count:', pool.totalCount, 'Idle count:', pool.idleCount);
  }
});

pool.on('remove', () => {
  if (process.env.DEBUG_DB === 'true') {
    console.log('Client removed from pool. Total count:', pool.totalCount, 'Idle count:', pool.idleCount);
  }
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

    // Add dietary_preferences column to users table if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'dietary_preferences'
        ) THEN
          ALTER TABLE users ADD COLUMN dietary_preferences JSONB;
        END IF;
      END$$;
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
        date DATE NOT NULL,
        type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        qr_code TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Migrate bookings.meal_id from UUID to TEXT if necessary
    await client.query(`
      DO $$
      BEGIN
        -- Drop foreign key constraint if it exists
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'bookings_meal_id_fkey' 
            AND table_name = 'bookings'
        ) THEN
          ALTER TABLE bookings DROP CONSTRAINT bookings_meal_id_fkey;
        END IF;
        
        -- Change column type from UUID to TEXT if needed
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'bookings' 
            AND column_name = 'meal_id' 
            AND data_type = 'uuid'
        ) THEN
          ALTER TABLE bookings ALTER COLUMN meal_id TYPE TEXT;
        END IF;
      END$$;
    `);

    // Ensure date column is DATE type (migrate if needed)
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'bookings' AND column_name = 'date' AND data_type = 'timestamp without time zone'
        ) THEN
          ALTER TABLE bookings ALTER COLUMN date TYPE DATE USING date::date;
        END IF;
      END$$;
    `);

    // Add created_at column to bookings if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'bookings' AND column_name = 'created_at'
        ) THEN
          ALTER TABLE bookings ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT NOW();
        END IF;
      END$$;
    `);

    // 5) Create feedbacks table (meal_id as TEXT for consistency)
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        meal_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        date TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Migrate meal_id from UUID to TEXT if necessary
    await client.query(`
      DO $$
      BEGIN
        -- Drop foreign key constraint if it exists
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'feedbacks_meal_id_fkey' 
            AND table_name = 'feedbacks'
        ) THEN
          ALTER TABLE feedbacks DROP CONSTRAINT feedbacks_meal_id_fkey;
        END IF;
        
        -- Change column type from UUID to TEXT if needed
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'feedbacks' 
            AND column_name = 'meal_id' 
            AND data_type = 'uuid'
        ) THEN
          ALTER TABLE feedbacks ALTER COLUMN meal_id TYPE TEXT;
        END IF;
      END$$;
    `);

    // Add date column to feedbacks table if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'feedbacks' AND column_name = 'date'
        ) THEN
          ALTER TABLE feedbacks ADD COLUMN date TIMESTAMP NOT NULL DEFAULT NOW();
        END IF;
      END$$;
    `);

    // Add sentiment column to feedbacks table if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'feedbacks' AND column_name = 'sentiment'
        ) THEN
          ALTER TABLE feedbacks ADD COLUMN sentiment JSONB;
        END IF;
      END$$;
    `);

    // 6) Create weekly_menu table to store menu items for each day
    //    Also, migrate legacy TEXT[] columns to JSONB if present (from old init scripts)
    await client.query(`
      DO $$
      BEGIN
        -- If table exists with TEXT[] columns, convert them to JSONB
        IF EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'weekly_menu' 
            AND column_name = 'breakfast' 
            AND (data_type = 'ARRAY' OR udt_name = '_text')
        ) THEN
          BEGIN
            ALTER TABLE weekly_menu 
              ALTER COLUMN breakfast TYPE JSONB USING to_jsonb(breakfast),
              ALTER COLUMN lunch TYPE JSONB USING to_jsonb(lunch),
              ALTER COLUMN dinner TYPE JSONB USING to_jsonb(dinner);
          EXCEPTION WHEN others THEN NULL; END;
        END IF;
      END$$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS weekly_menu (
        day TEXT PRIMARY KEY,
        breakfast JSONB NOT NULL,
        lunch JSONB NOT NULL,
        dinner JSONB NOT NULL
      );
    `);

    // 7) Create ai_summaries table for storing AI-generated summaries
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_summaries (
        id UUID PRIMARY KEY,
        summary TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 8) Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_meal_id ON bookings(meal_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
      CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
      CREATE INDEX IF NOT EXISTS idx_feedbacks_meal_id ON feedbacks(meal_id);
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      
      CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
      CREATE INDEX IF NOT EXISTS idx_meals_type ON meals(type);
    `);

    // 9) Composite indexes for common query patterns (Phase 3 optimization)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_user_date ON bookings(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_bookings_user_meal_status ON bookings(user_id, meal_id, date) WHERE status != 'cancelled';
      CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(date, status);
      CREATE INDEX IF NOT EXISTS idx_feedbacks_user_meal ON feedbacks(user_id, meal_id);
      CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
    `);

    console.log('Database tables and indexes initialized successfully');
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
