import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMeals } from '../../contexts/MealContext';
import StudentLayout from '../../components/layout/StudentLayout';
import MealCard from '../../components/student/MealCard';
import Button from '../../components/ui/Button';

const MealBookingPage: React.FC = () => {
  const { user } = useAuth();
  const { meals, bookings, getMealsByDate } = useMeals();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayedMeals, setDisplayedMeals] = useState(getMealsByDate(format(currentDate, 'yyyy-MM-dd')));
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Update displayed meals when date changes
  useEffect(() => {
    setDisplayedMeals(getMealsByDate(format(currentDate, 'yyyy-MM-dd')));
  }, [currentDate, meals, getMealsByDate, refreshTrigger]);
  
  // Navigate to previous day
  const handlePreviousDay = () => {
    setCurrentDate(prevDate => addDays(prevDate, -1));
  };
  
  // Navigate to next day
  const handleNextDay = () => {
    setCurrentDate(prevDate => addDays(prevDate, 1));
  };
  
  // Refresh meals list after booking/cancellation
  const handleBookingComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Check if a meal is booked
  const isMealBooked = (mealId: string) => {
    return bookings.some(booking => 
      booking.userId === user?.id && 
      booking.mealId === mealId && 
      booking.status !== 'cancelled'
    );
  };
  
  // Get booking details for a meal
  const getBookingForMeal = (mealId: string) => {
    return bookings.find(booking => 
      booking.userId === user?.id && 
      booking.mealId === mealId && 
      booking.status !== 'cancelled'
    );
  };
  
  return (
    <StudentLayout
      title="Meal Booking"
      subtitle="Book your meals for the week"
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
          
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          
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
        {displayedMeals.map(meal => {
          const isBooked = isMealBooked(meal.id);
          const booking = getBookingForMeal(meal.id);
          
          return (
            <MealCard 
              key={meal.id} 
              meal={meal} 
              isBooked={isBooked}
              bookingId={booking?.id}
              bookingStatus={booking?.status}
              onBookingComplete={handleBookingComplete}
            />
          );
        })}
        
        {displayedMeals.length === 0 && (
          <div className="col-span-1 sm:col-span-3 text-center py-10 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-4">No meals available for this date</p>
            <Button onClick={() => setCurrentDate(new Date())}>
              Go to Today
            </Button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default MealBookingPage;