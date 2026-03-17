import React, { useState, useEffect } from 'react';
import StudentSidebar from './StudentSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface StudentLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

type LiveMeal = { label: string; color: string } | null;

const MEAL_WINDOWS: { label: string; start: [number, number]; end: [number, number]; color: string }[] = [
  { label: 'Breakfast', start: [7, 30],  end: [9, 30],  color: 'bg-amber-500' },
  { label: 'Lunch',     start: [12, 30], end: [15, 0],  color: 'bg-emerald-500' },
  { label: 'Dinner',    start: [19, 30], end: [22, 0],  color: 'bg-indigo-500' },
];

function getCurrentLiveMeal(): LiveMeal {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const total = h * 60 + m;
  for (const meal of MEAL_WINDOWS) {
    const start = meal.start[0] * 60 + meal.start[1];
    const end   = meal.end[0]   * 60 + meal.end[1];
    if (total >= start && total < end) {
      return { label: meal.label, color: meal.color };
    }
  }
  return null;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children, title, subtitle }) => {
  const { user } = useAuth();
  const initial = (user?.name || user?.email || 'S').charAt(0).toUpperCase();

  const [liveMeal, setLiveMeal] = useState<LiveMeal>(getCurrentLiveMeal);

  useEffect(() => {
    // Re-check every 30 seconds so the badge appears/disappears at the right time
    const id = setInterval(() => setLiveMeal(getCurrentLiveMeal()), 30_000);
    return () => clearInterval(id);
  }, []);

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
              <div className="flex items-center gap-3">
                {liveMeal && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white ${liveMeal.color} shadow-sm`}
                    title={`${liveMeal.label} is being served now`}
                  >
                    {/* pulsing dot */}
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    LIVE
                  </span>
                )}
                <Link
                  to="/dashboard/profile"
                  className="h-9 w-9 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
                  title={user?.name || user?.email || 'Profile'}
                >
                  {initial}
                </Link>
              </div>
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