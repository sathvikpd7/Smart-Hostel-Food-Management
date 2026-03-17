import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MealProvider } from './contexts/MealContext';
import { FeedbackProvider } from './contexts/FeedbackContext';
import { LoadingScreen } from './components/ui/LoadingScreen';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AnalyticsDashboardPage from './pages/admin/AnalyticsDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import MealOverviewPage from './pages/admin/MealOverviewPage';
import QrVerificationPage from './pages/admin/QrVerificationPage';
import MenuManagementPage from './pages/admin/MenuManagementPage';
import ReportsPage from './pages/admin/ReportsPage';
import AiSummaryPage from './pages/admin/AiSummaryPage';

/**
 * Protects admin routes.
 * - Not logged in → redirect to student app login page
 * - Logged in but not admin → redirect to student dashboard
 * - Admin → render the requested page
 */
const AdminProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingScreen message="Loading admin panel..." />;
    }

    if (!user) {
        // Redirect to the student/shared login page (index.html)
        window.location.href = '/login';
        return null;
    }

    if (user.role !== 'admin') {
        // Logged in as student — send them to student dashboard (index.html)
        window.location.href = '/dashboard';
        return null;
    }

    return <>{element}</>;
};

function AdminRoutes() {
    const { loading } = useAuth();

    if (loading) {
        return <LoadingScreen message="Restoring your session" />;
    }

    return (
        <Routes>
            {/* Redirect bare /admin and /admin/ to the dashboard */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            <Route
                path="/admin/dashboard"
                element={<AdminProtectedRoute element={<AdminDashboard />} />}
            />
            <Route
                path="/admin/analytics"
                element={<AdminProtectedRoute element={<AnalyticsDashboardPage />} />}
            />
            <Route
                path="/admin/users"
                element={<AdminProtectedRoute element={<UserManagementPage />} />}
            />
            <Route
                path="/admin/meals"
                element={<AdminProtectedRoute element={<MealOverviewPage />} />}
            />
            <Route
                path="/admin/qr-verification"
                element={<AdminProtectedRoute element={<QrVerificationPage />} />}
            />
            <Route
                path="/admin/menu"
                element={<AdminProtectedRoute element={<MenuManagementPage />} />}
            />
            <Route
                path="/admin/reports"
                element={<AdminProtectedRoute element={<ReportsPage />} />}
            />
            <Route
                path="/admin/ai-summary"
                element={<AdminProtectedRoute element={<AiSummaryPage />} />}
            />

            {/* Catch-all: go to admin dashboard */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
    );
}

function AdminApp() {
    return (
        <AuthProvider>
            <MealProvider>
                <FeedbackProvider>
                    <AdminRoutes />
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

export default AdminApp;
