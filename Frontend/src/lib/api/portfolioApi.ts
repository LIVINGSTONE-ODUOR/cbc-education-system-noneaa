/**
 * Portfolio API Service
 * Handles HTTP requests for the student's own portfolio of projects,
 * certificates, and achievements (/api/v1/portfolio).
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
      'An error occurred while communicating with the portfolio API.';
    throw new Error(message);
  }
  return data;
};

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type PortfolioCategory = 'project' | 'certificate' | 'achievement';

export interface PortfolioItem {
  id: string;
  category: PortfolioCategory;
  title: string;
  description: string | null;
  organization: string | null;
  academic_year: string | null;
  date_achieved: string | null;
  external_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItemPayload {
  category: PortfolioCategory;
  title: string;
  description?: string;
  organization?: string;
  academic_year?: string;
  date_achieved?: string;
  external_link?: string;
}

/** GET /api/v1/portfolio — the caller's own portfolio, newest first. */
export const getPortfolioItems = async (
  params: { category?: PortfolioCategory; academic_year?: string } = {}
): Promise<ApiResponse<{ items: PortfolioItem[] }>> => {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.academic_year) query.set('academic_year', params.academic_year);
  const qs = query.toString();
  const response = await fetch(`${API_URL}/api/v1/portfolio${qs ? `?${qs}` : ''}`, jsonOptions('GET'));
  return handleResponse(response);
};

/** POST /api/v1/portfolio */
export const createPortfolioItem = async (
  payload: PortfolioItemPayload
): Promise<ApiResponse<{ item: PortfolioItem }>> => {
  const response = await fetch(`${API_URL}/api/v1/portfolio`, jsonOptions('POST', payload));
  return handleResponse(response);
};

/** PUT /api/v1/portfolio/:id — owner only. */
export const updatePortfolioItem = async (
  id: string,
  payload: Partial<PortfolioItemPayload>
): Promise<ApiResponse<{ item: PortfolioItem }>> => {
  const response = await fetch(`${API_URL}/api/v1/portfolio/${id}`, jsonOptions('PUT', payload));
  return handleResponse(response);
};

/** DELETE /api/v1/portfolio/:id — owner only. */
export const deletePortfolioItem = async (id: string): Promise<ApiResponse<Record<string, never>>> => {
  const response = await fetch(`${API_URL}/api/v1/portfolio/${id}`, jsonOptions('DELETE'));
  return handleResponse(response);
};
