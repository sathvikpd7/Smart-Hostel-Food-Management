import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar, ClipboardCheck, Utensils, Bell, BellOff } from 'lucide-react';
import type { Meal } from '../../types';
import StudentLayout from '../../components/layout/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useMeals } from '../../contexts/MealContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import MealCard from '../../components/student/MealCard';
import MealRecommendations from '../../components/student/MealRecommendations';
import Skeleton from '../../components/ui/Skeleton';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { RecommendationScore } from '../../services/mealRecommendation';
import { pushNotificationService } from '../../services/pushNotification';
import toast from 'react-hot-toast';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { meals, bookings, getBookingsByUser, getMealsByDate, loading: mealsLoading } = useMeals();
  const { feedbacks } = useFeedback();
  const [todayMeals, setTodayMeals] = useState(getMealsByDate(format(new Date(), 'yyyy-MM-dd')));
  const [currentMeal, setCurrentMeal] = useState<Meal | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsRefreshNonce, setRecommendationsRefreshNonce] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const navigate = useNavigate();
  const userId = user?.id ?? '';

  const userBookings = useMemo(
    () => (userId ? getBookingsByUser(userId) : []),
    [getBookingsByUser, userId, bookings]
  );

  const totalBookings = userBookings.length;
  const consumedMeals = userBookings.filter(b => b.status === 'consumed').length;

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const availableMeals = useMemo(
    () => meals.filter(meal => meal.date >= todayStr),
    [meals, todayStr]
  );

  // Check notification status on component mount
  useEffect(() => {
    setNotificationsEnabled(pushNotificationService.isEnabled());
  }, []);

  // Handle notification toggle
  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      toast('You can disable notifications in your browser settings', { icon: 'ℹ️' });
    } else {
      const granted = await pushNotificationService.requestPermission();
      if (granted) {
        setNotificationsEnabled(true);
        toast.success('Push notifications enabled! You will receive meal reminders.');
      } else {
        toast.error('Notification permission denied. Please enable it in your browser settings.');
      }
    }
  };

  useEffect(() => {
    if (user) {
      // Get today's meals
      const today = format(new Date(), 'yyyy-MM-dd');
      setTodayMeals(getMealsByDate(today));

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
  }, [user, meals, getMealsByDate]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    const fetchRecommendations = async () => {
      if (!user || availableMeals.length === 0) {
        if (active) setRecommendations([]);
        return;
      }
      if (active) setLoadingRecommendations(true);
      try {
        const recs = await api.getRecommendations(user.id, availableMeals, 4);
        if (active) setRecommendations(recs);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        if (active) setRecommendations([]);
      } finally {
        if (active) setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
    // Lightweight realtime refresh
    timer = setInterval(fetchRecommendations, 60000);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [user, availableMeals, bookings.length, feedbacks.length, recommendationsRefreshNonce]);

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
        {/* Notification Settings Card */}
        <div className="col-span-1 md:col-span-12">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {notificationsEnabled ? (
                    <Bell className="text-blue-600 mr-3" size={24} />
                  ) : (
                    <BellOff className="text-gray-400 mr-3" size={24} />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                    <p className="text-sm text-gray-600">
                      {notificationsEnabled
                        ? 'You will receive reminders for your upcoming meals'
                        : 'Enable notifications to get meal reminders'}
                    </p>
                  </div>
                </div>
                <Button
                  variant={notificationsEnabled ? 'outline' : 'primary'}
                  onClick={handleToggleNotifications}
                  className="flex items-center"
                >
                  {notificationsEnabled ? (
                    <>
                      <Bell size={16} className="mr-2" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <BellOff size={16} className="mr-2" />
                      Enable Notifications
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="col-span-1 md:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {mealsLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="w-full">
                        <Skeleton className="mb-2 w-[100px] h-[16px]" />
                        <Skeleton className="w-[60px] h-[32px]" />
                      </div>
                      <Skeleton variant="circular" className="w-[48px] h-[48px]" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card className="hover:shadow-md transition-shadow duration-200">
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

              <Card className="hover:shadow-md transition-shadow duration-200">
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
            </>
          )}
        </div>

        {user && availableMeals.length > 0 && (
          <div className="col-span-1 md:col-span-12">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">
                {loadingRecommendations ? 'Refreshing recommendations…' : 'Recommendations update automatically'}
              </div>
              <Button
                variant="outline"
                onClick={() => setRecommendationsRefreshNonce(n => n + 1)}
                disabled={loadingRecommendations}
              >
                Refresh Recommendations
              </Button>
            </div>
            <MealRecommendations
              recommendations={recommendations}
              loading={loadingRecommendations}
              showEmptyState
              onSelectMeal={(meal) => {
                const element = document.getElementById(`meal-${meal.id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  element.classList.add('ring-2', 'ring-purple-500', 'ring-offset-2');
                  setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-2');
                  }, 2000);
                } else {
                  navigate('/dashboard/booking');
                }
              }}
            />
          </div>
        )}

        {/* Current Meal Status */}
        {(mealsLoading || currentMeal) && (
          <div className="col-span-1 md:col-span-12">
            <Card>
              <CardHeader>
                {mealsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="w-[200px] h-[24px]" />
                    <Skeleton className="w-[300px] h-[16px]" />
                  </div>
                ) : (
                  <>
                    <CardTitle>Current Meal Status</CardTitle>
                    <CardDescription>
                      {(currentMeal!.name ?? currentMeal!.type)} ({currentMeal!.time})
                    </CardDescription>
                  </>
                )}
              </CardHeader>
              <CardContent>
                {mealsLoading ? (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1 w-full space-y-3">
                      <Skeleton className="w-[40%] h-[24px]" />
                      <Skeleton className="w-[80%] h-[16px]" />
                      <div className="flex gap-2">
                        <Skeleton className="rounded-full w-[60px] h-[24px]" />
                        <Skeleton className="rounded-full w-[80px] h-[24px]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="rounded-lg w-[100px] h-[40px]" />
                      <Skeleton className="rounded-md w-[120px] h-[40px]" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{currentMeal!.name ?? currentMeal!.type}</h3>
                      <p className="text-gray-600">{currentMeal!.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                          {currentMeal!.type}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                          {currentMeal!.time}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {isMealBooked(currentMeal!.id) ? (
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
                          // /dashboard/qr-code does not exist as a route.
                          // Navigate to Booking History where the QR modal is available.
                          navigate('/dashboard/history');
                        }}
                        disabled={!isMealBooked(currentMeal!.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                )}
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

          {mealsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-full">
                  <CardContent className="p-0 h-full flex flex-col">
                    <Skeleton className="w-full h-[192px] rounded-t-lg" />
                    <div className="p-5 space-y-3 flex-1">
                      <div className="flex justify-between items-start">
                        <Skeleton className="w-[60%] h-[24px]" />
                        <Skeleton className="rounded-full w-[60px] h-[20px]" />
                      </div>
                      <Skeleton className="w-[40%] h-[16px]" />
                      <div className="pt-4 mt-auto">
                        <Skeleton className="w-full h-[40px] rounded-md" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : todayMeals.length === 0 ? (
            <Card className="hover:shadow-sm transition-shadow duration-200">
              <CardContent className="p-8 text-center text-gray-500">
                No meals available for today.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {todayMeals.map(meal => {
                const isBooked = isMealBooked(meal.id);
                const booking = getBookingForMeal(meal.id);

                return (
                  <div key={meal.id} id={`meal-${meal.id}`} className="transition-all">
                    <MealCard
                      meal={meal}
                      isBooked={isBooked}
                      bookingId={booking?.id}
                      bookingStatus={booking?.status}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
