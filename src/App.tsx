import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MealProvider } from './contexts/MealContext';
import { FeedbackProvider } from './contexts/FeedbackContext';
import { LoadingScreen } from './components/ui/LoadingScreen';

// Pages (student / public only)
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AboutPage from './pages/AboutPage';
import StudentDashboard from './pages/student/StudentDashboard';
import MealBookingPage from './pages/student/MealBookingPage';
import BookingHistoryPage from './pages/student/BookingHistoryPage';
import FeedbackPage from './pages/student/FeedbackPage';
import ProfilePage from './pages/student/ProfilePage';
import WeeklyMenuPage from './pages/student/WeeklyMenuPage';

/**
 * Hard-navigates to the admin app (admin.html with HashRouter).
 * Used when someone lands on /admin/* inside the student app.
 */
const AdminRedirect: React.FC = () => {
  useEffect(() => {
    window.location.href = '/admin.html#/admin/dashboard';
  }, []);
  return <LoadingScreen message="Redirecting to Admin Panel..." />;
};

/**
 * Protects student-only routes.
 * - Not logged in → /login
 * - Admin logged in → hard redirect to admin.html (separate page)
 * - Student → render the element
 */
const StudentProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    // Admin app is a separate page (admin.html) with HashRouter
    window.location.href = '/admin.html#/admin/dashboard';
    return <LoadingScreen message="Redirecting to Admin Panel..." />;
  }

  return <>{element}</>;
};

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Restoring your session" />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Student Routes */}
      <Route path="/dashboard" element={<StudentProtectedRoute element={<StudentDashboard />} />} />
      <Route path="/dashboard/weekly-menu" element={<StudentProtectedRoute element={<WeeklyMenuPage />} />} />
      <Route path="/dashboard/booking" element={<StudentProtectedRoute element={<MealBookingPage />} />} />
      <Route path="/dashboard/history" element={<StudentProtectedRoute element={<BookingHistoryPage />} />} />
      <Route path="/dashboard/feedback" element={<StudentProtectedRoute element={<FeedbackPage />} />} />
      <Route path="/dashboard/profile" element={<StudentProtectedRoute element={<ProfilePage />} />} />

      {/* If anyone lands on /admin/* in the student app, hard-redirect to the admin page */}
      <Route path="/admin/*" element={<AdminRedirect />} />

      {/* Default */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <MealProvider>
        <FeedbackProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
            }}
          />
        </FeedbackProvider>
      </MealProvider>
    </AuthProvider>
  );
}

export default App;
