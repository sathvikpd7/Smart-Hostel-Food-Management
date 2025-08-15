import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  QrCode, 
  FileText, 
  BarChart2, 
  LogOut, 
  Menu, 
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => 
        `flex items-center py-3 px-4 rounded-lg transition-colors ${
          isActive 
            ? 'bg-emerald-100 text-emerald-800 font-medium' 
            : 'text-gray-600 hover:bg-gray-100'
        }`
      }
    >
      <span className="mr-3">{icon}</span>
      {label}
    </NavLink>
  );
};

const AdminSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b">
        <h1 className="text-xl font-bold text-emerald-800">Smart Hostel</h1>
        <p className="text-sm text-gray-500 mt-1">Admin Dashboard</p>
      </div>
      
      <div className="p-4">
        <div className="bg-emerald-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500">Admin</p>
          <p className="font-medium text-gray-800">{user?.name}</p>
          <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
        </div>
        
        <nav className="space-y-1 mb-6">
          <SidebarLink 
            to="/admin/dashboard" 
            icon={<Home size={20} />} 
            label="Dashboard" 
            onClick={closeMobileMenu}
          />
          <SidebarLink 
            to="/admin/users" 
            icon={<Users size={20} />} 
            label="User Management" 
            onClick={closeMobileMenu}
          />
          <SidebarLink 
            to="/admin/meals" 
            icon={<Calendar size={20} />} 
            label="Meal Overview" 
            onClick={closeMobileMenu}
          />
          <SidebarLink 
            to="/admin/qr-verification" 
            icon={<QrCode size={20} />} 
            label="QR Verification" 
            onClick={closeMobileMenu}
          />
          <SidebarLink 
            to="/admin/menu" 
            icon={<FileText size={20} />} 
            label="Menu Management" 
            onClick={closeMobileMenu}
          />
          <SidebarLink 
            to="/admin/reports" 
            icon={<BarChart2 size={20} />} 
            label="Reports" 
            onClick={closeMobileMenu}
          />
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t">
        <Button 
          variant="outline"
          fullWidth
          className="flex items-center justify-center"
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
  
  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white p-2 rounded-lg shadow-md text-gray-700 hover:bg-gray-50"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-white border-r h-screen overflow-y-auto fixed">
        {sidebarContent}
      </div>
      
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-40 bg-white w-64 h-screen overflow-y-auto md:hidden shadow-lg"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-30 md:hidden"
            onClick={closeMobileMenu}
          />
        )}
      </AnimatePresence>
      
      {/* Content Margin for desktop */}
      <div className="md:pl-64">
        {/* Page content goes inside children */}
      </div>
    </>
  );
};

export default AdminSidebar;