/**
 * Study Groups API Service
 * Handles HTTP requests for the peer collaboration group endpoints
 * (/api/v1/study-groups).
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

const authHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const jsonOptions = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json', ...authHeaders() },
  body: body ? JSON.stringify(body) : undefined,
});

const handleResponse = async <T>(response: Response): Promise<T> => {
  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      response.ok
        ? 'Unexpected response from the server.'
        : `Request failed (${response.status}). The connection may have timed out.`
    );
  }
  if (!response.ok || !data.success) {
    const message =
      data.message ||
      (Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
      'An error occurred while communicating with the study groups API.';
    throw new Error(message);
  }
  return data;
};

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface StudyGroupSubject {
  id: string;
  name: string;
  code: string;
}

export interface StudyGroupCreator {
  id: string;
  first_name: string;
  last_name: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  class_id: string;
  learning_area_id: string | null;
  created_by: string;
  max_members: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  learning_areas: StudyGroupSubject | null;
  creator: StudyGroupCreator | null;
  member_count: number;
  is_member: boolean;
  my_role: 'owner' | 'member' | null;
}

export interface StudyGroupMember {
  id: string;
  role: 'owner' | 'member';
  joined_at: string;
  learners: { id: string; first_name: string; last_name: string; admission_number: string } | null;
}

export interface StudyGroupMessage {
  id: string;
  message: string;
  created_at: string;
  learners: { id: string; first_name: string; last_name: string } | null;
}

export interface CreateStudyGroupPayload {
  name: string;
  description?: string;
  learning_area_id?: string;
  max_members?: number;
}

/**
 * GET /api/v1/study-groups
 * Students default to their own class; pass class_id explicitly for
 * teacher/admin views.
 */
export const getStudyGroups = async (classId?: string): Promise<ApiResponse<{ groups: StudyGroup[] }>> => {
  const query = classId ? `?class_id=${encodeURIComponent(classId)}` : '';
  const response = await fetch(`${API_URL}/api/v1/study-groups${query}`, jsonOptions('GET'));
  return handleResponse(response);
};

/** POST /api/v1/study-groups — creates a group for the caller's own class. */
export const createStudyGroup = async (
  payload: CreateStudyGroupPayload
): Promise<ApiResponse<{ group: StudyGroup }>> => {
  const response = await fetch(`${API_URL}/api/v1/study-groups`, jsonOptions('POST', payload));
  return handleResponse(response);
};

/** GET /api/v1/study-groups/:id — group detail plus its member list. */
export const getStudyGroup = async (
  id: string
): Promise<ApiResponse<{ group: StudyGroup; members: StudyGroupMember[] }>> => {
  const response = await fetch(`${API_URL}/api/v1/study-groups/${id}`, jsonOptions('GET'));
  return handleResponse(response);
};

/** POST /api/v1/study-groups/:id/join */
export const joinStudyGroup = async (id: string): Promise<ApiResponse<Record<string, never>>> => {
  const response = await fetch(`${API_URL}/api/v1/study-groups/${id}/join`, jsonOptions('POST'));
  return handleResponse(response);
};

/** POST /api/v1/study-groups/:id/leave */
export const leaveStudyGroup = async (id: string): Promise<ApiResponse<Record<string, never>>> => {
  const response = await fetch(`${API_URL}/api/v1/study-groups/${id}/leave`, jsonOptions('POST'));
  return handleResponse(response);
};

/** DELETE /api/v1/study-groups/:id — owner only. */
export const deleteStudyGroup = async (id: string): Promise<ApiResponse<Record<string, never>>> => {
  const response = await fetch(`${API_URL}/api/v1/study-groups/${id}`, jsonOptions('DELETE'));
  return handleResponse(response);
};

/** GET /api/v1/study-groups/:id/messages — members only. */
export const getGroupMessages = async (id: string): Promise<ApiResponse<{ messages: StudyGroupMessage[] }>> => {
  const response = await fetch(`${API_URL}/api/v1/study-groups/${id}/messages`, jsonOptions('GET'));
  return handleResponse(response);
};

/** POST /api/v1/study-groups/:id/messages — members only. */
export const postGroupMessage = async (
  id: string,
  message: string
): Promise<ApiResponse<{ message: StudyGroupMessage }>> => {
  const response = await fetch(`${API_URL}/api/v1/study-groups/${id}/messages`, jsonOptions('POST', { message }));
  return handleResponse(response);
};
