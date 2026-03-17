import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Meal, MealBooking, WeeklyMenuItem } from '../types';
import { format } from 'date-fns';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { sseClient } from '../services/sseClient';

// Mock weekly menu data
const mockWeeklyMenu: WeeklyMenuItem[] = [
  {
    day: 'monday',
    breakfast: ['Scrambled Eggs', 'Toast', 'Fruit Bowl', 'Coffee/Tea'],
    lunch: ['Grilled Chicken Sandwich', 'Fries', 'Green Salad', 'Iced Tea'],
    dinner: ['Spaghetti Bolognese', 'Garlic Bread', 'Caesar Salad', 'Ice Cream']
  },
  {
    day: 'tuesday',
    breakfast: ['Pancakes', 'Maple Syrup', 'Yogurt', 'Coffee/Tea'],
    lunch: ['Vegetable Curry', 'Rice', 'Naan Bread', 'Mango Lassi'],
    dinner: ['Grilled Salmon', 'Roasted Potatoes', 'Steamed Broccoli', 'Chocolate Cake']
  },
  {
    day: 'wednesday',
    breakfast: ['Oatmeal', 'Mixed Berries', 'Honey', 'Coffee/Tea'],
    lunch: ['Beef Burrito Bowl', 'Tortilla Chips', 'Guacamole', 'Lemonade'],
    dinner: ['Margherita Pizza', 'Garden Salad', 'Garlic Knots', 'Tiramisu']
  },
  {
    day: 'thursday',
    breakfast: ['Avocado Toast', 'Poached Eggs', 'Fruit Smoothie', 'Coffee/Tea'],
    lunch: ['Club Sandwich', 'Potato Chips', 'Coleslaw', 'Iced Tea'],
    dinner: ['Chicken Stir Fry', 'Steamed Rice', 'Spring Rolls', 'Fruit Salad']
  },
  {
    day: 'friday',
    breakfast: ['French Toast', 'Banana', 'Maple Syrup', 'Coffee/Tea'],
    lunch: ['Fish Tacos', 'Mexican Rice', 'Refried Beans', 'Horchata'],
    dinner: ['Beef Lasagna', 'Garlic Bread', 'Mixed Greens', 'Cheesecake']
  },
  {
    day: 'saturday',
    breakfast: ['Belgian Waffles', 'Whipped Cream', 'Fresh Berries', 'Coffee/Tea'],
    lunch: ['Chicken Caesar Wrap', 'Sweet Potato Fries', 'Fruit Cup', 'Iced Coffee'],
    dinner: ['BBQ Ribs', 'Corn on the Cob', 'Baked Beans', 'Apple Pie']
  },
  {
    day: 'sunday',
    breakfast: ['Breakfast Burrito', 'Salsa', 'Hash Browns', 'Coffee/Tea'],
    lunch: ['Mushroom Risotto', 'Garlic Bread', 'Rocket Salad', 'Tiramisu'],
    dinner: ['Roast Chicken', 'Mashed Potatoes', 'Gravy', 'Steamed Vegetables', 'Chocolate Mousse']
  }
];

// Generate meals for the next 7 days from a weekly menu
const generateMockMeals = (weekly: WeeklyMenuItem[] = mockWeeklyMenu): Meal[] => {
  const meals: Meal[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1; // Convert to 0-6 where 0 is Monday
    const dayName = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][dayIndex] as WeeklyMenuItem['day'];
    const menuForDay = weekly.find(menu => menu.day === dayName);

    if (menuForDay) {
      meals.push({
        id: `breakfast-${formattedDate}`,
        type: 'breakfast',
        date: formattedDate,
        menuItems: menuForDay.breakfast,
        time: '07:30-09:30',
        description: 'Morning meal with a variety of breakfast options'
      });

      meals.push({
        id: `lunch-${formattedDate}`,
        type: 'lunch',
        date: formattedDate,
        menuItems: menuForDay.lunch,
        time: '12:30-15:00',
        description: 'Midday meal with fresh and nutritious options'
      });

      meals.push({
        id: `dinner-${formattedDate}`,
        type: 'dinner',
        date: formattedDate,
        menuItems: menuForDay.dinner,
        time: '19:30-22:00',
        description: 'Evening meal with a variety of dinner options'
      });
    }
  }

  return meals;
};

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

export function useMeals(): MealContextType {
  const context = useContext(MealContext);
  if (context === undefined) {
    throw new Error('useMeals must be used within a MealProvider');
  }
  return context;
}

export function MealProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [bookings, setBookings] = useState<MealBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenuItem[]>(mockWeeklyMenu);

  const refreshBookings = useCallback(async (retries = 3) => {
    try {
      const bookingRows = await api.getBookings();
      setBookings(bookingRows || []);
      setError(null);
    } catch (e) {
      console.error('Failed to refresh bookings:', e);
      if (retries > 0) {
        setTimeout(() => refreshBookings(retries - 1), 2000);
      } else {
        setError('Failed to load bookings. Please refresh the page.');
      }
    }
  }, []);

  const updateWeeklyMenu = async (newMenu: WeeklyMenuItem[]) => {
    setLoading(true);
    setError(null);
    try {
      await api.updateWeeklyMenu(newMenu);
      setWeeklyMenu(newMenu);
      // Also regenerate meals so student views reflect updates immediately
      setMeals(generateMockMeals(newMenu));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update weekly menu');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      // Only fetch if user is logged in
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Load meals based on current weekly menu (mock or fetched)
        setMeals(generateMockMeals(mockWeeklyMenu));

        // Fetch bookings from backend
        await refreshBookings();

        // Fetch weekly menu; fall back to mock if empty
        try {
          const weekly = await api.getWeeklyMenu();
          if (Array.isArray(weekly) && weekly.length > 0) {
            const typedWeekly = weekly as WeeklyMenuItem[];
            setWeeklyMenu(typedWeekly);
            setMeals(generateMockMeals(typedWeekly));
          } else {
            // ensure meals reflect current state
            setMeals(generateMockMeals(mockWeeklyMenu));
          }
        } catch (menuError) {
          console.warn('Failed to fetch weekly menu, using default:', menuError);
          // ignore and keep mockWeeklyMenu
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to initialize meals data';
        setError(errorMessage);
        console.error('Initialization error:', errorMessage);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  // SSE-driven refresh: re-fetch bookings instantly when the server broadcasts
  // a booking-created or booking-updated event.
  useEffect(() => {
    if (!user) return;

    sseClient.acquire();
    const unsubCreated = sseClient.on('booking-created', () => { refreshBookings(); });
    const unsubUpdated = sseClient.on('booking-updated', () => { refreshBookings(); });

    return () => {
      unsubCreated();
      unsubUpdated();
      sseClient.release();
    };
  }, [user, refreshBookings]);

  // Fallback poll – runs every 60 s in case SSE is unavailable (e.g. proxy strips
  // the connection header). Keeps data eventually consistent without hammering the server.
  useEffect(() => {
    if (!user) return;

    const timer = setInterval(() => { refreshBookings(); }, 60_000);
    return () => clearInterval(timer);
  }, [user, refreshBookings]);



  // No longer persist to localStorage; bookings come from backend

  const bookMeal = async (userId: string, mealId: string, type: 'breakfast' | 'lunch' | 'dinner', date: string): Promise<MealBooking> => {
    setLoading(true);
    setError(null);
    try {
      const created = await api.bookMeal({ userId, mealId, date, type });
      setBookings(prev => {
        const updated = [...prev, created];
        return updated;
      });
      return created;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while booking meal';
      setError(errorMessage);
      console.error('Error booking meal:', errorMessage);
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
      setBookings(prev => prev.map(booking => booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while cancelling booking';
      setError(errorMessage);
      console.error('Error cancelling booking:', errorMessage);
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
      setBookings(prev => prev.map(booking => booking.id === bookingId ? { ...booking, status: 'consumed' } : booking));
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
}
