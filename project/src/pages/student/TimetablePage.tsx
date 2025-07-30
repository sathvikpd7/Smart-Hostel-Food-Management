import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Utensils, ChevronRight, Edit2 } from 'lucide-react';
import Button from '../../components/ui/Button.js';
import { useAuth } from '../../contexts/AuthContext.js';
import ProtectedRoute from '../../components/ProtectedRoute.tsx';
import { useMeals } from '../../contexts/MealContext.js';
import { format } from 'date-fns';

interface DayMeal {
  time: string;
  type: string;
  menu: string;
}

interface DayData {
  day: string;
  meals: DayMeal[];
}

const TimetablePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { weeklyMenu } = useMeals();

  const handleBack = () => {
    navigate(-1);
  };

  // Convert weeklyMenu to timetable format
  const timetableData = weeklyMenu?.map((menu: any) => ({
    day: menu.day.charAt(0).toUpperCase() + menu.day.slice(1),
    meals: [
      {
        time: '7:00 - 9:00 AM',
        type: 'Breakfast',
        menu: menu.breakfast?.join(', ') || 'No menu available'
      },
      {
        time: '12:30 - 2:30 PM',
        type: 'Lunch',
        menu: menu.lunch?.join(', ') || 'No menu available'
      },
      {
        time: '7:30 - 9:30 PM',
        type: 'Dinner',
        menu: menu.dinner?.join(', ') || 'No menu available'
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
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              {format(new Date(), 'MMMM yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Weekly Menu Timetable</h1>
          <p className="mt-2 text-sm text-gray-500">Your weekly meal schedule</p>
        </div>

        {/* Timetable Grid */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {timetableData.map((dayData: DayData, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{dayData.day}</h3>
                    <Utensils className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="space-y-4">
                    {dayData.meals.map((meal: DayMeal, mealIndex: number) => (
                      <div key={mealIndex} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{meal.time}</span>
                          <span className="text-sm font-medium text-gray-900">{meal.type}</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-sm text-gray-700">{meal.menu}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetablePage;