import React, { createContext, useContext, useState, useEffect } from 'react';
import { Feedback } from '../types';

interface FeedbackContextType {
  feedbacks: Feedback[];
  addFeedback: (userId: string, mealId: string, rating: 1 | 2 | 3 | 4 | 5, comment?: string) => Promise<void>;
  getFeedbackByUser: (userId: string) => Feedback[];
  getFeedbackByMeal: (mealId: string) => Feedback[];
  loading: boolean;
  error: string | null;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if there are stored feedbacks in localStorage
    const storedFeedbacks = localStorage.getItem('feedbacks');
    
    if (storedFeedbacks) {
      setFeedbacks(JSON.parse(storedFeedbacks));
    }
  }, []);

  // Save feedbacks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
  }, [feedbacks]);

  const addFeedback = async (userId: string, mealId: string, rating: 1 | 2 | 3 | 4 | 5, comment?: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock API call - would be replaced with actual API call to Flask backend
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newFeedback: Feedback = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        mealId,
        rating,
        comment,
        date: new Date().toISOString()
      };
      
      setFeedbacks(prev => [...prev, newFeedback]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while adding feedback');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getFeedbackByUser = (userId: string): Feedback[] => {
    return feedbacks.filter(feedback => feedback.userId === userId);
  };

  const getFeedbackByMeal = (mealId: string): Feedback[] => {
    return feedbacks.filter(feedback => feedback.mealId === mealId);
  };

  return (
    <FeedbackContext.Provider 
      value={{ 
        feedbacks, 
        addFeedback, 
        getFeedbackByUser, 
        getFeedbackByMeal, 
        loading, 
        error 
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};