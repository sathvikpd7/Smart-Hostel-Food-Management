import React, { createContext, useContext, useState, useEffect } from 'react';
import { Feedback } from '../types/index';
import { api } from '../services/api';

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
    const fetchFeedbacks = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getFeedbacks();
        setFeedbacks(data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load feedbacks');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  const addFeedback = async (userId: string, mealId: string, rating: 1 | 2 | 3 | 4 | 5, comment?: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const created = await api.addFeedback({ userId, mealId, rating, comment });
      setFeedbacks(prev => [...prev, created]);
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