import { pool } from '../config/database.js';

const weeklyMenuData = [
  {
    day: 'monday',
    breakfast: ['Scrambled Eggs', 'Toast', 'Fruit Bowl', 'Coffee/Tea'],
    lunch: ['Grilled Chicken Sandwich', 'Fries', 'Green Salad', 'Iced Tea'],
    dinner: ['Spaghetti Bolognese', 'Garlic Bread', 'Caesar Salad', 'Ice Cream'],
  },
  {
    day: 'tuesday',
    breakfast: ['Pancakes', 'Maple Syrup', 'Yogurt', 'Coffee/Tea'],
    lunch: ['Vegetable Curry', 'Rice', 'Naan Bread', 'Mango Lassi'],
    dinner: ['Grilled Salmon', 'Roasted Potatoes', 'Steamed Broccoli', 'Chocolate Cake'],
  },
  {
    day: 'wednesday',
    breakfast: ['Oatmeal', 'Mixed Berries', 'Honey', 'Coffee/Tea'],
    lunch: ['Beef Burrito Bowl', 'Tortilla Chips', 'Guacamole', 'Lemonade'],
    dinner: ['Margherita Pizza', 'Garden Salad', 'Garlic Knots', 'Tiramisu'],
  },
  {
    day: 'thursday',
    breakfast: ['Avocado Toast', 'Poached Eggs', 'Fruit Smoothie', 'Coffee/Tea'],
    lunch: ['Club Sandwich', 'Potato Chips', 'Coleslaw', 'Iced Tea'],
    dinner: ['Chicken Stir Fry', 'Steamed Rice', 'Spring Rolls', 'Fruit Salad'],
  },
  {
    day: 'friday',
    breakfast: ['French Toast', 'Banana', 'Maple Syrup', 'Coffee/Tea'],
    lunch: ['Fish Tacos', 'Mexican Rice', 'Refried Beans', 'Horchata'],
    dinner: ['Beef Lasagna', 'Garlic Bread', 'Mixed Greens', 'Cheesecake'],
  },
  {
    day: 'saturday',
    breakfast: ['Belgian Waffles', 'Whipped Cream', 'Fresh Berries', 'Coffee/Tea'],
    lunch: ['Chicken Caesar Wrap', 'Sweet Potato Fries', 'Fruit Cup', 'Iced Coffee'],
    dinner: ['BBQ Ribs', 'Corn on the Cob', 'Baked Beans', 'Apple Pie'],
  },
  {
    day: 'sunday',
    breakfast: ['Breakfast Burrito', 'Salsa', 'Hash Browns', 'Coffee/Tea'],
    lunch: ['Mushroom Risotto', 'Garlic Bread', 'Rocket Salad', 'Tiramisu'],
    dinner: ['Roast Chicken', 'Mashed Potatoes', 'Gravy', 'Steamed Vegetables', 'Chocolate Mousse'],
  },
];

async function initMenu() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS weekly_menu (
        day VARCHAR(10) PRIMARY KEY,
        breakfast TEXT[] NOT NULL,
        lunch TEXT[] NOT NULL,
        dinner TEXT[] NOT NULL
      );
    `);

    for (const menu of weeklyMenuData) {
      await client.query(
        'INSERT INTO weekly_menu (day, breakfast, lunch, dinner) VALUES ($1, $2, $3, $4) ON CONFLICT (day) DO NOTHING',
        [menu.day, menu.breakfast, menu.lunch, menu.dinner]
      );
    }
    console.log('Weekly menu initialized successfully.');
  } finally {
    client.release();
  }
}

initMenu().catch(err => {
  console.error('Error initializing weekly menu:', err);
  process.exit(1);
});