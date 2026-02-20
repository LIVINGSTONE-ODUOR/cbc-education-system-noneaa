import { useState, createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';

// Backend API URL - uses Vite proxy in development to avoid CORS issues
// The proxy is configured in vite.config.ts to forward /api requests to localhost:3000
const API_URL = import.meta.env.VITE_API_URL || '/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_REQUEST_TIMEOUT_MS = 10000;

// Cache for user profiles to avoid redundant database calls
const userCache = new Map<string, User>();

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

// Token storage keys
const ACCESS_TOKEN_KEY = 'cbc_access_token';
const REFRESH_TOKEN_KEY = 'cbc_refresh_token';
const USER_KEY = 'cbc_user';

// Get stored tokens
const getStoredTokens = () => {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    return { accessToken, refreshToken, user };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
};

// Save tokens to storage
const saveTokens = (accessToken: string, refreshToken: string, user: User) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Clear tokens from storage
const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// API client for auth requests
const authApi = {
  async login(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (!data.success) {
      throw new Error(data.message || 'Login failed');
    }

    return {
      user: {
        id: data.data.user.id,
        email: data.data.user.email,
        role: data.data.user.role as UserRole,
        firstName: data.data.user.firstName || data.data.user.email?.split('@')[0] || 'User',
        lastName: data.data.user.lastName || '',
        schoolId: data.data.user.schoolId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accessToken: data.data.tokens.accessToken,
      refreshToken: data.data.tokens.refreshToken,
    };
  },

  async logout(accessToken: string): Promise<void> {
    await fetch(`${API_URL}/users/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await fetch(`${API_URL}/users/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Token refresh failed');
    }

    return {
      accessToken: data.data.tokens.accessToken,
      refreshToken: data.data.tokens.refreshToken,
    };
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Initialize - check for existing session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { accessToken: storedToken, user: storedUser } = getStoredTokens();
        
        if (storedToken && storedUser) {
          setAccessToken(storedToken);
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Token refresh interval
  useEffect(() => {
    if (!accessToken) return;

    const refreshInterval = setInterval(async () => {
      try {
        const { refreshToken } = getStoredTokens();
        if (refreshToken) {
          const tokens = await authApi.refreshToken(refreshToken);
          const { user } = getStoredTokens();
          if (user) {
            saveTokens(tokens.accessToken, tokens.refreshToken, user);
            setAccessToken(tokens.accessToken);
          }
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Clear session on refresh failure
        clearTokens();
        setUser(null);
        setAccessToken(null);
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes

    return () => clearInterval(refreshInterval);
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Input validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Use backend API for authentication (bypasses CORS)
      const result = await withTimeout(
        authApi.login(email, password),
        AUTH_REQUEST_TIMEOUT_MS,
        'Sign in timed out. Please try again.'
      );

      // Save tokens and user to localStorage
      saveTokens(result.accessToken, result.refreshToken, result.user);
      setAccessToken(result.accessToken);
      setUser(result.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { accessToken: token } = getStoredTokens();
      if (token) {
        await authApi.logout(token).catch(console.error);
      }
      clearTokens();
      setUser(null);
      setAccessToken(null);
      userCache.clear();
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      clearTokens();
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
