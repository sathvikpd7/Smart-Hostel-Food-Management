export interface User {
  id: string;
  name: string;
  email: string;
  roomNumber: string;
  role: 'student' | 'admin';
  status: 'active' | 'inactive';
  dietaryPreferences?: {
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    dairyFree?: boolean;
    nutFree?: boolean;
    spicyPreferred?: boolean;
    preferences?: string[];
    dislikes?: string[];
  };
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface Meal {
  id: string;
  date: string;
  type: MealType;          
  name?: string;           
  menuItems: string[];     
  time: string;
  description: string;
  cost?: number;           // Cost per meal in currency
}

export interface MealBooking {
  id: string;
  userId: string;
  mealId: string;
  date: string;
  type: 'breakfast' | 'lunch' | 'dinner';
  status: 'booked' | 'consumed' | 'cancelled';
  qrCode: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  userId: string;
  mealId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  date: string;
  sentiment?: {
    score: number;
    sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
    confidence: number;
    categories: string[];
    keywords: string[];
  };
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface WeeklyMenu {
  day: string;
  breakfast: string[];
  lunch: string[];
  dinner: string[];
}

export interface WeeklyMenuItem {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  breakfast: string[];
  lunch: string[];
  dinner: string[];
}