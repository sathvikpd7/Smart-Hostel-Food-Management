import { pool } from '../config/database.js'; // Added .js extension
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

async function initializeAdmin() {
  const client = await pool.connect();
  
  try {
    // Check if admin already exists
    const result = await client.query('SELECT * FROM users WHERE email = $1', ['admin@example.com']);
    const existingAdmin = result.rows[0];
    
    if (!existingAdmin) {
      // Create admin user
      const adminId = uuidv4();
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO users (id, name, email, password, role, room_number)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        adminId,
        'System Admin',
        'admin@hfms.com',
        hashedPassword,
        'admin',
        'ADMIN'
      ]);
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the initialization
initializeAdmin().catch(console.error);