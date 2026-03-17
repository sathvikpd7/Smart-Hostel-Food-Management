import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Feedback } from '../types/index';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { sseClient } from '../services/sseClient';

interface FeedbackContextType {
  feedbacks: Feedback[];
  addFeedback: (userId: string, mealId: string, rating: 1 | 2 | 3 | 4 | 5, comment?: string) => Promise<void>;
  getFeedbackByUser: (userId: string) => Feedback[];
  getFeedbackByMeal: (mealId: string) => Feedback[];
  loading: boolean;
  error: string | null;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function useFeedback(): FeedbackContextType {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFeedbacks = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
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
  }, [user]);

  useEffect(() => {
    refreshFeedbacks();
  }, [user, refreshFeedbacks]);

  // SSE-driven refresh: re-fetch feedbacks the moment a new one is submitted.
  useEffect(() => {
    if (!user) return;

    sseClient.acquire();
    const unsubFeedback = sseClient.on('feedback-created', () => { refreshFeedbacks(); });

    return () => {
      unsubFeedback();
      sseClient.release();
    };
  }, [user, refreshFeedbacks]);

  // Fallback poll – every 60 s in case SSE is unavailable.
  useEffect(() => {
    if (!user) return;

    const timer = setInterval(() => { refreshFeedbacks(); }, 60_000);
    return () => clearInterval(timer);
  }, [user, refreshFeedbacks]);



  const addFeedback = async (userId: string, mealId: string, rating: 1 | 2 | 3 | 4 | 5, comment?: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Check if feedback already exists
      const existingFeedback = feedbacks.find(
        f => f.userId === userId && f.mealId === mealId
      );

      if (existingFeedback) {
        throw new Error('You have already provided feedback for this meal');
      }

      const newFeedback = await api.addFeedback({ userId, mealId, rating, comment });
      setFeedbacks(prev => [...prev, newFeedback]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to add feedback';
      setError(errorMessage);
      throw new Error(errorMessage);
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
}
