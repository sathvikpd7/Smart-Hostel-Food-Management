import React from 'react';
import StudentSidebar from './StudentSidebar.js';

interface StudentLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentSidebar />
      
      <div className="md:pl-64 flex flex-col min-h-screen">
        <header className="bg-white shadow-sm px-6 py-5 md:py-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
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