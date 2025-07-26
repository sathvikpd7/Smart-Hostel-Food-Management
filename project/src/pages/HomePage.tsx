import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  Calendar, 
  Users, 
  Clock, 
  ArrowRight,
  Shield,
  Smartphone,
  Bell
} from 'lucide-react';
import Button from '../components/ui/Button.js';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <QrCode className="w-6 h-6" />,
      title: "QR Code Verification",
      description: "Quick and secure meal verification using QR codes"
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Easy Meal Booking",
      description: "Book your meals in advance with a simple interface"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "User Management",
      description: "Efficient management of student and staff accounts"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Real-time Updates",
      description: "Get instant notifications about meal status"
    }
  ];

  const benefits = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure",
      description: "End-to-end encrypted data protection"
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Mobile Friendly",
      description: "Access from any device, anywhere"
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Smart Notifications",
      description: "Stay updated with meal schedules"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Smart Hostel</span>
              <span className="block text-blue-600">Food Management System</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Streamline your hostel's food management with our modern, efficient, and user-friendly platform.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Button
                  onClick={() => navigate('/login')}
                  size="lg"
                  className="w-full"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Key Features
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Everything you need to manage hostel meals efficiently
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="relative p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="text-blue-600 mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-medium text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-base text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-12 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Choose Us
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Experience the benefits of modern food management
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="relative p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="text-blue-600 mb-4">{benefit.icon}</div>
                  <h3 className="text-lg font-medium text-gray-900">{benefit.title}</h3>
                  <p className="mt-2 text-base text-gray-500">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-blue-200">Sign up for free today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Button
                onClick={() => navigate('/register')}
                variant="secondary"
                size="lg"
                className="w-full"
              >
                Sign up
              </Button>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Log in
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 