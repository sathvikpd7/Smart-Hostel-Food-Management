import React, { useState, useEffect } from 'react';
import { format, addDays, isToday } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useMeals } from '../../contexts/MealContext.js';
import StudentLayout from '../../components/layout/StudentLayout.js';
import Button from '../../components/ui/Button.js';
import { Meal, MealBooking } from '../../types/index.js'; // Import your actual Meal type

const MealBookingPage: React.FC = () => {
  const { user } = useAuth();
  const { meals, bookings, getMealsByDate, bookMeal } = useMeals();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayedMeals, setDisplayedMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  
  // Update displayed meals when date or meals change
  useEffect(() => {
    const mealsForDate = getMealsByDate(format(currentDate, 'yyyy-MM-dd'));
    setDisplayedMeals(mealsForDate || []);
  }, [currentDate, meals, bookings, getMealsByDate]);

  const handlePreviousDay = () => {
    setCurrentDate(prevDate => addDays(prevDate, -1));
  };
  
  const handleNextDay = () => {
    setCurrentDate(prevDate => addDays(prevDate, 1));
  };
  
  const handleBookMeal = async (mealId: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!user) return;
    setLoading(prev => ({ ...prev, [mealId]: true }));
    try {
      await bookMeal(mealId, user.id, mealType, format(currentDate, 'yyyy-MM-dd'));
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, [mealId]: false }));
    }
  };

  const isMealBooked = (mealId: string) => {
    return bookings.some((booking: MealBooking) => 
      booking.userId === user?.id && 
      booking.mealId === mealId && 
      booking.status !== 'cancelled'
    );
  };

  // Define meal types with their display names and icons
  const mealTypes = [
    { type: 'Breakfast', displayName: 'Breakfast', icon: '☕' },
    { type: 'Lunch', displayName: 'Lunch', icon: '🍲' },
    { type: 'Dinner', displayName: 'Dinner', icon: '🍽️' }
  ];

  return (
    <StudentLayout
      title="Meal Booking"
      subtitle="Book your meals for the day"
    >
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center mb-4 sm:mb-0">
          <Calendar className="text-blue-800 mr-2" size={22} />
          <h2 className="text-lg font-semibold">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h2>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handlePreviousDay}
            className="flex items-center"
          >
            <ChevronLeft size={18} className="mr-1" />
            Previous
          </Button>
          
          {!isToday(currentDate) && (
            <Button
              variant="outline"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handleNextDay}
            className="flex items-center"
          >
            Next
            <ChevronRight size={18} className="ml-1" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mealTypes.map(({ type, displayName, icon }) => {
          const meal = displayedMeals.find(m => m.type === type);
          const isBooked = meal ? isMealBooked(meal.id) : false;
          const isLoading = meal ? loading[meal.id] : false;

          return (
            <div key={type} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">{icon}</span>
                  <h3 className="text-xl font-semibold">{displayName}</h3>
                </div>
                
                {meal ? (
                  <>
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-1">Menu:</h4>
                      <p className="text-gray-600 pl-2 border-l-2 border-blue-200">
                        {meal.menuItems.join(', ') || 'No menu specified'}
                      </p>
                    </div>
                    
                    <div className="flex justify-end items-center mt-6">
                      {isBooked ? (
                        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-md font-medium">
                          Booked
                        </span>
                      ) : (
                        <Button
                          onClick={() => handleBookMeal(meal.id, meal.type)}
                          disabled={isLoading}
                          className="min-w-[120px]"
                        >
                          {isLoading ? 'Booking...' : 'Book Meal'}
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p className="mb-4">No {displayName} available today</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Check Today's Meals
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </StudentLayout>
  );
};

export default MealBookingPage;