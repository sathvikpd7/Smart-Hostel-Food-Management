# Smart Hostel Food Management System

A modern web application for managing hostel food services, including meal booking, QR code verification, and user management.

## Features

- User Authentication (Admin & Student roles)
- Meal Booking System
- QR Code Verification
- Weekly Menu Management
- User Management (Admin Dashboard)
- Feedback System
- Real-time Statistics Dashboard

## Tech Stack

- React 18
- TypeScript
- Express.js (Backend)
- PostgreSQL (Database)
- React Router
- Tailwind CSS
- Lucide React Icons

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd [project-directory]
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hostel_food_db
```

4. Initialize the database:
```bash
npm run init-db
```

5. Start the development servers:
```bash
# Start backend server
npm run server

# In a new terminal, start frontend
npm start
```

## Project Structure

```
project/
├── src/
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   ├── services/
│   ├── types/
│   └── utils/
├── public/
├── server/
└── tests/
```

## API Endpoints

### Authentication
- POST /auth/register - Register new user
- POST /auth/login - User login

### Users
- GET /users - Get all users
- GET /users/:id - Get user by ID
- POST /users - Create new user
- PUT /users/:id - Update user
- DELETE /users/:id - Delete user

### Meals
- GET /meals - Get all meals
- POST /meals - Create new meal
- PUT /meals/:id - Update meal
- DELETE /meals/:id - Delete meal

### Bookings
- GET /bookings - Get all bookings
- POST /bookings - Create new booking
- PUT /bookings/:id - Update booking status
- DELETE /bookings/:id - Delete booking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
