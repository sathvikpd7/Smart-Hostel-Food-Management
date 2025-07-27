import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Utensils, Sun, Moon, Coffee, Clock, CheckCircle } from 'lucide-react';
import StudentLayout from '../../components/layout/StudentLayout.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import Button from '../../components/ui/Button.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useMeals } from '../../contexts/MealContext.js';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, color }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  color: string;
}) => (
  <Card className="hover:shadow-md transition-all">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <div className={`bg-${color}-100 p-3 rounded-lg text-${color}-600`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const LiveMealTimeCard = () => {
  const [currentMeal, setCurrentMeal] = useState({ 
    period: '', 
    icon: <Clock className="text-gray-400" />,
    color: 'gray'
  });

  useEffect(() => {
    const updateMealTime = () => {
      const hours = new Date().getHours();
      let mealInfo;

      if (hours >= 6 && hours < 11) {
        mealInfo = {
          period: 'Breakfast Time',
          icon: <Coffee className="text-amber-600" />,
          color: 'amber'
        };
      } else if (hours >= 11 && hours < 16) {
        mealInfo = {
          period: 'Lunch Time',
          icon: <Sun className="text-orange-500" />,
          color: 'orange'
        };
      } else {
        mealInfo = {
          period: 'Dinner Time',
          icon: <Moon className="text-indigo-600" />,
          color: 'indigo'
        };
      }

      setCurrentMeal(mealInfo);
    };

    updateMealTime();
    const interval = setInterval(updateMealTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-l-4 border-blue-500 hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Current Meal Period</p>
            <h3 className="text-2xl font-bold">{currentMeal.period || "Checking..."}</h3>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg text-gray-600">
            {currentMeal.icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { bookings, getBookingsByUser, getMealsByDate } = useMeals();
  const [stats, setStats] = useState({
    totalBookings: 0,
    mealsConsumed: 0,
    upcomingMeals: 0,
    todaysMeals: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const userBookings = getBookingsByUser(user.id);
      const today = format(new Date(), 'yyyy-MM-dd');
      const activeBookings = userBookings.filter((b: any) => 
        b.status === 'booked' && b.date >= today
      );

      setStats({
        totalBookings: userBookings.length,
        mealsConsumed: userBookings.filter((b: any) => b.status === 'consumed').length,
        upcomingMeals: activeBookings.length,
        todaysMeals: getMealsByDate(today).length
      });
    }
  }, [user, bookings, getBookingsByUser, getMealsByDate]);

  return (
    <StudentLayout 
      title={`Welcome, ${user?.name}`} 
      subtitle="Your meal dashboard"
    >
      <div className="space-y-6">
        {/* 4-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <LiveMealTimeCard />
          
          <StatCard
            title="Today's Meals"
            value={stats.todaysMeals}
            icon={<Utensils className="text-blue-600" />}
            color="blue"
          />
          
          <StatCard
            title="Upcoming Bookings"
            value={stats.upcomingMeals}
            icon={<Calendar className="text-green-600" />}
            color="green"
          />
          
          <StatCard
            title="Meals Consumed"
            value={stats.mealsConsumed}
            icon={<CheckCircle className="text-purple-600" />}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Book Meals</h3>
                  <p className="text-sm text-gray-500">Schedule your upcoming meals</p>
                </div>
                <Button 
                  onClick={() => navigate('/meal-booking')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Booking History</h3>
                  <p className="text-sm text-gray-500">View your past bookings</p>
                </div>
                <Button 
                  onClick={() => navigate('/booking-history')}
                  variant="outline"
                >
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;