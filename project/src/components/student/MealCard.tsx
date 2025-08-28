import React from 'react';
import { format } from 'date-fns';
import { Meal } from '../../types';
import { Coffee, Utensils, UtensilsCrossed } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { useMeals } from '../../contexts/MealContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface MealCardProps {
  meal: Meal;
  isBooked: boolean;
  bookingId?: string;
  bookingStatus?: 'booked' | 'consumed' | 'cancelled';
  onBookingComplete?: () => void;
}

const MealCard: React.FC<MealCardProps> = ({ 
  meal, 
  isBooked, 
  bookingId,
  bookingStatus = 'booked',
  onBookingComplete
}) => {
  const { bookMeal, cancelBooking, loading } = useMeals();
  const { user } = useAuth();
  
  // Parse the date string into a Date object
  const mealDate = new Date(meal.date);
  
  // Time-based booking cutoff per meal type (local time)
  const getCutoffDateTime = () => {
    const cutoffs: Record<'breakfast' | 'lunch' | 'dinner', { h: number; m: number }> = {
      breakfast: { h: 9, m: 0 },   // 09:00
      lunch: { h: 15, m: 0 },      // 15:00 (3 PM)
      dinner: { h: 21, m: 0 },     // 21:00 (9 PM)
    };
    const c = cutoffs[meal.type] ?? { h: 23, m: 59 };
    const d = new Date(`${meal.date}T00:00:00`);
    d.setHours(c.h, c.m, 0, 0);
    return d;
  };
  
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const isPastDate = meal.date < todayStr; // string compare yyyy-MM-dd
  const isToday = meal.date === todayStr;
  const isBookingClosed = isPastDate || (isToday && now > getCutoffDateTime());
  
  // Get meal time icons
  const getMealIcon = () => {
    switch (meal.type) {
      case 'breakfast':
        return <Coffee size={20} />;
      case 'lunch':
        return <Utensils size={20} />;
      case 'dinner':
        return <UtensilsCrossed size={20} />;
      default:
        return <Utensils size={20} />;
    }
  };
  
  // Format time ranges for each meal type
  const getMealTimeRange = () => {
    switch (meal.type) {
      case 'breakfast':
        return '7:00 AM - 8:30 AM';
      case 'lunch':
        return '12:00 PM - 1:30 PM';
      case 'dinner':
        return '7:00 PM - 8:30 PM';
      default:
        return '';
    }
  };

  // Simple veg/non-veg detection using keywords in menu items
  const isVegMeal = () => {
    const nonVegKeywords = [/chicken/i, /egg\b/i, /fish/i, /mutton/i, /beef/i, /pork/i, /meat/i, /ham/i, /turkey/i, /prawn/i, /shrimp/i];
    return !meal.menuItems.some(item => nonVegKeywords.some(rx => rx.test(item)));
  };
  
  // Format meal title
  const formatMealTitle = () => {
    return meal.type.charAt(0).toUpperCase() + meal.type.slice(1);
  };
  
  // Handle booking
  const handleBookMeal = async () => {
    if (!user) return;
    
    try {
      await bookMeal(user.id, meal.id, meal.type, meal.date);
      toast.success(`${formatMealTitle()} booked successfully!`);
      if (onBookingComplete) onBookingComplete();
    } catch {
      toast.error('Failed to book meal. Please try again.');
    }
  };
  
  // Handle cancellation
  const handleCancelBooking = async () => {
    if (!bookingId) return;
    
    try {
      await cancelBooking(bookingId);
      toast.success(`${formatMealTitle()} booking cancelled`);
      if (onBookingComplete) onBookingComplete();
    } catch {
      toast.error('Failed to cancel booking. Please try again.');
    }
  };
  
  // Determine card status color
  const getCardHeaderClass = () => {
    if (isBooked) {
      if (bookingStatus === 'consumed') return 'bg-green-100 text-green-800';
      if (bookingStatus === 'cancelled') return 'bg-red-100 text-red-800';
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };
  
  return (
    <Card className="h-full">
      <CardHeader className={`${getCardHeaderClass()} py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2">{getMealIcon()}</span>
            <CardTitle className="text-lg">{formatMealTitle()}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">
              {getMealTimeRange()}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isVegMeal() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
            >
              {isVegMeal() ? 'VEG' : 'NON-VEG'}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="text-sm text-gray-700 mb-2">
          {format(mealDate, 'EEEE, MMMM d, yyyy')}
        </div>
        
        <ul className="text-sm text-gray-700 space-y-1 mb-4">
          {meal.menuItems.map((item, index) => (
            <li key={index} className="flex items-center">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
              {item}
            </li>
          ))}
        </ul>
        
        {isBooked && (
          <div className="text-sm">
            {bookingStatus === 'booked' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-medium">
                Booked
              </span>
            )}
            {bookingStatus === 'consumed' && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md font-medium">
                Consumed
              </span>
            )}
            {bookingStatus === 'cancelled' && (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md font-medium">
                Cancelled
              </span>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {!isBooked && (
          <Button 
            fullWidth 
            onClick={handleBookMeal} 
            isLoading={loading}
            disabled={isBookingClosed}
          >
            Book Meal
          </Button>
        )}
        
        {isBooked && bookingStatus === 'booked' && !isBookingClosed && (
          <Button 
            fullWidth 
            variant="outline" 
            onClick={handleCancelBooking}
            isLoading={loading}
          >
            Cancel Booking
          </Button>
        )}
        
        {isBookingClosed && !isBooked && (
          <span className="text-sm text-gray-500 w-full text-center py-2">
            Booking closed for this meal
          </span>
        )}
      </CardFooter>
    </Card>
  );
};

export default MealCard;