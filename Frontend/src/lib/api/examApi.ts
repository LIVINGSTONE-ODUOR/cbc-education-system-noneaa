/**
 * Exam API Service
 * Handles HTTP requests for the Exam Setup backend endpoints (/api/v1/exams).
 */

const getApiUrl = (): string => {
  if (import.meta.env.PROD) return '';
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
};

const API_URL = getApiUrl();

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
    const message =
      data.message ||
      (Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
      'An error occurred while communicating with the exams API.';
    throw new Error(message);
  }
  return data;
};

export const EXAM_TYPES = ['CAT', 'Mid-Term', 'End-Term', 'Mock', 'Final'] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

export interface ExamApiTerm {
  id: string;
  name: string;
  year: number;
  is_current?: boolean;
  is_active?: boolean;
}

export interface ExamApiClass {
  id: string;
  grade_level: string;
  stream_name: string | null;
}

export interface ExamApiItem {
  id: string;
  school_id: string;
  term_id: string;
  class_id: string;
  exam_name: string;
  exam_type: ExamType;
  start_date: string;
  end_date: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  academic_years?: ExamApiTerm | null;
  classes?: ExamApiClass | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ExamsListResponse {
  exams: ExamApiItem[];
  pagination?: {
    page: number;
    limit: number;
    total_count: number;
  };
}

export interface ExamListParams {
  search?: string;
  exam_type?: string;
  term_id?: string;
  class_id?: string;
  grade_level?: string;
  is_active?: string;
  page?: number;
  limit?: number;
  sort_by?: 'start_date' | 'end_date' | 'exam_name' | 'exam_type' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export const getExams = async (
  params: ExamListParams = {}
): Promise<ApiResponse<ExamsListResponse>> => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const query = searchParams.toString();
  const url = `${API_URL}/api/v1/exams${query ? `?${query}` : ''}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<ExamsListResponse>>(response);
};

export interface ExamPayload {
  term_id: string;
  class_id: string;
  exam_name: string;
  exam_type: ExamType;
  start_date: string;
  end_date: string;
  description?: string;
}

export const createExam = async (
  payload: ExamPayload
): Promise<ApiResponse<ExamApiItem>> => {
  const url = `${API_URL}/api/v1/exams`;
  const response = await fetch(url, getFetchOptions('POST', payload));
  return handleResponse<ApiResponse<ExamApiItem>>(response);
};

export const updateExam = async (
  id: string,
  payload: Partial<ExamPayload> & { is_active?: boolean }
): Promise<ApiResponse<ExamApiItem>> => {
  const url = `${API_URL}/api/v1/exams/${id}`;
  const response = await fetch(url, getFetchOptions('PUT', payload));
  return handleResponse<ApiResponse<ExamApiItem>>(response);
};

export const deleteExam = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const url = `${API_URL}/api/v1/exams/${id}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  return handleResponse<ApiResponse<{ message: string }>>(response);
};
