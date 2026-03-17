import React from 'react';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title, 
  subtitle,
  actionButton
}) => {
  const { user } = useAuth();
  const initial = (user?.name || user?.email || 'A').charAt(0).toUpperCase();
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="md:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
          <div className="px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-3">
                {actionButton && (
                  <div className="hidden sm:block">
                    {actionButton}
                  </div>
                )}
                <div
                  className="h-9 w-9 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-sm font-medium text-gray-700 select-none"
                  title={user?.name || user?.email || 'Admin'}
                >
                  {initial}
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-6 py-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <footer className="bg-white border-t px-6 py-4">
          <div className="max-w-7xl mx-auto text-sm text-gray-500 text-center md:text-left">
            &copy; {new Date().getFullYear()} Smart Hostel Food Management System - Admin
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;