/**
 * Teacher/Staff API Service
 * Handles all HTTP requests to the teachers backend API (/api/v1/teachers)
 */

import type { StaffMember, StaffType } from '../../pages/teacher/StaffManagement/types';

// API URL - same pattern as curriculumApi
const getApiUrl = (): string => {
  if (import.meta.env.PROD) return '';
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
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
export interface TeacherBackend {
  id: string;
  tsc_number: string | null;
  qualifications: string | null; // JSON-encoded array
  date_joined: string | null;
  is_active: boolean;
  extra_info: string | null; // JSON: {designation, branch, salary, etc.}
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    id_number?: string | null;
    status: string;
    last_login?: string;
    extra_info?: string | null;
  };
}

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

// ==================== Utilities ====================
const camelToSnake = (obj: Record<string, any>): Record<string, any> => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      return [snakeKey, value];
    })
  );
};

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
} = {}): Promise<ApiResponse<TeachersListResponse>> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.status) searchParams.append('status', params.status);
  if (params.search) searchParams.append('search', params.search);

  const query = searchParams.toString();
  const url = `${API_URL}/api/v1/teachers${query ? `?${query}` : ''}`;
  
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<TeachersListResponse>>(response);
};

/**
 * GET /api/v1/teachers/:id
 */
export const getTeacher = async (id: string): Promise<ApiResponse<TeacherBackend>> => {
  const url = `${API_URL}/api/v1/teachers/${id}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse(response);
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
}): Promise<ApiResponse<{teacher_id: string; user_id: string}>> => {
  const url = `${API_URL}/api/v1/teachers/invite`;
  const response = await fetch(url, getFetchOptions('POST', payload));
  return handleResponse(response);
};

/**
 * PUT /api/v1/teachers/:id
 * Update teacher profile
 */
export const updateTeacher = async (
  id: string,
  payload: Partial<StaffMember>,  // Full StaffMember support
  schoolId?: string
): Promise<ApiResponse<TeacherBackend>> => {
  // Auto-detect schoolId from AuthContext/localStorage
  const effectiveSchoolId = schoolId || (typeof localStorage !== 'undefined' ? 
    JSON.parse(localStorage.getItem('cbe_user') || '{}')?.schoolId : null);
  
  let url = `${API_URL}/api/v1/teachers/${id}`;
  if (effectiveSchoolId) {
    url += `?school_id=${encodeURIComponent(effectiveSchoolId)}`;
  }
  
  console.log('[DEBUG] updateTeacher RAW frontend payload:', payload);
  // Convert camelCase → snake_case (handles all StaffMember fields)
  const snakePayload = camelToSnake(payload as Record<string, any>);
  // Clean payload: ensure tsc_number is null if empty/undefined
  const cleanPayload = {
    ...snakePayload,
    tsc_number: snakePayload.tsc_number || null,
    qualifications: snakePayload.qualifications || []
  };
  console.log('[DEBUG] updateTeacher CLEAN payload:', { id, schoolId: effectiveSchoolId, original: payload, converted: cleanPayload });
  
  const response = await fetch(url, getFetchOptions('PUT', cleanPayload));
  return handleResponse<ApiResponse<TeacherBackend>>(response);
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
export const mapBackendToStaffMember = (backend: TeacherBackend): StaffMember => {
  const extra = backend.extra_info ? JSON.parse(backend.extra_info) : {};
  return {
  id: backend.id,
  firstName: backend.user.first_name,
  lastName: backend.user.last_name,
  idNumber: backend.user.id_number || extra.id_number || '',
  designation: extra.designation || 'Teacher',
  dateOfBirth: '',
  contractStart: '',
  contractEnd: '',
  jobStatus: backend.user.status || (backend.is_active ? 'Active' : 'Inactive'),
  sex: extra.gender || 'Male',
  branch: extra.branch || '',
  county: extra.county || '',
  location: extra.location || '',
  email: backend.user.email,
  mobilePhone: backend.user.phone_number || '',
  tscNumber: backend.tsc_number || '',
  teachingSubjects: extra.subjects_taught || [],
  qualifications: (() => {
    try {
      let val = backend.qualifications || '';
      // Unescape multiple layers
      for (let i = 0; i < 5 && typeof val === 'string'; i++) {
        val = JSON.parse(val);
      }
      if (Array.isArray(val)) {
        return val.flat(Infinity).map((q: any) => String(q).replace(/^["']|["']$/g, '').trim()).filter(Boolean);
      }
    } catch {}
    return [];
  })(),
  salary: parseFloat(extra.salary || '0'),
  hireDate: backend.date_joined || backend.created_at,
  staffType: 'teaching',
  photo: '',
};
};


