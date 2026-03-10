import { User, Meal, MealBooking, Feedback, WeeklyMenuItem } from '../types/index';

// Resolve API URL: use VITE_API_URL if set to a real value, otherwise default to localhost
const resolveApiUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  // Reject placeholder or missing URLs — always fall back to localhost in dev
  if (!envUrl || envUrl.includes('YOUR_BACKEND') || envUrl.includes('your-production')) {
    return 'http://localhost:3001';
  }
  return envUrl;
};
export const API_URL: string = resolveApiUrl();

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Only treat this as "session expired" if the user actually had a token.
      // If there is no token, this is just a failed login attempt — show the error normally.
      const hasToken = !!localStorage.getItem('token');
      if (hasToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Dispatch a custom event so AuthContext can react via React state instead of
        // a hard window.location redirect. This works correctly for both the student app
        // (BrowserRouter on index.html) and the admin app (HashRouter on admin.html).
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    const error = await response.json().catch(() => ({}));
    if (error.code === '23505' || error.detail?.includes('Key (email)')) {
      throw new Error('Email already exists. Please use a different email address.');
    }
    throw new Error(error.message || 'API request failed');
  }
  return response.json();
};

const normalizeDateOnly = (value: any): string => {
  if (!value) return '';
  try {
    if (typeof value === 'string') {
      // Already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      // Has time component, extract date part
      if (value.includes('T')) return value.split('T')[0];
      // Try to parse as date
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
      return value;
    }
    if (value instanceof Date) {
      if (!isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
      }
      return '';
    }
    // Try to convert to Date
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
    return '';
  } catch (e) {
    console.error('Error normalizing date:', e, value);
    return '';
  }
};

const normalizeDateTime = (value: any): string => {
  if (!value) return new Date().toISOString();
  try {
    if (typeof value === 'string') {
      // Already ISO format
      if (value.includes('T') && value.includes('Z')) return value;
      // Try to parse
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      return value;
    }
    if (value instanceof Date) {
      if (!isNaN(value.getTime())) {
        return value.toISOString();
      }
      return new Date().toISOString();
    }
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    return new Date().toISOString();
  } catch (e) {
    console.error('Error normalizing datetime:', e, value);
    return new Date().toISOString();
  }
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
      if (newUser.token) {
        localStorage.setItem('token', newUser.token);
      }
      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        roomNumber: newUser.room_number,
        role: newUser.role,
        status: newUser.status || 'active'
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Registration failed. Please try again.');
    }
  },

  login: async (credentials: { email: string; password: string }): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await handleResponse(response);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    // Return only the User fields — never leak the JWT into the user object
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      roomNumber: data.room_number ?? data.roomNumber,
      role: data.role,
      status: data.status || 'active',
      ...(data.dietaryPreferences ? { dietaryPreferences: data.dietaryPreferences } : {}),
    } as User;
  },

  getMeals: async (): Promise<Meal[]> => {
    const response = await fetch(`${API_URL}/meals`);
    return handleResponse(response);
  },

  getBookings: async (userId?: string): Promise<MealBooking[]> => {
    try {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      params.set('pageSize', '200');
      const response = await fetch(`${API_URL}/bookings?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const result = await handleResponse(response);
      // Handle both paginated { data: [...] } and legacy array response
      const rows = Array.isArray(result) ? result : (result as any).data || [];
      return (rows as any[]).map((b: any): MealBooking => ({
        id: b.id,
        userId: b.user_id ?? b.userId,
        mealId: b.meal_id ?? b.mealId,
        date: normalizeDateOnly(b.date),
        type: b.type,
        status: b.status,
        qrCode: b.qr_code ?? b.qrCode,
        createdAt: normalizeDateTime(b.created_at ?? b.createdAt),
      }));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  },

  bookMeal: async (bookingData: { userId: string; mealId: string; date: string; type: string }): Promise<MealBooking> => {
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bookingData),
      });
      const created = await handleResponse(response);
      const mapped: MealBooking = {
        id: created.id,
        userId: created.user_id ?? created.userId,
        mealId: created.meal_id ?? created.mealId,
        date: normalizeDateOnly(created.date),
        type: created.type,
        status: created.status,
        qrCode: created.qr_code ?? created.qrCode,
        createdAt: normalizeDateTime(created.created_at ?? created.createdAt),
      };
      return mapped;
    } catch (error) {
      console.error('Error booking meal:', error);
      throw error;
    }
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: 'cancelled' }),
    });
    await handleResponse(response);
  },

  markMealAsConsumed: async (bookingId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/bookings/${bookingId}/consume`, {
      method: 'PUT',
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
      body: JSON.stringify(menu),
    });
    return handleResponse(response);
  },

  getFeedbacks: async (): Promise<Feedback[]> => {
    const response = await fetch(`${API_URL}/feedbacks`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return (data as any[]).map((fb: any): Feedback => ({
      id: fb.id,
      userId: fb.user_id ?? fb.userId,
      mealId: fb.meal_id ?? fb.mealId,
      rating: fb.rating,
      comment: fb.comment ?? undefined,
      date: fb.date ?? new Date().toISOString(),
      sentiment: fb.sentiment ? (typeof fb.sentiment === 'string' ? JSON.parse(fb.sentiment) : fb.sentiment) : undefined,
    }));
  },

  rateMeal: async (ratingData: { bookingId: string; rating: number; comment?: string }): Promise<void> => {
    const response = await fetch(`${API_URL}/bookings/${ratingData.bookingId}/rate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rating: ratingData.rating, comment: ratingData.comment }),
    });
    return handleResponse(response);
  },

  addFeedback: async (feedbackData: { userId: string; mealId: string; rating: number; comment?: string }): Promise<Feedback> => {
    const response = await fetch(`${API_URL}/feedbacks`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
      sentiment: fb.sentiment ? (typeof fb.sentiment === 'string' ? JSON.parse(fb.sentiment) : fb.sentiment) : undefined,
    };
    return mapped;
  },

  analyzeSentiment: async (text: string, rating?: number): Promise<any> => {
    const response = await fetch(`${API_URL}/api/analyze-sentiment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text, rating }),
    });
    return handleResponse(response);
  },

  getRecommendations: async (userId: string, availableMeals: Meal[], topN: number = 5): Promise<any[]> => {
    const response = await fetch(`${API_URL}/api/recommendations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, availableMeals, topN }),
    });
    return handleResponse(response);
  },

  updateDietaryPreferences: async (userId: string, dietaryPreferences: any): Promise<void> => {
    const response = await fetch(`${API_URL}/api/users/${userId}/preferences`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ dietaryPreferences }),
    });
    return handleResponse(response);
  },
};
