import { User, UserRole } from '@/types';

// API Response types
interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

const unwrapResponse = <T>(response: ApiResponse<T>, fallbackMessage: string): T => {
  if (response.success && response.data !== undefined) {
    return response.data;
  }

  throw new Error(response.message || fallbackMessage);
};

// API Configuration
// In production, use relative path so requests are proxied through Vercel (avoids CORS on custom domains)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');
const TOKEN_KEY = 'cbe_access_token';
const REFRESH_TOKEN_KEY = 'cbe_refresh_token';
const USER_KEY = 'cbe_user_data';

// API Client with automatic token refresh
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request with new token
          const newToken = this.getToken();
          const newHeaders = {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          };
          
          const retryResponse = await fetch(url, {
            ...options,
            headers: newHeaders,
          });

          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }

          return await retryResponse.json();
        } else {
          // Refresh failed, logout user
          this.logout();
          throw new Error('Authentication failed, please login again');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json() as ApiResponse<{ tokens: AuthTokens }>;
      const tokenData = unwrapResponse(data, 'Failed to refresh authentication token');

      this.setToken(tokenData.tokens.accessToken);
      this.setRefreshToken(tokenData.tokens.refreshToken);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  logout(): void {
    this.clearTokens();
    // Notify other tabs about logout
    window.dispatchEvent(new Event('storage'));
  }
}

// Auth API Client
const apiClient = new ApiClient(API_BASE_URL);

// Authentication Service
export class AuthService {
  // Login
  static async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
    const loginData = unwrapResponse(response, 'Login failed');

    apiClient.setToken(loginData.tokens.accessToken);
    apiClient.setRefreshToken(loginData.tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(loginData.user));
    return loginData;
  }

  // Logout
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.logout();
    }
  }

  // Register School Admin
  static async registerSchoolAdmin(data: Record<string, unknown>): Promise<unknown> {
    const response = await apiClient.post<ApiResponse>('/auth/register/school-admin', data);
    return unwrapResponse(response, 'Registration failed');
  }

  // Register Teacher
  static async registerTeacher(data: Record<string, unknown>): Promise<unknown> {
    const response = await apiClient.post<ApiResponse>('/auth/register/teacher', data);
    return unwrapResponse(response, 'Teacher registration failed');
  }

  // Register Parent
  static async registerParent(data: Record<string, unknown>): Promise<unknown> {
    const response = await apiClient.post<ApiResponse>('/auth/register/parent', data);
    return unwrapResponse(response, 'Parent registration failed');
  }

  // Register Learner
  static async registerLearner(data: Record<string, unknown>): Promise<unknown> {
    const response = await apiClient.post<ApiResponse>('/register/learner', data);
    return unwrapResponse(response, 'Learner registration failed');
  }

  // Request Password Reset
  static async requestPasswordReset(email: string): Promise<unknown> {
    const response = await apiClient.post<ApiResponse>('/auth/request-password-reset', { email });
    return unwrapResponse(response, 'Password reset request failed');
  }

  // Reset Password
  static async resetPassword(token: string, password: string): Promise<unknown> {
    const response = await apiClient.post<ApiResponse>('/auth/reset-password', { token, password });
    return unwrapResponse(response, 'Password reset failed');
  }

  // Change Password
  static async changePassword(currentPassword: string, newPassword: string): Promise<unknown> {
    const response = await apiClient.post<ApiResponse>('/auth/change-password', { 
      currentPassword, 
      newPassword 
    });
    return unwrapResponse(response, 'Password change failed');
  }

  // Verify Email
  static async verifyEmail(token: string): Promise<unknown> {
    const response = await apiClient.get<ApiResponse>(`/auth/verify-email/${token}`);
    return unwrapResponse(response, 'Email verification failed');
  }

  // Get Current User
  static getCurrentUser(): User | null {
    const userData = localStorage.getItem(USER_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = apiClient.getToken();
    return !!token;
  }

  // Get user role
  static getUserRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  // Get user school ID
  static getUserSchoolId(): string | null {
    const user = this.getCurrentUser();
    return user ? user.schoolId : null;
  }
}

// Utility functions for token management
export const getToken = () => apiClient.getToken();
export const getRefreshToken = () => apiClient.getRefreshToken();
export const clearTokens = () => apiClient.clearTokens();
export const refreshToken = () => apiClient.refreshToken();
export const logout = () => apiClient.logout();
