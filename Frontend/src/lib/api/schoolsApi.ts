/**
 * Schools API Service
 */

const getApiUrl = (): string => {
  const raw = import.meta.env.VITE_API_URL || '';
  if (!raw) return '';
  return raw.replace(/\/api(?:\/v1)?\/?$/, '').replace(/\/+$/, '');
};

const API_URL = getApiUrl();
console.log('[schoolsApi] API_URL:', API_URL);

// Get auth token
const getAuthToken = (): string | null => localStorage.getItem('cbe_access_token');

// Fetch options
const getFetchOptions = (method: string, body?: unknown): RequestInit => {
  const token = getAuthToken();
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { method, headers, body: body ? JSON.stringify(body) : undefined };
};

// Response handler
const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'API Error');
  return data;
};

export interface School {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  fee_payment_instructions?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Branch {
  id: string;
  name: string;
  school_id: string;
  is_active: boolean;
}

export interface CreateSchoolPayload {
  name: string;
  code: string;
  email: string;
  phone?: string;
  address?: string;
  fee_payment_instructions?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const getSchools = async (params: Record<string, any> = {}): Promise<ApiResponse<School[]>> => {
  const searchParams = new URLSearchParams(params as any);
  const query = searchParams.toString();
  const url = `${API_URL}/api/v1/schools${query ? `?${query}` : ''}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<School[]>>(response);
};

export const getSchoolById = async (id: string): Promise<ApiResponse<School>> => {
  const url = `${API_URL}/api/v1/schools/${id}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<School>>(response);
};

export const createSchool = async (payload: CreateSchoolPayload): Promise<ApiResponse<School>> => {
  const url = `${API_URL}/api/v1/schools`;
  const response = await fetch(url, getFetchOptions('POST', payload));
  return handleResponse<ApiResponse<School>>(response);
};

export const updateSchool = async (id: string, payload: Partial<CreateSchoolPayload>): Promise<ApiResponse<School>> => {
  const url = `${API_URL}/api/v1/schools/${id}`;
  const response = await fetch(url, getFetchOptions('PUT', payload));
  return handleResponse<ApiResponse<School>>(response);
};

export const deleteSchool = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const url = `${API_URL}/api/v1/schools/${id}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  return handleResponse<ApiResponse<{ message: string }>>(response);
};

export const getBranches = async (schoolId: string): Promise<Branch[]> => {
  const url = `${API_URL}/api/v1/schools/${schoolId}/branches`;
  const response = await fetch(url, getFetchOptions('GET'));
  const result = await handleResponse<ApiResponse<Branch[]>>(response);
  return result.data || [];
};

export interface Administrator {
  user_id: string;
  name: string;
  email: string;
  role: string;
  is_principal: boolean;
  appointment_date: string | null;
}

/**
 * GET /api/v1/schools/:id/administrators
 * List a school's administrator accounts, including who's currently
 * the signatory (is_principal) — used by the School Signatory settings
 * card to show who can be reassigned.
 */
export const getAdministrators = async (schoolId: string): Promise<{ administrators: Administrator[] }> => {
  const url = `${API_URL}/api/v1/schools/${schoolId}/administrators`;
  const response = await fetch(url, getFetchOptions('GET'));
  const result = await handleResponse<ApiResponse<{ administrators: Administrator[] }>>(response);
  return result.data || { administrators: [] };
};

/**
 * PATCH /api/v1/schools/:id/administrators/:userId/signatory
 * Reassigns which administrator is the school's signatory — the name
 * shown on the Fee Structure page and its PDF export.
 */
export const setSignatory = async (schoolId: string, userId: string): Promise<ApiResponse<{ user_id: string }>> => {
  const url = `${API_URL}/api/v1/schools/${schoolId}/administrators/${userId}/signatory`;
  const response = await fetch(url, getFetchOptions('PATCH'));
  return handleResponse<ApiResponse<{ user_id: string }>>(response);
};
