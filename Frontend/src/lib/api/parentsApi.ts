/**
 * Parents API Service
 * Handles all HTTP requests to parents, schools, learners for ParentManagement page
 * Follows same pattern as learnersApi.ts, schoolsApi.ts
 */

import type { Parent, School, Learner, ApiResponse } from '../../types';

// API URL helper - normalize VITE_API_URL to avoid duplicate '/api'
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

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

// ── Parents ────────────────────────────────────────────────────────────────

export const getParents = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean | string;
}): Promise<ApiResponse<Parent[]>> => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 20).toString(),
    ...(params.search && { search: params.search }),
    ...(params.is_active !== undefined && { is_active: params.is_active.toString() }),
  });

  const url = `${API_URL}/api/v1/parents?${searchParams}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<Parent[]>>(response);
};

export const getParent = async (id: string): Promise<ApiResponse<Parent>> => {
  const url = `${API_URL}/api/v1/parents/${id}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<Parent>>(response);
};

export const createParent = async (data: Partial<Parent>): Promise<ApiResponse<Parent>> => {
  const url = `${API_URL}/api/v1/parents`;
  const response = await fetch(url, getFetchOptions('POST', data));
  return handleResponse<ApiResponse<Parent>>(response);
};

export const updateParent = async (id: string, data: Partial<Parent>): Promise<ApiResponse<Parent>> => {
  const url = `${API_URL}/api/v1/parents/${id}`;
  const response = await fetch(url, getFetchOptions('PUT', data));
  return handleResponse<ApiResponse<Parent>>(response);
};

export const deleteParent = async (id: string): Promise<void> => {
  const url = `${API_URL}/api/v1/parents/${id}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  await handleResponse(response);
};

// ── Link/Unlink Learners ───────────────────────────────────────────────────

export const linkLearner = async (parentId: string, data: {
  learner_id: string;
  relationship?: string;
  is_primary?: boolean;
}): Promise<ApiResponse<any>> => {
  const url = `${API_URL}/api/v1/parents/${parentId}/link-learner`;
  const response = await fetch(url, getFetchOptions('POST', data));
  return handleResponse(response);
};

export const unlinkLearner = async (parentId: string, learnerId: string): Promise<void> => {
  const url = `${API_URL}/api/v1/parents/${parentId}/unlink/${learnerId}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  await handleResponse(response);
};

export const sendParentInvite = async (parentId: string, channel: 'email' | 'sms'): Promise<ApiResponse<any>> => {
  const url = `${API_URL}/api/v1/parents/${parentId}/send-invite`;
  const response = await fetch(url, getFetchOptions('POST', { channel }));
  return handleResponse(response);
};

// ── Self-service parent portal (logged-in parent viewing their own children) ─

export const getMyChildren = async (): Promise<ApiResponse<{
  parent: Parent;
  children: Array<Learner & {
    relationship: string | null;
    is_primary_guardian: boolean;
    latest_exam_summary: any;
  }>;
  total_children: number;
}>> => {
  const url = `${API_URL}/api/v1/parents/me/children`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse(response);
};

// ── Schools (for dropdown) ──────────────────────────────────────────────────

export const getSchools = async (): Promise<ApiResponse<School[]>> => {
  const url = `${API_URL}/api/v1/schools`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<School[]>>(response);
};

// ── Learners (for linking) ─────────────────────────────────────────────────

export const getLearners = async (): Promise<ApiResponse<Learner[]>> => {
  const url = `${API_URL}/api/v1/learners`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<Learner[]>>(response);
};
