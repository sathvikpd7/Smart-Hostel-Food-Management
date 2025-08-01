import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MealProvider } from './contexts/MealContext';
import { FeedbackProvider } from './contexts/FeedbackContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import MealBookingPage from './pages/student/MealBookingPage';
import BookingHistoryPage from './pages/student/BookingHistoryPage';
import FeedbackPage from './pages/student/FeedbackPage';
import ProfilePage from './pages/student/ProfilePage';

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import MealOverviewPage from './pages/admin/MealOverviewPage';
import QrVerificationPage from './pages/admin/QrVerificationPage';
import MenuManagementPage from './pages/admin/MenuManagementPage';
import ReportsPage from './pages/admin/ReportsPage';

const ProtectedRoute: React.FC<{ 
  element: React.ReactNode, 
  allowedRole?: 'student' | 'admin' 
}> = ({ element, allowedRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    return user.role === 'admin' 
      ? <Navigate to="/admin/dashboard" replace /> 
      : <Navigate to="/dashboard" replace />;
  }
  
  return <>{element}</>;
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={user ? (user.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/dashboard" />) : <LoginPage />} />
      <Route path="/register" element={user ? (user.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/dashboard" />) : <RegisterPage />} />
      
      {/* Student Routes */}
      <Route path="/dashboard" element={<ProtectedRoute element={<StudentDashboard />} allowedRole="student" />} />
      <Route path="/dashboard/booking" element={<ProtectedRoute element={<MealBookingPage />} allowedRole="student" />} />
      <Route path="/dashboard/history" element={<ProtectedRoute element={<BookingHistoryPage />} allowedRole="student" />} />
      <Route path="/dashboard/feedback" element={<ProtectedRoute element={<FeedbackPage />} allowedRole="student" />} />

      <Route path="/dashboard/profile" element={<ProtectedRoute element={<ProfilePage />} allowedRole="student" />} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute element={<AdminDashboard />} allowedRole="admin" />} />
      <Route path="/admin/users" element={<ProtectedRoute element={<UserManagementPage />} allowedRole="admin" />} />
      <Route path="/admin/meals" element={<ProtectedRoute element={<MealOverviewPage />} allowedRole="admin" />} />
      <Route path="/admin/qr-verification" element={<ProtectedRoute element={<QrVerificationPage />} allowedRole="admin" />} />
      <Route path="/admin/menu" element={<ProtectedRoute element={<MenuManagementPage />} allowedRole="admin" />} />
      <Route path="/admin/reports" element={<ProtectedRoute element={<ReportsPage />} allowedRole="admin" />} />
      
      {/* Default Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <MealProvider>
          <FeedbackProvider>
            <AppRoutes />
            <Toaster position="top-right" />
          </FeedbackProvider>
        </MealProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;