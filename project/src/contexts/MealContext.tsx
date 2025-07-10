import React, { createContext, useContext, useState, useEffect } from 'react';
import { Meal, MealBooking, WeeklyMenuItem } from '../types';
import { api } from '../services/api';

interface MealContextType {
  meals: Meal[];
  weeklyMenu: WeeklyMenuItem[];
  bookings: MealBooking[];
  bookMeal: (userId: string, mealId: string, type: 'breakfast' | 'lunch' | 'dinner', date: string) => Promise<MealBooking>;
  cancelBooking: (bookingId: string) => Promise<void>;
  getBookingsByUser: (userId: string) => MealBooking[];
  getBookingsByDate: (date: string) => MealBooking[];
  getMealsByDate: (date: string) => Meal[];
  markMealAsConsumed: (bookingId: string) => Promise<void>;
  updateWeeklyMenu: (newMenu: WeeklyMenuItem[]) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const MealContext = createContext<MealContextType | undefined>(undefined);

export const useMeals = () => {
  const context = useContext(MealContext);
  if (context === undefined) {
    throw new Error('useMeals must be used within a MealProvider');
  }
  return context;
};

export const MealProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [bookings, setBookings] = useState<MealBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenuItem[]>([]);

  useEffect(() => {
    // Fetch meals and bookings from the API
    const loadData = async () => {
      setLoading(true);
      try {
        const [mealsData, bookingsData] = await Promise.all([
          api.getMeals(),
          api.getBookings(),
        ]);
        setMeals(mealsData);
        setBookings(bookingsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const bookMeal = async (userId: string, mealId: string, type: 'breakfast' | 'lunch' | 'dinner', date: string): Promise<MealBooking> => {
    setLoading(true);
    setError(null);
    
    try {
      const newBooking = await api.bookMeal({ userId, mealId, date, type });
      setBookings(prev => [...prev, newBooking]);
      return newBooking;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while booking meal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await api.cancelBooking(bookingId);
      setBookings(prev =>
        prev.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: 'cancelled' }
            : booking
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while cancelling booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const markMealAsConsumed = async (bookingId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await api.markMealAsConsumed(bookingId);
      setBookings(prev =>
        prev.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: 'consumed' }
            : booking
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while marking meal as consumed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getBookingsByUser = (userId: string): MealBooking[] => {
    return bookings.filter(booking => booking.userId === userId);
  };

  const getBookingsByDate = (date: string): MealBooking[] => {
    return bookings.filter(booking => booking.date === date);
  };

  const getMealsByDate = (date: string): Meal[] => {
    return meals.filter(meal => meal.date === date);
  };

  const updateWeeklyMenu = async (newMenu: WeeklyMenuItem[]) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.updateWeeklyMenu(newMenu);
      setWeeklyMenu(newMenu);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update menu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <MealContext.Provider 
      value={{ 
        meals, 
        weeklyMenu,
        bookings, 
        bookMeal, 
        cancelBooking, 
        getBookingsByUser, 
        getBookingsByDate,
        getMealsByDate,
        markMealAsConsumed,
        updateWeeklyMenu,
        loading, 
        error 
      }}
    >
      {children}
    </MealContext.Provider>
  );
};