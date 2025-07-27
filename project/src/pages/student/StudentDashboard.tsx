import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, ClipboardCheck, Clock, QrCode, Utensils, Sun, Moon, Coffee } from 'lucide-react';
import StudentLayout from '../../components/layout/StudentLayout.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import Button from '../../components/ui/Button.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useMeals } from '../../contexts/MealContext.js';
import MealCard from '../../components/student/MealCard.js';
import QRCodeDisplay from '../../components/student/QRCodeDisplay.js';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
      <div className={`bg-${color}-100 p-3 rounded-lg text-${color}-600`}>
        {icon}
      </div>
    </CardContent>
  </Card>
);

const EmptyState = ({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
  <div className="text-center py-8 space-y-2">
    <Utensils className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
    <p className="text-sm text-gray-500">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const LiveMealStatusCard = () => {
  const [currentMealPeriod, setCurrentMealPeriod] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    const hours = currentTime.getHours();
    let period = '';
    let mealIcon = <Utensils className="text-gray-400" />;
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-600';

    if (hours >= 6 && hours < 11) {
      period = 'Breakfast Time';
      mealIcon = <Coffee className="text-amber-600" />;
      bgColor = 'bg-amber-100';
      textColor = 'text-amber-600';
    } else if (hours >= 11 && hours < 16) {
      period = 'Lunch Time';
      mealIcon = <Sun className="text-orange-500" />;
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-600';
    } else if ((hours >= 16 && hours < 24) || (hours >= 0 && hours < 6)) {
      period = 'Dinner Time';
      mealIcon = <Moon className="text-indigo-600" />;
      bgColor = 'bg-indigo-100';
      textColor = 'text-indigo-600';
    }

    setCurrentMealPeriod(period);

    return () => clearInterval(timer);
  }, [currentTime]);

  return (
    <Card className="border-l-4 border-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Current Meal Period</h3>
            <p className={`text-sm ${currentMealPeriod ? 'text-gray-600' : 'text-gray-400'}`}>
              {currentMealPeriod || 'Determining current meal time...'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {format(currentTime, 'hh:mm a')}
            </p>
          </div>
          <div className={`p-3 rounded-full ${currentMealPeriod ? 'bg-green-100' : 'bg-gray-100'}`}>
            {currentMealPeriod ? (
              <Utensils size={24} className="text-green-600" />
            ) : (
              <Clock size={24} className="text-gray-400" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { bookings, getBookingsByUser, getMealsByDate } = useMeals();
  const [todayMeals, setTodayMeals] = useState(getMealsByDate(format(new Date(), 'yyyy-MM-dd')));
  const [upcomingBookings, setUpcomingBookings] = useState(getBookingsByUser(user?.id || '').filter((b: any) => b.status === 'booked'));
  const [nextBooking, setNextBooking] = useState(upcomingBookings[0]);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      const today = format(new Date(), 'yyyy-MM-dd');
      setTodayMeals(getMealsByDate(today));
      
      const userBookings = getBookingsByUser(user.id);
      const activeBookings = userBookings.filter((booking: any) => 
        booking.status === 'booked' && 
        (booking.date >= today)
      ).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setUpcomingBookings(activeBookings);
      setNextBooking(activeBookings[0]);
    }
  }, [user, bookings, getMealsByDate, getBookingsByUser]);
  
  const stats = [
    { title: 'Total Bookings', value: getBookingsByUser(user?.id || '').length, icon: <Calendar size={20} />, color: 'blue' },
    { title: 'Meals Consumed', value: getBookingsByUser(user?.id || '').filter((b: any) => b.status === 'consumed').length, icon: <ClipboardCheck size={20} />, color: 'green' },
    { title: 'Upcoming Meals', value: upcomingBookings.length, icon: <Clock size={20} />, color: 'amber' }
  ];
  
  const isMealBooked = (mealId: string) => {
    return bookings.some((booking: any) => 
      booking.userId === user?.id && 
      booking.mealId === mealId && 
      booking.status !== 'cancelled'
    );
  };
  
  const getBookingForMeal = (mealId: string) => {
    return bookings.find((booking: any) => 
      booking.userId === user?.id && 
      booking.mealId === mealId && 
      booking.status !== 'cancelled'
    );
  };
  
  const handleViewAllMeals = () => navigate('/meal-booking');
  const handleViewQR = (bookingId: string) => navigate(`/booking/${bookingId}/qr`);

  return (
    <StudentLayout 
      title={`Welcome back, ${user?.name}`} 
      subtitle="Here's your meal schedule"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <StatCard 
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Meals */}
          <div className="lg:col-span-2 space-y-6">
            <LiveMealStatusCard />
            
            <Card>
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Today's Meals</CardTitle>
                    <CardDescription>{format(new Date(), 'EEEE, MMMM d')}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleViewAllMeals}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {todayMeals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {todayMeals.map((meal: any) => (
                      <MealCard 
                        key={meal.id} 
                        meal={meal} 
                        isBooked={isMealBooked(meal.id)}
                        bookingId={getBookingForMeal(meal.id)?.id}
                        bookingStatus={getBookingForMeal(meal.id)?.status}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    title="No meals available today"
                    description="Check back later or book for another day"
                    action={<Button onClick={handleViewAllMeals}>Book Meal</Button>}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* QR Code Section */}
          {nextBooking && (
            <Card>
              <CardHeader>
                <CardTitle>Next Booking</CardTitle>
                <CardDescription>
                  {format(new Date(nextBooking.date), 'EEEE, MMMM d')} - {nextBooking.type}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center p-6">
                <QRCodeDisplay booking={nextBooking} />
                <Button variant="outline" className="mt-4 w-full" onClick={() => handleViewQR(nextBooking.id)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  View Full QR
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;