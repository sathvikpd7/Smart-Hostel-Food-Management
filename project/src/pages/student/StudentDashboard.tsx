import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Calendar, ClipboardCheck, Clock, QrCode } from 'lucide-react';
import StudentLayout from '../../components/layout/StudentLayout.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import Button from '../../components/ui/Button.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useMeals } from '../../contexts/MealContext.js';
import { useNavigate } from 'react-router-dom';
import { Meal, MealBooking } from '../../types/index.js';
import {toast} from 'react-hot-toast';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    meals, 
    bookings, 
    getBookingsByUser, 
    getMealsByDate,
    markMealAsConsumed,
    rateMeal
  } = useMeals();
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<MealBooking[]>([]);
  const [nextBooking, setNextBooking] = useState<MealBooking | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<MealBooking | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRBooking, setSelectedQRBooking] = useState<MealBooking | null>(null);
  const navigate = useNavigate();

  const handleViewAllMeals = () => {
    navigate('/student/meals');
  };

  useEffect(() => {
    if (user) {
      // Get today's meals
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayMealsList = getMealsByDate(today);
      setTodayMeals(todayMealsList);

      // Get upcoming bookings (future dates and today, status is booked)
      const userBookings = getBookingsByUser(user.id);
      const activeBookings = userBookings.filter(booking => 
        booking.status === 'booked' && 
        (booking.date >= today)
      );

      // Sort by date (closest first)
      activeBookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setUpcomingBookings(activeBookings);
      setNextBooking(activeBookings[0] || null);
    }
  }, [user, meals, bookings, getMealsByDate, getBookingsByUser]);

  const handleShowQRCode = (booking: MealBooking | undefined) => {
    if (booking) {
      setSelectedQRBooking(booking);
      setShowQRModal(true);
    }
  };

  const handleConsumeMeal = async (bookingId: string | undefined) => {
    if (!bookingId) return;
    try {
      await markMealAsConsumed(bookingId);
      toast.success('Meal marked as consumed!');
      // Refresh data
      const today = format(new Date(), 'yyyy-MM-dd');
      setTodayMeals(getMealsByDate(today));
      setUpcomingBookings(getBookingsByUser(user?.id || '').filter(b => 
        b.status === 'booked' && b.date >= today
      ));
    } catch (error) {
      toast.error('Failed to mark meal as consumed');
    }
  };

  const handleRatingSubmit = async () => {
    if (!selectedBooking || rating === null) return;
    
    try {
      await rateMeal(selectedBooking.id, rating, ratingComment);
      toast.success('Thank you for your feedback!');
      setShowRatingModal(false);
      setRating(null);
      setRatingComment('');
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const getMealByType = (type: string) => {
    const meal = meals.find(meal => meal.type === type);
    return meal || { 
      id: '', 
      type, 
      date: '', 
      menuItems: [],
      time: 'Not available',
      description: 'No meal available'
    };
  };

  return (
    <StudentLayout 
      title={`Welcome, ${user?.name}`} 
      subtitle="Check your meal schedule and manage bookings"
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Student Dashboard</h1>

        {/* Today's Meals */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Today's Meals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['breakfast', 'lunch', 'dinner'].map(type => (
              <Card key={type}>
                <CardContent>
                  <h3 className="font-semibold mb-2">{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
                  <p className="text-gray-600 mb-2">{getMealByType(type).time}</p>
                  {getMealByType(type).menuItems.map(item => (
                    <p key={item} className="text-sm mb-1">• {item}</p>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Bookings</h2>
          {upcomingBookings.length === 0 ? (
            <p className="text-gray-600">No upcoming bookings.</p>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map(booking => (
                <div key={booking.id} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">{booking.type.charAt(0).toUpperCase() + booking.type.slice(1)}</h3>
                  <p className="text-sm text-gray-600 mb-2">{booking.date}</p>
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowQRCode(booking)}
                    >
                      Show QR Code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConsumeMeal(booking.id)}
                    >
                      Mark as Consumed
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;