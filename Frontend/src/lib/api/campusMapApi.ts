/**
 * Campus Map API Service
 * Handles HTTP requests for the campus location directory
 * (/api/v1/campus-locations).
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
      'An error occurred while communicating with the Campus Map API.';
    throw new Error(message);
  }
  return data;
};

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type CampusLocationCategory = 'classroom' | 'lab' | 'library' | 'office' | 'other';

export interface CampusLocation {
  id: string;
  name: string;
  category: CampusLocationCategory;
  building: string | null;
  floor: string | null;
  room_number: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampusLocationPayload {
  name: string;
  category: CampusLocationCategory;
  building?: string;
  floor?: string;
  room_number?: string;
  description?: string;
}

/** GET /api/v1/campus-locations — school-wide directory, everyone can view. */
export const getCampusLocations = async (
  params: { category?: CampusLocationCategory; building?: string; q?: string } = {}
): Promise<ApiResponse<{ locations: CampusLocation[] }>> => {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.building) query.set('building', params.building);
  if (params.q) query.set('q', params.q);
  const qs = query.toString();
  const response = await fetch(`${API_URL}/api/v1/campus-locations${qs ? `?${qs}` : ''}`, jsonOptions('GET'));
  return handleResponse(response);
};

/** POST /api/v1/campus-locations — teacher/school_admin only. */
export const createCampusLocation = async (
  payload: CampusLocationPayload
): Promise<ApiResponse<{ location: CampusLocation }>> => {
  const response = await fetch(`${API_URL}/api/v1/campus-locations`, jsonOptions('POST', payload));
  return handleResponse(response);
};

/** PUT /api/v1/campus-locations/:id — teacher/school_admin only. */
export const updateCampusLocation = async (
  id: string,
  payload: Partial<CampusLocationPayload>
): Promise<ApiResponse<{ location: CampusLocation }>> => {
  const response = await fetch(`${API_URL}/api/v1/campus-locations/${id}`, jsonOptions('PUT', payload));
  return handleResponse(response);
};

/** DELETE /api/v1/campus-locations/:id — teacher/school_admin only. */
export const deleteCampusLocation = async (id: string): Promise<ApiResponse<Record<string, never>>> => {
  const response = await fetch(`${API_URL}/api/v1/campus-locations/${id}`, jsonOptions('DELETE'));
  return handleResponse(response);
};
