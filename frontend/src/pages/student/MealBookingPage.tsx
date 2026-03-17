import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMeals } from '../../contexts/MealContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import StudentLayout from '../../components/layout/StudentLayout';
import MealCard from '../../components/student/MealCard';
import MealRecommendations from '../../components/student/MealRecommendations';
import Button from '../../components/ui/Button';
import { api } from '../../services/api';
import type { Meal } from '../../types';
import type { RecommendationScore } from '../../services/mealRecommendation';

const MealBookingPage: React.FC = () => {
  const { user } = useAuth();
  const { meals, bookings, getMealsByDate } = useMeals();
  const { feedbacks } = useFeedback();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayedMeals, setDisplayedMeals] = useState(getMealsByDate(format(currentDate, 'yyyy-MM-dd')));
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [detailsMeal, setDetailsMeal] = useState<Meal | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mealsLoading, setMealsLoading] = useState(false);
  
  // Update displayed meals when date changes or bookings change
  useEffect(() => {
    const mealsForDate = getMealsByDate(format(currentDate, 'yyyy-MM-dd'));
    setDisplayedMeals(mealsForDate);
  }, [currentDate, meals, bookings, getMealsByDate, refreshTrigger]);

  // Fetch recommendations when meals or user data changes
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user || displayedMeals.length === 0) return;
      
      setLoadingRecommendations(true);
      try {
        const recs = await api.getRecommendations(user.id, displayedMeals, 4);
        setRecommendations(recs);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setRecommendations([]);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    // Only fetch recommendations if user has some history
    if (user && (bookings.length > 0 || feedbacks.length > 0)) {
      fetchRecommendations();
    }
  }, [displayedMeals, user, bookings.length, feedbacks.length]);
  
  // Navigate to previous day
  const handlePreviousDay = () => {
    setCurrentDate(prevDate => addDays(prevDate, -1));
  };
  
  // Navigate to next day
  const handleNextDay = () => {
    setCurrentDate(prevDate => addDays(prevDate, 1));
  };
  
  // Refresh meals list after booking/cancellation
  const handleBookingComplete = async () => {
    setIsRefreshing(true);
    try {
      // Trigger a re-render by incrementing refreshTrigger
      setRefreshTrigger(prev => prev + 1);
      // Small delay to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsRefreshing(false);
    }
  };
  
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
  
  return (
    <StudentLayout
      title="Meal Booking"
      subtitle="Book your meals for the week"
    >
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center mb-4 sm:mb-0">
          <Calendar className="text-blue-800 mr-2" size={22} />
          <h2 className="text-lg font-semibold">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            type="date"
            className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={format(currentDate, 'yyyy-MM-dd')}
            aria-label="Select date"
            title="Select date"
            onChange={(e) => {
              const val = e.target.value;
              if (val) setCurrentDate(new Date(val + 'T00:00:00'));
            }}
          />
          <Button
            variant="outline"
            onClick={handlePreviousDay}
            className="flex items-center"
          >
            <ChevronLeft size={18} className="mr-1" />
            Previous
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          
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

      {/* AI-Powered Meal Recommendations */}
      {recommendations.length > 0 && (
        <MealRecommendations
          recommendations={recommendations}
          onSelectMeal={(meal) => {
            // Scroll to the meal card
            const element = document.getElementById(`meal-${meal.id}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.classList.add('ring-2', 'ring-purple-500', 'ring-offset-2');
              setTimeout(() => {
                element.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-2');
              }, 2000);
            }
          }}
          loading={loadingRecommendations}
        />
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {isRefreshing && (
          <div className="col-span-1 sm:col-span-3 text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Updating...</p>
          </div>
        )}
        
        {!isRefreshing && displayedMeals.map(meal => {
          const isBooked = isMealBooked(meal.id);
          const booking = getBookingForMeal(meal.id);
          
          return (
            <div key={meal.id} id={`meal-${meal.id}`} className="transition-all">
              <MealCard 
                meal={meal} 
                isBooked={isBooked}
                bookingId={booking?.id}
                bookingStatus={booking?.status}
                onBookingComplete={handleBookingComplete}
              />
            </div>
          );
        })}
        
        {!isRefreshing && displayedMeals.length === 0 && (
          <div className="col-span-1 sm:col-span-3 text-center py-10 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-4">No meals available for this date</p>
            <Button onClick={() => setCurrentDate(new Date())}>
              Go to Today
            </Button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {detailsMeal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailsMeal(null)}></div>
          <div className="relative bg-white rounded-lg shadow-lg w-[90%] max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h3 className="text-lg font-semibold capitalize">{detailsMeal.type}</h3>
                <p className="text-sm text-gray-500">{format(new Date(detailsMeal.date), 'EEEE, MMM d, yyyy')}</p>
              </div>
              <button
                className="p-2 rounded-md hover:bg-gray-100"
                onClick={() => setDetailsMeal(null)}
                aria-label="Close details"
                title="Close details"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">{detailsMeal.type}</span>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                  {(() => {
                    switch (detailsMeal.type) {
                      case 'breakfast':
                        return '7:30 AM - 9:30 AM';
                      case 'lunch':
                        return '12:30 PM - 3:00 PM';
                      case 'dinner':
                        return '7:30 PM - 10:00 PM';
                      default:
                        return '';
                    }
                  })()}
                </span>
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 font-medium">{detailsMeal.menuItems.length} items</span>
              </div>
              {detailsMeal.name && (
                <p className="font-medium text-gray-900 mb-1">{detailsMeal.name}</p>
              )}
              {detailsMeal.description && (
                <p className="text-sm text-gray-700 mb-4">{detailsMeal.description}</p>
              )}
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Menu</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {detailsMeal.menuItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="px-5 py-4 border-t text-right">
              <Button variant="outline" onClick={() => setDetailsMeal(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default MealBookingPage;
