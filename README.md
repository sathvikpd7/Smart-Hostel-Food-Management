# 🍽️ Smart Hostel Food Management System

A comprehensive full-stack TypeScript application for managing hostel dining operations with **role-based access control**, **intelligent meal booking**, **QR code verification**, **real-time analytics**, and **AI-driven insights**.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#️-architecture)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Scripts Reference](#-scripts-reference)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

The **Smart Hostel Food Management System** is a modern web application designed to streamline food service operations in hostels and dormitories. It provides a seamless experience for both **students** and **administrators**, featuring intelligent meal planning, automated feedback analysis, and comprehensive reporting.

### Why This System?

| Benefit | Description |
|---------|-------------|
| 🗑️ **Reduces Food Waste** | AI-powered predictions and booking analytics minimize over-preparation |
| 😊 **Improves Satisfaction** | Personalized recommendations and dietary preference tracking |
| ⚡ **Streamlines Operations** | QR verification, automated reports, and real-time dashboards |
| 📊 **Data-Driven Decisions** | Sentiment analysis, attendance tracking, and financial insights |

---

## ✨ Key Features

### For Students 👨‍🎓

- **Meal Booking System** — Book breakfast, lunch, and dinner in advance
- **QR Code Generation** — Unique QR codes for each meal booking
- **Personalized Recommendations** — AI suggests meals based on preferences and history
- **Dietary Preferences** — Configure vegetarian, vegan, gluten-free, and other dietary needs
- **Rating & Feedback** — Rate meals (1–5 stars) with detailed comments
- **Booking History** — Track meal consumption and spending history
- **Weekly Menu View** — See upcoming meals for the entire week
- **Real-time Notifications** — Get reminders and updates via push notifications

### For Administrators 🔧

- **Dashboard Analytics** — Real-time metrics on bookings, attendance, and revenue
- **Sentiment Analysis** — AI-powered feedback analysis with emotion categorization
- **Menu Management** — Create and update weekly menus
- **QR Verification** — Scan student QR codes to mark meals as consumed
- **User Management** — Manage student accounts, roles, and statuses
- **AI Menu Planner** — Generate optimized weekly menus based on budget and preferences
- **Advanced Reports** — Generate PDF reports for attendance, waste, and financials
- **Real-time Updates** — Server-Sent Events (SSE) for live dashboard data

### AI-Powered Features 🤖

| Feature | Description |
|---------|-------------|
| **Sentiment Analysis** | Automatically categorize feedback as positive/negative with confidence scores |
| **Menu Planning** | Generate balanced weekly menus optimizing for nutrition, cost, or satisfaction |
| **Meal Recommendations** | Personalized suggestions based on student preferences and history |
| **Feedback Summaries** | AI-generated insights from student feedback using Groq Llama 3.1 |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | Modern UI library with hooks |
| **TypeScript 5.8** | Type-safe development |
| **Vite 7** | Lightning-fast build tool with multi-page app support |
| **Tailwind CSS 3** | Utility-first CSS framework |
| **Framer Motion** | Smooth animations and transitions |
| **React Router v6** | Client-side routing |
| **Recharts** | Data visualization and charts |
| **React Hot Toast** | Beautiful notifications |
| **Lucide Icons** | Consistent iconography |
| **react-qr-code** | QR code generation |
| **@zxing/browser** | QR code scanning |

### Backend

| Technology | Purpose |
|------------|---------|
| **Node.js 18+** | JavaScript runtime |
| **Express.js 4** | Web application framework |
| **TypeScript** | Type-safe server code |
| **PostgreSQL 14+** | Relational database |
| **JWT (jsonwebtoken)** | Authentication tokens |
| **bcryptjs** | Secure password hashing |
| **pg / pg-pool** | PostgreSQL client and connection pooling |

### AI & ML

| Technology | Purpose |
|------------|---------|
| **Groq API** | Fast LLM inference (Llama 3.1-8B-Instant) |
| **Custom Sentiment Analysis** | Lexicon-based sentiment scoring |
| **Recommendation Engine** | Collaborative filtering for meal suggestions |

### DevOps & Tooling

| Technology | Purpose |
|------------|---------|
| **ESLint** | Code linting and quality |
| **Zod** | Runtime schema validation |
| **jsPDF + jspdf-autotable** | PDF report generation |
| **date-fns** | Date manipulation |
| **uuid** | Unique ID generation |
| **Cypress / Jest / Vitest** | Testing frameworks |

---

## 🏗️ Architecture

### Multi-Page Application

The system uses a **multi-page architecture** with two separate entry points — one for the **Student App** and one for the **Admin App**. Both share the same backend API server, React contexts, and component libraries, but are built and served as independent pages for **better performance** and **isolation**.

| Entry Point | HTML File | React Root | URL Prefix |
|-------------|-----------|------------|------------|
| **Student App** | `index.html` | `src/main.tsx` → `App.tsx` | `/`, `/login`, `/register`, `/dashboard`, etc. |
| **Admin App** | `admin.html` | `src/admin-main.tsx` → `AdminApp.tsx` | `/admin/*` |

### Project Structure

```
Smart-Hostel-Food-Management/
├── index.html                  # Student app HTML entry point
├── admin.html                  # Admin app HTML entry point
├── server.ts                   # Express backend server
├── vite.config.ts              # Vite multi-page configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── eslint.config.js            # ESLint configuration
├── render.yaml                 # Render.com deployment config
├── package.json                # Dependencies and scripts
├── tsconfig.json               # Root TypeScript configuration
├── tsconfig.app.json           # Frontend TypeScript config
├── tsconfig.server.json        # Backend TypeScript config
├── tsconfig.scripts.json       # Scripts TypeScript config
├── tsconfig.node.json          # Node tools TypeScript config
├── .env                        # Environment variables (DO NOT COMMIT)
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
│
├── src/
│   ├── main.tsx                # Student app React entry point
│   ├── App.tsx                 # Student app root component (routes)
│   ├── admin-main.tsx          # Admin app React entry point
│   ├── AdminApp.tsx            # Admin app root component (routes)
│   ├── index.css               # Global styles
│   ├── vite-env.d.ts           # Vite type declarations
│   │
│   ├── components/             # Reusable React components
│   │   ├── admin/              # Admin-specific components
│   │   │   ├── AIMenuPlanner.tsx
│   │   │   └── SentimentDashboard.tsx
│   │   ├── student/            # Student-specific components
│   │   │   ├── MealCard.tsx
│   │   │   ├── MealRecommendations.tsx
│   │   │   ├── QRCodeDisplay.tsx
│   │   │   └── StarRating.tsx
│   │   ├── layout/             # Layout components
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── StudentLayout.tsx
│   │   │   └── StudentSidebar.tsx
│   │   ├── ui/                 # Reusable UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   └── Skeleton.tsx
│   │   └── ErrorBoundary.tsx   # Global error boundary
│   │
│   ├── pages/                  # Route page components
│   │   ├── admin/              # Admin dashboard pages
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AnalyticsDashboardPage.tsx
│   │   │   ├── AiSummaryPage.tsx
│   │   │   ├── MealOverviewPage.tsx
│   │   │   ├── MenuManagementPage.tsx
│   │   │   ├── QrVerificationPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   └── UserManagementPage.tsx
│   │   ├── student/            # Student pages
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── MealBookingPage.tsx
│   │   │   ├── WeeklyMenuPage.tsx
│   │   │   ├── FeedbackPage.tsx
│   │   │   ├── BookingHistoryPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── auth/               # Authentication pages
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── HomePage.tsx        # Landing / home page
│   │   └── AboutPage.tsx       # About page
│   │
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.tsx     # User authentication state
│   │   ├── MealContext.tsx     # Meal data management
│   │   └── FeedbackContext.tsx # Feedback state
│   │
│   ├── services/               # API clients and business logic
│   │   ├── api.ts              # Base Axios API client
│   │   ├── userApi.ts          # User-related API calls
│   │   ├── aiMenuPlanner.ts   # AI menu generation service
│   │   ├── sentimentAnalysis.ts # Sentiment scoring service
│   │   ├── mealRecommendation.ts # Meal suggestion engine
│   │   ├── analyticsUtils.ts  # Analytics helper utilities
│   │   ├── pdfExport.ts       # PDF report generation
│   │   ├── pushNotification.ts # Push notification service
│   │   └── sseClient.ts       # Server-Sent Events client
│   │
│   ├── hooks/                  # Custom React hooks
│   │   └── useSSE.ts          # SSE subscription hook
│   │
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts
│   │
│   ├── config/                 # Configuration files
│   │   └── database.ts        # PostgreSQL connection pool
│   │
│   └── scripts/                # Initialization scripts
│       ├── initDb.ts          # Database schema setup
│       ├── initAdmin.ts       # Create admin user
│       └── initMenu.ts        # Seed initial menu data
│
└── public/                     # Static assets
    ├── index.html              # Fallback HTML
    ├── logo.svg                # App logo
    ├── sw.js                   # Service worker for PWA
    └── site.webmanifest        # PWA manifest
```

### Database Schema

The system uses **PostgreSQL** with the following main tables:

| Table | Description |
|-------|-------------|
| `users` | Student and admin accounts with dietary preferences |
| `meals` | Daily meal items with menu, timing, and cost |
| `bookings` | Meal reservations with QR codes and status tracking |
| `feedback` | Ratings and comments with sentiment analysis results |
| `notifications` | User notifications and alerts |
| `weekly_menu` | Weekly menu template for meal planning |

### API Architecture

The backend provides **RESTful APIs** with JWT authentication:

| Endpoint Group | Routes | Description |
|----------------|--------|-------------|
| **Authentication** | `/auth/login`, `/auth/register` | User login and registration |
| **Users** | `/users/*` | CRUD operations for user management |
| **Meals** | `/meals`, `/menu/weekly` | Menu and meal management |
| **Bookings** | `/bookings/*` | Full booking lifecycle |
| **Feedback** | `/feedbacks/*` | Ratings and comments |
| **AI Services** | `/api/ai/*` | AI-powered features |
| **Reports** | `/api/reports/*` | PDF report generation |
| **Health** | `/api/health` | Server health check |
| **Real-time** | `/events` | Server-Sent Events (SSE) |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

| Requirement | Version | Download |
|-------------|---------|----------|
| **Node.js** | v18.0.0+ | [nodejs.org](https://nodejs.org/) |
| **PostgreSQL** | v14.0+ | [postgresql.org](https://www.postgresql.org/download/) |
| **npm** | v9.0.0+ | Comes with Node.js |
| **Git** | Any (optional) | [git-scm.com](https://git-scm.com/) |

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/sathvikpd7/Smart-Hostel-Food-Management.git
cd Smart-Hostel-Food-Management
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Set Up PostgreSQL Database

Open the PostgreSQL command line:

```bash
psql -U postgres
```

Create the database:

```sql
CREATE DATABASE smart_hostel_food;
\q
```

#### 4. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit the `.env` file:

```env
# ──────────────────────────────────────
# PostgreSQL Database Configuration
# ──────────────────────────────────────
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=smart_hostel_food

# ──────────────────────────────────────
# Server Configuration
# ──────────────────────────────────────
PORT=3001
CORS_ORIGIN=http://localhost:5173

# ──────────────────────────────────────
# JWT Secret (generate a strong random string)
# ──────────────────────────────────────
JWT_SECRET=your_jwt_secret_key_here

# ──────────────────────────────────────
# Groq AI Configuration
# Get a free API key from https://console.groq.com
# ──────────────────────────────────────
GROQ_API_KEY=your_groq_api_key_here

# ──────────────────────────────────────
# OpenAI (optional fallback)
# ──────────────────────────────────────
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-mini

# ──────────────────────────────────────
# Default Admin Credentials (for initialization)
# ──────────────────────────────────────
ADMIN_EMAIL=admin@hostel.com
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=System Administrator
ADMIN_ROOM=ADMIN-001

# ──────────────────────────────────────
# Frontend Environment (Vite)
# ──────────────────────────────────────
VITE_API_URL=http://localhost:3001
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_ENABLE_SENTIMENT_ANALYSIS=true
VITE_ENABLE_AI_MENU_PLANNING=true
VITE_ENABLE_MEAL_RECOMMENDATIONS=true

# ──────────────────────────────────────
# Debug Mode (optional)
# ──────────────────────────────────────
DEBUG_DB=false
```

> ⚠️ **Important**: Never commit the `.env` file to version control. It is already included in `.gitignore`.

#### 5. Initialize the Database

Run the initialization script to create tables and seed data:

```bash
npm run init:db
```

This will:
- ✅ Create all necessary database tables
- ✅ Insert the default admin user
- ✅ Set up the initial weekly menu template

### Running the Application

#### Development Mode

You need to run **two terminals** — one for the backend and one for the frontend:

**Terminal 1 — Backend Server:**

```bash
npm run dev:backend
```

**Terminal 2 — Frontend Dev Server:**

```bash
npm run dev:frontend
```

The application will be available at:

| Service | URL |
|---------|-----|
| 🖥️ **Student App** | [http://localhost:5173](http://localhost:5173) |
| 🔧 **Admin App** | [http://localhost:5173/admin](http://localhost:5173/admin) |
| 🔌 **Backend API** | [http://localhost:3001](http://localhost:3001) |

#### Production Build

Build and run for production:

```bash
# Build both frontend and backend
npm run build

# Start the production server
npm start
```

The production server serves both the API and the built frontend at `http://localhost:3001`.

### First Login

After setup, log in with the default admin credentials:

| Field | Value |
|-------|-------|
| **Email** | `admin@hostel.com` (or value from `.env`) |
| **Password** | `Admin@123` (or value from `.env`) |

> 🔒 **Security**: Change the admin password after your first login!

---

## 📖 API Documentation

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/login` | User login | ❌ |
| `POST` | `/auth/register` | Student registration | ❌ |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/users` | List all users | Admin |
| `GET` | `/users/:id` | Get user by ID | JWT |
| `PUT` | `/users/:id` | Update user | JWT |
| `DELETE` | `/users/:id` | Delete user | Admin |

### Meals & Menu

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/meals` | List meals | JWT |
| `GET` | `/menu/weekly` | Get weekly menu | JWT |
| `POST` | `/meals` | Create meal | Admin |
| `PUT` | `/meals/:id` | Update meal | Admin |

### Bookings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/bookings` | List user bookings | JWT |
| `POST` | `/bookings` | Create booking | JWT |
| `PUT` | `/bookings/:id` | Update booking | JWT |
| `POST` | `/bookings/verify` | Verify QR code | Admin |

### Feedback

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/feedbacks` | List feedbacks | JWT |
| `POST` | `/feedbacks` | Submit feedback | JWT |

### AI Services

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/ai/menu-plan` | Generate AI menu | Admin |
| `POST` | `/api/ai/feedback-summary` | AI feedback summary | Admin |
| `GET` | `/api/ai/recommendations` | Meal recommendations | JWT |

### System

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/health` | Health check | ❌ |
| `GET` | `/events` | SSE real-time stream | JWT |

---

## 🌐 Deployment

### Deploy to Render.com (Recommended)

A `render.yaml` Blueprint is included for one-click deployment.

1. Create a new **PostgreSQL** database on Render
2. Create a new **Web Service** and connect your GitHub repository
3. Set the required environment variables in the Render Dashboard:
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DB`
   - `JWT_SECRET`, `GROQ_API_KEY`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
4. Render will automatically use the `render.yaml` for build and start commands
5. After first deployment, trigger a database initialization via the Render shell:
   ```bash
   npm run init:db
   ```

### Deploy to Heroku

```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set GROQ_API_KEY=your_key
heroku config:set ADMIN_EMAIL=admin@hostel.com
heroku config:set ADMIN_PASSWORD=Admin@123
# ... set other env vars as needed

# Deploy
git push heroku main

# Initialize database
heroku run npm run init:db
```

### Deploy to VPS (Ubuntu)

```bash
# Install Node.js and PostgreSQL
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql

# Clone and setup
git clone https://github.com/sathvikpd7/Smart-Hostel-Food-Management.git
cd Smart-Hostel-Food-Management
npm install
npm run build

# Setup PostgreSQL
sudo -u postgres psql
CREATE DATABASE smart_hostel_food;
CREATE USER hostel_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE smart_hostel_food TO hostel_user;
\q

# Configure environment
cp .env.example .env
nano .env
# ... fill in your configuration

# Initialize database
npm run init:db

# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "hostel-food" -- start
pm2 save
pm2 startup
```

### Environment Variables Checklist

Before deploying, ensure **all required variables** are set:

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_USER` | ✅ | Database username |
| `POSTGRES_PASSWORD` | ✅ | Database password |
| `POSTGRES_HOST` | ✅ | Database host |
| `POSTGRES_PORT` | ✅ | Database port (default: `5432`) |
| `POSTGRES_DB` | ✅ | Database name |
| `PORT` | ✅ | Server port (default: `3001`) |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `GROQ_API_KEY` | ⚡ | Required for AI features |
| `ADMIN_EMAIL` | ✅ | Initial admin email |
| `ADMIN_PASSWORD` | ✅ | Initial admin password |
| `OPENAI_API_KEY` | ❌ | Optional fallback for AI |
| `CORS_ORIGIN` | ❌ | Frontend URL for CORS |
| `DEBUG_DB` | ❌ | Enable database debug logs |

---

## 📖 Scripts Reference

### Development

| Command | Description |
|---------|-------------|
| `npm run dev:backend` | Start Express server with hot reload (via `tsx`) |
| `npm run dev:frontend` | Start Vite dev server with HMR |
| `npm run dev` | Shows a reminder to run both servers separately |

### Build

| Command | Description |
|---------|-------------|
| `npm run build:backend` | Compile TypeScript backend to `dist/` |
| `npm run build:frontend` | Build frontend for production to `dist/public/` |
| `npm run build` | Build both backend and frontend |

### Production

| Command | Description |
|---------|-------------|
| `npm start` | Run production server (after build) |
| `npm run preview` | Preview production frontend build locally |

### Database

| Command | Description |
|---------|-------------|
| `npm run init:db` | Initialize database schema, admin user, and seed menu data |

---

## 🔧 Troubleshooting

### Database Connection Errors

**Problem**: `Error: connect ECONNREFUSED ::1:5432`

**Solutions**:
1. Ensure PostgreSQL is running:
   - **Windows**: Check Services (`services.msc`) → look for PostgreSQL
   - **Linux**: `sudo systemctl status postgresql`
2. Verify connection details in `.env`
3. Check if the database exists: `psql -U postgres -l`

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <process_id> /F

# Linux / Mac
lsof -ti:3001 | xargs kill -9
```

### Build Failures

**Problem**: TypeScript compilation errors

**Solution**:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Ensure TypeScript version matches: `npx tsc --version`

### Groq API Errors

**Problem**: AI features not working

**Solution**:
1. Verify `GROQ_API_KEY` in `.env`
2. Check API quota at [console.groq.com](https://console.groq.com)
3. Ensure internet connectivity
4. Check API rate limits

### Login Issues

**Problem**: Cannot login with admin credentials

**Solution**:
```bash
# Re-run initialization script
npm run init:db

# Or manually check the database
psql -U postgres -d smart_hostel_food
SELECT email, role FROM users WHERE role = 'admin';
```

### Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/sathvikpd7/Smart-Hostel-Food-Management/issues)
2. Review application logs in the terminal
3. Enable debug mode: Set `DEBUG_DB=true` in `.env`
4. Check browser console for frontend errors (`F12`)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Style

- Use **TypeScript** for all new code
- Follow the existing code formatting conventions
- Run ESLint before committing: `npx eslint .`
- Write meaningful, descriptive commit messages
- Keep components focused and reusable

### Pull Request Guidelines

- Provide a clear description of changes
- Link related issues
- Update documentation if needed
- Ensure the build passes (`npm run build`)
- Keep PRs focused on a single feature or fix

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Sathvik PD** — [GitHub](https://github.com/sathvikpd7)

---

## 🙏 Acknowledgments

- [React](https://react.dev/) and [Vite](https://vite.dev/) communities
- [PostgreSQL](https://www.postgresql.org/) team
- [Groq](https://groq.com/) for fast LLM inference
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Recharts](https://recharts.org/) for data visualization
- All contributors and testers

---

## 📞 Support

For support, open an issue on [GitHub](https://github.com/sathvikpd7/Smart-Hostel-Food-Management/issues).

---

<div align="center">

**Built with ❤️ for better hostel food management**

</div>
