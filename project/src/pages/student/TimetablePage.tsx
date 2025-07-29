import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Utensils, ChevronRight, Edit2 } from 'lucide-react';
import Button from '../../components/ui/Button.js';
import { useAuth } from '../../contexts/AuthContext.js';
import ProtectedRoute from '../../components/ProtectedRoute.tsx';
import { useMeals } from '../../contexts/MealContext.js';

const TimetablePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { weeklyMenu } = useMeals();

  const handleBack = () => {
    navigate(-1);
  };

  // Convert weeklyMenu to timetable format
  const timetableData = weeklyMenu?.map(menu => ({
    day: menu.day.charAt(0).toUpperCase() + menu.day.slice(1),
    meals: [
      {
        time: '7:00 - 9:00 AM',
        type: 'Breakfast',
        menu: menu.breakfast.join(', ')
      },
      {
        time: '12:30 - 2:30 PM',
        type: 'Lunch',
        menu: menu.lunch.join(', ')
      },
      {
        time: '7:30 - 9:30 PM',
        type: 'Dinner',
        menu: menu.dinner.join(', ')
      }
    ]
  })) || []; // Provide empty array as fallback if weeklyMenu is undefined

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Weekly Meal Timetable
          </h1>
          {user?.role === 'admin' && (
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/menu')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <Edit2 className="h-5 w-5 mr-2" />
              Edit Menu
            </Button>
          )}
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Current Week Display */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-blue-800">
              Current Week: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Download Timetable (PDF)
            </button>
          </div>
        </div>

        {/* Timetable */}
        <div className="bg-white shadow overflow-hidden rounded-xl">
          {timetableData.map((dayData, index) => (
            <div key={index} className={`border-b border-gray-200 ${index === timetableData.length - 1 ? 'border-b-0' : ''}`}>
              <div className="px-6 py-4 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">{dayData.day}</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {dayData.meals.map((meal, mealIndex) => (
                  <div key={mealIndex} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-medium text-gray-900">{meal.type}</h4>
                          <span className="text-sm text-gray-500">{meal.time}</span>
                        </div>
                        <div className="mt-2 flex items-center">
                          <Utensils className="h-4 w-4 text-gray-400 mr-2" />
                          <p className="text-sm text-gray-600">{meal.menu}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Special Notes</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Breakfast timings may vary by ±30 minutes on weekends
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Special diet requests must be submitted 24 hours in advance
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Mess remains closed on national holidays
              </li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4 text-gray-600">
              <p>
                <span className="font-medium">Mess Manager:</span> Mr. Rajesh Kumar<br />
                Phone: +91 98765 43210<br />
                Email: messmanager@hostel.edu
              </p>
              <p>
                <span className="font-medium">Office Hours:</span> 9 AM - 5 PM (Mon-Sat)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetablePage;