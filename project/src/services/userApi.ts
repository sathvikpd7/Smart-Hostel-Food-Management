import { User } from '../types';

const API_URL = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:3001';

export const userApi = {
  getUsers: async (params?: {
    page?: number;
    pageSize?: number;
    sortBy?: 'name' | 'email' | 'room_number' | 'status';
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }): Promise<{ data: User[]; total: number; page: number; pageSize: number }> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.sortOrder) q.set('sortOrder', params.sortOrder);
    if (params?.search) q.set('search', params.search);
    const url = q.toString() ? `${API_URL}/users?${q.toString()}` : `${API_URL}/users`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : payload.data;
    const normalized = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      roomNumber: r.roomNumber ?? r.room_number ?? '',
      role: r.role ?? 'student',
      status: r.status ?? 'active',
    }) as User);
    return {
      data: normalized,
      total: payload.total ?? normalized.length,
      page: payload.page ?? params?.page ?? 1,
      pageSize: payload.pageSize ?? params?.pageSize ?? normalized.length,
    };
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

  resetPassword: async (userId: string, newPassword: string): Promise<void> => {
    const response = await fetch(`${API_URL}/users/${userId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    if (!response.ok) {
      const j = await response.json().catch(() => ({}));
      throw new Error(j?.message || 'Failed to reset password');
    }
  },

  bulkImport: async (users: Array<{ name: string; email: string; password: string; roomNumber: string; status?: 'active' | 'inactive' }>): Promise<{ created: number; skipped: number }> => {
    const response = await fetch(`${API_URL}/users/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users),
    });
    if (!response.ok) {
      const j = await response.json().catch(() => ({}));
      throw new Error(j?.message || 'Failed bulk import');
    }
    return response.json();
  },
};
