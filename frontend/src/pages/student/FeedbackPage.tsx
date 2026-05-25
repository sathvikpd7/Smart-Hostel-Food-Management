import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { MessageSquare, Send, Calendar, ArrowRight, Coffee, Utensils, Moon, X, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMeals } from '../../contexts/MealContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import StudentLayout from '../../components/layout/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StarRating from '../../components/student/StarRating';
import { MealBooking } from '../../types/index';
import toast from 'react-hot-toast';

const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const { getBookingsByUser, meals } = useMeals();
  const { feedbacks, addFeedback, loading } = useFeedback();

  const [consumedMeals, setConsumedMeals] = useState<MealBooking[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealBooking | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  // Load consumed meals on component mount
  useEffect(() => {
    if (user) {
      const userBookings = getBookingsByUser(user.id);

      // Filter for consumed meals only
      const consumed = userBookings.filter((booking: MealBooking) => booking.status === 'consumed');

      // Sort by date (newest first)
      consumed.sort((a: MealBooking, b: MealBooking) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setConsumedMeals(consumed);
    }
  }, [user, getBookingsByUser]);

  // Check if user has already provided feedback for a meal
  const hasFeedback = (mealId: string) => {
    return feedbacks.some((feedback: any) =>
      feedback.userId === user?.id && feedback.mealId === mealId
    );
  };

  // Filter meals based on reviews
  const pendingMeals = consumedMeals.filter(meal => !hasFeedback(meal.mealId));
  const reviewedMeals = consumedMeals.filter(meal => hasFeedback(meal.mealId));
  const displayedMeals = activeTab === 'pending' ? pendingMeals : reviewedMeals;

  // Handle meal selection for feedback
  const handleSelectMeal = (meal: MealBooking) => {
    setSelectedMeal(meal);
    setRating(0);
    setComment('');
  };

  // Handle rating change
  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
  };

  // Handle submit feedback
  const handleSubmitFeedback = async () => {
    if (!user || !selectedMeal) return;

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      await addFeedback(
        user.id,
        selectedMeal.mealId,
        rating as 1 | 2 | 3 | 4 | 5,
        comment.trim() || undefined
      );

      toast.success('Feedback submitted successfully! 🎉');
      setSelectedMeal(null);
      setRating(0);
      setComment('');
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    }
  };

  // Format meal type with capitalization
  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Match corresponding meal details
  const getMealDetails = (booking: MealBooking) => {
    return meals.find(
      (m) => m.id === booking.mealId || (m.date === booking.date && m.type === booking.type)
    );
  };

  // Meal type icons, borders, and colors
  const getMealTypeDetails = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return {
          icon: <Coffee size={14} className="text-amber-500" />,
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          borderL: 'border-l-amber-500',
          text: 'text-amber-700'
        };
      case 'lunch':
        return {
          icon: <Utensils size={14} className="text-emerald-500" />,
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          borderL: 'border-l-emerald-500',
          text: 'text-emerald-700'
        };
      case 'dinner':
        return {
          icon: <Moon size={14} className="text-indigo-500" />,
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
          borderL: 'border-l-indigo-500',
          text: 'text-indigo-700'
        };
      default:
        return {
          icon: <Utensils size={14} className="text-gray-500" />,
          bg: 'bg-gray-50 border-gray-200 text-gray-700',
          borderL: 'border-l-gray-500',
          text: 'text-gray-700'
        };
    }
  };

  return (
    <StudentLayout
      title="Meal Feedback"
      subtitle="Share your feedback on consumed meals to help us improve"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Welcome Banner - Styled to perfectly match the Sidebar welcome card */}
        <div className="col-span-1 lg:col-span-12">
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 opacity-5 pointer-events-none text-blue-200">
              <Sparkles size={160} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                  <Sparkles className="text-blue-500 fill-blue-100" size={20} />
                  Help Us Craft Better Menus!
                </h2>
                <p className="text-sm text-blue-700/90 mt-1 max-w-3xl leading-relaxed">
                  Your feedback is processed instantly by our advanced Groq AI Engine to help administrative chefs optimize weekly menu configurations, portion controls, and meal quality.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Left Column: Dining Records & Tab Bar (8 Columns for Spacious Cards List) */}
        <div className="col-span-1 lg:col-span-8 space-y-6">
          {/* Header row containing Title and Toggle Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Your Dining Records</h3>
              <p className="text-xs text-gray-500 mt-0.5">Select a consumed meal card to write your review</p>
            </div>

            {/* Toggle Pills */}
            <div className="inline-flex p-1 bg-gray-200/80 rounded-xl">
              <button
                onClick={() => {
                  setActiveTab('pending');
                  setSelectedMeal(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'pending'
                    ? 'bg-white text-blue-800 shadow-sm shadow-black/5 border border-gray-200/10'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-gray-300 text-gray-700'
                }`}>
                  {pendingMeals.length}
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  setSelectedMeal(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-white text-blue-800 shadow-sm shadow-black/5 border border-gray-200/10'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                History
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === 'history' ? 'bg-blue-100 text-blue-800' : 'bg-gray-300 text-gray-700'
                }`}>
                  {reviewedMeals.length}
                </span>
              </button>
            </div>
          </div>

          {/* List of Meal Cards directly in column (No outer nested card) */}
          {displayedMeals.length > 0 ? (
            <div className="space-y-4">
              {displayedMeals.map((booking) => {
                const mealInfo = getMealDetails(booking);
                const typeInfo = getMealTypeDetails(booking.type);
                const isSelected = selectedMeal?.id === booking.id;
                const hasFeedbackForMeal = hasFeedback(booking.mealId);
                const mealDateStr = booking.date ? format(parseISO(booking.date), 'MMM d, yyyy') : '';
                const mealDayName = booking.date ? format(parseISO(booking.date), 'EEEE') : '';

                return (
                  <div
                    key={booking.id}
                    onClick={() => !hasFeedbackForMeal && handleSelectMeal(booking)}
                    className={`border-l-4 border-y border-r rounded-2xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                      typeInfo.borderL
                    } ${
                      hasFeedbackForMeal
                        ? 'bg-slate-50/70 opacity-75 border-gray-200'
                        : isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/10 shadow bg-blue-50/20 cursor-pointer'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow cursor-pointer'
                    }`}
                  >
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${typeInfo.bg}`}>
                          {typeInfo.icon}
                          {booking.type}
                        </span>
                        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                          <Calendar size={12} className="text-gray-400" />
                          {mealDateStr} <span className="text-[10px] font-normal text-gray-400">({mealDayName})</span>
                        </span>
                      </div>

                      {/* Meal items */}
                      {mealInfo ? (
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-gray-800 text-sm">
                            {mealInfo.name || `${formatMealType(booking.type)} Menu`}
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {mealInfo.menuItems.map((item, idx) => (
                              <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded border border-slate-200/50 font-medium">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No menu items details loaded</p>
                      )}
                    </div>

                    <div className="flex items-center md:justify-end">
                      {hasFeedbackForMeal ? (
                        <span className="text-[10px] font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200 flex items-center gap-1">
                          ✓ Reviewed
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant={isSelected ? 'primary' : 'outline'}
                          className="w-full md:w-auto text-xs"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            handleSelectMeal(booking);
                          }}
                        >
                          Rate Meal
                          <ArrowRight size={12} className="ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <MessageSquare size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-800">
                {activeTab === 'pending' ? 'All Reviews Completed!' : 'No History Records'}
              </h3>
              <p className="mt-1.5 text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                {activeTab === 'pending'
                  ? 'Excellent! You have reviewed all consumed meals. Eat more meals to leave more feedback!'
                  : 'You have not submitted any meal feedback yet. Click on "Pending" to begin.'}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: History Feed at Top Position (4 Columns) */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          {/* Recently Submitted Feedback Card */}
          <Card className="border border-gray-200 shadow-sm overflow-hidden rounded-2xl bg-white">
            <CardHeader className="bg-slate-50 border-b border-gray-200 py-3.5 px-5">
              <CardTitle className="text-sm font-bold text-gray-800">Your Recent Reviews</CardTitle>
            </CardHeader>

            <CardContent className="p-5">
              {feedbacks.filter((f: any) => f.userId === user?.id).length > 0 ? (
                <div className="space-y-4">
                  {feedbacks
                    .filter((f: any) => f.userId === user?.id)
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 3)
                    .map((feedback: any) => {
                      const matchedMeal = getMealDetails({ mealId: feedback.mealId } as MealBooking);
                      return (
                        <div key={feedback.id} className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/50 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div>
                              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                                {matchedMeal ? matchedMeal.type : 'Meal'}
                              </span>
                              <p className="text-[9px] text-gray-400 mt-0.5 flex items-center gap-1">
                                <Calendar size={10} />
                                {format(parseISO(feedback.date), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <StarRating
                              initialRating={feedback.rating}
                              onChange={() => { }}
                              size="sm"
                              interactive={false}
                            />
                          </div>
                          {feedback.comment ? (
                            <p className="text-xs text-gray-600 italic bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm mt-1.5 leading-relaxed">
                              "{feedback.comment}"
                            </p>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">No comments written</p>
                          )}
                        </div>
                      );
                    })
                  }
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-xs italic">You haven't submitted any reviews yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Elegant Centered Feedback Overlay Modal (Only displays when a meal is actively selected) */}
      {selectedMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Glassmorphism Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setSelectedMeal(null)}
          />
          
          {/* Modal Card container */}
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-150 w-full max-w-lg overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            {/* Header - Humanized, premium styled */}
            <div className="bg-slate-50 border-b border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded flex items-center gap-1 w-max">
                    ⭐ Create Review
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-1.5">
                    {getMealDetails(selectedMeal)?.name || `${formatMealType(selectedMeal.type)} Menu`}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar size={12} className="text-gray-400" />
                    {selectedMeal.date ? format(parseISO(selectedMeal.date), 'EEEE, MMM d, yyyy') : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMeal(null)}
                  className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors border border-gray-200"
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content body */}
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Menu items summary */}
              {getMealDetails(selectedMeal) && (
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">What was served:</p>
                  <div className="flex flex-wrap gap-1">
                    {getMealDetails(selectedMeal)?.menuItems.map((item, idx) => (
                      <span key={idx} className="text-xs bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Star Rating Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Meal Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col items-center py-4 bg-slate-50 rounded-xl border border-slate-100">
                  <StarRating
                    key={selectedMeal.id}
                    initialRating={rating}
                    onChange={handleRatingChange}
                    size="lg"
                  />
                  <p className="text-xs font-bold mt-2.5 transition-all text-slate-700">
                    {rating === 1 && '⭐ Disappointing'}
                    {rating === 2 && '⭐⭐ Below Average'}
                    {rating === 3 && '⭐⭐⭐ Average'}
                    {rating === 4 && '⭐⭐⭐⭐ Delicious'}
                    {rating === 5 && '⭐⭐⭐⭐⭐ Exceptional! 🎉'}
                    {rating === 0 && <span className="text-gray-400 font-normal">Tap stars to rate</span>}
                  </p>
                </div>
              </div>

              {/* Comment Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Comments <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none shadow-sm h-28"
                  placeholder="Share your thoughts about this meal (e.g. taste, quality, portion size)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="bg-slate-50 px-5 py-4 border-t border-gray-150 flex gap-3 justify-end">
              <Button
                variant="outline"
                className="px-4 py-2 text-xs"
                onClick={() => setSelectedMeal(null)}
              >
                Cancel
              </Button>
              <Button
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-xs font-semibold rounded-xl transition-colors"
                disabled={rating === 0 || loading}
                isLoading={loading}
                onClick={handleSubmitFeedback}
              >
                <Send size={12} className="mr-1.5" />
                Submit Feedback
              </Button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default FeedbackPage;