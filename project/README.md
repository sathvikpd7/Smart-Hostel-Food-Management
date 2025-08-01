# Smart Hostel Food Management System

A comprehensive web application for managing hostel food services with modern features including meal booking, QR code verification, user management, and real-time analytics.

![Smart Hostel Food Management](https://img.shields.io/badge/React-18.3.1-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue) ![Node.js](https://img.shields.io/badge/Node.js-v18+-green) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.5-blue)

## 🚀 Quick Start

### 📋 Prerequisites

- Node.js (v18 or higher) ✅
- PostgreSQL (v14 or higher) ✅ 
- npm or yarn ✅

### 🛠️ Installation & Setup

1. **Clone the repository:**
```bash
git clone [repository-url]
cd project
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```
Edit `.env` with your database credentials:
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=hostel_food_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
PORT=3001
NODE_ENV=development
```

4. **Initialize the database:**
```bash
# Create database tables
npm run init:db

# Create admin user
npm run init:admin

# Initialize menu data
npm run init:menu
```

5. **Start the application:**
```bash
# Start backend server (Terminal 1)
npm run server

# Start frontend development server (Terminal 2)
npm run dev
```

6. **Access the application:**
   - **Frontend:** http://localhost:5173
   - **Backend API:** http://localhost:3001

## 🔐 Login Credentials

### 👨‍💼 Admin Account
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Role:** Administrator

### 👨‍🎓 Student Account
- **Registration:** Click "Register" on the login page
- **Role:** Student
- **Note:** Students can create their own accounts

## ✨ Application Features

### 🎓 **Student Features**
- ✅ **User Registration & Authentication**
  - Secure account creation with email validation
  - Password-protected login system
  - Profile management

- ✅ **Meal Booking System**
  - Browse available meals (Breakfast, Lunch, Dinner)
  - Book meals in advance
  - View meal descriptions and menu items
  - Real-time booking status updates

- ✅ **QR Code Generation & Management**
  - Generate unique QR codes for booked meals
  - Download QR codes for offline use
  - Share QR codes via mobile devices
  - Secure QR code verification

- ✅ **Booking History & Management**
  - View complete booking history
  - Track meal consumption status
  - Cancel upcoming bookings
  - Filter bookings by date and status

- ✅ **Feedback System**
  - Rate consumed meals (1-5 stars)
  - Provide detailed feedback comments
  - View feedback history
  - Help improve meal quality

- ✅ **Dashboard & Analytics**
  - Personal meal statistics
  - Upcoming bookings overview
  - Quick access to all features
  - Responsive mobile-friendly design

### 👨‍💼 **Admin Features**
- ✅ **User Management**
  - View all registered students
  - Manage user accounts and status
  - Update user information
  - Deactivate/activate accounts

- ✅ **Meal & Menu Management**
  - Create and manage daily meals
  - Set meal times and descriptions
  - Update menu items and ingredients
  - Manage weekly menu schedules

- ✅ **Booking Oversight**
  - Monitor all student bookings
  - View real-time booking statistics
  - Generate booking reports
  - Track meal consumption rates

- ✅ **QR Code Verification**
  - Verify student QR codes at meal service
  - Mark meals as consumed
  - Prevent duplicate meal claims
  - Real-time verification system

- ✅ **Analytics & Reporting**
  - Daily/weekly/monthly meal statistics
  - Student engagement metrics
  - Popular meal analysis
  - Feedback sentiment analysis

- ✅ **System Administration**
  - Manage system settings
  - Monitor application performance
  - User activity logs
  - Database management tools

## 🏗️ **Tech Stack**

### Frontend
- **React 18.3.1** - Modern React with hooks and context
- **TypeScript 5.8.3** - Type-safe development
- **Vite 6.3.5** - Fast build tool and dev server
- **React Router 6.23.0** - Client-side routing
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Framer Motion 11.0.8** - Smooth animations
- **Lucide React 0.344.0** - Beautiful icons
- **React Hot Toast 2.4.1** - Toast notifications
- **React QR Code 2.0.12** - QR code generation
- **date-fns 3.3.1** - Date manipulation

### Backend
- **Node.js** - Runtime environment
- **Express.js 4.18.2** - Web framework
- **TypeScript** - Type-safe backend development
- **PostgreSQL 17.5** - Relational database
- **bcryptjs 3.0.2** - Password hashing
- **UUID 11.1.0** - Unique identifier generation
- **Zod 3.22.4** - Schema validation
- **CORS 2.8.5** - Cross-origin resource sharing
- **dotenv 16.5.0** - Environment variable management

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **tsx 4.7.1** - TypeScript execution
- **Vite** - Build tool and dev server

## 📱 **Application Screenshots & Demo**

### Student Dashboard
- Modern, intuitive interface
- Quick meal booking
- Real-time statistics
- Mobile-responsive design

### Admin Panel
- Comprehensive management tools
- Analytics and reporting
- User administration
- System monitoring

## 📦 **Available Scripts**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run server` | Start backend server |
| `npm run server:build` | Build and start backend |
| `npm run init:db` | Initialize database tables |
| `npm run init:admin` | Create admin user |
| `npm run init:menu` | Initialize menu data |
| `npm run lint` | Run ESLint |

## 🔧 **Troubleshooting**

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL service status
psql -U postgres -c "SELECT 1"

# Verify database exists
psql -U postgres -c "\l" | grep hostel_food_management

# Create database if missing
psql -U postgres -c "CREATE DATABASE hostel_food_management;"
```

#### Port Already in Use
- Backend will automatically find available port (3001, 3002, etc.)
- Frontend will use next available port (5173, 5174, etc.)
- Check `.env` file for custom port configuration

#### TypeScript/Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist
npm run build
```

#### Login Issues
- Ensure database is initialized: `npm run init:admin`
- Check network connectivity between frontend and backend
- Verify backend server is running on correct port

### Environment Variables
Make sure your `.env` file contains all required variables:
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=hostel_food_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
PORT=3001
NODE_ENV=development
```

## 🌟 **Key Highlights**

- ⚡ **Fast Performance** - Built with Vite and optimized React
- 🔒 **Secure** - Password hashing, input validation, SQL injection protection
- 📱 **Responsive** - Works perfectly on desktop, tablet, and mobile
- 🎨 **Modern UI** - Clean design with Tailwind CSS and smooth animations
- 🔄 **Real-time** - Live updates and notifications
- 📊 **Analytics** - Comprehensive reporting and statistics
- 🧪 **Type-Safe** - Full TypeScript implementation
- 🚀 **Scalable** - Modular architecture for easy expansion

## 🛡️ **Security Features**

- Password hashing with bcryptjs
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Secure session management
- Role-based access control

## 📈 **Performance Optimizations**

- Code splitting with React.lazy()
- Optimized bundle size
- Efficient database queries
- Cached API responses
- Lazy loading of components
- Minified production builds

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
