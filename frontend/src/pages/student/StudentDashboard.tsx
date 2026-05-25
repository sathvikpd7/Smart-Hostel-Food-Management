import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { Calendar, ClipboardCheck, Utensils, Bell, BellOff, Clock, Sun, Moon, Sunrise, ArrowRight, Coffee, UtensilsCrossed } from 'lucide-react';
import type { Meal } from '../../types';
import StudentLayout from '../../components/layout/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useMeals } from '../../contexts/MealContext';
import MealCard from '../../components/student/MealCard';
import Skeleton from '../../components/ui/Skeleton';
import { useNavigate } from 'react-router-dom';
import { pushNotificationService } from '../../services/pushNotification';
import toast from 'react-hot-toast';

// Helper: parse hour from a time string like "7-9", "07:00-09:00", etc.
const parseHour = (s: string): number => {
  const match = s.match(/\d{1,2}/);
  return match ? parseInt(match[0], 10) : NaN;
};

// Helper: parse time to minutes from "07:00" or "7"
const parseTimeToMinutes = (s: string): number => {
  const trimmed = s.trim();
  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
  }
  const hourMatch = trimmed.match(/^\d{1,2}$/);
  if (hourMatch) {
    return parseInt(hourMatch[0], 10) * 60;
  }
  return NaN;
};

// Helper: get greeting based on time of day
const getGreeting = (): { text: string; icon: React.ReactNode } => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return { text: 'Good Morning', icon: <Sunrise size={28} className="text-amber-500" /> };
  } else if (hour < 17) {
    return { text: 'Good Afternoon', icon: <Sun size={28} className="text-orange-500" /> };
  } else {
    return { text: 'Good Evening', icon: <Moon size={28} className="text-indigo-500" /> };
  }
};

// Helper: get meal icon by type
const getMealTypeIcon = (type: string) => {
  switch (type) {
    case 'breakfast': return <Coffee size={18} className="text-amber-600" />;
    case 'lunch': return <Utensils size={18} className="text-blue-600" />;
    case 'dinner': return <UtensilsCrossed size={18} className="text-purple-600" />;
    default: return <Utensils size={18} className="text-gray-600" />;
  }
};

interface CountdownInfo {
  meal: Meal;
  hours: number;
  minutes: number;
  seconds: number;
  isNow: boolean;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { meals, bookings, getBookingsByUser, getMealsByDate, loading: mealsLoading } = useMeals();
  const [todayMeals, setTodayMeals] = useState(getMealsByDate(format(new Date(), 'yyyy-MM-dd')));
  const [currentMeal, setCurrentMeal] = useState<Meal | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [countdown, setCountdown] = useState<CountdownInfo | null>(null);
  const navigate = useNavigate();
  const userId = user?.id ?? '';

  const userBookings = useMemo(
    () => (userId ? getBookingsByUser(userId) : []),
    [getBookingsByUser, userId, bookings]
  );

  const totalBookings = userBookings.length;
  const consumedMeals = userBookings.filter(b => b.status === 'consumed').length;

  const greeting = useMemo(() => getGreeting(), []);

  // Tomorrow's meals for the empty state
  const tomorrowStr = useMemo(() => format(addDays(new Date(), 1), 'yyyy-MM-dd'), []);
  const tomorrowMeals = useMemo(
    () => getMealsByDate(tomorrowStr),
    [getMealsByDate, tomorrowStr, meals]
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
      const today = format(new Date(), 'yyyy-MM-dd');
      setTodayMeals(getMealsByDate(today));

      // Determine current meal
      const now = new Date();
      const currentHour = now.getHours();
      const currentMealFound = meals.find((meal) => {
        const parts = (meal.time || '').split('-');
        if (parts.length !== 2) return false;
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

  // Next upcoming meal countdown timer
  useEffect(() => {
    const computeCountdown = (): CountdownInfo | null => {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const nowSeconds = now.getSeconds();

      // Gather today's and tomorrow's meals, sorted by date + start time
      const candidates: { meal: Meal; startMinutes: number; dayOffset: number }[] = [];

      const todayMealsList = getMealsByDate(todayStr);
      const tomorrowDate = format(addDays(now, 1), 'yyyy-MM-dd');
      const tomorrowMealsList = getMealsByDate(tomorrowDate);

      for (const meal of todayMealsList) {
        const parts = (meal.time || '').split('-');
        if (parts.length !== 2) continue;
        const startMin = parseTimeToMinutes(parts[0]);
        const endMin = parseTimeToMinutes(parts[1]);
        if (Number.isNaN(startMin) || Number.isNaN(endMin)) continue;

        // Check if meal is currently happening
        if (nowMinutes >= startMin && nowMinutes < endMin) {
          return { meal, hours: 0, minutes: 0, seconds: 0, isNow: true };
        }

        // Only consider future meals
        if (startMin > nowMinutes) {
          candidates.push({ meal, startMinutes: startMin, dayOffset: 0 });
        }
      }

      for (const meal of tomorrowMealsList) {
        const parts = (meal.time || '').split('-');
        if (parts.length !== 2) continue;
        const startMin = parseTimeToMinutes(parts[0]);
        if (Number.isNaN(startMin)) continue;
        candidates.push({ meal, startMinutes: startMin, dayOffset: 1 });
      }

      if (candidates.length === 0) return null;

      // Sort by dayOffset then startMinutes
      candidates.sort((a, b) => a.dayOffset - b.dayOffset || a.startMinutes - b.startMinutes);
      const next = candidates[0];

      let diffMinutes: number;
      if (next.dayOffset === 0) {
        diffMinutes = next.startMinutes - nowMinutes;
      } else {
        diffMinutes = (24 * 60 - nowMinutes) + next.startMinutes;
      }

      // Subtract seconds that have passed in the current minute
      let totalSeconds = diffMinutes * 60 - nowSeconds;
      if (totalSeconds < 0) totalSeconds = 0;

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return { meal: next.meal, hours, minutes, seconds, isNow: false };
    };

    setCountdown(computeCountdown());
    const timer = setInterval(() => {
      setCountdown(computeCountdown());
    }, 1000);

    return () => clearInterval(timer);
  }, [meals, getMealsByDate]);

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
      title={`${greeting.text}, ${user?.name?.split(' ')[0] || 'Student'}`}
      subtitle={format(new Date(), 'EEEE, MMMM d, yyyy')}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Greeting + Countdown Row */}
        <div className="col-span-1 md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Greeting Card */}
          <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200/60 overflow-hidden relative">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="bg-white/70 backdrop-blur p-3 rounded-xl shadow-sm">
                  {greeting.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {greeting.text}, {user?.name?.split(' ')[0] || 'Student'}! 👋
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {totalBookings > 0
                      ? `You have ${totalBookings} booking${totalBookings !== 1 ? 's' : ''} so far`
                      : 'Start booking your meals today!'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Meal Countdown Card */}
          <Card className={`overflow-hidden relative ${
            countdown?.isNow
              ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-200/60'
              : 'bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-amber-200/60'
          }`}>
            <CardContent className="p-5">
              {countdown ? (
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl shadow-sm ${
                    countdown.isNow ? 'bg-green-100/80' : 'bg-white/70 backdrop-blur'
                  }`}>
                    {countdown.isNow ? (
                      <Utensils size={28} className="text-green-600" />
                    ) : (
                      <Clock size={28} className="text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    {countdown.isNow ? (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-1">
                          Happening Now
                        </p>
                        <h3 className="text-lg font-bold text-gray-900 capitalize">
                          {countdown.meal.name || countdown.meal.type}
                        </h3>
                        <p className="text-sm text-gray-600">{countdown.meal.time}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">
                          Next Meal
                        </p>
                        <h3 className="text-lg font-bold text-gray-900 capitalize">
                          {countdown.meal.name || countdown.meal.type}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-baseline gap-1">
                            {countdown.hours > 0 && (
                              <>
                                <span className="text-2xl font-bold text-amber-700 tabular-nums">{countdown.hours}</span>
                                <span className="text-xs text-amber-600 mr-1">h</span>
                              </>
                            )}
                            <span className="text-2xl font-bold text-amber-700 tabular-nums">{countdown.minutes}</span>
                            <span className="text-xs text-amber-600 mr-1">m</span>
                            <span className="text-2xl font-bold text-amber-700 tabular-nums">{countdown.seconds}</span>
                            <span className="text-xs text-amber-600">s</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center">
                    {getMealTypeIcon(countdown.meal.type)}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="bg-white/70 backdrop-blur p-3 rounded-xl shadow-sm">
                    <Clock size={28} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">No upcoming meals</p>
                    <p className="text-xs text-gray-400 mt-0.5">Check back later for new meal schedules</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
            /* Enhanced Empty State: show tomorrow's meals preview */
            <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Utensils size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700">No meals available for today</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {tomorrowMeals.length > 0
                      ? "Here's a preview of what's coming tomorrow"
                      : 'Check back later or view all available meals'}
                  </p>
                </div>

                {/* Tomorrow's Meals Preview */}
                {tomorrowMeals.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Calendar size={16} className="text-blue-600" />
                      <p className="text-sm font-semibold text-blue-700">
                        Tomorrow — {format(addDays(new Date(), 1), 'EEEE, MMMM d')}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                      {tomorrowMeals.map(meal => (
                        <div
                          key={meal.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex-shrink-0 p-2 rounded-lg bg-blue-50">
                            {getMealTypeIcon(meal.type)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 capitalize">{meal.type}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {meal.menuItems.slice(0, 2).join(', ')}
                              {meal.menuItems.length > 2 && ` +${meal.menuItems.length - 2} more`}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{meal.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-center mt-5">
                      <Button
                        variant="outline"
                        onClick={handleViewAllMeals}
                        className="inline-flex items-center gap-2"
                      >
                        Book Tomorrow's Meals
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  </div>
                )}

                {tomorrowMeals.length === 0 && (
                  <div className="text-center">
                    <Button onClick={handleViewAllMeals}>
                      View All Meals
                    </Button>
                  </div>
                )}
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
