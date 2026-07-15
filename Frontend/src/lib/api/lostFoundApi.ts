/**
 * Lost & Found API Service
 * Handles HTTP requests for the campus Lost & Found board
 * (/api/v1/lost-found).
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
      'An error occurred while communicating with the Lost & Found API.';
    throw new Error(message);
  }
  return data;
};

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface LostFoundReporter {
  id: string;
  first_name: string;
  last_name: string;
}

export interface LostFoundItem {
  id: string;
  item_type: 'lost' | 'found';
  title: string;
  description: string | null;
  location: string | null;
  contact_info: string | null;
  status: 'open' | 'resolved';
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  reported_by: string;
  reporter: LostFoundReporter | null;
}

export interface CreateLostFoundPayload {
  item_type: 'lost' | 'found';
  title: string;
  description?: string;
  location?: string;
  contact_info?: string;
}

/** GET /api/v1/lost-found — school-wide list, defaults to open posts. */
export const getLostFoundItems = async (
  params: { status?: 'open' | 'resolved' | 'all'; type?: 'lost' | 'found' } = {}
): Promise<ApiResponse<{ items: LostFoundItem[] }>> => {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.type) query.set('type', params.type);
  const qs = query.toString();
  const response = await fetch(`${API_URL}/api/v1/lost-found${qs ? `?${qs}` : ''}`, jsonOptions('GET'));
  return handleResponse(response);
};

/** POST /api/v1/lost-found */
export const createLostFoundItem = async (
  payload: CreateLostFoundPayload
): Promise<ApiResponse<{ item: LostFoundItem }>> => {
  const response = await fetch(`${API_URL}/api/v1/lost-found`, jsonOptions('POST', payload));
  return handleResponse(response);
};

/** POST /api/v1/lost-found/:id/resolve — reporter only. */
export const resolveLostFoundItem = async (id: string): Promise<ApiResponse<Record<string, never>>> => {
  const response = await fetch(`${API_URL}/api/v1/lost-found/${id}/resolve`, jsonOptions('POST'));
  return handleResponse(response);
};

/** DELETE /api/v1/lost-found/:id — reporter only. */
export const deleteLostFoundItem = async (id: string): Promise<ApiResponse<Record<string, never>>> => {
  const response = await fetch(`${API_URL}/api/v1/lost-found/${id}`, jsonOptions('DELETE'));
  return handleResponse(response);
};
