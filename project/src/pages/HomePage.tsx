import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowRight
} from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Navigation handlers
  const handleLogin = () => navigate('/login');
  const handleRegister = () => navigate('/register');

  // Button configuration
  const buttonConfig = {
    login: {
      text: "Login to Your Account",
      className: "px-8 py-4 text-lg font-medium bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center hover:bg-blue-700",
      icon: <ArrowRight className="ml-2 h-5 w-5" />
    },
    register: {
      text: "Register Now",
      className: "px-8 py-4 text-lg font-medium border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all",
      icon: null
    },
    ctaRegister: {
      text: "Create Free Account",
      className: "px-8 py-4 text-lg font-medium bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors",
      icon: null
    },
    ctaLogin: {
      text: "Log In",
      className: "px-8 py-4 text-lg font-medium text-white border-2 border-white rounded-lg hover:bg-white/10 transition-colors",
      icon: null
    }
  };

  // Feature data
  const features = [
    {
      icon: <QrCode className="w-8 h-8" />,
      title: "QR Code Verification",
      description: "Quick and secure meal verification using QR codes"
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Easy Meal Booking",
      description: "Book your meals in advance with a simple interface"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "User Management",
      description: "Efficient management of student and staff accounts"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Real-time Updates",
      description: "Get instant notifications about meal status"
    }
  ];

  // Benefits data
  const benefits = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure",
      description: "End-to-end encrypted data protection"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile Friendly",
      description: "Access from any device, anywhere"
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: "Smart Notifications",
      description: "Stay updated with meal schedules"
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      quote: "This system reduced our food wastage by 40% and improved student satisfaction significantly.",
      name: "Dr. Sarah Johnson",
      role: "Hostel Warden, University of Tech"
    },
    {
      quote: "The QR code verification made our meal distribution process so much faster and more secure.",
      name: "Michael Chen",
      role: "Student Union President"
    },
    {
      quote: "Implementation was seamless and the support team was incredibly helpful throughout the process.",
      name: "Raj Patel",
      role: "IT Administrator, City College"
    }
  ];

  // Reusable Button Component
  const ActionButton = ({ type, onClick }: { type: keyof typeof buttonConfig, onClick: () => void }) => {
    const config = buttonConfig[type];
    return (
      <button
        onClick={onClick}
        className={config.className}
      >
        {config.text}
        {config.icon}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 opacity-20 -z-1"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-4 px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              <Utensils className="w-4 h-4 mr-2" />
              Revolutionizing hostel dining
            </div>
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Smart Hostel</span>
              <span className="block bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Food Management
              </span>
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-xl text-gray-600">
              Streamline your hostel's food management with our modern, efficient, and user-friendly platform.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <ActionButton type="login" onClick={handleLogin} />
              <ActionButton type="register" onClick={handleRegister} />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              <span className="relative inline-block">
                <span className="absolute inset-0 bg-blue-100 opacity-50 -bottom-1 -z-1 h-3 w-full"></span>
                Key Features
              </span>
            </h2>
            <p className="mt-5 max-w-3xl mx-auto text-xl text-gray-500">
              Everything you need to manage hostel meals efficiently
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="relative p-8 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-center w-14 h-14 mb-6 rounded-lg bg-blue-50 text-blue-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-3 text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Choose Our System
            </h2>
            <p className="mt-5 max-w-3xl mx-auto text-xl text-gray-500">
              Experience the benefits of modern food management
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="relative p-8 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-center w-14 h-14 mb-6 rounded-lg bg-blue-50 text-blue-600">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{benefit.title}</h3>
                  <p className="mt-3 text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl px-6 py-12 sm:p-16">
            <div className="max-w-4xl mx-auto">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                  Trusted by hostels nationwide
                </h2>
                <p className="mt-3 max-w-2xl mx-auto text-xl text-blue-100">
                  Join thousands of institutions already using our platform
                </p>
              </div>
              <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
                <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg">
                  <p className="text-4xl font-bold text-white">100+</p>
                  <p className="mt-2 text-blue-100">Hostels</p>
                </div>
                <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg">
                  <p className="text-4xl font-bold text-white">50K+</p>
                  <p className="mt-2 text-blue-100">Students</p>
                </div>
                <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg">
                  <p className="text-4xl font-bold text-white">1M+</p>
                  <p className="mt-2 text-blue-100">Meals Served</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              What Our Users Say
            </h2>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <CheckCircle key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <blockquote className="text-lg text-gray-600">
                  "{testimonial.quote}"
                </blockquote>
                <div className="mt-6">
                  <p className="font-medium text-gray-900">{testimonial.name}</p>
                  <p className="text-blue-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                <span className="block">Ready to get started?</span>
                <span className="block text-blue-100">Sign up for free today.</span>
              </h2>
              <p className="mt-4 text-lg text-blue-100">
                Join hundreds of hostels already transforming their food management systems.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex flex-col sm:flex-row gap-3">
              <ActionButton type="ctaRegister" onClick={handleRegister} />
              <ActionButton type="ctaLogin" onClick={handleLogin} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
