import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, ClipboardCheck, Clock, QrCode } from 'lucide-react';
import StudentLayout from '../../components/layout/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useMeals } from '../../contexts/MealContext';
import MealCard from '../../components/student/MealCard';
import QRCodeDisplay from '../../components/student/QRCodeDisplay';
import { useNavigate } from 'react-router-dom';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { bookings, getBookingsByUser, getMealsByDate } = useMeals();
  const [todayMeals, setTodayMeals] = useState(getMealsByDate(format(new Date(), 'yyyy-MM-dd')));
  const [upcomingBookings, setUpcomingBookings] = useState(getBookingsByUser(user?.id || '').filter(b => b.status === 'booked'));
  const [nextBooking, setNextBooking] = useState(upcomingBookings[0]);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      // Get today's meals
      const today = format(new Date(), 'yyyy-MM-dd');
      setTodayMeals(getMealsByDate(today));
      
      // Get upcoming bookings (future dates and today, status is booked)
      const userBookings = getBookingsByUser(user.id);
      const activeBookings = userBookings.filter(booking => 
        booking.status === 'booked' && 
        (booking.date >= today)
      );
      
      // Sort by date (closest first)
      activeBookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setUpcomingBookings(activeBookings);
      setNextBooking(activeBookings[0]);
    }
  }, [user, bookings, getMealsByDate, getBookingsByUser]);
  
  // Format stats data
  const totalBookings = getBookingsByUser(user?.id || '').length;
  const consumedMeals = getBookingsByUser(user?.id || '').filter(b => b.status === 'consumed').length;
  
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
  
  // Navigate to booking page
  const handleViewAllMeals = () => {
    navigate('/meal-booking');
  };
  
  return (
    <StudentLayout 
      title={`Welcome, ${user?.name}`} 
      subtitle="Check your meal schedule and manage bookings"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Stats Cards */}
        <div className="col-span-1 md:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Bookings</p>
                  <h3 className="text-3xl font-bold text-gray-900">{totalBookings}</h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg text-blue-700">
                  <Calendar size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Meals Consumed</p>
                  <h3 className="text-3xl font-bold text-gray-900">{consumedMeals}</h3>
                </div>
                <div className="bg-green-100 p-3 rounded-lg text-green-700">
                  <ClipboardCheck size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Upcoming Meals</p>
                  <h3 className="text-3xl font-bold text-gray-900">{upcomingBookings.length}</h3>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg text-amber-700">
                  <Clock size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* QR Code Section - Show only if next booking exists */}
        {nextBooking && (
          <div className="col-span-1 md:col-span-3">
            <QRCodeDisplay booking={nextBooking} />
          </div>
        )}
        
        {/* Today's Meals */}
        <div className="col-span-1 md:col-span-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Today's Meals</h2>
            <Button variant="outline" onClick={handleViewAllMeals}>
              View All Meals
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {todayMeals.map(meal => {
              const isBooked = isMealBooked(meal.id);
              const booking = getBookingForMeal(meal.id);
              
              return (
                <MealCard 
                  key={meal.id} 
                  meal={meal} 
                  isBooked={isBooked}
                  bookingId={booking?.id}
                  bookingStatus={booking?.status}
                />
              );
            })}
          </div>
        </div>
        
        {/* Upcoming Bookings Section */}
        <div className="col-span-1 md:col-span-12 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
              <CardDescription>Your next 5 meal bookings</CardDescription>
            </CardHeader>
            
            <CardContent>
              {upcomingBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b text-xs text-gray-500 uppercase">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Meal</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingBookings.slice(0, 5).map(booking => (
                        <tr key={booking.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {format(new Date(booking.date), 'MMM d, yyyy')}
                          </td>
                          <td className="px-4 py-3 capitalize">{booking.type}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="flex items-center text-blue-700"
                            >
                              <QrCode size={16} className="mr-1" />
                              View QR
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No upcoming bookings</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={handleViewAllMeals}
                  >
                    Book a Meal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;