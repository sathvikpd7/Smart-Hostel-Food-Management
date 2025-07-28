import React from 'react';
import { format } from 'date-fns';
import { Meal, MealBooking } from '../../types/index.js';
import { Coffee, Utensils, UtensilsCrossed } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card.js';
import Button from '../ui/Button.js';
import { useMeals } from '../../contexts/MealContext.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { toast } from 'react-hot-toast';
import QRCodeDisplay from './QRCodeDisplay.js';

interface MealCardProps {
  meal: Meal | undefined;
  isBooked: boolean;
  date: Date;
  isLoading: boolean;
  onBook: () => void;
  onShowQR: () => void;
  type: 'breakfast' | 'lunch' | 'dinner';
  icon: string;
  bookingId?: string;
  bookingStatus?: 'booked' | 'consumed' | 'cancelled';
  onBookingComplete?: () => void;
  booking?: any; // TODO: Define proper type for booking
}

const MealCard: React.FC<MealCardProps> = ({ 
  meal, 
  isBooked, 
  bookingId,
  bookingStatus = 'booked',
  onBookingComplete,
  booking
}) => {
  const { bookMeal, cancelBooking, loading } = useMeals();
  const { user } = useAuth();
  
  // Parse the date string into a Date object
  const mealDate = meal ? new Date(meal.date) : new Date();
  
  // Check if the meal date is in the past
  const isPastMeal = mealDate ? mealDate < new Date() : false;
  
  // Get meal time icons
  const getMealIcon = () => {
    if (!meal) return <Utensils size={20} />;
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
    if (!meal) return '';
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
  
  // Format meal title
  const formatMealTitle = () => {
    if (!meal) return '';
    return meal.type.charAt(0).toUpperCase() + meal.type.slice(1);
  };
  
  // Handle booking
  const handleBookMeal = async () => {
    if (!user) return;
    
    try {
      if (!meal) return;
    const booking = await bookMeal(user.id, meal.id, meal.type, meal.date);
      toast.success(`${formatMealTitle()} booked successfully!`);
      if (onBookingComplete) onBookingComplete();
      return booking;
    } catch (error) {
      toast.error('Failed to book meal. Please try again.');
      return null;
    }
  };
  
  // Handle cancellation
  const handleCancelBooking = async () => {
    if (!bookingId) return;
    
    try {
      await cancelBooking(bookingId);
      toast.success(`${formatMealTitle()} booking cancelled`);
      if (onBookingComplete) onBookingComplete();
    } catch (error) {
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
  
  const [showQRCode, setShowQRCode] = React.useState(false);
  const [currentBooking, setCurrentBooking] = React.useState<MealBooking | null>(null);

  const handleBookingSuccess = async () => {
    const booking = await handleBookMeal();
    if (booking) {
      setCurrentBooking(booking);
      setShowQRCode(true);
    }
  };

  return (
    <div className="space-y-4">
      {showQRCode && currentBooking && meal && (
        <QRCodeDisplay booking={currentBooking} meal={meal} />
      )}
      <Card className="h-full">
        <CardHeader className={`${getCardHeaderClass()} py-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2">{getMealIcon()}</span>
              <CardTitle className="text-lg">{formatMealTitle()}</CardTitle>
            </div>
            <span className="text-xs font-medium">
              {getMealTimeRange()}
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          <div className="text-sm text-gray-700 mb-2">
            {mealDate ? format(mealDate, 'EEEE, MMMM d, yyyy') : 'Date not available'}
          </div>
          
          <ul className="text-sm text-gray-700 space-y-1 mb-4">
            {meal?.menuItems?.map((item: string, index: number) => (
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
        
        <CardFooter>
          {isBooked ? (
          <Button 
            variant="danger" 
            onClick={handleCancelBooking}
            disabled={loading || isPastMeal}
          >
            Cancel Booking
          </Button>
        ) : (
          <Button 
            onClick={handleBookingSuccess}
            disabled={loading || isPastMeal}
          >
            Book Meal
          </Button>
        )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default MealCard;