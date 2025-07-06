import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { MessageSquare, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMeals } from '../../contexts/MealContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import StudentLayout from '../../components/layout/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import StarRating from '../../components/student/StarRating';
import { MealBooking } from '../../types';
import toast from 'react-hot-toast';

const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const { getBookingsByUser } = useMeals();
  const { feedbacks, addFeedback, loading } = useFeedback();
  
  const [consumedMeals, setConsumedMeals] = useState<MealBooking[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealBooking | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  
  // Load consumed meals on component mount
  useEffect(() => {
    if (user) {
      const userBookings = getBookingsByUser(user.id);
      
      // Filter for consumed meals only
      const consumed = userBookings.filter(booking => booking.status === 'consumed');
      
      // Sort by date (newest first)
      consumed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setConsumedMeals(consumed);
    }
  }, [user, getBookingsByUser]);
  
  // Check if user has already provided feedback for a meal
  const hasFeedback = (mealId: string) => {
    return feedbacks.some(feedback => 
      feedback.userId === user?.id && feedback.mealId === mealId
    );
  };
  
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
      
      toast.success('Feedback submitted successfully!');
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
  
  return (
    <StudentLayout
      title="Meal Feedback"
      subtitle="Share your feedback on consumed meals"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Meals List */}
        <div className="col-span-1 md:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle>Your Consumed Meals</CardTitle>
              <CardDescription>
                Select a meal to provide feedback
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {consumedMeals.length > 0 ? (
                <div className="divide-y">
                  {consumedMeals.map(meal => {
                    const hasFeedbackForMeal = hasFeedback(meal.mealId);
                    
                    return (
                      <div 
                        key={meal.id} 
                        className={`py-4 flex justify-between items-center ${
                          hasFeedbackForMeal ? 'opacity-50' : 'hover:bg-gray-50 cursor-pointer'
                        }`}
                        onClick={() => !hasFeedbackForMeal && handleSelectMeal(meal)}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-800">
                              {formatMealType(meal.type)}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              {format(parseISO(meal.date), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Consumed on {format(parseISO(meal.date), 'EEEE, MMMM d')}
                          </div>
                        </div>
                        
                        <div>
                          {hasFeedbackForMeal ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Feedback Provided
                            </span>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectMeal(meal);
                              }}
                            >
                              Give Feedback
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto text-gray-400" size={32} />
                  <p className="mt-2 text-gray-500">
                    No consumed meals found. Once you have consumed a meal, you can provide feedback.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Feedback Form */}
        <div className="col-span-1 md:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Provide Feedback</CardTitle>
              <CardDescription>
                Rate your meal experience and provide comments
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {selectedMeal ? (
                <div>
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600">Selected Meal:</p>
                    <p className="font-medium">
                      {formatMealType(selectedMeal.type)} on {format(parseISO(selectedMeal.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <div className="flex justify-center mb-2">
                      <StarRating
                        initialRating={rating}
                        onChange={handleRatingChange}
                        size="lg"
                      />
                    </div>
                    <p className="text-center text-sm text-gray-500">
                      {rating > 0 ? `You rated this meal ${rating} star${rating !== 1 ? 's' : ''}` : 'Select a rating'}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments (Optional)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Share your thoughts about this meal..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Select a meal from the list to provide feedback
                  </p>
                </div>
              )}
            </CardContent>
            
            {selectedMeal && (
              <CardFooter>
                <Button
                  fullWidth
                  disabled={rating === 0 || loading}
                  isLoading={loading}
                  onClick={handleSubmitFeedback}
                >
                  <Send size={16} className="mr-2" />
                  Submit Feedback
                </Button>
              </CardFooter>
            )}
          </Card>
          
          {/* Recently Submitted Feedback */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Recent Feedback</CardTitle>
            </CardHeader>
            
            <CardContent>
              {feedbacks.filter(f => f.userId === user?.id).length > 0 ? (
                <div className="space-y-4">
                  {feedbacks
                    .filter(f => f.userId === user?.id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 3)
                    .map(feedback => (
                      <div key={feedback.id} className="border-b pb-4 last:border-0">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm text-gray-600">
                            {format(parseISO(feedback.date), 'MMM d, yyyy')}
                          </p>
                          <StarRating
                            initialRating={feedback.rating}
                            onChange={() => {}}
                            size="sm"
                            interactive={false}
                          />
                        </div>
                        {feedback.comment && (
                          <p className="text-sm text-gray-700">
                            "{feedback.comment}"
                          </p>
                        )}
                      </div>
                    ))
                  }
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">
                  You haven't submitted any feedback yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
};

export default FeedbackPage;