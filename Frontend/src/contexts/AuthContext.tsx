import { useState, useRef, createContext, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';

// In production builds (Vercel), always use relative path so requests are proxied
// through Vercel's server-side rewrite rules (vercel.json) to the backend on Render.
// This completely avoids browser CORS errors because the request stays on the same origin.
// In development, VITE_API_URL can point to a local or remote backend, or fall back to
// the Vite dev-server proxy (also configured in vite.config.ts).
const getApiUrl = () => {
  // Production: always use relative path → proxied by Vercel, no CORS
  if (import.meta.env.PROD) {
    return '';
  }
  // Development: use VITE_API_URL if set, otherwise fall back to Vite proxy
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '';
};

const API_URL = getApiUrl();

console.log('[AuthContext] API_URL:', API_URL);
console.log('[AuthContext] Environment:', import.meta.env.MODE);

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  showLoginSkeleton: boolean;
  isSkeletonFading: boolean;
  login: (email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'cbc_access_token';
const REFRESH_TOKEN_KEY = 'cbc_refresh_token';
const USER_KEY = 'cbc_user';
const LOGIN_SKELETON_DURATION_MS = 6000;
const SKELETON_FADE_START_MS = LOGIN_SKELETON_DURATION_MS - 1000; // fade-out begins 1 second before hide

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

const saveTokens = (accessToken: string, refreshToken: string, user: User) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginSkeleton, setShowLoginSkeleton] = useState(false);
  const [isSkeletonFading, setIsSkeletonFading] = useState(false);
  const skeletonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skeletonFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startSkeletonTimer = () => {
    if (skeletonTimerRef.current) clearTimeout(skeletonTimerRef.current);
    if (skeletonFadeTimerRef.current) clearTimeout(skeletonFadeTimerRef.current);
    setShowLoginSkeleton(true);
    setIsSkeletonFading(false);
    skeletonFadeTimerRef.current = setTimeout(() => setIsSkeletonFading(true), SKELETON_FADE_START_MS);
    skeletonTimerRef.current = setTimeout(() => {
      setShowLoginSkeleton(false);
      setIsSkeletonFading(false);
    }, LOGIN_SKELETON_DURATION_MS);
  };

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const { user: storedUser } = getStoredTokens();
        if (storedUser) {
          setUser(storedUser);
          startSkeletonTimer();
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();

    return () => {
      if (skeletonTimerRef.current) clearTimeout(skeletonTimerRef.current);
      if (skeletonFadeTimerRef.current) clearTimeout(skeletonFadeTimerRef.current);
    };
  }, []);

  const login = async (email: string, password: string, role?: string) => {
    setIsLoading(true);
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      console.log('[AuthContext] Login attempt for:', email, 'with role:', role);
      console.log('[AuthContext] Full API URL:', `${API_URL}/api/auth/login`);

      const requestBody = { email, password };
      // Add role if provided (for future backend support)
      if (role) {
        (requestBody as any).role = role;
      }

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[AuthContext] Response status:', response.status);

      const data = await response.json();
      console.log('[AuthContext] Response data:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Invalid credentials. Please try again.');
      }

      const userData = data.data?.user || data.user || data.data || {};
      // Backend returns: { success: true, data: { user: {...}, tokens: { accessToken, refreshToken } } }
      const token = data.data?.tokens?.accessToken || data.data?.accessToken || data.token || '';
      const refreshToken = data.data?.tokens?.refreshToken || data.data?.refreshToken || data.refreshToken || '';

      const user: User = {
        id: userData.id || '1',
        email: userData.email || email,
        role: (userData.role || 'admin') as UserRole,
        firstName: userData.firstName || userData.first_name || userData.name?.split(' ')[0] || 'Admin',
        lastName: userData.lastName || userData.last_name || userData.name?.split(' ').slice(1).join(' ') || '',
        schoolId: userData.schoolId || userData.school_id || null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveTokens(token, refreshToken, user);
      setUser(user);
      startSkeletonTimer();
      console.log('[AuthContext] Login successful for:', email);
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (skeletonTimerRef.current) clearTimeout(skeletonTimerRef.current);
    if (skeletonFadeTimerRef.current) clearTimeout(skeletonFadeTimerRef.current);
    setShowLoginSkeleton(false);
    setIsSkeletonFading(false);
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      showLoginSkeleton,
      isSkeletonFading,
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
