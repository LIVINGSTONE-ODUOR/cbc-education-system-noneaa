import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missing: string[] = [];
if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

if (missing.length > 0) {
  console.error(
    `[supabase] Supabase configuration missing: ${missing.join(', ')}. ` +
      `Set these in Frontend/.env and restart the dev server.`
  );
}

// Create the Supabase client with optimized settings for faster performance.
// If env vars are missing, export null so the app doesn't crash on boot.
export const supabase =
  missing.length > 0
    ? null
    : createClient(supabaseUrl as string, supabaseAnonKey as string, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          flowType: 'pkce',
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Client-Info': 'cbc-education-system/1.0.0',
          },
        },
      });


// User types based on the database schema
export interface DatabaseUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  avatar_url: string | null;
  role: 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';
  status: 'active' | 'inactive' | 'pending';
  email_verified: boolean;
  two_factor_enabled: boolean;
  last_login: string | null;
  login_attempts: number;
  locked_until: string | null;
  active_sessions: number;
  max_sessions: number;
  school_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Extended user type for UI display
export interface UserForUI {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: string;
  status: string;
  displayStatus: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLogin: string | null;
  loginAttempts: number;
  lockedUntil: string | null;
  isLocked: boolean;
  activeSessions: number;
  maxSessions: number;
  schoolId: string | null;
  isActive: boolean;
  joinedDate: string;
  avatarUrl: string | null;
  schoolName?: string;
}

// Helper function to format user data for the UI
export const formatUserForUI = (dbUser: DatabaseUser, schoolName?: string): UserForUI => {
  const firstName = dbUser.first_name || '';
  const lastName = dbUser.last_name || '';
  const name = `${firstName} ${lastName}`.trim() || dbUser.email;
  
  // Smart status logic
  let displayStatus = 'Active';
  const now = new Date();
  
  if (dbUser.locked_until && new Date(dbUser.locked_until) > now) {
    displayStatus = 'Locked';
  } else if (!dbUser.is_active) {
    displayStatus = 'Inactive';
  } else if (!dbUser.email_verified) {
    displayStatus = 'Not Verified';
  }
  
  return {
    id: dbUser.id,
    firstName,
    lastName,
    name,
    email: dbUser.email,
    role: dbUser.role,
    status: dbUser.status,
    displayStatus,
    emailVerified: dbUser.email_verified,
    twoFactorEnabled: dbUser.two_factor_enabled,
    lastLogin: dbUser.last_login,
    loginAttempts: dbUser.login_attempts,
    lockedUntil: dbUser.locked_until,
    isLocked: dbUser.locked_until ? new Date(dbUser.locked_until) > now : false,
    activeSessions: dbUser.active_sessions,
    maxSessions: dbUser.max_sessions,
    schoolId: dbUser.school_id,
    isActive: dbUser.is_active,
    joinedDate: new Date(dbUser.created_at).toISOString().split('T')[0],
    avatarUrl: dbUser.avatar_url,
    schoolName
  };
};

// Helper to format last active time
const formatLastActive = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};
