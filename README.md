# 🍽️ Smart Hostel Food Management System

> 

A comprehensive full-stack TypeScript application for managing hostel dining operations with **role-based access control**, **intelligent meal booking**, **QR code verification**, **real-time analytics**, and **AI-driven insights**.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

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

### Core Technologies
* **Frontend:** React 18, TypeScript 5.8, Vite 7 (Multi-Page App), Tailwind CSS 3, Framer Motion, Recharts
* **Backend:** Node.js, Express, TypeScript, PostgreSQL (pg-pool), JWT, BcryptJS, Zod, Pino Logger
* **AI Engine:** Groq API (Llama 3.1-8B-Instant), Lexicon sentiment scoring, collaborative filtering recommendation algorithm
* **Real-Time Data:** Server-Sent Events (SSE) live updates

### DevOps & Tooling
* **Database & Indexing:** PostgreSQL connection pooling and performance indexing
* **Security & Auth:** Secure HMAC-signed QR verification, Helmet security headers, rate-limiting
* **Reports & Utilities:** jsPDF reporting, Zod runtime validation, date-fns, UUID, Cypress/Jest/Vitest

---

## 🏗️ Architecture

### Multi-Page Application

The system uses a **multi-page architecture** with two separate entry points — one for the **Student App** and one for the **Admin App**. Both share the same backend API server, React contexts, and component libraries, but are built and served as independent pages for **better performance** and **isolation**.


### Project Structure

```
Smart-Hostel-Food-Management/
├── backend/                   # Express backend application
│   ├── src/
│   │   ├── config/            # DB & Env setups
│   │   ├── middleware/        # Request validation
│   │   ├── scripts/           # DB seed scripts
│   │   └── services/          # Recommendation & sentiment engines
│   └── server.ts              # Main server entry point
├── frontend/                  # React + Vite frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI, layout & page components
│   │   ├── contexts/          # Auth, Meal & Feedback contexts
│   │   ├── hooks/             # Custom SSE hooks
│   │   ├── pages/             # Student, Admin & Auth route pages
│   │   ├── services/          # API, PDF, and SSE clients
│   │   ├── admin-main.tsx     # Admin portal entry point
│   │   └── main.tsx           # Student portal entry point
│   ├── index.html             # Student app template
│   └── admin.html             # Admin app template
└── package.json               # Root workspace script setup
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

Run the initialization script directly from the workspace root to create tables and seed data:

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

Build and run for production directly from the workspace root:

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
| **Email** | `admin@hostel.com` |
| **Password** | `admin123` |
| **Role** | Admin |

> 🔒 **Security**: Change the admin password immediately after your first login!

Students can **self-register** at `/register` or be bulk-imported by the admin.

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

<details>
<summary><b>Vite Dependency Optimization Error (core-js not found)</b></summary>

* **Problem:** Frontend crashes on start with errors like `Could not resolve "../internals/a-callable"`.
* **Cause:** The `jspdf` package pulls in `canvg` which imports `core-js` polyfills, but it's not installed in the frontend workspace.
* **Solution:**
  ```bash
  npm install core-js --prefix frontend
  ```
</details>

<details>
<summary><b>CORS Error (Frontend Cannot Reach Backend)</b></summary>

* **Problem:** Browser console shows `Access to fetch at ... blocked by CORS policy`.
* **Cause:** Vite fell back to port `5174` (or `5173` is busy), but `CORS_ORIGIN` in `.env` only lists `5173`.
* **Solution:** Update `backend/.env` to allow both ports:
  ```env
  CORS_ORIGIN=http://localhost:5173,http://localhost:5174
  ```
  Then restart the backend server.
</details>

<details>
<summary><b>Database Connection Errors</b></summary>

* **Problem:** `Error: connect ECONNREFUSED ::1:5432`
* **Solutions:**
  1. Ensure PostgreSQL is running. (Windows: check Services; Linux: `sudo systemctl status postgresql`)
  2. Verify credentials in `.env` match database user/password.
  3. Verify database exists: `psql -U postgres -l`.
</details>

<details>
<summary><b>Port Already in Use</b></summary>

* **Problem:** `Error: listen EADDRINUSE: address already in use :::3001`
* **Solution:** Kill the process running on port 3001:
  * **Windows:**
    ```bash
    netstat -ano | findstr :3001
    taskkill /PID <process_id> /F
    ```
  * **Linux / Mac:**
    ```bash
    lsof -ti:3001 | xargs kill -9
    ```
</details>

<details>
<summary><b>Build Failures & TypeScript Errors</b></summary>

* **Problem:** TypeScript compilation errors during build.
* **Solution:**
  1. Clear caches: delete `node_modules` and `package-lock.json`.
  2. Run `npm install` again.
  3. Ensure TypeScript version is correct: `npx tsc --version`.
</details>

<details>
<summary><b>Groq AI Errors</b></summary>

* **Problem:** AI features fail to work.
* **Solution:**
  1. Verify `GROQ_API_KEY` in `.env`.
  2. Check API quota status at [console.groq.com](https://console.groq.com).
  3. Ensure internet connectivity and check rate limits.
</details>

<details>
<summary><b>Admin Login Issues</b></summary>

* **Problem:** Cannot login with admin credentials.
* **Solution:** Re-run database seeding scripts:
  ```bash
  npm run init:db --prefix backend
  ```
</details>
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

- **Sathvik P D** — [GitHub](https://github.com/sathvikpd7)

---
