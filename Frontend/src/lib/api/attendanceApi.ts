/**
 * Attendance API Service
 * Handles HTTP requests for the Daily Attendance backend endpoints.
 * Base: /api/v1/attendance
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
    throw new Error(data.message || 'An error occurred while communicating with the attendance API.');
  }

  return data;
};

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceApiClass {
  id: string;
  grade_level: string;
  stream_name: string | null;
  school_id?: string;
}

export interface AttendanceApiLearner {
  enrollment_id: string;
  learner_id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  gender: string | null;
  photo_url: string | null;
  attendance_id: string | null;
  status: AttendanceStatus | null;
  arrival_time: string | null;
  remarks: string;
}

export interface AttendanceApiSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  marked: number;
  attendance_rate: number;
}

export interface AttendanceRosterResponse {
  class: AttendanceApiClass;
  date: string;
  already_marked: boolean;
  summary: AttendanceApiSummary;
  learners: AttendanceApiLearner[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * GET /api/v1/attendance/class/:classId/roster?date=YYYY-MM-DD
 * Fetches the live enrolled roster for a class merged with any attendance
 * already recorded for that date.
 */
export const getClassAttendanceRoster = async (
  classId: string,
  date: string
): Promise<ApiResponse<AttendanceRosterResponse>> => {
  const url = `${API_URL}/api/v1/attendance/class/${classId}/roster?date=${encodeURIComponent(date)}`;
  const response = await fetch(url, getFetchOptions('GET'));

  if (!response.ok) {
    const txt = await response.clone().text().catch(() => '');
    console.error('[attendanceApi:getClassAttendanceRoster] request failed', { url, status: response.status, body: txt });
  }

  return handleResponse<ApiResponse<AttendanceRosterResponse>>(response);
};

export interface SaveAttendanceRecordPayload {
  learner_id: string;
  status: AttendanceStatus;
  arrival_time?: string | null;
  remarks?: string | null;
}

/**
 * POST /api/v1/attendance/class/:classId
 * Upserts attendance — safe to call again for the same class/date, it
 * updates existing records instead of creating duplicates.
 */
export const saveClassAttendance = async (
  classId: string,
  attendance_date: string,
  records: SaveAttendanceRecordPayload[]
): Promise<ApiResponse<{ saved_count: number }>> => {
  const url = `${API_URL}/api/v1/attendance/class/${classId}`;
  const response = await fetch(url, getFetchOptions('POST', { attendance_date, records }));

  if (!response.ok) {
    const txt = await response.clone().text().catch(() => '');
    console.error('[attendanceApi:saveClassAttendance] request failed', { url, status: response.status, body: txt });
  }

  return handleResponse<ApiResponse<{ saved_count: number }>>(response);
};

// ── Learner attendance summary (Parent Portal, teacher/admin single-learner view) ──

export interface AttendanceApiTerm {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
}

export interface AttendanceApiRecord {
  attendance_date: string;
  status: AttendanceStatus;
  arrival_time: string | null;
  remarks: string | null;
}

export interface AttendanceApiLearnerSummary {
  total_days: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_rate: number;
}

export interface LearnerAttendanceSummaryResponse {
  learner: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
  };
  term: AttendanceApiTerm | null;
  summary: AttendanceApiLearnerSummary;
  recent_records: AttendanceApiRecord[];
  /** Full term history — powers the calendar, late-arrivals, and absence-reasons views. */
  all_records: AttendanceApiRecord[];
}

/**
 * GET /api/v1/attendance/learner/:learnerId/summary?term_id=...
 * Attendance stats + recent history for one learner. Defaults to the
 * school's current term when term_id is omitted. Used by the Parent Portal
 * dashboard's "Attendance summary" card.
 */
export const getLearnerAttendanceSummary = async (
  learnerId: string,
  termId?: string
): Promise<ApiResponse<LearnerAttendanceSummaryResponse>> => {
  const query = termId ? `?term_id=${encodeURIComponent(termId)}` : '';
  const url = `${API_URL}/api/v1/attendance/learner/${learnerId}/summary${query}`;
  const response = await fetch(url, getFetchOptions('GET'));

  if (!response.ok) {
    const txt = await response.clone().text().catch(() => '');
    console.error('[attendanceApi:getLearnerAttendanceSummary] request failed', { url, status: response.status, body: txt });
  }

  return handleResponse<ApiResponse<LearnerAttendanceSummaryResponse>>(response);
};
