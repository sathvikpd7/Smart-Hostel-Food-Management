import { pool, initializeDatabase } from '../config/database.js'; // Added .js extension
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

async function initDb() {
  // Initialize database schema
  await initializeDatabase();
  
  // Get client from pool
  const client = await pool.connect();
  
  try {
    // Insert sample users
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (id, name, email, password, role, room_number)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
    `, [
      uuidv4(),
      'John Doe',
      'john@example.com',
      hashedPassword,
      'student',
      '101'
    ]);

    // Insert sample meals
    await client.query(`
      INSERT INTO meals (id, type, date, menu)
      VALUES ($1, $2, $3, $4)
    `, [
      uuidv4(),
      'breakfast',
      new Date().toISOString(),
      'Oatmeal, Fruits, Toast'
    ]);

    console.log('Sample data inserted successfully!');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  } finally {
    // Release client back to pool
    client.release();
  }
}

// Run initialization
initDb().catch(console.error);