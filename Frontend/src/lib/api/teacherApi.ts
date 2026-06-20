/**
 * Teacher/Staff API Service
 * Handles all HTTP requests to the teachers backend API (/api/v1/teachers)
 */

import type { StaffMember, StaffType } from '../../pages/teacher/StaffManagement/types';
import { backendToStaffMember, staffMemberToBackend } from '../../pages/teacher/StaffManagement/utils';

// API URL - normalize VITE_API_URL to avoid duplicate '/api' segments
const getApiUrl = (): string => {
  if (import.meta.env.PROD) return '';
  const raw = import.meta.env.VITE_API_URL || '';
  return raw.replace(/\/api\/?$/, '').replace(/\/+$/, '');
};

const API_URL = getApiUrl();
console.log('[teacherApi] API_URL:', API_URL);

// Auth token from localStorage (same as curriculumApi)
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
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
};

// ==================== Backend Response Types ====================
// BackendTeacherResponse defined in utils.ts
export type TeacherBackend = any;

export interface TeachersListResponse {
  teachers: TeacherBackend[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

// ==================== API Functions ====================

/**
 * GET /api/v1/teachers
 * List teachers for current school (paginated)
 */
export const getTeachers = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
} = {}): Promise<{teachers: StaffMember[], pagination: {page: number, limit: number, total: number, pages: number}}> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.status) searchParams.append('status', params.status);
  if (params.search) searchParams.append('search', params.search);

  const query = searchParams.toString();
  const url = `${API_URL}/api/v1/teachers${query ? `?${query}` : ''}`;
  
  const response = await fetch(url, getFetchOptions('GET'));
  const result = await handleResponse<ApiResponse<{teachers: any[], pagination: any}>>(response);
  
  return {
    teachers: result.data.teachers.map(backendToStaffMember),
    pagination: result.data.pagination
  };
};

/**
 * GET /api/v1/teachers/:id
 */
export const getTeacher = async (id: string): Promise<StaffMember> => {
  const url = `${API_URL}/api/v1/teachers/${id}`;
  const response = await fetch(url, getFetchOptions('GET'));
  const result = await handleResponse<ApiResponse<any>>(response);
  
  // Map backend response to StaffMember
  return backendToStaffMember(result.data);
};

/**
 * POST /api/v1/teachers/invite
 * Create pending teacher (send invite email)
 */
export const inviteTeacher = async (payload: {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  tsc_number?: string;
  qualifications?: string[];
  date_joined?: string;
  id_number?: string;
  designation?: string;
  branch?: string;
  job_status?: string;
  staff_type?: string;
  salary?: number;
  contract_start?: string;
  contract_end?: string;
  date_of_birth?: string;
  gender?: string;
  county?: string;
  location?: string;
  subjects_taught?: string[];
  photo?: string;
}): Promise<ApiResponse<{teacher_id: string; user_id: string}>> => {
  const url = `${API_URL}/api/v1/teachers/invite`;
  const response = await fetch(url, getFetchOptions('POST', payload));
  return handleResponse(response);
};

/**
 * PUT /api/v1/teachers/:id
 * Update teacher profile
 */
/**
 * PUT /api/v1/teachers/:id
 * Update teacher profile
 */
export const updateTeacher = async (
  id: string,
  payload: Partial<StaffMember>,
  schoolId?: string
): Promise<ApiResponse<StaffMember>> => {
  const effectiveSchoolId = schoolId || (typeof localStorage !== 'undefined' ? 
    JSON.parse(localStorage.getItem('cbe_user') || '{}')?.schoolId : null);
  
  let url = `${API_URL}/api/v1/teachers/${id}`;
  if (effectiveSchoolId) {
    url += `?school_id=${encodeURIComponent(effectiveSchoolId)}`;
  }
  
  console.log('[DEBUG] updateTeacher RAW frontend payload:', payload);
  
  // Convert StaffMember to backend format using your utility
  const backendPayload = staffMemberToBackend(payload);
  
  console.log('[DEBUG] updateTeacher FINAL backend payload:', backendPayload);
  
  const response = await fetch(url, getFetchOptions('PUT', backendPayload));
  const result = await handleResponse<ApiResponse<any>>(response);
  
  return {
    success: result.success,
    message: result.message,
    data: backendToStaffMember(result.data)
  };
};



/**
 * PATCH /api/v1/teachers/:id/activate
 * Toggle teacher active status
 */
export const toggleTeacherActive = async (id: string): Promise<ApiResponse<{is_active: boolean}>> => {
  const url = `${API_URL}/api/v1/teachers/${id}/activate`;
  const response = await fetch(url, getFetchOptions('PATCH'));
  return handleResponse(response);
};

/**
 * DELETE /api/v1/teachers/:id
 * Soft delete teacher
 */
export const deleteTeacher = async (id: string): Promise<ApiResponse<void>> => {
  const url = `${API_URL}/api/v1/teachers/${id}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete teacher');
  }
  return { success: true, message: 'Teacher deleted', data: undefined };
};

// ==================== Helper: Map backend to frontend ====================
// DEPRECATED: Use utils.ts mapping instead
export const mapBackendToStaffMember = (backend: TeacherBackend): StaffMember => {
  return backendToStaffMember(backend); // Delegate to utils.ts
};



