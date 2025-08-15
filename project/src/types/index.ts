export interface User {
  id: string;
  name: string;
  email: string;
  roomNumber: string;
  role: 'student' | 'admin';
  status: 'active' | 'inactive';
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface Meal {
  id: string;
  date: string;
  type: MealType;          // <-- changed: strict union type
  name?: string;           // <-- added: optional human-readable name
  menuItems: string[];     // <-- ensure menu items are typed
  time: string;
  description: string;
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