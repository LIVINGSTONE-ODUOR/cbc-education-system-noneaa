/**
 * Teacher Attendance API Service
 * Handles HTTP requests for the Teacher Attendance backend endpoints.
 * Base: /api/v1/attendance/teachers
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
    throw new Error(data.message || 'An error occurred while communicating with the teacher attendance API.');
  }

  return data;
};

export type TeacherAttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface TeacherAttendanceApiTeacher {
  teacher_id: string;
  staff_number: string | null;
  first_name: string;
  last_name: string;
  email: string;
  designation: string | null;
  photo_url: string | null;
  attendance_id: string | null;
  status: TeacherAttendanceStatus | null;
  check_in_time: string | null;
  check_out_time: string | null;
  remarks: string;
}

export interface TeacherAttendanceApiSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  marked: number;
  attendance_rate: number;
}

export interface TeacherAttendanceRosterResponse {
  date: string;
  already_marked: boolean;
  summary: TeacherAttendanceApiSummary;
  teachers: TeacherAttendanceApiTeacher[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * GET /api/v1/attendance/teachers/roster?date=YYYY-MM-DD
 * Fetches every active teacher merged with any attendance already
 * recorded for that date.
 */
export const getTeacherAttendanceRoster = async (
  date: string
): Promise<ApiResponse<TeacherAttendanceRosterResponse>> => {
  const url = `${API_URL}/api/v1/attendance/teachers/roster?date=${encodeURIComponent(date)}`;
  const response = await fetch(url, getFetchOptions('GET'));

  if (!response.ok) {
    const txt = await response.clone().text().catch(() => '');
    console.error('[teacherAttendanceApi:getTeacherAttendanceRoster] request failed', { url, status: response.status, body: txt });
  }

  return handleResponse<ApiResponse<TeacherAttendanceRosterResponse>>(response);
};

export interface SaveTeacherAttendanceRecordPayload {
  teacher_id: string;
  status: TeacherAttendanceStatus;
  check_in_time?: string | null;
  check_out_time?: string | null;
  remarks?: string | null;
}

/**
 * POST /api/v1/attendance/teachers
 * Upserts attendance — safe to call again for the same date, it updates
 * existing records instead of creating duplicates.
 */
export const saveTeacherAttendance = async (
  attendance_date: string,
  records: SaveTeacherAttendanceRecordPayload[]
): Promise<ApiResponse<{ saved_count: number }>> => {
  const url = `${API_URL}/api/v1/attendance/teachers`;
  const response = await fetch(url, getFetchOptions('POST', { attendance_date, records }));

  if (!response.ok) {
    const txt = await response.clone().text().catch(() => '');
    console.error('[teacherAttendanceApi:saveTeacherAttendance] request failed', { url, status: response.status, body: txt });
  }

  return handleResponse<ApiResponse<{ saved_count: number }>>(response);
};
