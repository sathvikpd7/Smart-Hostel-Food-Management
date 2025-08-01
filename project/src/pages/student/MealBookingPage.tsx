import React, { useState, useEffect } from 'react';
import { format, addDays, isToday } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, QrCode, Utensils, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMeals } from '../../contexts/MealContext';
import StudentLayout from '../../components/layout/StudentLayout';
import Button from '../../components/ui/Button';
import { Meal, MealBooking } from '../../types/index';
import QRCode from 'react-qr-code';
import Modal from '../../components/ui/Modal';

const MealCard: React.FC<{
  meal: Meal | undefined;
  date: Date;
  isBooked: boolean;
  isLoading: boolean;
  onBook: () => void;
  onShowQR: () => void;
  type: 'breakfast' | 'lunch' | 'dinner';
  icon: string;
}> = ({ meal, date, isBooked, isLoading, onBook, onShowQR, type, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{icon}</span>
            <div>
              <h3 className="text-xl font-semibold">{type}</h3>
              {meal && (
                <p className="text-sm text-gray-500 flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {meal.time}
                </p>
              )}
            </div>
          </div>
          {isBooked && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Booked
            </span>
          )}
        </div>

        {meal ? (
          <>
            <div className="mb-4 space-y-3">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Menu:</h4>
                <p className="text-gray-600 pl-2 border-l-2 border-blue-200">
                  {meal.menuItems.join(', ') || 'No menu specified'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Description:</h4>
                <p className="text-gray-600 pl-2 border-l-2 border-blue-200">
                  {meal.description || 'No description available'}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              {isBooked ? (
                <>
                  <Button
                    variant="outline"
                    onClick={onShowQR}
                    className="flex items-center"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Show QR
                  </Button>
                </>
              ) : (
                <Button
                  onClick={onBook}
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
            <Utensils className="mx-auto h-8 w-8 mb-3" />
            <p className="mb-4">No {type} available on {format(date, 'MMM d')}</p>
            <Button 
              variant="outline" 
              onClick={() => {}}
              className="w-full"
            >
              Book Meal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const MealBookingPage: React.FC = () => {
  const { user } = useAuth();
  const { meals, bookings, getMealsByDate, bookMeal } = useMeals();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayedMeals, setDisplayedMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQRData] = useState('');
  const [currentBooking, setCurrentBooking] = useState<MealBooking | null>(null);
  
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
      const booking = await bookMeal(
        mealId, 
        user.id, 
        mealType, 
        format(currentDate, 'yyyy-MM-dd')
      );
      
      // Generate QR code data after successful booking
      const qrContent = JSON.stringify({
        bookingId: booking.id,
        userId: user.id,
        mealId: mealId,
        date: format(currentDate, 'yyyy-MM-dd'),
        type: mealType
      });
      setQRData(qrContent);
      setCurrentBooking(booking);
      setShowQRModal(true);
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

  interface MealType {
    type: 'breakfast' | 'lunch' | 'dinner';
    displayName: string;
    icon: string;
  }

  const mealTypes: MealType[] = [
    { type: 'breakfast', displayName: 'Breakfast', icon: '🍳' },
    { type: 'lunch', displayName: 'Lunch', icon: '🍲' },
    { type: 'dinner', displayName: 'Dinner', icon: '🍽️' }
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
            <MealCard
              key={type}
              meal={meal}
              date={currentDate}
              isBooked={isBooked}
              isLoading={meal ? loading[meal.id] : false}
              onBook={() => meal && handleBookMeal(meal.id, type)}
              onShowQR={() => {
                if (meal) {
                  const booking = bookings.find(b => 
                    b.mealId === meal.id && 
                    b.userId === user?.id && 
                    b.status !== 'cancelled'
                  );
                  if (booking) {
                    setQRData(JSON.stringify({
                      bookingId: booking.id,
                      userId: user?.id ?? '',
                      mealId: meal.id,
                      date: booking.date,
                      type: type
                    }));
                    setCurrentBooking(booking);
                    setShowQRModal(true);
                  }
                }
              }}
              type={type}
              icon={icon}
            />
          );
        })}
      </div>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Meal QR Code"
      >
        <div className="text-center p-6">
          {qrData && (
            <>
              <div className="mb-4 flex justify-center">
                <QRCode 
                  value={qrData} 
                  size={200}
                />
              </div>
              <div className="mb-6">
                <h3 className="font-medium text-lg mb-1">
                  {currentBooking?.type?.toUpperCase() || 'Meal'}
                </h3>
                <p className="text-gray-600">
                  {format(new Date(currentBooking?.date || currentDate), 'MMMM d, yyyy')}
                </p>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Show this QR code at the dining hall to claim your meal
              </p>
              <Button 
                onClick={() => setShowQRModal(false)}
                className="w-full"
              >
                Close
              </Button>
            </>
          )}
        </div>
      </Modal>
    </StudentLayout>
  );
};

export default MealBookingPage;