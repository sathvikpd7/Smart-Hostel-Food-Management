import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database';

async function initializeAdmin() {
  const db = getDatabase();
  
  try {
    // Check if admin already exists
    const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@hfms.com');
    
    if (!existingAdmin) {
      // Create admin user
      const adminId = uuidv4();
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const insertAdmin = db.prepare(`
        INSERT INTO users (id, name, email, password, role, room_number)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      insertAdmin.run(
        adminId,
        'System Admin',
        'admin@hfms.com',
        hashedPassword,
        'admin',
        'ADMIN'
      );
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

// Run the initialization
initializeAdmin().catch(console.error);
