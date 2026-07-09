/**
 * Promotion / Graduation API Service
 * Handles HTTP requests for the Promotions & Graduations backend endpoints
 * (/api/v1/promotions). Mirrors examApi.ts / classApi.ts conventions.
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
      'An error occurred while communicating with the promotions API.';
    throw new Error(message);
  }
  return data;
};

export const BATCH_KINDS = ['promotion', 'graduation'] as const;
export type BatchKind = (typeof BATCH_KINDS)[number];

export const BATCH_STATUSES = [
  'draft',
  'ready',
  'running',
  'completed',
  'locked',
  'cancelled',
] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

export interface PromotionApiTerm {
  id: string;
  name: string;
  year: number;
  is_current?: boolean;
  is_active?: boolean;
}

export interface PromotionBatchLearner {
  id: string;
  batch_id: string;
  learner_id: string;
  from_class_id: string | null;
  to_class_id: string | null;
  decision: 'selected' | 'promoted' | 'retained' | 'graduated' | 'not_graduated' | 'excluded';
  certificate_no: string | null;
  notes: string | null;
  learners?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
  } | null;
}

export interface PromotionBatchApiItem {
  id: string;
  school_id: string;
  kind: BatchKind;
  academic_year_id: string;
  grade_level: string;
  stream_name: string | null;
  to_grade_level: string | null;
  criteria: string;
  effective_date: string;
  learner_count_target: number;
  learner_count_selected: number;
  learner_count_completed: number;
  status: BatchStatus;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
  academic_years?: PromotionApiTerm | null;
  learners?: PromotionBatchLearner[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PromotionsListResponse {
  data: PromotionBatchApiItem[];
  pagination?: { page: number; limit: number; total: number };
}

export interface PromotionListParams {
  kind?: BatchKind;
  status?: BatchStatus;
  academic_year_id?: string;
  grade_level?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const getPromotionBatches = async (
  params: PromotionListParams = {}
): Promise<PromotionsListResponse> => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const query = searchParams.toString();
  const url = `${API_URL}/api/v1/promotions${query ? `?${query}` : ''}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<PromotionsListResponse>(response);
};

export const getPromotionBatch = async (
  id: string
): Promise<ApiResponse<PromotionBatchApiItem>> => {
  const url = `${API_URL}/api/v1/promotions/${id}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<PromotionBatchApiItem>>(response);
};

export interface CreateBatchPayload {
  kind: BatchKind;
  academic_year_id: string;
  grade_level: string;
  stream_name?: string | null;
  to_grade_level?: string | null;
  criteria: string;
  effective_date: string;
}

export const createPromotionBatch = async (
  payload: CreateBatchPayload
): Promise<ApiResponse<PromotionBatchApiItem>> => {
  const url = `${API_URL}/api/v1/promotions`;
  const response = await fetch(url, getFetchOptions('POST', payload));
  return handleResponse<ApiResponse<PromotionBatchApiItem>>(response);
};

export const runPromotionBatch = async (
  id: string
): Promise<ApiResponse<PromotionBatchApiItem>> => {
  const url = `${API_URL}/api/v1/promotions/${id}/run`;
  const response = await fetch(url, getFetchOptions('POST'));
  return handleResponse<ApiResponse<PromotionBatchApiItem>>(response);
};

export const lockPromotionBatch = async (
  id: string
): Promise<ApiResponse<PromotionBatchApiItem>> => {
  const url = `${API_URL}/api/v1/promotions/${id}/lock`;
  const response = await fetch(url, getFetchOptions('POST'));
  return handleResponse<ApiResponse<PromotionBatchApiItem>>(response);
};

export const unlockPromotionBatch = async (
  id: string
): Promise<ApiResponse<PromotionBatchApiItem>> => {
  const url = `${API_URL}/api/v1/promotions/${id}/unlock`;
  const response = await fetch(url, getFetchOptions('POST'));
  return handleResponse<ApiResponse<PromotionBatchApiItem>>(response);
};

export const deletePromotionBatch = async (
  id: string
): Promise<ApiResponse<{ message: string }>> => {
  const url = `${API_URL}/api/v1/promotions/${id}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  return handleResponse<ApiResponse<{ message: string }>>(response);
};
