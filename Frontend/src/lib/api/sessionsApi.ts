/**
 * Sessions API Service
 * Handles HTTP requests for device/session history (/api/v1/sessions).
 */

const getApiUrl = (): string => {
  if (import.meta.env.PROD) return '';
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
};

const API_URL = getApiUrl();

const getAuthToken = (): string | null => localStorage.getItem('cbe_access_token');
// The refresh token doubles as the session_token stored server-side in
// user_sessions, so sending it lets the backend flag "this device" without
// ever returning any session's raw token in the response.
const getRefreshToken = (): string | null => localStorage.getItem('cbe_refresh_token');

const getFetchOptions = (method: string, body?: unknown): RequestInit => {
  const token = getAuthToken();
  const refreshToken = getRefreshToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (refreshToken) headers['x-session-token'] = refreshToken;
  return {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'An error occurred while communicating with the sessions API.');
  }
  return data;
};

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface UserSession {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
  is_current: boolean;
}

export const getMySessions = async (): Promise<ApiResponse<{ sessions: UserSession[] }>> => {
  const url = `${API_URL}/api/v1/sessions`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse(response);
};

export const revokeSession = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const url = `${API_URL}/api/v1/sessions/${id}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  return handleResponse(response);
};
