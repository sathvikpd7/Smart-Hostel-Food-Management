import { User } from '../types';

const API_URL = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:3001';

export const userApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const rows = await response.json();
    // Normalize server response (room_number -> roomNumber)
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      roomNumber: r.roomNumber ?? r.room_number ?? '',
      role: r.role ?? 'student',
      status: r.status ?? 'active',
    }) as User);
  },

  getUser: async (userId: string): Promise<User> => {
    const response = await fetch(`${API_URL}/users/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    const r = await response.json();
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      roomNumber: r.roomNumber ?? r.room_number ?? '',
      role: r.role ?? 'student',
      status: r.status ?? 'active',
    } as User;
  },

  // The backend exposes POST /auth/register (not POST /users).
  // Accept password from caller and send it to the server.
  createUser: async (userData: Omit<User, 'id'>, password: string): Promise<User> => {
    const payload = {
      name: userData.name,
      email: userData.email,
      password,
      roomNumber: userData.roomNumber,
    };
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      let msg = 'Failed to create user';
      try { const j = await response.json(); msg = j?.message || msg; } catch {}
      throw new Error(msg);
    }
    const r = await response.json();
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      roomNumber: r.roomNumber ?? r.room_number ?? userData.roomNumber,
      role: r.role ?? userData.role ?? 'student',
      status: r.status ?? userData.status ?? 'active',
    } as User;
  },

  updateUser: async (userId: string, userData: Partial<User>): Promise<User> => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error('Failed to update user');
    }
    return response.json();
  },

  deleteUser: async (userId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
  },
};
