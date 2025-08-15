import { User, Meal, MealBooking, Feedback, WeeklyMenuItem } from '../types/index';

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
    const rows = await handleResponse(response);
    return (rows as any[]).map((b: any): MealBooking => ({
      id: b.id,
      userId: b.user_id ?? b.userId,
      mealId: b.meal_id ?? b.mealId,
      date: typeof b.date === 'string' ? b.date : new Date(b.date).toISOString().slice(0, 10),
      type: b.type,
      status: b.status,
      qrCode: b.qr_code ?? b.qrCode,
      createdAt: b.created_at ?? new Date().toISOString(),
    }));
  },

  bookMeal: async (bookingData: { userId: string; mealId: string; date: string; type: string }): Promise<MealBooking> => {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    const created = await handleResponse(response);
    const mapped: MealBooking = {
      id: created.id,
      userId: created.user_id ?? created.userId,
      mealId: created.meal_id ?? created.mealId,
      date: typeof created.date === 'string' ? created.date : new Date(created.date).toISOString().slice(0, 10),
      type: created.type,
      status: created.status,
      qrCode: created.qr_code ?? created.qrCode,
      createdAt: created.created_at ?? new Date().toISOString(),
    };
    return mapped;
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    await handleResponse(response);
  },

  markMealAsConsumed: async (bookingId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/bookings/${bookingId}/consume`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    await handleResponse(response);
  },

  getWeeklyMenu: async (): Promise<WeeklyMenuItem[]> => {
    const response = await fetch(`${API_URL}/menu/weekly`);
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

  rateMeal: async (ratingData: { bookingId: string; rating: number; comment?: string }): Promise<void> => {
    const response = await fetch(`${API_URL}/bookings/${ratingData.bookingId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: ratingData.rating, comment: ratingData.comment }),
    });
    return handleResponse(response);
  },

  addFeedback: async (feedbackData: { userId: string; mealId: string; rating: number; comment?: string }): Promise<Feedback> => {
    const response = await fetch(`${API_URL}/feedbacks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData),
    });
    const fb = await handleResponse(response);
    const mapped: Feedback = {
      id: fb.id,
      userId: fb.user_id ?? fb.userId,
      mealId: fb.meal_id ?? fb.mealId,
      rating: fb.rating,
      comment: fb.comment ?? undefined,
      date: fb.date ?? new Date().toISOString(),
    };
    return mapped;
  },
};
