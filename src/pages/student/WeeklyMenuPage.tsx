import React from 'react';
import { Coffee, Utensils, UtensilsCrossed, Calendar } from 'lucide-react';
import StudentLayout from '../../components/layout/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useMeals } from '../../contexts/MealContext';

const WeeklyMenuPage: React.FC = () => {
  const { weeklyMenu, loading, error } = useMeals();

  const formatDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const getMealIcon = (type: 'breakfast' | 'lunch' | 'dinner') => {
    switch (type) {
      case 'breakfast':
        return <Coffee size={20} className="text-amber-600" />;
      case 'lunch':
        return <Utensils size={20} className="text-emerald-600" />;
      case 'dinner':
        return <UtensilsCrossed size={20} className="text-blue-600" />;
    }
  };

  const getMealTime = (type: 'breakfast' | 'lunch' | 'dinner') => {
    switch (type) {
      case 'breakfast':
        return '7:30 AM - 9:30 AM';
      case 'lunch':
        return '12:30 PM - 3:00 PM';
      case 'dinner':
        return '7:30 PM - 10:00 PM';
    }
  };

  const getMealColor = (type: 'breakfast' | 'lunch' | 'dinner') => {
    switch (type) {
      case 'breakfast':
        return 'bg-amber-50 border-amber-200';
      case 'lunch':
        return 'bg-emerald-50 border-emerald-200';
      case 'dinner':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getDotColor = (type: 'breakfast' | 'lunch' | 'dinner') => {
    switch (type) {
      case 'breakfast':
        return 'bg-amber-500';
      case 'lunch':
        return 'bg-emerald-500';
      case 'dinner':
        return 'bg-blue-500';
    }
  };

  // Get current day for highlighting
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  return (
    <StudentLayout
      title="Weekly Menu Timetable"
      subtitle="View the complete weekly meal schedule"
    >
      {error && (
        <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading weekly menu...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Legend */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Weekly Schedule</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Coffee size={16} className="text-amber-600" />
                    <span className="text-xs text-gray-600">Breakfast</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Utensils size={16} className="text-emerald-600" />
                    <span className="text-xs text-gray-600">Lunch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed size={16} className="text-blue-600" />
                    <span className="text-xs text-gray-600">Dinner</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Menu Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {weeklyMenu.map((menu) => (
              <Card
                key={menu.day}
                className={`transition-all duration-200 hover:shadow-lg ${
                  menu.day === currentDay
                    ? 'ring-2 ring-blue-500 shadow-md'
                    : 'hover:shadow-md'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {formatDayName(menu.day)}
                    </CardTitle>
                    {menu.day === currentDay && (
                      <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Breakfast */}
                  <div className={`p-3 rounded-lg border ${getMealColor('breakfast')}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {getMealIcon('breakfast')}
                      <div>
                        <h4 className="font-semibold text-sm text-gray-800">Breakfast</h4>
                        <p className="text-xs text-gray-500">{getMealTime('breakfast')}</p>
                      </div>
                    </div>
                    <ul className="space-y-1 ml-1">
                      {menu.breakfast.map((item, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-700">
                          <span className={`w-1 h-1 ${getDotColor('breakfast')} rounded-full mr-2`}></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Lunch */}
                  <div className={`p-3 rounded-lg border ${getMealColor('lunch')}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {getMealIcon('lunch')}
                      <div>
                        <h4 className="font-semibold text-sm text-gray-800">Lunch</h4>
                        <p className="text-xs text-gray-500">{getMealTime('lunch')}</p>
                      </div>
                    </div>
                    <ul className="space-y-1 ml-1">
                      {menu.lunch.map((item, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-700">
                          <span className={`w-1 h-1 ${getDotColor('lunch')} rounded-full mr-2`}></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Dinner */}
                  <div className={`p-3 rounded-lg border ${getMealColor('dinner')}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {getMealIcon('dinner')}
                      <div>
                        <h4 className="font-semibold text-sm text-gray-800">Dinner</h4>
                        <p className="text-xs text-gray-500">{getMealTime('dinner')}</p>
                      </div>
                    </div>
                    <ul className="space-y-1 ml-1">
                      {menu.dinner.map((item, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-700">
                          <span className={`w-1 h-1 ${getDotColor('dinner')} rounded-full mr-2`}></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {weeklyMenu.length === 0 && !loading && (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Menu Available</h3>
                <p className="text-gray-500">The weekly menu hasn't been set up yet. Please check back later.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </StudentLayout>
  );
};

export default WeeklyMenuPage;
