/**
 * Timetable API Service
 * Handles HTTP requests for the School Timetable backend endpoints
 * (/api/v1/timetable). Mirrors the fetch/auth pattern used by classApi.ts.
 */

import { refreshToken as refreshAccessToken } from '@/lib/auth';

const getApiUrl = (): string => {
  const raw = import.meta.env.VITE_API_URL || '';
  if (!raw) return '';
  return raw.replace(/\/api(?:\/v1)?\/?$/, '').replace(/\/+$/, '');
};

const API_URL = getApiUrl();

const getAuthToken = (): string | null => localStorage.getItem('cbe_access_token');

const getFetchOptions = (method: string, body?: unknown): RequestInit => {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { method, headers, body: body ? JSON.stringify(body) : undefined };
};

const fetchWithAuth = async (url: string, options: RequestInit): Promise<Response> => {
  let response = await fetch(url, options);
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryHeaders = {
        ...(options.headers as Record<string, string>),
        Authorization: `Bearer ${getAuthToken()}`,
      };
      response = await fetch(url, { ...options, headers: retryHeaders });
    }
  }
  return response;
};

export class TimetableConflictError extends Error {
  conflicts?: unknown;
  constructor(message: string, conflicts?: unknown) {
    super(message);
    this.name = 'TimetableConflictError';
    this.conflicts = conflicts;
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok || !data.success) {
    if (response.status === 409) {
      throw new TimetableConflictError(data.message || 'That slot is already booked.', data.data?.conflicts);
    }
    if (response.status === 403) {
      throw new Error(
        data.message || "Your account doesn't have permission for this action. Try logging out and back in."
      );
    }
    throw new Error(data.message || 'An error occurred while communicating with the timetable API.');
  }
  return data;
};

// ── Types ────────────────────────────────────────────────────────────────

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export const WEEK_DAYS: { value: WeekDay; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
];

export interface TimetableSlot {
  id: string;
  day: WeekDay;
  period_number: number | null;
  start_time: string; // 'HH:MM'
  end_time: string;   // 'HH:MM'
  room: string | null;
  class_id: string;
  teacher_id: string;
  learning_area_id: string;
  is_active?: boolean;
  teacher?: { id: string; user_id: string; users?: { first_name: string; last_name: string } };
  learning_area?: { id: string; name: string; code: string };
}

export type TimetableGrid = Record<WeekDay, TimetableSlot[]>;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface GetTimetableResponse {
  class: { id: string; grade_level: string; stream_name: string | null };
  academic_year_id: string;
  timetable: TimetableGrid;
  total_slots: number;
}

// GET /api/v1/timetable?class_id=&academic_year_id=&term_id=
export const getTimetable = async (params: {
  class_id: string;
  academic_year_id?: string;
  term_id?: string;
}): Promise<ApiResponse<GetTimetableResponse>> => {
  const searchParams = new URLSearchParams();
  searchParams.append('class_id', params.class_id);
  if (params.academic_year_id) searchParams.append('academic_year_id', params.academic_year_id);
  if (params.term_id) searchParams.append('term_id', params.term_id);

  const url = `${API_URL}/api/v1/timetable?${searchParams.toString()}`;
  const response = await fetchWithAuth(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<GetTimetableResponse>>(response);
};

// POST /api/v1/timetable
// day can be a single WeekDay or an array of WeekDay to book the same
// lesson across multiple days in one call.
export const createTimetableSlot = async (payload: {
  class_id: string;
  learning_area_id: string;
  teacher_id: string;
  day: WeekDay | WeekDay[];
  start_time: string;
  end_time: string;
  academic_year_id?: string;
  term_id?: string;
  room?: string;
  period_number?: number;
}): Promise<ApiResponse<{ slots: TimetableSlot[] }>> => {
  const url = `${API_URL}/api/v1/timetable`;
  const response = await fetchWithAuth(url, getFetchOptions('POST', payload));
  return handleResponse<ApiResponse<{ slots: TimetableSlot[] }>>(response);
};

// PUT /api/v1/timetable/:id
export const updateTimetableSlot = async (
  id: string,
  payload: Partial<{
    day: WeekDay;
    start_time: string;
    end_time: string;
    teacher_id: string;
    learning_area_id: string;
    room: string;
    period_number: number;
    is_active: boolean;
  }>
): Promise<ApiResponse<{ slot: TimetableSlot }>> => {
  const url = `${API_URL}/api/v1/timetable/${id}`;
  const response = await fetchWithAuth(url, getFetchOptions('PUT', payload));
  return handleResponse<ApiResponse<{ slot: TimetableSlot }>>(response);
};

// DELETE /api/v1/timetable/:id
export const deleteTimetableSlot = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const url = `${API_URL}/api/v1/timetable/${id}`;
  const response = await fetchWithAuth(url, getFetchOptions('DELETE'));
  return handleResponse<ApiResponse<{ message: string }>>(response);
};

// ── Timetable Setup: number of lessons taught per day ───────────────────────
// e.g. Monday = 8 lessons, Friday = 6 lessons. Configured by the school
// admin and enforced server-side when scheduling new lessons.

export interface DaySetting {
  day: WeekDay;
  lessons_count: number;
}

export interface DaySettingsResponse {
  academic_year_id: string;
  settings: DaySetting[];
}

// GET /api/v1/timetable/settings?academic_year_id=
export const getDaySettings = async (params?: {
  academic_year_id?: string;
}): Promise<ApiResponse<DaySettingsResponse>> => {
  const searchParams = new URLSearchParams();
  if (params?.academic_year_id) searchParams.append('academic_year_id', params.academic_year_id);
  const qs = searchParams.toString();
  const url = `${API_URL}/api/v1/timetable/settings${qs ? `?${qs}` : ''}`;
  const response = await fetchWithAuth(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<DaySettingsResponse>>(response);
};

// PUT /api/v1/timetable/settings
export const updateDaySettings = async (payload: {
  academic_year_id?: string;
  days: DaySetting[];
}): Promise<ApiResponse<DaySettingsResponse>> => {
  const url = `${API_URL}/api/v1/timetable/settings`;
  const response = await fetchWithAuth(url, getFetchOptions('PUT', payload));
  return handleResponse<ApiResponse<DaySettingsResponse>>(response);
};

// ── Printing ─────────────────────────────────────────────────────────────

export interface PrintHeader {
  school_name: string | null;
  school_address: string | null;
  academic_year_name: string | null;
  term_name: string | null;
}

// GET /api/v1/timetable/print-header — school name/term/year for a print
// header. Shared by the Teacher, Parent, and Student portal print buttons.
export const getPrintHeader = async (params?: {
  academic_year_id?: string;
  term_id?: string;
}): Promise<ApiResponse<PrintHeader>> => {
  const searchParams = new URLSearchParams();
  if (params?.academic_year_id) searchParams.append('academic_year_id', params.academic_year_id);
  if (params?.term_id) searchParams.append('term_id', params.term_id);
  const qs = searchParams.toString();
  const url = `${API_URL}/api/v1/timetable/print-header${qs ? `?${qs}` : ''}`;
  const response = await fetchWithAuth(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<PrintHeader>>(response);
};

export interface SchoolTimetableClass {
  id: string;
  grade_level: string;
  stream_name: string | null;
  timetable: TimetableGrid;
}

export interface SchoolTimetableResponse extends PrintHeader {
  school: { name: string; address: string | null } | null;
  academic_year: { id: string; name: string | null };
  term: { id: string; name: string } | null;
  classes: SchoolTimetableClass[];
}

// GET /api/v1/timetable/school-wide — every class's weekly grid in one
// response, for the school admin's "Print Timetable" button.
export const getSchoolTimetable = async (params?: {
  academic_year_id?: string;
  term_id?: string;
}): Promise<ApiResponse<SchoolTimetableResponse>> => {
  const searchParams = new URLSearchParams();
  if (params?.academic_year_id) searchParams.append('academic_year_id', params.academic_year_id);
  if (params?.term_id) searchParams.append('term_id', params.term_id);
  const qs = searchParams.toString();
  const url = `${API_URL}/api/v1/timetable/school-wide${qs ? `?${qs}` : ''}`;
  const response = await fetchWithAuth(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<SchoolTimetableResponse>>(response);
};

// ── Teacher Load Report ─────────────────────────────────────────────────
// Per-teacher, per-day lesson counts against that day's configured lesson
// cap (Timetable Setup) — flags free/unassigned days and overloaded days.

export type TeacherDayStatus = 'free' | 'light' | 'balanced' | 'overloaded';

export interface TeacherLoadLesson {
  id: string;
  start_time: string;
  end_time: string;
  class: string | null;
  learning_area: string | null;
}

export interface TeacherLoadDay {
  day: WeekDay;
  lessons_count: number;
  limit: number;
  free_periods: number;
  status: TeacherDayStatus;
  lessons: TeacherLoadLesson[];
}

export interface TeacherLoad {
  teacher_id: string;
  name: string;
  weekly_total: number;
  days_unassigned: number;
  days_overloaded: number;
  days: TeacherLoadDay[];
}

export interface TeacherLoadResponse {
  academic_year_id: string;
  teachers: TeacherLoad[];
}

// GET /api/v1/timetable/teacher-load?academic_year_id=&term_id=
export const getTeacherLoadReport = async (params?: {
  academic_year_id?: string;
  term_id?: string;
}): Promise<ApiResponse<TeacherLoadResponse>> => {
  const searchParams = new URLSearchParams();
  if (params?.academic_year_id) searchParams.append('academic_year_id', params.academic_year_id);
  if (params?.term_id) searchParams.append('term_id', params.term_id);
  const qs = searchParams.toString();
  const url = `${API_URL}/api/v1/timetable/teacher-load${qs ? `?${qs}` : ''}`;
  const response = await fetchWithAuth(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<TeacherLoadResponse>>(response);
};
