/**
 * Parent Dashboard API Service
 * Handles HTTP requests for the 5 Parent Portal dashboard cards:
 * unread messages, latest announcements, teacher comments, today's
 * timetable, and school events.
 * Base: /api/v1/parent-dashboard
 */

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
    throw new Error(data.message || 'An error occurred while communicating with the parent dashboard API.');
  }

  return data;
};

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Messages ────────────────────────────────────────────────────────────

export interface DashboardMessage {
  id: string;
  subject: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
  sender: { id: string; first_name: string; last_name: string; role: string } | null;
  learner: { id: string; first_name: string; last_name: string } | null;
}

export interface MessagesResponse {
  unread_count: number;
  messages: DashboardMessage[];
}

/**
 * GET /api/v1/parent-dashboard/messages?limit=10
 */
export const getMessages = async (limit = 10): Promise<ApiResponse<MessagesResponse>> => {
  const url = `${API_URL}/api/v1/parent-dashboard/messages?limit=${limit}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<MessagesResponse>>(response);
};

/**
 * PUT /api/v1/parent-dashboard/messages/:id/read
 */
export const markMessageRead = async (id: string): Promise<ApiResponse<Record<string, never>>> => {
  const url = `${API_URL}/api/v1/parent-dashboard/messages/${id}/read`;
  const response = await fetch(url, getFetchOptions('PUT'));
  return handleResponse<ApiResponse<Record<string, never>>>(response);
};

// ── Announcements ───────────────────────────────────────────────────────

export interface DashboardAnnouncement {
  id: string;
  title: string;
  body: string;
  class_id: string | null;
  created_at: string;
  classes: { id: string; grade_level: string; stream_name: string | null } | null;
}

export interface AnnouncementsResponse {
  announcements: DashboardAnnouncement[];
}

/**
 * GET /api/v1/parent-dashboard/announcements?limit=10
 */
export const getAnnouncements = async (limit = 10): Promise<ApiResponse<AnnouncementsResponse>> => {
  const url = `${API_URL}/api/v1/parent-dashboard/announcements?limit=${limit}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<AnnouncementsResponse>>(response);
};

// ── Teacher comments ────────────────────────────────────────────────────

export interface TeacherComment {
  id: string;
  comment: string;
  created_at: string;
  teachers: { id: string; users: { first_name: string; last_name: string } | null } | null;
  learning_areas: { id: string; name: string } | null;
}

export interface TeacherCommentsResponse {
  comments: TeacherComment[];
}

/**
 * GET /api/v1/parent-dashboard/learner/:learnerId/comments?limit=10
 */
export const getLearnerTeacherComments = async (
  learnerId: string,
  limit = 10
): Promise<ApiResponse<TeacherCommentsResponse>> => {
  const url = `${API_URL}/api/v1/parent-dashboard/learner/${learnerId}/comments?limit=${limit}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<TeacherCommentsResponse>>(response);
};

// ── Timetable ───────────────────────────────────────────────────────────

export interface TimetablePeriod {
  id: string;
  day_of_week: number; // 1 = Monday ... 7 = Sunday
  start_time: string;
  end_time: string;
  room: string | null;
  learning_areas: { id: string; name: string } | null;
  teachers: { id: string; users: { first_name: string; last_name: string } | null } | null;
}

export interface TimetableResponse {
  class_id: string | null;
  periods: TimetablePeriod[];
}

/**
 * GET /api/v1/parent-dashboard/learner/:learnerId/timetable
 */
export const getLearnerTimetable = async (learnerId: string): Promise<ApiResponse<TimetableResponse>> => {
  const url = `${API_URL}/api/v1/parent-dashboard/learner/${learnerId}/timetable`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<TimetableResponse>>(response);
};

// ── School events ───────────────────────────────────────────────────────

export interface SchoolEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  location: string | null;
  audience: string;
}

export interface SchoolEventsResponse {
  events: SchoolEvent[];
}

/**
 * GET /api/v1/parent-dashboard/events?limit=10
 */
export const getSchoolEvents = async (limit = 10): Promise<ApiResponse<SchoolEventsResponse>> => {
  const url = `${API_URL}/api/v1/parent-dashboard/events?limit=${limit}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<SchoolEventsResponse>>(response);
};
