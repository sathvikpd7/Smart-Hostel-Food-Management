import { User, Meal, MealBooking, Feedback, WeeklyMenuItem } from '../types';

export const API_URL = 'http://localhost:3001'; // Update this with your actual backend URL

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    if (error.code === '23505' || error.detail?.includes('Key (email)')) {
      throw new Error('Email already exists. Please use a different email address.');
    }
    throw new Error(error.message || 'API request failed');
  }
  return response.json();
};

export const api = {
  register: async (userData: { name: string; email: string; password: string; roomNumber: string; role: string }): Promise<User> => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          roomNumber: userData.roomNumber,
          role: userData.role
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const newUser = await response.json();
      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        roomNumber: newUser.room_number,
        role: newUser.role,
        status: newUser.status || 'active'
      };
    } catch (error) {
      throw new Error('Registration failed. Please try again.');
    }
  },

  login: async (credentials: { email: string; password: string }): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  getMeals: async (): Promise<Meal[]> => {
    const response = await fetch(`${API_URL}/meals`);
    return handleResponse(response);
  },

  getBookings: async (): Promise<MealBooking[]> => {
    const response = await fetch(`${API_URL}/bookings`);
    return handleResponse(response);
  },

  bookMeal: async (bookingData: { userId: string; mealId: string; date: string; type: string }): Promise<MealBooking> => {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    return handleResponse(response);
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    return handleResponse(response);
  },

  markMealAsConsumed: async (bookingId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/bookings/${bookingId}/consume`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  updateWeeklyMenu: async (menu: WeeklyMenuItem[]): Promise<void> => {
    const response = await fetch(`${API_URL}/menu/weekly`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menu),
    });
    return handleResponse(response);
  },

  getFeedbacks: async (): Promise<Feedback[]> => {
    const response = await fetch(`${API_URL}/feedbacks`);
    return handleResponse(response);
  },

  addFeedback: async (feedbackData: { userId: string; mealId: string; rating: number; comment?: string }): Promise<Feedback> => {
    const response = await fetch(`${API_URL}/feedbacks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData),
    });
    return handleResponse(response);
  },
};
