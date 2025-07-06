import React, { createContext, useContext, useState, useEffect } from 'react';
import { Feedback } from '../types';
import { useAuth } from './AuthContext';

interface FeedbackContextType {
  feedbacks: Feedback[];
  loading: boolean;
  error: string | null;
  submitFeedback: (mealId: string, rating: number, comment?: string) => Promise<void>;
  fetchFeedbacks: () => Promise<void>;
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
  const { user } = useAuth();

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/feedbacks');
      if (!response.ok) {
        throw new Error('Failed to fetch feedbacks');
      }
      const data = await response.json();
      setFeedbacks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (mealId: string, rating: number, comment?: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/feedbacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          mealId,
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const newFeedback = await response.json();
      setFeedbacks(prev => [...prev, newFeedback]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while submitting feedback');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch feedbacks when the component mounts
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  return (
    <FeedbackContext.Provider value={{
      feedbacks,
      loading,
      error,
      submitFeedback,
      fetchFeedbacks,
    }}>
      {children}
    </FeedbackContext.Provider>
  );
};