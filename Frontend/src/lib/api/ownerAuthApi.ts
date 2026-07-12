/**
 * Website Owner Auth API
 * DB-backed login for the Blog Manager and Support Inbox (marketing site).
 * Base: /api/v1/website-owner
 */

const getApiUrl = (): string => {
  const raw = import.meta.env.VITE_API_URL || '';
  if (!raw) return '';
  return raw.replace(/\/api(?:\/v1)?\/?$/, '').replace(/\/+$/, '');
};

const API_URL = getApiUrl();
const BASE = `${API_URL}/api/v1/website-owner`;

export const OWNER_TOKEN_KEY = 'noneaa_owner_token';

export interface WebsiteOwner {
  id: string;
  name: string;
  email: string;
}

const handle = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Request failed');
  }
  return data.data as T;
};

export async function ownerLoginRequest(email: string, password: string): Promise<{ token: string; owner: WebsiteOwner }> {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handle(res);
}

export function getOwnerToken(): string | null {
  return sessionStorage.getItem(OWNER_TOKEN_KEY);
}
