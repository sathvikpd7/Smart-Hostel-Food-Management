import Database from 'better-sqlite3';

// Database connection configuration
const dbConfig = {
  filename: './database.sqlite'
};

// Initialize database connection
function initializeDatabase() {
  try {
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

    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Get database connection
let dbConnection: Database.Database | null = null;

function getDatabase() {
  if (!dbConnection) {
    dbConnection = initializeDatabase();
  }
  return dbConnection;
}

export {
  initializeDatabase,
  getDatabase
};