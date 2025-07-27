import React, { useState, useEffect } from 'react';
import { format, addDays, isToday } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useMeals } from '../../contexts/MealContext.js';
import StudentLayout from '../../components/layout/StudentLayout.js';
import MealCard from '../../components/student/MealCard.js';
import Button from '../../components/ui/Button.js';

const MealBookingPage: React.FC = () => {
  const { user } = useAuth();
  const { meals, bookings, getMealsByDate, bookMeal } = useMeals();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayedMeals, setDisplayedMeals] = useState(getMealsByDate(format(currentDate, 'yyyy-MM-dd')));
  const [loading, setLoading] = useState(false);
  
  // Update displayed meals when date changes
  useEffect(() => {
    setDisplayedMeals(getMealsByDate(format(currentDate, 'yyyy-MM-dd')));
  }, [currentDate, meals, bookings, getMealsByDate]);

  // Navigate to previous day
  const handlePreviousDay = () => {
    setCurrentDate(prevDate => addDays(prevDate, -1));
  };
  
  // Navigate to next day
  const handleNextDay = () => {
    setCurrentDate(prevDate => addDays(prevDate, 1));
  };
  
  // Handle meal booking
  const handleBookMeal = async (mealId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const meal = displayedMeals.find(m => m.id === mealId);
    if (meal) {
      await bookMeal(user.id, mealId, meal.type, meal.date);
    }
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if a meal is booked
  const isMealBooked = (mealId: string) => {
    return bookings.some(booking => 
      booking.userId === user?.id && 
      booking.mealId === mealId && 
      booking.status !== 'cancelled'
    );
  };

  // Default meal types to display
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

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
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {mealTypes.map(mealType => {
          const meal = displayedMeals.find(m => m.type === mealType);
          
          return (
            <div key={mealType} className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">{mealType}</h3>
              
              {meal ? (
                <>
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700">Menu:</h4>
                    <p className="text-gray-600">{meal.menuItems.join(', ') || 'Not specified'}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    {isMealBooked(meal.id) ? (
                      <span className="text-green-600 font-medium">Booked</span>
                    ) : (
                      <Button 
                        onClick={() => handleBookMeal(meal.id)}
                        disabled={loading}
                      >
                        {loading ? 'Booking...' : 'Book Meal'}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No {mealType} available</p>
                  {isToday(currentDate) && (
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Refresh
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </StudentLayout>
  );
};

export default MealBookingPage;