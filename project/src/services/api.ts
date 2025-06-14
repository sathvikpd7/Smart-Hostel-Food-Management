import { User } from '../types';

const API_URL = 'http://localhost:3001'; // Update this with your actual backend URL

export const api = {
  register: async (userData: { name: string; email: string; password: string; roomNumber: string }): Promise<User> => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      return response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Registration failed');
    }
  },

  login: async (credentials: { email: string; password: string }): Promise<User> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      return response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Login failed');
    }
  },
};
