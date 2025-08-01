# Smart Hostel Food Management System

A modern web application for managing hostel food services, built with React and Express.js. This system streamlines the food management process for both students and administrators in a hostel environment.

## 🌟 Key Features

- **User Authentication**
  - Secure login and registration system
  - Role-based access control (Admin/Student)
  - Password encryption using bcrypt

- **Student Features**
  - View daily/weekly menu
  - Book meals in advance
  - Track meal history
  - QR code-based verification
  - Provide feedback on meals

- **Admin Features**
  - Manage student accounts
  - Create and update meal menus
  - Monitor meal bookings and consumption
  - Generate reports and analytics
  - View feedback statistics

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite (Build Tool)
- Tailwind CSS (Styling)
- React Router (Navigation)
- Framer Motion (Animations)
- React Hot Toast (Notifications)
- React QR Code (QR Code Generation)

### Backend
- Node.js
- Express.js
- TypeScript
- PostgreSQL (Database)
- bcryptjs (Password Hashing)
- UUID (Unique Identifiers)
- CORS (Cross-Origin Resource Sharing)

### Development Tools
- ESLint (Code Linting)
- TypeScript (Type Checking)
- PostCSS (CSS Processing)
- Vite (Development Server)

## 📁 Project Structure

```
project/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── contexts/      # React contexts
│   ├── services/      # API services
│   ├── types/         # TypeScript type definitions
│   ├── config/        # Configuration files
│   └── scripts/       # Utility scripts
├── dist/              # Build output
├── server.ts          # Express server
└── database.sqlite    # SQLite database
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/smart-hostel-food-management.git
cd smart-hostel-food-management
```

2. Install dependencies:
```bash
npm install
```

3. Start the development servers:

For frontend (in one terminal):
```bash
npm run dev
```

For backend (in another terminal):
```bash
npm run server
```

4. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Default Admin Credentials
- Email: admin@hfms.com
- Password: admin123

## 🔧 Environment Setup

The application uses the following environment variables (create a `.env` file in the root directory):

```env
PORT=3001
DATABASE_URL=./database
```

## 📝 API Endpoints

### Authentication
- POST `/auth/register` - Register new user
- POST `/auth/login` - User login

### Admin Routes
- GET `/admin/users` - Get all users
- POST `/admin/menu` - Create new menu
- GET `/admin/attendance` - Get attendance reports

### Student Routes
- GET `/student/menu` - Get current menu
- POST `/student/attendance` - Mark meal attendance
- GET `/student/history` - Get meal history

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to the open-source community for the amazing tools and libraries
- Inspired by the need for efficient hostel food management systems
- Built with ❤️ for educational institutions
