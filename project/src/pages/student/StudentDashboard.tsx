import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, ClipboardCheck, Utensils } from 'lucide-react';
import type { Meal } from '../../types';
import StudentLayout from '../../components/layout/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useMeals } from '../../contexts/MealContext';
import MealCard from '../../components/student/MealCard';
import { useNavigate } from 'react-router-dom';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { meals, bookings, getBookingsByUser, getMealsByDate } = useMeals();
  const [todayMeals, setTodayMeals] = useState(getMealsByDate(format(new Date(), 'yyyy-MM-dd')));
  const [upcomingBookings, setUpcomingBookings] = useState(getBookingsByUser(user?.id || '').filter(b => b.status === 'booked'));
  const [currentMeal, setCurrentMeal] = useState<Meal | null>(null);
  const navigate = useNavigate();
  
  // Format stats data
  const totalBookings = getBookingsByUser(user?.id || '').length;
  const consumedMeals = getBookingsByUser(user?.id || '').filter(b => b.status === 'consumed').length;
  
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

      // Determine current meal
      const now = new Date();
      const currentHour = now.getHours();
      const currentMealFound = meals.find((meal) => {
        // Expect formats like "7-9" or "07:00-09:00"; extract hours safely
        const parts = (meal.time || '').split('-');
        if (parts.length !== 2) return false;
        const parseHour = (s: string) => {
          const match = s.match(/\d{1,2}/);
          return match ? parseInt(match[0], 10) : NaN;
        };
        const startHour = parseHour(parts[0]);
        const endHour = parseHour(parts[1]);
        if (Number.isNaN(startHour) || Number.isNaN(endHour)) return false;
        return (
          format(new Date(meal.date), 'yyyy-MM-dd') === today &&
          currentHour >= startHour &&
          currentHour < endHour
        );
      });
      setCurrentMeal(currentMealFound || null);
    }
  }, [user, bookings, getMealsByDate, getBookingsByUser]);
  
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
    navigate('/dashboard/booking');
  };
  
  return (
    <StudentLayout 
      title={`Welcome, ${user?.name}`} 
      subtitle="Check your meal schedule and manage bookings"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Stats Cards */}
        <div className="col-span-1 md:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <p className="text-sm text-gray-500 mb-1">Current Meal</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {currentMeal ? (currentMeal.name ?? currentMeal.type) : 'None'}
                  </h3>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg text-amber-700">
                  <Utensils size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Meal Status */}
        {currentMeal && (
          <div className="col-span-1 md:col-span-12">
            <Card>
              <CardHeader>
                <CardTitle>Current Meal Status</CardTitle>
                <CardDescription>
                  {(currentMeal.name ?? currentMeal.type)} ({currentMeal.time})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{currentMeal.name ?? currentMeal.type}</h3>
                    <p className="text-gray-600">{currentMeal.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                        {currentMeal.type}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                        {currentMeal.time}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {isMealBooked(currentMeal.id) ? (
                      <span className="px-4 py-2 rounded-lg bg-green-100 text-green-800 font-medium">
                        Booked
                      </span>
                    ) : (
                      <span className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 font-medium">
                        Not Booked
                      </span>
                    )}
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const booking = getBookingForMeal(currentMeal.id);
                        if (booking) {
                          navigate('/dashboard/qr-code', { state: { booking, meal: currentMeal } });
                        }
                      }}
                      disabled={!isMealBooked(currentMeal.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;