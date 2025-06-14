import { initializeDatabase } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// Initialize database
const db = initializeDatabase();

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