import React, { createContext, useContext, useState, useEffect } from 'react';
import { Meal, MealBooking, WeeklyMenuItem } from '../types';
import { format } from 'date-fns';
import { api } from '../services/api';

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

// Mock meal data for the next 7 days
const generateMockMeals = (): Meal[] => {
  const meals: Meal[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1; // Convert to 0-6 where 0 is Monday
    const dayName = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][dayIndex] as WeeklyMenuItem['day'];
    const menuForDay = mockWeeklyMenu.find(menu => menu.day === dayName);
    
    if (menuForDay) {
      meals.push({
        id: `breakfast-${formattedDate}`,
        type: 'breakfast',
        date: formattedDate,
        menuItems: menuForDay.breakfast,
        time: '08:00',
        description: 'Morning meal with a variety of breakfast options'
      });
      
      meals.push({
        id: `lunch-${formattedDate}`,
        type: 'lunch',
        date: formattedDate,
        menuItems: menuForDay.lunch,
        time: '12:00',
        description: 'Midday meal with fresh and nutritious options'
      });
      
      meals.push({
        id: `dinner-${formattedDate}`,
        type: 'dinner',
        date: formattedDate,
        menuItems: menuForDay.dinner,
        time: '18:00',
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
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenuItem[]>(mockWeeklyMenu);

  const updateWeeklyMenu = async (newMenu: WeeklyMenuItem[]) => {
    setLoading(true);
    setError(null);
    try {
      await api.updateWeeklyMenu(newMenu);
      setWeeklyMenu(newMenu);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update weekly menu');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Load mock meals for the next 7 days (until backend meals are fully implemented)
        const mockMeals = generateMockMeals();
        setMeals(mockMeals);

        // Fetch bookings from backend
        const bookingRows = await api.getBookings();
        setBookings(bookingRows || []);

        // Fetch weekly menu; fall back to mock if empty
        try {
          const weekly = await api.getWeeklyMenu();
          if (Array.isArray(weekly) && weekly.length > 0) {
            setWeeklyMenu(weekly as WeeklyMenuItem[]);
          }
        } catch {
          // ignore and keep mockWeeklyMenu
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to initialize meals data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // No longer persist to localStorage; bookings come from backend

  const bookMeal = async (userId: string, mealId: string, type: 'breakfast' | 'lunch' | 'dinner', date: string): Promise<MealBooking> => {
    setLoading(true);
    setError(null);
    try {
      const created = await api.bookMeal({ userId, mealId, date, type });
      setBookings(prev => [...prev, created]);
      return created;
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
      setBookings(prev => prev.map(booking => booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking));
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
};