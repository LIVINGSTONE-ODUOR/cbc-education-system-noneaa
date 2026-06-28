/**
 * Learners API Service - Full CRUD
 * Base: /api/v1/learners
 * Auth: Bearer token from localStorage
 */

const getApiUrl = (): string => {
  if (import.meta.env.PROD) return '';
  const raw = import.meta.env.VITE_API_URL || '';
  return raw.replace(/\/api\/?$/, '').replace(/\/+$/, '');
};

export const API_URL = getApiUrl();
console.log('[learnersApi] API_URL:', API_URL);

const getAuthToken = (): string | null => localStorage.getItem('cbe_access_token');

const getFetchOptions = (method: string, body?: unknown): RequestInit => {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { method, headers, body: body ? JSON.stringify(body) : undefined };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};

// Backend response type (matches controller)
interface LearnerBackend {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth?: string;
  gender: string;
  special_needs?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  current_class?: {
    id: string;
    grade_level: string;
    stream_name?: string;
  } | null;
  parent?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone_number?: string;
    relationship?: string;
  } | null;
  email?: string;
  photo_url?: string;
  birth_certificate_number?: string;
  nemis_number?: string;
  admission_date?: string;
  nationality?: string;
  parent_id?: string;
}

interface LearnersListResponse {
  success: boolean;
  data: LearnerBackend[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface LearnerDetailResponse {
  success: boolean;
  data: LearnerBackend & {
    parent?: any;
    enrollments?: any[];
    current_enrollment?: any;
  };
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: LearnerBackend | LearnerBackend[];
}

// Map backend to frontend Learner type
const mapBackendToLearner = (backend: LearnerBackend): any => ({
  id: backend.id,
  admission_number: backend.admission_number,
  first_name: backend.first_name,
  last_name: backend.last_name,
  middle_name: backend.middle_name || null,
  date_of_birth: backend.date_of_birth || null,
  grade_level: backend.current_class?.grade_level || '',
  stream_name: backend.current_class?.stream_name || null,
  gender: backend.gender,
  special_needs: backend.special_needs || null,
  is_active: backend.is_active,
  created_at: backend.created_at,
  parents: backend.parent || null,
  email: backend.email || null,
  photo_url: backend.photo_url || null,
  birth_certificate_number: backend.birth_certificate_number || null,
  nemis_number: backend.nemis_number || null,
  admission_date: backend.admission_date || null,
  nationality: backend.nationality || 'Kenyan',
});

/**
 * GET /api/v1/learners - List learners
 */
export const getLearners = async (params: {
  search?: string;
  grade_level?: string;
  gender?: string;
  is_active?: string;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
} = {}): Promise<{
  students: any[];
  totalStudents: number;
  totalPages: number;
}> => {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.append('search', params.search);
  if (params.gender) searchParams.append('gender', params.gender);
  if (params.is_active !== undefined) searchParams.append('is_active', params.is_active);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.pageSize) searchParams.append('limit', params.pageSize.toString());

  const query = searchParams.toString();
  const url = `${API_URL}/api/v1/learners${query ? `?${query}` : ''}`;

  const response = await fetch(url, {
    ...getFetchOptions('GET'),
    signal: params.signal,
  });

  // If token expired/invalid, try refreshing then retry once.
  if (response.status === 401) {
    try {
      const refreshToken = localStorage.getItem('cbe_refresh_token');
      if (refreshToken) {
        // Prefer modern refresh route in backend.
        const refreshResp = await fetch(`${API_URL}/api/v1/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResp.ok) {
          const refreshData = await refreshResp.json();
          const newAccessToken = refreshData?.data?.tokens?.accessToken ?? refreshData?.data?.accessToken;
          const newRefreshToken = refreshData?.data?.tokens?.refreshToken ?? refreshData?.data?.refreshToken;

          if (newAccessToken) {
            localStorage.setItem('cbe_access_token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('cbe_refresh_token', newRefreshToken);

            // retry original request once with updated token
            const retryResponse = await fetch(url, {
              ...getFetchOptions('GET'),
              signal: params.signal,
            });
            const retryResult = await handleResponse<LearnersListResponse>(retryResponse);
            const students = Array.isArray(retryResult.data)
              ? retryResult.data.map(mapBackendToLearner)
              : [];
            const totalStudents = retryResult.pagination?.total ?? students.length;
            const totalPages = retryResult.pagination?.pages ?? Math.ceil(totalStudents / (params.pageSize || 10));
            return { students, totalStudents, totalPages };
          }
        }
      }
    } catch {
      // fall through to original error handling
    }
  }

  const result = await handleResponse<LearnersListResponse>(response);

  const students = Array.isArray(result.data)
    ? result.data.map(mapBackendToLearner)
    : [];
  const totalStudents = result.pagination?.total ?? students.length;
  const totalPages =
    result.pagination?.pages ?? Math.ceil(totalStudents / (params.pageSize || 10));

  return {
    students,
    totalStudents,
    totalPages,
  };

};

/**
 * GET /api/v1/learners/:id - Get single learner details
 */
export const getLearnerById = async (id: string): Promise<LearnerBackend> => {
  const url = `${API_URL}/api/v1/learners/${id}`;
  const response = await fetch(url, getFetchOptions('GET'));
  const result = await handleResponse<LearnerDetailResponse>(response);
  return mapBackendToLearner(result.data as LearnerBackend);
};

/**
 * POST /api/v1/learners - Create new learner (WITH parent info)
 */
export interface CreateLearnerPayload {
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: string;
  birth_certificate_number?: string;
  nemis_number?: string;
  special_needs?: string;
  medical_conditions?: string;
  allergies?: string;
  profile_photo?: string;
  parent_info?: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    national_id?: string;
    occupation?: string;
    relationship: string;
  };
}

export const createLearner = async (data: CreateLearnerPayload): Promise<LearnerBackend> => {
  const url = `${API_URL}/api/v1/learners`;
  const response = await fetch(url, getFetchOptions('POST', data));
  const result = await handleResponse<ApiResponse>(response);
  return mapBackendToLearner(result.data as LearnerBackend);
};

/**
 * POST /api/v1/learners/:id/enroll - Enroll learner in class
 * Backend Issue: This endpoint is returning 500 errors
 * Workaround: May need to contact backend team or enroll via classes API
 */
export const enrollLearner = async (learnerId: string, classId: string): Promise<any> => {
  const url = `${API_URL}/api/v1/learners/${learnerId}/enroll`;
  const payload = { class_id: classId };
  try {
    const response = await fetch(url, getFetchOptions('POST', payload));
    const result = await handleResponse(response);
    return result;
  } catch (error) {
    console.error('[enrollLearner] Error:', error);
    // Return a friendly error for UI
    throw new Error('Enrollment endpoint is currently unavailable. Please try again later or enroll manually.');
  }
};

/**
 * PUT /api/v1/learners/:id - Update learner
 */
export interface UpdateLearnerData {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  date_of_birth?: string;
  gender?: string;
  email?: string;
  special_needs?: string;
  birth_certificate_number?: string;
  nemis_number?: string;
  is_active?: boolean;
}

export const updateLearner = async (id: string, data: UpdateLearnerData): Promise<LearnerBackend> => {
  const url = `${API_URL}/api/v1/learners/${id}`;
  const response = await fetch(url, getFetchOptions('PUT', data));
  const result = await handleResponse<ApiResponse>(response);
  return mapBackendToLearner(result.data as LearnerBackend);
};

/**
 * DELETE /api/v1/learners/:id - Soft delete learner
 */
export const deleteLearner = async (id: string): Promise<void> => {
  const url = `${API_URL}/api/v1/learners/${id}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  await handleResponse(response);
};

export default { 
  getLearners, 
  getLearnerById, 
  createLearner, 
  updateLearner, 
  deleteLearner,
  enrollLearner,
};