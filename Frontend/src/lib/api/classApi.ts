/**
 * Class API Service
 * Handles HTTP requests for the Classes Management backend endpoints.
 */

const getApiUrl = (): string => {
  const raw = import.meta.env.VITE_API_URL || '';
  if (!raw) return '';
  return raw.replace(/\/api(?:\/v1)?\/?$/, '').replace(/\/+$/, '');
};

const API_URL = getApiUrl();
console.log('[classApi] API_URL:', API_URL, 'PROD:', import.meta.env.PROD);

const getAuthToken = (): string | null => {
  return localStorage.getItem('cbe_access_token');
};

const getFetchOptions = (method: string, body?: unknown): RequestInit => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'An error occurred while communicating with the classes API.');
  }

  return data;
};

export interface ClassApiTeacherPayload {
  id: string;
  user_id?: string;
  users?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface ClassApiBranchPayload {
  id: string;
  name: string;
}

export interface ClassApiItem {
  id: string;
  grade_level: string;
  stream_name: string | null;
  capacity: number | null;
  is_active: boolean;
  learner_count?: number | null;
  branches?: ClassApiBranchPayload | null;
  branch?: ClassApiBranchPayload | null;
  teachers?: ClassApiTeacherPayload | null;
  created_at: string;
}

export interface ClassesApiResponse {
  classes: ClassApiItem[];
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const getClasses = async (params: {
  is_active?: string;
  school_id?: string;
  grade_level?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ApiResponse<ClassesApiResponse>> => {
  const searchParams = new URLSearchParams();
  if (params.is_active) searchParams.append('is_active', params.is_active);
  if (params.school_id) searchParams.append('school_id', params.school_id);
  if (params.grade_level) searchParams.append('grade_level', params.grade_level);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());

  const query = searchParams.toString();
  const url = `${API_URL}/api/v1/classes${query ? `?${query}` : ''}`;

  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<ClassesApiResponse>>(response);
};

export const createClass = async (payload: {
  grade_level: string;
  stream_name?: string | null;
  class_teacher_id?: string | null;
  branch_id?: string | null;
  academic_year_id?: string | null;
  capacity?: number;
}): Promise<ApiResponse<ClassApiItem>> => {
  const response = await fetch(`${API_URL}/api/v1/classes`, getFetchOptions('POST', payload));
  return handleResponse<ApiResponse<ClassApiItem>>(response);
};

export const deleteClass = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await fetch(`${API_URL}/api/v1/classes/${id}`, getFetchOptions('DELETE'));
  return handleResponse<ApiResponse<{ message: string }>>(response);
};
