import { useState, useRef, createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';

// ======================================================
// API URL CONFIGURATION
// ======================================================
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  // Production: require VITE_API_URL
  if (import.meta.env.PROD) {
    const fromEnv = import.meta.env.VITE_API_URL;
    return fromEnv ? fromEnv.replace(/\/+$/, '') : '';
  }
  // Development fallback
  return '';
};

const API_URL = getApiUrl();

// ======================================================
// TYPES
// ======================================================
interface LoginResult {
  requiresTwoFactor?: boolean;
  tempToken?: string;
}

interface AuthContextType {
  user: User | null;
  schoolId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  showLoginSkeleton: boolean;
  isSkeletonFading: boolean;
  login: (email: string, password: string, role?: string) => Promise<LoginResult>;
  verifyTwoFactor: (tempToken: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ======================================================
// STORAGE KEYS
// ======================================================
const ACCESS_TOKEN_KEY = 'cbe_access_token';
const REFRESH_TOKEN_KEY = 'cbe_refresh_token';
const USER_KEY = 'cbe_user';

// ======================================================
// SETTINGS
// ======================================================
const LOGIN_SKELETON_DURATION_MS = 6000;
const SKELETON_FADE_START_MS = LOGIN_SKELETON_DURATION_MS - 1000;

const INACTIVITY_TIMEOUT_MS =
  Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES || 5) * 60 * 1000;

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const;

// ======================================================
// TOKEN HELPERS
// ======================================================
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

// ======================================================
// PROVIDER
// ======================================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginSkeleton, setShowLoginSkeleton] = useState(false);
  const [isSkeletonFading, setIsSkeletonFading] = useState(false);
  const skeletonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skeletonFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ======================================================
  // SKELETON TIMER
  // ======================================================
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

  // ======================================================
  // STOP INACTIVITY TIMER
  // ======================================================
  const stopInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  // ======================================================
  // LOGOUT
  // ======================================================
  const performLogout = useCallback(() => {
    if (skeletonTimerRef.current) clearTimeout(skeletonTimerRef.current);
    if (skeletonFadeTimerRef.current) clearTimeout(skeletonFadeTimerRef.current);
    setShowLoginSkeleton(false);
    setIsSkeletonFading(false);
    stopInactivityTimer();
    clearTokens();
    setUser(null);
  }, [stopInactivityTimer]);

  // ======================================================
  // START INACTIVITY TIMER
  // ======================================================
  const startInactivityTimer = useCallback(() => {
    stopInactivityTimer();
    if (INACTIVITY_TIMEOUT_MS <= 0) return;
    inactivityTimerRef.current = setTimeout(() => {
      performLogout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [stopInactivityTimer, performLogout]);

  // ======================================================
  // INITIALIZE AUTH
  // ======================================================
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const { user: storedUser, accessToken } = getStoredTokens();
        if (storedUser && accessToken) {
          setUser(storedUser);
          startSkeletonTimer();
        } else {
          clearTokens();
        }
      } catch {
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

  // ======================================================
  // USER ACTIVITY LISTENERS
  // ======================================================
  useEffect(() => {
    if (!user) {
      stopInactivityTimer();
      return;
    }
    startInactivityTimer();
    const handleActivity = () => startInactivityTimer();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
      stopInactivityTimer();
    };
  }, [user, startInactivityTimer, stopInactivityTimer]);

  // ======================================================
  // APPLY LOGIN RESPONSE
  // ======================================================
  const applyLoginResponse = (data: any, fallbackEmail: string) => {
    const userData = data.data?.user || data.user || data.data || {};
    const token = data.data?.tokens?.accessToken || data.data?.accessToken || data.token || '';
    const refreshToken = data.data?.tokens?.refreshToken || data.data?.refreshToken || data.refreshToken || '';

    if (!userData.role) {
      throw new Error('Login response is missing the account role. Please contact support.');
    }

    const user: User = {
      id: userData.id || '1',
      email: userData.email || fallbackEmail,
      role: userData.role as UserRole,
      firstName: userData.firstName || userData.first_name || userData.name?.split(' ')[0] || 'Admin',
      lastName: userData.lastName || userData.last_name || userData.name?.split(' ').slice(1).join(' ') || '',
      schoolId: userData.schoolId || userData.school_id || null,
      schoolName: userData.schoolName || userData.school_name || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTokens(token, refreshToken, user);
    setUser(user);
    startSkeletonTimer();
    return user;
  };

  // ======================================================
  // LOGIN
  // ======================================================
  const login = async (email: string, password: string, role?: string) => {
    setIsLoading(true);
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const loginUrl = `${API_URL}/api/v1/login`;
      const requestBody: any = { email, password };
      if (role) requestBody.role = role;

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const err = new Error(data.message || data.error || 'Invalid credentials. Please try again.');
        if (response.status === 423 && data.locked_until) {
          (err as Error & { lockedUntil: string }).lockedUntil = data.locked_until;
        }
        throw err;
      }

      // 2FA required
      if (data.requiresTwoFactor) {
        return { requiresTwoFactor: true, tempToken: data.data?.tempToken as string };
      }

      applyLoginResponse(data, email);
      return {};
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ======================================================
  // VERIFY 2FA
  // ======================================================
  const verifyTwoFactor = async (tempToken: string, code: string) => {
    setIsLoading(true);
    try {
      const verifyUrl = `${API_URL}/api/v1/login/2fa-verify`;
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid or expired code. Please try again.');
      }

      applyLoginResponse(data, '');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ======================================================
  // LOGOUT
  // ======================================================
  const logout = () => {
    performLogout();
  };

  // ======================================================
  // PROVIDER RETURN
  // ======================================================
  return (
    <AuthContext.Provider
      value={{
        user,
        schoolId: user?.schoolId || null,
        isLoading,
        isAuthenticated: !!user && !!getStoredTokens().accessToken,
        showLoginSkeleton,
        isSkeletonFading,
        login,
        verifyTwoFactor,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ======================================================
// HOOK
// ======================================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
