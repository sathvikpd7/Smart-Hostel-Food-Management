import React from 'react';
import StudentSidebar from './StudentSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface StudentLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children, title, subtitle }) => {
  const { user } = useAuth();
  const initial = (user?.name || user?.email || 'S').charAt(0).toUpperCase();
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentSidebar />
      
      <div className="md:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
          <div className="px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
              </div>
              <Link
                to="/dashboard/profile"
                className="h-9 w-9 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
                title={user?.name || user?.email || 'Profile'}
              >
                {initial}
              </Link>
            </div>
          </div>
        </header>
        
        <main className="flex-grow px-4 py-6 md:px-6 md:py-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        <footer className="bg-white border-t px-6 py-4">
          <div className="max-w-7xl mx-auto text-sm text-gray-500 text-center md:text-left">
            &copy; {new Date().getFullYear()} Smart Hostel Food Management System
          </div>
        </footer>
      </div>
    </div>
  );
};

export default StudentLayout;