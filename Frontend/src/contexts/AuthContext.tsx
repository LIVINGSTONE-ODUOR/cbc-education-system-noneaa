import {
  useState,
  useRef,
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';

import { User, UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';

// ======================================================
// API URL CONFIGURATION
// ======================================================

const getApiUrl = () => {
  // Use Vercel environment variable if available
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }

  // Production backend base URL.
  // Must point to the SAME backend that serves `/api/v1/login`.
  // In prod, require VITE_API_URL to avoid hardcoded drift across deployments.
  if (import.meta.env.PROD) {
    const fromEnv = import.meta.env.VITE_API_URL;
    if (!fromEnv) {
      console.warn('[AuthContext] VITE_API_URL missing in PROD; falling back to empty string (may break auth).');
      return '';
    }
    return fromEnv.replace(/\/+$/, '');
  }



  // Development fallback (Vite proxy/local backend)
  return '';
};

const API_URL = getApiUrl();

  if (!import.meta.env.PROD) {
    console.log('[AuthContext] API_URL:', API_URL);
    console.log('[AuthContext] Environment:', import.meta.env.MODE);
    console.log('[AuthContext] Login URL:', `${API_URL}/api/v1/login`);
    console.log('[AuthContext] Health URL:', `${API_URL}/health`);
  }


// ======================================================
// TYPES
// ======================================================

interface AuthContextType {
  user: User | null;
  schoolId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  showLoginSkeleton: boolean;
  isSkeletonFading: boolean;

  login: (
    email: string,
    password: string,
    role?: string
  ) => Promise<void>;

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
// LOGIN SKELETON SETTINGS
// ======================================================

const LOGIN_SKELETON_DURATION_MS = 6000;

const SKELETON_FADE_START_MS =
  LOGIN_SKELETON_DURATION_MS - 1000;

  // ======================================================
  // AUTO LOGOUT SETTINGS
  // ======================================================

  // Disabled by default to prevent dashboard 401 loops while debugging.
  // Re-enable after token/refresh behavior is stable.
  //
  // NOTE: 0 is treated as "disabled" by startInactivityTimer() below.
  // setTimeout(fn, 0) does NOT mean "never fire" - it fires almost
  // immediately on the next tick. Previously this caused an instant
  // logout right after login. Do not remove the guard in
  // startInactivityTimer() unless these values are both > 0.
  const INACTIVITY_TIMEOUT_MS =
    Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES || 5) *
    60 *
    1000;

  const ACTIVITY_EVENTS = [
    'mousemove',
    'mousedown',
    'keydown',
    'scroll',
    'touchstart',
  ] as const;

// ======================================================
// TOKEN HELPERS
// ======================================================

const getStoredTokens = () => {
  try {
    const accessToken = localStorage.getItem(
      ACCESS_TOKEN_KEY
    );

    const refreshToken = localStorage.getItem(
      REFRESH_TOKEN_KEY
    );

    const userStr = localStorage.getItem(USER_KEY);

    const user = userStr ? JSON.parse(userStr) : null;

    return {
      accessToken,
      refreshToken,
      user,
    };
  } catch {
    return {
      accessToken: null,
      refreshToken: null,
      user: null,
    };
  }
};

const saveTokens = (
  accessToken: string,
  refreshToken: string,
  user: User
) => {
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

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [showLoginSkeleton, setShowLoginSkeleton] =
    useState(false);

  const [isSkeletonFading, setIsSkeletonFading] =
    useState(false);

  const skeletonTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const skeletonFadeTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const inactivityTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  // ======================================================
  // SKELETON TIMER
  // ======================================================

  const startSkeletonTimer = () => {
    if (skeletonTimerRef.current) {
      clearTimeout(skeletonTimerRef.current);
    }

    if (skeletonFadeTimerRef.current) {
      clearTimeout(skeletonFadeTimerRef.current);
    }

    setShowLoginSkeleton(true);

    setIsSkeletonFading(false);

    skeletonFadeTimerRef.current = setTimeout(() => {
      setIsSkeletonFading(true);
    }, SKELETON_FADE_START_MS);

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
    if (skeletonTimerRef.current) {
      clearTimeout(skeletonTimerRef.current);
    }

    if (skeletonFadeTimerRef.current) {
      clearTimeout(skeletonFadeTimerRef.current);
    }

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

    // Guard: treat a non-positive timeout as "inactivity logout disabled".
    // setTimeout(fn, 0) fires almost immediately (next tick), NOT never.
    // Without this guard, INACTIVITY_TIMEOUT_MS = 0 was logging users out
    // right after login, before the dashboard even finished loading.
    if (INACTIVITY_TIMEOUT_MS <= 0) {
      return;
    }

    inactivityTimerRef.current = setTimeout(() => {
      performLogout();

      toast.info(
        'You have been logged out due to inactivity.',
        {
          id: 'inactivity-logout',
        }
      );
    }, INACTIVITY_TIMEOUT_MS);
  }, [stopInactivityTimer, performLogout]);

  // ======================================================
  // INITIALIZE AUTH
  // ======================================================

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const {
          user: storedUser,
          accessToken,
        } = getStoredTokens();

        if (storedUser && accessToken) {
          setUser(storedUser);

          startSkeletonTimer();
        } else {
          clearTokens();
        }
      } catch (error) {
        console.error(
          'Session initialization error:',
          error
        );

        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (skeletonTimerRef.current) {
        clearTimeout(skeletonTimerRef.current);
      }

      if (skeletonFadeTimerRef.current) {
        clearTimeout(skeletonFadeTimerRef.current);
      }
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

    const handleActivity = () => {
      startInactivityTimer();
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleActivity, {
        passive: true,
      })
    );

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(
          event,
          handleActivity
        )
      );

      stopInactivityTimer();
    };
  }, [
    user,
    startInactivityTimer,
    stopInactivityTimer,
  ]);

  // ======================================================
  // LOGIN
  // ======================================================

  const login = async (
    email: string,
    password: string,
    role?: string
  ) => {
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error(
          'Email and password are required'
        );
      }

      console.log(
        '[AuthContext] Login attempt for:',
        email,
        'with role:',
        role
      );

      const loginUrl = `${API_URL}/api/v1/login`;
      // Absolute URL in prod is required to match the backend that signs JWTs.


      console.log(
        '[AuthContext] Full API URL:',
        loginUrl
      );

      const requestBody: any = {
        email,
        password,
      };

      if (role) {
        requestBody.role = role;
      }

      const response = await fetch(loginUrl, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify(requestBody),
      });

      console.log(
        '[AuthContext] Response status:',
        response.status
      );

      const data = await response.json();

      console.log(
        '[AuthContext] Response data:',
        data
      );

      if (!response.ok || !data.success) {
        const err = new Error(
          data.message ||
            data.error ||
            'Invalid credentials. Please try again.'
        );

        if (response.status === 423 && data.locked_until) {
          (
            err as Error & {
              lockedUntil: string;
            }
          ).lockedUntil = data.locked_until;
        }

        if (response.status === 503 || data.error === 'DATABASE_UNAVAILABLE') {
          (
            err as Error & { code: string }
          ).code = 'DATABASE_UNAVAILABLE';
        }

        throw err;
      }

      const userData =
        data.data?.user ||
        data.user ||
        data.data ||
        {};

      const token =
        data.data?.tokens?.accessToken ||
        data.data?.accessToken ||
        data.token ||
        '';

      const refreshToken =
        data.data?.tokens?.refreshToken ||
        data.data?.refreshToken ||
        data.refreshToken ||
        '';

      const user: User = {
        id: userData.id || '1',

        email: userData.email || email,

        role: (userData.role || 'admin') as UserRole,

        firstName:
          userData.firstName ||
          userData.first_name ||
          userData.name?.split(' ')[0] ||
          'Admin',

        lastName:
          userData.lastName ||
          userData.last_name ||
          userData.name
            ?.split(' ')
            .slice(1)
            .join(' ') ||
          '',

        schoolId:
          userData.schoolId ||
          userData.school_id ||
          null,

        isActive: true,

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString(),
      };

      saveTokens(token, refreshToken, user);

      setUser(user);

      startSkeletonTimer();

      console.log(
        '[AuthContext] Login successful for:',
        email
      );
    } catch (error) {
      console.error(
        '[AuthContext] Login error:',
        error
      );

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
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}
