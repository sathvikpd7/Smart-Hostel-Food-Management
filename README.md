# Smart Hostel Food Management System 🏫🍽️

A comprehensive web application for managing hostel food services with modern features including meal booking, QR code verification, user management, and real-time analytics.

![Tech Stack](https://img.shields.io/badge/React-18.3.1-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue) ![Node.js](https://img.shields.io/badge/Node.js-v18+-green) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.5-blue) ![Vite](https://img.shields.io/badge/Vite-6.3.5-yellow) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-06B6D4)

## 🌟 Key Features

### 🔐 Authentication & Security
- Secure login and registration system
- Role-based access control (Admin/Student)
- Password encryption using bcryptjs
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Secure session management

### 🎓 Student Features
- **User Profile**
  - Secure account creation with email validation
  - Password-protected login system
  - Profile management
- **Meal Booking System**
  - Browse available meals (Breakfast, Lunch, Dinner)
  - Book meals in advance
  - View meal descriptions and menu items
  - Real-time booking status updates
- **QR Code Management**
  - Generate unique QR codes for booked meals
  - Download QR codes for offline use
  - Share QR codes via mobile devices
  - Secure QR code verification
- **Booking History**
  - View complete booking history
  - Track meal consumption status
  - Cancel upcoming bookings
  - Filter bookings by date and status
- **Feedback System**
  - Rate consumed meals (1-5 stars)
  - Provide detailed feedback comments
  - View feedback history
  - Help improve meal quality
- **Dashboard**
  - Personal meal statistics
  - Upcoming bookings overview
  - Quick access to all features
  - Responsive mobile-friendly design

### 👨‍💼 Admin Features
- **User Management**
  - View all registered students
  - Manage user accounts and status
  - Update user information
  - Deactivate/activate accounts
- **Meal Management**
  - Create and manage daily meals
  - Set meal times and descriptions
  - Update menu items and ingredients
  - Manage weekly menu schedules
- **Booking Oversight**
  - Monitor all student bookings
  - View real-time booking statistics
  - Generate booking reports
  - Track meal consumption rates
- **QR Verification**
  - Verify student QR codes at meal service
  - Mark meals as consumed
  - Prevent duplicate meal claims
  - Real-time verification system
- **Analytics**
  - Daily/weekly/monthly meal statistics
  - Student engagement metrics
  - Popular meal analysis
  - Feedback sentiment analysis
- **System Administration**
  - Manage system settings
  - Monitor application performance
  - User activity logs
  - Database management tools

## 🛠️ Tech Stack

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


## 🚀 Quick Start

### 📋 Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### 🛠️ Installation & Setup

1. **Clone the repository:**
```bash
git clone [repository-url]
cd project

---------
Start the application:
# Start backend server (Terminal 1)
cd project
npm run server

# Start frontend development server (Terminal 2)
cd project
npm run dev

---------
Initialize the database:
# Create database tables
npm run init:db
# Create admin user
npm run init:admin
# Initialize menu data
npm run init:menu



For more details and complete setup view Setup.md file.



2025|Build By Sathvik P D





