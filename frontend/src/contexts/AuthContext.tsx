import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, roomNumber: string) => Promise<User>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    setError(null);

    try {
      const user = await api.login({ email, password });
      setUser(user);
      // Persist user session — token is stored separately by api.ts (localStorage.token)
      // Store user without any token field to keep concerns separated
      const { ...safeUser } = user as any;
      delete safeUser.token;
      localStorage.setItem('user', JSON.stringify(safeUser));
      return user;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, roomNumber: string) => {
    setLoading(true);
    setError(null);

    try {
      // Validate password
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Create user object with role set to student
      const userData = {
        name,
        email,
        password,
        roomNumber,
        role: 'student'
      };

      const newUser = await api.register(userData);

      // Set user in context
      setUser(newUser);
      // Persist user session
      localStorage.setItem('user', JSON.stringify(newUser));

      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during registration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    setLoading(false);
    // Clear persisted session and token
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Always navigate to /login on the main (student) page.
    // This works for both the student app and the admin app (admin.html)
    // because both share the same backend origin and /login is served by the student app.
    window.location.href = '/login';
  };

  useEffect(() => {
    // Check for persisted user session and token on mount
    const persistedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (persistedUser && token) {
      try {
        const user = JSON.parse(persistedUser);
        setUser(user);
      } catch (e) {
        console.error('Failed to parse persisted user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else {
      // Ensure clean state if parts are missing
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  // Listen for 401/403 responses from any API call (dispatched by handleResponse in api.ts).
  // When fired, clear the session and let the protected routes handle the redirect:
  //   - Student app: <Navigate to="/login"> via StudentProtectedRoute (React Router)
  //   - Admin app:   window.location.href = '/login' via AdminProtectedRoute
  // This approach works on both pages regardless of router type or current pathname.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setError(null);
      setLoading(false);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const contextValue: AuthContextType = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
    error
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}