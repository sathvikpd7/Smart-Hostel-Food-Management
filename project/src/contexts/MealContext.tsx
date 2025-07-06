import React, { createContext, useContext, useState, useEffect } from 'react';
import { Meal, MealBooking, WeeklyMenuItem } from '../types';
import { format } from 'date-fns';
import { useAuth } from './AuthContext';

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
        menuItems: menuForDay.breakfast
      });
      
      meals.push({
        id: `lunch-${formattedDate}`,
        type: 'lunch',
        date: formattedDate,
        menuItems: menuForDay.lunch
      });
      
      meals.push({
        id: `dinner-${formattedDate}`,
        type: 'dinner',
        date: formattedDate,
        menuItems: menuForDay.dinner
      });
    }
  }
  
  return meals;
};

interface MealContextType {
  meals: Meal[];
  weeklyMenu: WeeklyMenuItem[];
  bookings: MealBooking[];
  bookMeal: (mealId: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  fetchMeals: () => Promise<void>;
  fetchBookings: () => Promise<void>;
  getMealsByDate: (date: string) => Meal[];
  getBookingsByUser: (userId: string) => MealBooking[];
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklyMenu] = useState<WeeklyMenuItem[]>(mockWeeklyMenu);
  const { user } = useAuth();

  // Initialize meals and fetch bookings when component mounts
  useEffect(() => {
    // Initialize meals with mock data
    const initialMeals = generateMockMeals();
    setMeals(initialMeals);

    // Fetch bookings if user is logged in
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const getMealsByDate = (date: string): Meal[] => {
    return meals.filter(meal => meal.date === date);
  };

  const getBookingsByUser = (userId: string): MealBooking[] => {
    return bookings.filter(booking => booking.userId === userId);
  };

  const fetchMeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/meals');
      if (!response.ok) {
        throw new Error('Failed to fetch meals');
      }
      const data = await response.json();
      setMeals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching meals');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/bookings/user/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const data = await response.json();
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  const bookMeal = async (mealId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          mealId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to book meal');
      }

      const newBooking = await response.json();
      setBookings(prev => [...prev, newBooking]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while booking meal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      setBookings(prev => prev.filter(booking => booking.id !== bookingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while cancelling booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <MealContext.Provider value={{
      meals,
      weeklyMenu,
      bookings,
      bookMeal,
      cancelBooking,
      fetchMeals,
      fetchBookings,
      getMealsByDate,
      getBookingsByUser,
      loading,
      error,
    }}>
      {children}
    </MealContext.Provider>
  );
};