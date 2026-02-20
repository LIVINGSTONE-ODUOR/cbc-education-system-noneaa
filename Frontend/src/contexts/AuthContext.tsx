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

const AUTH_REQUEST_TIMEOUT_MS = 15000;

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

// Try different field name combinations for login
const tryLogin = async (email: string, password: string): Promise<any> => {
  const fieldCombinations = [
    { email, password },
    { emailAddress: email, password },
    { username: email, password },
    { identifier: email, password },
  ];

  for (const fields of fieldCombinations) {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });

      const data = await response.json();
      
      if (response.ok && (data.success || data.token || data.data?.token || data.data?.accessToken)) {
        return { response, data };
      }
    } catch (e) {
      continue;
    }
  }

  // If all fail, try one more time with email/password and return the error
  const lastResponse = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  return { response: lastResponse, data: await lastResponse.json() };
};

// Extract user data from various response formats
const extractUserData = (data: any, email: string) => {
  // Try to find user data in various possible locations
  const userData = data.data?.user || data.user || data.data || {};
  const token = data.data?.token || data.data?.accessToken || data.token || data.accessToken || data.data?.tokens?.accessToken;
  const refreshToken = data.data?.refreshToken || data.refreshToken || data.data?.tokens?.refreshToken || '';

  return {
    user: {
      id: userData.id || '1',
      email: userData.email || email,
      role: (userData.role || 'admin') as UserRole,
      firstName: userData.firstName || userData.name?.split(' ')[0] || 'Admin',
      lastName: userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '',
      schoolId: userData.schoolId || userData.school_id || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    accessToken: token,
    refreshToken: refreshToken,
  };
};

// API client for auth requests
const authApi = {
  async login(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const { response, data } = await tryLogin(email, password);

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Invalid credentials. Please try again.');
    }

    if (!data.success && !data.token && !data.data?.token && !data.data?.accessToken) {
      throw new Error(data.message || data.error || 'Invalid credentials. Please try again.');
    }

    return extractUserData(data, email);
  },

  async logout(accessToken: string): Promise<void> {
    try {
      await fetch(`${API_URL}/users/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (e) {
      // Ignore logout errors
    }
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
      accessToken: data.data.tokens?.accessToken || data.data.accessToken,
      refreshToken: data.data.tokens?.refreshToken || data.data.refreshToken || refreshToken,
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
        clearTokens();
        setUser(null);
        setAccessToken(null);
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const result = await withTimeout(
        authApi.login(email, password),
        AUTH_REQUEST_TIMEOUT_MS,
        'Connection timed out. Please check your internet connection and try again.'
      );

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
