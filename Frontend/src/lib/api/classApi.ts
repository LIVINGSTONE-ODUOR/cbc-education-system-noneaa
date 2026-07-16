/**
 * Class API Service
 * Handles HTTP requests for the Classes Management backend endpoints.
 */

import { refreshToken as refreshAccessToken } from '@/lib/auth';

const getApiUrl = (): string => {
  const raw = import.meta.env.VITE_API_URL || '';
  if (!raw) return '';
  return raw.replace(/\/api(?:\/v1)?\/?$/, '').replace(/\/+$/, '');
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

// Wraps `fetch` so a 401 (expired access token) transparently refreshes and
// retries once, matching the behavior lib/auth.ts's ApiClient already has.
// Without this, classApi calls (createClass, getBranches-adjacent calls,
// etc.) failed hard the moment the 1h access token expired, while other
// modules (learnersApi/profileApi, which go through lib/auth.ts) silently
// refreshed and kept working — which is why "create learner" could
// succeed in the same session where "create class" failed.
const fetchWithAuth = async (url: string, options: RequestInit): Promise<Response> => {
  let response = await fetch(url, options);

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryHeaders = {
        ...(options.headers as Record<string, string>),
        Authorization: `Bearer ${getAuthToken()}`,
      };
      response = await fetch(url, { ...options, headers: retryHeaders });
    }
  }

  return response;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();

  if (!response.ok || !data.success) {
    // 403 here means the *current* account role genuinely isn't allowed
    // to do this — not an expired token (that's the 401 case above).
    // Surface that distinction instead of a generic error, since a stale
    // cached session (see AuthContext.tsx) is the most common cause.
    if (response.status === 403) {
      throw new Error(
        data.message ||
          "Your account doesn't have permission for this action. If your role recently changed, try logging out and back in."
      );
    }
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

  const response = await fetchWithAuth(url, getFetchOptions('GET'));
  // Helpful debug when creation succeeds but subsequent list is empty.
  // NOTE: read a clone, not the original — reading .text()/.json() on the
  // original consumes its body stream, which made the later handleResponse()
  // call throw "body stream already read".
  if (!response.ok) {
    const txt = await response.clone().text().catch(() => '');
    // Request failed — log in dev only
    if (import.meta.env.DEV) {
      console.warn('[classApi] request failed', { url, status: response.status });
    }
  }
  return handleResponse<ApiResponse<ClassesApiResponse>>(response);
};

// GET /api/v1/classes/:id — single class detail, including its class teacher.
// Any authenticated role can call this for a class in their own school
// (students included, e.g. to show their own class teacher's name).
export const getClassById = async (
  id: string
): Promise<ApiResponse<ClassApiItem & { teachers?: ClassApiTeacherPayload | null }>> => {
  const response = await fetchWithAuth(`${API_URL}/api/v1/classes/${id}`, getFetchOptions('GET'));
  return handleResponse(response);
};

export const createClass = async (payload: {
  grade_level: string;
  stream_name?: string | null;
  class_teacher_id?: string | null;
  branch_id?: string | null;
  academic_year_id?: string | null;
  capacity?: number;
  learning_area_ids?: string[];
}): Promise<ApiResponse<ClassApiItem>> => {
  const url = `${API_URL}/api/v1/classes`;
  const response = await fetchWithAuth(url, getFetchOptions('POST', payload));
  if (!response.ok) {
    // Request failed — log in dev only
    if (import.meta.env.DEV) {
      const txt = await response.clone().text().catch(() => '');
      console.warn('[classApi] create failed', { url, status: response.status });
    }
  }
  return handleResponse<ApiResponse<ClassApiItem>>(response);
};

// PUT /api/v1/classes/:id
// Update class fields. Pass class_teacher_id: null to unassign the teacher.
export const updateClass = async (
  id: string,
  payload: {
    class_teacher_id?: string | null;
    capacity?: number;
    stream_name?: string | null;
    branch_id?: string | null;
    is_active?: boolean;
  }
): Promise<ApiResponse<ClassApiItem>> => {
  const url = `${API_URL}/api/v1/classes/${id}`;
  const response = await fetchWithAuth(url, getFetchOptions('PUT', payload));
  if (!response.ok) {
    if (import.meta.env.DEV) {
      console.warn('[classApi] update failed', { url, status: response.status });
    }
  }
  return handleResponse<ApiResponse<ClassApiItem>>(response);
};

export const deleteClass = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await fetchWithAuth(`${API_URL}/api/v1/classes/${id}`, getFetchOptions('DELETE'));
  return handleResponse<ApiResponse<{ message: string }>>(response);
};

// ── Class Subjects (Learning Areas) ─────────────────────────────────────────

export interface ClassLearningArea {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  grade_levels?: string[] | null;
  is_active?: boolean;
}

export interface ClassLearningAreasApiResponse {
  learning_areas: ClassLearningArea[];
  source: 'class_assignment' | 'grade_default';
}

// GET /api/v1/classes/:id/learning-areas
// Resolved subject list for a class: the explicit assignment if one was
// set (at creation or via setClassLearningAreas), otherwise the
// grade-level default.
export const getClassLearningAreas = async (
  classId: string
): Promise<ApiResponse<ClassLearningAreasApiResponse>> => {
  const response = await fetchWithAuth(
    `${API_URL}/api/v1/classes/${classId}/learning-areas`,
    getFetchOptions('GET')
  );
  return handleResponse<ApiResponse<ClassLearningAreasApiResponse>>(response);
};

// PUT /api/v1/classes/:id/learning-areas
// Replace the explicit subject assignment for a class. Pass [] to clear
// the explicit assignment and fall back to the grade-level default again.
export const setClassLearningAreas = async (
  classId: string,
  learning_area_ids: string[]
): Promise<ApiResponse<{ message: string }>> => {
  const response = await fetchWithAuth(
    `${API_URL}/api/v1/classes/${classId}/learning-areas`,
    getFetchOptions('PUT', { learning_area_ids })
  );
  return handleResponse<ApiResponse<{ message: string }>>(response);
};

// ── Class Roster ─────────────────────────────────────────────────────────

export interface ClassLearnerItem {
  id: string; // enrollment id
  learner_id: string;
  status: string;
  enrollment_date?: string;
  learners: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    date_of_birth?: string;
    gender?: string;
    email?: string;
  } | null;
}

export interface ClassLearnersApiResponse {
  learners: ClassLearnerItem[];
  pagination?: {
    page: number;
    limit: number;
    total_count: number;
  };
}

/**
 * GET /api/v1/classes/:id/learners - Full roster for a class
 */
export const getClassLearners = async (
  classId: string,
  params: {
    status?: 'enrolled' | 'withdrawn' | 'all';
    gender?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<ApiResponse<ClassLearnersApiResponse>> => {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.append('status', params.status);
  if (params.gender) searchParams.append('gender', params.gender);
  if (params.search) searchParams.append('search', params.search);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());

  const query = searchParams.toString();
  const url = `${API_URL}/api/v1/classes/${classId}/learners${query ? `?${query}` : ''}`;

  const response = await fetchWithAuth(url, getFetchOptions('GET'));
  if (!response.ok) {
    if (import.meta.env.DEV) {
      console.warn('[classApi] learners request failed', { url, status: response.status });
    }
  }
  return handleResponse<ApiResponse<ClassLearnersApiResponse>>(response);
};
