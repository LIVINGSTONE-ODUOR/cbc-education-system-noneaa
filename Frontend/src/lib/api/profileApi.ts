/**
 * Profile API Service - School Admin Profile Management
 */

import type { School, ApiResponse } from './schoolsApi'; // Import types only
import { toast } from '@/components/ui/sonner';

const getApiUrl = (): string => {
  const raw = import.meta.env.VITE_API_URL || '';
  if (!raw) return '';
  return raw.replace(/\/api(?:\/v1)?\/?$/, '').replace(/\/+$/, '');
};

const API_URL = getApiUrl();
console.log('[profileApi] API_URL:', API_URL);

// Get auth token from localStorage (matches other APIs)
const getAuthToken = (): string | null => localStorage.getItem('cbe_access_token');

// Fetch options with auth
const getFetchOptions = (method: string, body?: unknown | FormData): RequestInit => {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return { 
    method, 
    headers, 
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined 
  };
};

// Response handler
const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok || !data.success) {
    toast.error(data.message || 'API Error');
    const err: any = new Error(data.message || 'API Error');
    err.status = response.status;
    throw err;
  }
  toast.success(data.message || 'Success');
  return data;
};

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  avatarUrl: string | null;
  title?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  alternativeEmail?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  twoFactorEnabled: boolean;
  schoolId?: string;
}

export interface PersonalInfoUpdate {
  firstName?: string;
  lastName?: string;
  title?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
}

export interface ContactInfoUpdate {
  phone?: string;
  alternativeEmail?: string;
  address?: string;
}

export interface EmergencyContactUpdate {
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

// ─── CORE PROFILE ENDPOINTS ───────────────────────────────────────────────────

export const getProfile = async (): Promise<Profile> => {
  const url = `${API_URL}/api/v1/users/me`;

  const doRequest = async () => {
    const response = await fetch(url, getFetchOptions('GET'));
    return handleResponse<{ data: Profile }>(response).then((data) => data.data);
  };

  try {
    return await doRequest();
  } catch (e: any) {
    // If token expired, attempt refresh then retry once.
    // profileApi previously never retried, causing persistent 401.
    if ((e && (e.status === 401)) || String(e?.message || '').toLowerCase().includes('401')) {
      const refreshToken = localStorage.getItem('cbe_refresh_token');
      if (!refreshToken) throw e;

      const refreshResp = await fetch(`${API_URL}/api/v1/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshResp.ok) throw e;

      const refreshData = await refreshResp.json();
      const newAccessToken = refreshData?.data?.tokens?.accessToken ?? refreshData?.data?.accessToken;
      const newRefreshToken = refreshData?.data?.tokens?.refreshToken ?? refreshData?.data?.refreshToken;

      if (newAccessToken) {
        localStorage.setItem('cbe_access_token', newAccessToken);
        if (newRefreshToken) localStorage.setItem('cbe_refresh_token', newRefreshToken);
      }

      return await doRequest();
    }

    throw e;
  }
};

export const updatePersonalInfo = async (data: PersonalInfoUpdate): Promise<void> => {
  const url = `${API_URL}/api/v1/users/me/personal-info`;
  const response = await fetch(url, getFetchOptions('PUT', data));
  await handleResponse(response);
};

export const updateContactInfo = async (data: ContactInfoUpdate): Promise<void> => {
  const url = `${API_URL}/api/v1/users/me/contact-info`;
  const response = await fetch(url, getFetchOptions('PUT', data));
  await handleResponse(response);
};

export const updateEmergencyContact = async (data: EmergencyContactUpdate): Promise<void> => {
  const url = `${API_URL}/api/v1/users/me/emergency-contact`;
  const response = await fetch(url, getFetchOptions('PUT', data));
  await handleResponse(response);
};

export const changePassword = async (data: PasswordChange): Promise<void> => {
  const url = `${API_URL}/api/v1/users/me/change-password`;
  const response = await fetch(url, getFetchOptions('POST', data));
  await handleResponse(response);
};

// ─── AVATAR ───────────────────────────────────────────────────────────────────

export const uploadAvatar = async (file: File): Promise<{ avatarUrl: string }> => {
  const url = `${API_URL}/api/v1/users/me/avatar`;
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await fetch(url, getFetchOptions('POST', formData));
  return handleResponse<{ data: { avatarUrl: string } }>(response).then(data => data.data);
};

export const removeAvatar = async (): Promise<void> => {
  const url = `${API_URL}/api/v1/users/me/avatar`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  await handleResponse(response);
};

// ─── SECURITY SETTINGS ───────────────────────────────────────────────────────

export interface SecuritySettingsData {
  loginAlerts: boolean;
  trustedDevicesOnly: boolean;
  sessionTimeout: number;
  trustedDevices: Array<{
    deviceId: string;
    deviceName: string;
    deviceType: string;
    addedAt: string;
    lastUsed: string;
  }>;
  lastLogin?: string;
  lastLoginIp?: string;
  lastActivity?: string;
}

export const fetchSecuritySettings = async (): Promise<SecuritySettingsData> => {
  const url = `${API_URL}/api/users/me/security-settings`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<{ data: SecuritySettingsData }>(response).then(data => data.data);
};

export const updateSecuritySettings = async (data: {
  loginAlerts: boolean;
  trustedDevicesOnly: boolean;
  sessionTimeout: number;
}): Promise<void> => {
  const url = `${API_URL}/api/users/me/security-settings`;
  const response = await fetch(url, getFetchOptions('PUT', data));
  await handleResponse(response);
};

export const addTrustedDevice = async (data: {
  deviceId: string;
  deviceName: string;
  deviceType: string;
}): Promise<void> => {
  const url = `${API_URL}/api/users/me/trusted-device`;
  const response = await fetch(url, getFetchOptions('POST', data));
  await handleResponse(response);
};

export const removeTrustedDevice = async (deviceId: string): Promise<void> => {
  const url = `${API_URL}/api/users/me/trusted-device/${deviceId}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  await handleResponse(response);
};

export const updateActivity = async (): Promise<void> => {
  const url = `${API_URL}/api/v1/users/me/update-activity`;

  const doRequest = async () => {
    const response = await fetch(url, getFetchOptions('POST'));
    await handleResponse<{ success: true }>(response);
  };

  try {
    await doRequest();
  } catch (e: any) {
    if (String(e?.message || '').toLowerCase().includes('401')) {
      const refreshToken = localStorage.getItem('cbe_refresh_token');
      if (!refreshToken) throw e;

      const refreshResp = await fetch(`${API_URL}/api/v1/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshResp.ok) throw e;

      const refreshData = await refreshResp.json();
      const newAccessToken = refreshData?.data?.tokens?.accessToken ?? refreshData?.data?.accessToken;
      const newRefreshToken = refreshData?.data?.tokens?.refreshToken ?? refreshData?.data?.refreshToken;

      if (newAccessToken) {
        localStorage.setItem('cbe_access_token', newAccessToken);
        if (newRefreshToken) localStorage.setItem('cbe_refresh_token', newRefreshToken);
      }

      await doRequest();
      return;
    }

    throw e;
  }
};

