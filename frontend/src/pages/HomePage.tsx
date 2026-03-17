import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  QrCode,
  Calendar,
  Users,
  Clock,
  Shield,
  Smartphone,
  Bell,
  Utensils,
  CheckCircle,
  ArrowRight,
  ChefHat,
  Star,
  Zap,
  LayoutDashboard,
  LogIn,
  Menu
} from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Navigation handlers
  const handleLogin = () => navigate('/login');
  const handleRegister = () => navigate('/register');

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="fixed w-full z-50 top-0 start-0 border-b border-white/20 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 hidden md:block">
                Smart Hostel
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogin}
                className="text-slate-600 hover:text-indigo-600 font-medium transition-colors px-4 py-2"
              >
                Sign In
              </button>
              <button
                onClick={handleRegister}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] rounded-full bg-violet-500/10 blur-[100px] animate-pulse delay-700"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                The Future of Hostel Dining
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                SMART HOSTEL <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
                  FOOD MANAGEMENT SYSTEM
                </span>
              </h1>

              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Streamline your hostel mess operations with our all-in-one platform.
                Experience seamless booking, instant QR verification, and real-time analytics designed for modern campuses.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleRegister}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={handleLogin}
                  className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-semibold hover:bg-slate-50 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  View Demo
                </button>
              </div>

              <div className="mt-10 flex items-center justify-center lg:justify-start gap-8 text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>Instant Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </motion.div>

            {/* Visual Content / Floating Cards */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Main Glass Card */}
                <div className="absolute inset-x-8 inset-y-8 bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center p-8 z-20">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
                    <QrCode className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Instant Scan</h3>
                  <p className="text-slate-600 text-center">Verify meals in less than 0.5 seconds with our advanced QR technology.</p>

                  {/* Stats Bar */}
                  <div className="w-full bg-white/50 rounded-xl p-4 mt-8 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Today's Meals</p>
                      <p className="text-2xl font-bold text-slate-800">1,248</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-0 right-0 p-4 bg-white rounded-2xl shadow-xl z-30 border border-slate-100"
                >
                  <Utensils className="w-8 h-8 text-fuchsia-500" />
                </motion.div>

                <motion.div
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-10 -left-4 p-4 bg-white rounded-2xl shadow-xl z-30 border border-slate-100 flex items-center gap-3"
                >
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-slate-700">System Active</span>
                </motion.div>

                {/* Decorative Blobs */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-fuchsia-600 rounded-full opacity-20 blur-3xl transform rotate-12 scale-90 z-10"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-3">Powerful Features</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Everything you need to run a smart hostel mess</h3>
            <p className="text-lg text-slate-600">Built with modern technology to ensure efficiency, transparency, and satisfaction for both students and administration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <QrCode />,
                title: "QR Code Attendance",
                desc: "Touchless, fast, and secure meal verification system preventing proxy bookings.",
                color: "text-blue-600",
                bg: "bg-blue-50"
              },
              {
                icon: <Smartphone />,
                title: "Mobile First Design",
                desc: "Students can book meals, check menus, and provide feedback on the go.",
                color: "text-violet-600",
                bg: "bg-violet-50"
              },
              {
                icon: <LayoutDashboard />,
                title: "Admin Dashboard",
                desc: "Comprehensive analytics, inventory tracking, and daily report generation.",
                color: "text-fuchsia-600",
                bg: "bg-fuchsia-50"
              },
              {
                icon: <Bell />,
                title: "Smart Notifications",
                desc: "Instant alerts for meal times, special menus, and booking deadlines.",
                color: "text-amber-600",
                bg: "bg-amber-50"
              },
              {
                icon: <Calendar />,
                title: "Advnace Booking",
                desc: "Reduce food wastage by allowing students to plan their meals in advance.",
                color: "text-emerald-600",
                bg: "bg-emerald-50"
              },
              {
                icon: <Shield />,
                title: "Secure & Reliable",
                desc: "Enterprise-grade security ensuring student data privacy and system uptime.",
                color: "text-rose-600",
                bg: "bg-rose-50"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="group p-8 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
              >
                <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {React.cloneElement(feature.icon as React.ReactElement, { className: `w-7 h-7 ${feature.color}` })}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Stats Section */}
      <div className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0f172a]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-fuchsia-500/10"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Active Users", value: "10k+", icon: <Users /> },
              { label: "Daily Meals", value: "25k+", icon: <Utensils /> },
              { label: "Food Saved", value: "15%", icon: <CheckCircle /> },
              { label: "Uptime", value: "99.9%", icon: <Zap /> }
            ].map((stat, idx) => (
              <div key={idx} className="p-6">
                <div className="flex justify-center mb-4 text-indigo-400 opacity-80">
                  {React.cloneElement(stat.icon as React.ReactElement, { className: "w-8 h-8" })}
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[2.5rem] overflow-hidden p-12 md:p-20 text-center bg-gradient-to-br from-indigo-600 to-violet-700 shadow-2xl shadow-indigo-600/30">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>

            <h2 className="relative text-3xl md:text-5xl font-bold text-white mb-8">
              Ready to modernize your hostel?
            </h2>
            <div className="relative flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleRegister}
                className="px-10 py-5 bg-white text-indigo-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all transform hover:-translate-y-1"
              >
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-800">Smart Hostel</span>
              </div>
              <p className="text-slate-500 max-w-md leading-relaxed">
                The most advanced food management system for educational institutions.
                Providing seamless dining experiences since 2024.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Platform</h4>
              <ul className="space-y-4 text-slate-500">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Company</h4>
              <ul className="space-y-4 text-slate-500">
                <li><button onClick={() => navigate('/about')} className="hover:text-indigo-600 transition-colors">About Us</button></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">© 2024 Smart Hostel Food Management Systems. All rights reserved.</p>
            <div className="flex gap-6">
              {/* Social icons placeholder */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
