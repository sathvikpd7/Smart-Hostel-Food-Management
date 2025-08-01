# Smart Hostel Food Management System - Setup Guide

## Prerequisites

1. Node.js (v18 or higher)
2. PostgreSQL database
3. Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Create a PostgreSQL database named `hostel_food_management`
   - Update database credentials in `.env` file (copy from `.env.example`)

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials.

5. **Initialize Database**
   ```bash
   npm run init:db
   npm run init:admin
   npm run init:menu
   ```

## Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   npm run server
   ```

2. **Start the frontend development server** (in a new terminal)
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Demo Credentials

- **Admin**: admin@example.com / admin123
- **Student**: Register a new account or create one through the admin panel

## Project Structure

```
project/
├── src/
│   ├── components/     # Reusable React components
│   ├── contexts/       # React context providers
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── types/          # TypeScript type definitions
│   └── config/         # Configuration files
├── server.ts           # Backend server
└── public/             # Static assets
```

## Features

- User authentication (Student/Admin roles)
- Meal booking system
- QR code generation and verification
- Feedback system
- Admin dashboard for user and meal management
- Responsive design

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run server` - Start backend server
- `npm run lint` - Run ESLint
- `npm run init:db` - Initialize database tables
- `npm run init:admin` - Create admin user
- `npm run init:menu` - Initialize menu data

## Troubleshooting

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database `hostel_food_management` exists

2. **Port Conflicts**
   - Backend uses port 3001 by default
   - Frontend uses port 5173 by default
   - Update ports in configuration files if needed

3. **Module Resolution Issues**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Clear build cache: `rm -rf dist`
