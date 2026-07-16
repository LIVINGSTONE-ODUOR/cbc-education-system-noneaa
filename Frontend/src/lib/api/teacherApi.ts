/**
 * Teacher/Staff API Service
 * Handles all HTTP requests to the teachers backend API (/api/v1/teachers)
 */

import type { StaffMember, StaffType } from '../../pages/teacher/StaffManagement/types';
import { backendToStaffMember, staffMemberToBackend } from '../../pages/teacher/StaffManagement/utils';

// API URL - normalize VITE_API_URL to avoid duplicate '/api' segments
const getApiUrl = (): string => {
  const raw = import.meta.env.VITE_API_URL || '';
  if (!raw) return '';
  return raw.replace(/\/api(?:\/v1)?\/?$/, '').replace(/\/+$/, '');
};

const API_URL = getApiUrl();

// Auth token from localStorage (same as curriculumApi)
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

// ==================== Backend Response Types ====================
// BackendTeacherResponse defined in utils.ts
export type TeacherBackend = any;

export interface TeachersListResponse {
  teachers: TeacherBackend[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

// ==================== API Functions ====================

/**
 * GET /api/v1/teachers
 * List teachers for current school (paginated)
 */
export const getTeachers = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
} = {}): Promise<{teachers: StaffMember[], pagination: {page: number, limit: number, total: number, pages: number}}> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.status) searchParams.append('status', params.status);
  if (params.search) searchParams.append('search', params.search);

  const query = searchParams.toString();
  const url = `${API_URL}/api/v1/teachers${query ? `?${query}` : ''}`;
  
  const response = await fetch(url, getFetchOptions('GET'));
  const result = await handleResponse<ApiResponse<{teachers: any[], pagination: any}>>(response);
  
  return {
    teachers: result.data.teachers.map(backendToStaffMember),
    pagination: result.data.pagination
  };
};

/**
 * GET /api/v1/teachers/:id
 */
export const getTeacher = async (id: string): Promise<StaffMember> => {
  const url = `${API_URL}/api/v1/teachers/${id}`;
  const response = await fetch(url, getFetchOptions('GET'));
  const result = await handleResponse<ApiResponse<any>>(response);
  
  // Map backend response to StaffMember
  return backendToStaffMember(result.data);
};

/**
 * POST /api/v1/teachers/upload-photo
 * Upload a teacher's profile photo (multipart/form-data). Returns a public URL
 * that should be passed as `photo` in the inviteTeacher/updateTeacher payload.
 */
export const uploadTeacherPhoto = async (
  file: File,
  label?: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  if (label) formData.append('filename', label);

  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/teachers/upload-photo`, {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.photoUrl) {
    throw new Error(data?.message || 'Failed to upload photo');
  }

  return data.photoUrl;
};

/**
 * POST /api/v1/teachers/invite
 * Create pending teacher (send invite email)
 */
export const inviteTeacher = async (payload: {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  /** Employee number. Required — this doubles as the teacher's login password. */
  tsc_number: string;
  qualifications?: string[];
  date_joined?: string;
  id_number?: string;
  designation?: string;
  branch?: string;
  job_status?: string;
  staff_type?: string;
  salary?: number;
  contract_start?: string;
  contract_end?: string;
  date_of_birth?: string;
  gender?: string;
  county?: string;
  location?: string;
  subjects_taught?: string[];
  photo?: string;
}): Promise<ApiResponse<{teacher_id: string; user_id: string}>> => {
  const url = `${API_URL}/api/v1/teachers/invite`;
  const response = await fetch(url, getFetchOptions('POST', payload));
  return handleResponse(response);
};

/**
 * PUT /api/v1/teachers/:id
 * Update teacher profile
 */
/**
 * PUT /api/v1/teachers/:id
 * Update teacher profile
 */
export const updateTeacher = async (
  id: string,
  payload: Partial<StaffMember>,
  schoolId?: string
): Promise<ApiResponse<StaffMember>> => {
  const effectiveSchoolId = schoolId || (typeof localStorage !== 'undefined' ? 
    JSON.parse(localStorage.getItem('cbe_user') || '{}')?.schoolId : null);
  
  let url = `${API_URL}/api/v1/teachers/${id}`;
  if (effectiveSchoolId) {
    url += `?school_id=${encodeURIComponent(effectiveSchoolId)}`;
  }
  
  // Convert StaffMember to backend format using your utility
  const backendPayload = staffMemberToBackend(payload);
  
  const response = await fetch(url, getFetchOptions('PUT', backendPayload));
  const result = await handleResponse<ApiResponse<any>>(response);
  
  return {
    success: result.success,
    message: result.message,
    data: backendToStaffMember(result.data)
  };
};



/**
 * PATCH /api/v1/teachers/:id/activate
 * Toggle teacher active status
 */
export const toggleTeacherActive = async (id: string): Promise<ApiResponse<{is_active: boolean}>> => {
  const url = `${API_URL}/api/v1/teachers/${id}/activate`;
  const response = await fetch(url, getFetchOptions('PATCH'));
  return handleResponse(response);
};

/**
 * DELETE /api/v1/teachers/:id
 * Soft delete teacher
 */
export const deleteTeacher = async (id: string): Promise<ApiResponse<void>> => {
  const url = `${API_URL}/api/v1/teachers/${id}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete teacher');
  }
  return { success: true, message: 'Teacher deleted', data: undefined };
};

// ==================== Helper: Map backend to frontend ====================
// DEPRECATED: Use utils.ts mapping instead
export const mapBackendToStaffMember = (backend: TeacherBackend): StaffMember => {
  return backendToStaffMember(backend); // Delegate to utils.ts
};

// ==================== Class/Subject Assignments ====================
// "A teacher can be assigned specific subjects to teach in a certain class
// (multiple subjects, multiple classes) — those are the ones they can enter
// marks for."

export interface TeacherAssignmentClass {
  id: string;
  grade_level: string;
  stream_name: string | null;
}

export interface TeacherAssignmentSubject {
  id: string;
  name: string;
  code: string;
}

export interface TeacherAssignment {
  id: string;
  is_active: boolean;
  academic_year_id: string;
  term_id: string | null;
  class: TeacherAssignmentClass | null;
  learning_area: TeacherAssignmentSubject | null;
  academic_year?: { id: string; name: string; is_current: boolean } | null;
  term?: { id: string; name: string; term_number: number } | null;
}

export interface AssignmentPair {
  class_id: string;
  learning_area_id: string;
  term_id?: string;
}

/**
 * GET /api/v1/teachers/:id/assignments
 * List a teacher's class/subject assignments.
 */
export const getTeacherAssignments = async (
  teacherId: string,
  params: { academic_year_id?: string; include_inactive?: boolean } = {}
): Promise<ApiResponse<{ teacher_id: string; assignments: TeacherAssignment[] }>> => {
  const searchParams = new URLSearchParams();
  if (params.academic_year_id) searchParams.append('academic_year_id', params.academic_year_id);
  if (params.include_inactive) searchParams.append('include_inactive', 'true');
  const query = searchParams.toString();
  const url = `${API_URL}/api/v1/teachers/${teacherId}/assignments${query ? `?${query}` : ''}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse(response);
};

/**
 * POST /api/v1/teachers/:id/assignments
 * Assign a teacher to teach specific subject(s) in specific class(es).
 * Pass one row per (class, subject) pair — build the cross-product
 * client-side if the admin picked several classes and several subjects
 * at once.
 */
export const assignTeacherToClasses = async (
  teacherId: string,
  assignments: AssignmentPair[],
  options: { academic_year_id?: string; term_id?: string } = {}
): Promise<ApiResponse<{ saved: TeacherAssignment[]; failed: any[] }>> => {
  const url = `${API_URL}/api/v1/teachers/${teacherId}/assignments`;
  const response = await fetch(
    url,
    getFetchOptions('POST', { assignments, ...options })
  );
  return handleResponse(response);
};

/**
 * DELETE /api/v1/teachers/:id/assignments/:assignmentId
 * Remove (deactivate) a single class/subject assignment.
 */
export const removeTeacherAssignment = async (
  teacherId: string,
  assignmentId: string
): Promise<ApiResponse<{ message: string }>> => {
  const url = `${API_URL}/api/v1/teachers/${teacherId}/assignments/${assignmentId}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  return handleResponse(response);
};

/**
 * GET /api/v1/teachers/me/classes
 * Convenience endpoint for the CURRENTLY LOGGED-IN teacher: returns exactly
 * what GET /api/v1/teachers/:id/classes returns, without needing to know
 * your own teacher_id. Used to scope the Marks Entry screen to "my classes
 * and subjects only".
 */
export interface MyClassAssignment {
  id: string;
  is_active: boolean;
  is_class_teacher: boolean;
  class: {
    id: string;
    grade_level: string;
    stream_name: string | null;
    capacity: number;
    is_active: boolean;
    class_teacher_id: string | null;
    learner_count: number;
  } | null;
  learning_area: TeacherAssignmentSubject | null;
  term: { id: string; name: string; term_number: number } | null;
}

export const getMyClasses = async (
  academic_year_id?: string
): Promise<ApiResponse<{ teacher_id: string; academic_year_id: string; assignments: MyClassAssignment[] }>> => {
  const url = `${API_URL}/api/v1/teachers/me/classes${academic_year_id ? `?academic_year_id=${academic_year_id}` : ''}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse(response);
};

/**
 * GET /api/v1/teachers/me
 * The logged-in teacher's own profile — powers the Teacher Portal sidebar.
 */
export interface MyTeacherProfile {
  teacher_id: string;
  employee_number: string | null;
  designation: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  photo: string | null;
  school_name: string | null;
  date_joined: string | null;
  experience: string | null;
}

export const getMyProfile = async (): Promise<ApiResponse<MyTeacherProfile>> => {
  const url = `${API_URL}/api/v1/teachers/me`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse(response);
};

/**
 * GET /api/v1/teachers/me/timetable
 * The logged-in teacher's own weekly timetable — powers the Schedule tab.
 */
export interface MyTimetableSlot {
  id: string;
  day: string;
  period_number: number;
  start_time: string;
  end_time: string;
  room: string | null;
  class: { id: string; grade_level: string; stream_name: string | null } | null;
  learning_area: { id: string; name: string; code: string } | null;
}

export const getMyTimetable = async (): Promise<
  ApiResponse<{ teacher_id: string; academic_year_id: string; timetable: Record<string, MyTimetableSlot[]> }>
> => {
  const url = `${API_URL}/api/v1/teachers/me/timetable`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse(response);
};

/**
 * GET /api/v1/teachers/me/classes/:classId/students
 * Real class roster (enrollment + attendance + exam performance) for one of
 * the logged-in teacher's classes — powers the Classes tab student list.
 */
export interface MyClassStudentParentContact {
  name: string | null;
  phone: string | null;
  email: string | null;
  relationship: string | null;
}

export interface MyClassStudent {
  learner_id: string;
  admission_number: string;
  name: string;
  photo: string | null;
  performance: number | null;
  attendance: number | null;
  exams_recorded: number;
  strengths: string;
  areas_for_improvement: string;
  recent_scores: number[];
  parent_contact: MyClassStudentParentContact | null;
}

export const getMyClassStudents = async (
  classId: string
): Promise<ApiResponse<{ class_id: string; students: MyClassStudent[] }>> => {
  const url = `${API_URL}/api/v1/teachers/me/classes/${classId}/students`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse(response);
};

/**
 * GET /api/v1/teachers/me/dashboard
 * One-call aggregate for the Teacher Portal Home/Dashboard tab: today's
 * lessons, classes still needing attendance marked, upcoming exams, and
 * quick stats. `assignments`, `announcements`, and `notifications` come
 * back with `available: false` — there's no backend module for those yet,
 * so the UI shows an honest "not set up" state instead of fake data.
 */
export interface MyDashboardLesson {
  id: string;
  day: string;
  period_number: number;
  start_time: string;
  end_time: string;
  room: string | null;
  class: { id: string; grade_level: string; stream_name: string | null } | null;
  learning_area: { id: string; name: string } | null;
}

export interface MyDashboardExam {
  id: string;
  exam_name: string;
  exam_type: string;
  start_date: string;
  end_date: string;
  class: { id: string; grade_level: string; stream_name: string | null } | null;
}

export interface MyDashboard {
  date: string;
  classes_count: number;
  students_count: number;
  todays_lessons: MyDashboardLesson[];
  attendance: { classes_pending: number; students_pending: number };
  upcoming_exams: MyDashboardExam[];
  assignments: { available: false };
  announcements: { available: false };
  notifications: { available: false };
}

export const getMyDashboard = async (): Promise<ApiResponse<MyDashboard>> => {
  const url = `${API_URL}/api/v1/teachers/me/dashboard`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse(response);
};

/**
 * GET /api/v1/teachers/me/students/:learnerId
 * Full Student Profile — photo, admission no., parents, medical info,
 * attendance history, discipline records, academic history, notes.
 * Powers the Student Profile dialog opened from the Classes tab.
 */
export interface StudentProfileParent {
  name: string | null;
  phone: string | null;
  email: string | null;
  relationship: string | null;
  is_primary: boolean;
}

export interface StudentProfileAttendanceRecord {
  attendance_date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks: string | null;
}

export interface StudentProfileAcademicRecord {
  exam_name: string;
  exam_type: string | null;
  date: string | null;
  subject: string;
  score_percent: number;
}

export interface StudentProfileDisciplineRecord {
  id: string;
  date: string;
  category: 'minor' | 'major' | 'commendation';
  description: string;
  action_taken: string | null;
  recorded_by: string | null;
}

export interface StudentProfileNote {
  id: string;
  note_type: 'comment' | 'teacher_note';
  content: string;
  created_at: string;
  author: string;
}

export interface StudentProfile {
  learner_id: string;
  admission_number: string;
  name: string;
  photo: string | null;
  date_of_birth: string | null;
  gender: string | null;
  medical: {
    conditions: string | null;
    allergies: string | null;
    special_needs: string | null;
  };
  parents: StudentProfileParent[];
  attendance: { rate: number | null; history: StudentProfileAttendanceRecord[] };
  academic_history: StudentProfileAcademicRecord[];
  discipline: StudentProfileDisciplineRecord[];
  notes: StudentProfileNote[];
}

export const getStudentProfile = async (
  learnerId: string
): Promise<ApiResponse<StudentProfile>> => {
  const url = `${API_URL}/api/v1/teachers/me/students/${learnerId}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse(response);
};

/**
 * POST /api/v1/teachers/me/students/:learnerId/notes
 * Add a comment (e.g. for report cards) or a private teacher note.
 */
export const addStudentNote = async (
  learnerId: string,
  note_type: 'comment' | 'teacher_note',
  content: string
): Promise<ApiResponse<StudentProfileNote>> => {
  const url = `${API_URL}/api/v1/teachers/me/students/${learnerId}/notes`;
  const response = await fetch(url, getFetchOptions('POST', { note_type, content }));
  return handleResponse(response);
};

// ==================== Lesson Planner ====================

export type LessonPlanStatus = 'draft' | 'submitted' | 'approved' | 'changes_requested';

export interface LessonPlan {
  id: string;
  week_number: number;
  objectives: string;
  activities: string;
  resources: string | null;
  homework: string | null;
  status: LessonPlanStatus;
  review_comment: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  class: { id: string; grade_level: string; stream_name: string | null } | null;
  learning_area: { id: string; name: string; code: string } | null;
  term: { id: string; name: string; term_number: number } | null;
  reviewed_by: { first_name: string; last_name: string } | null;
}

export interface LessonPlanInput {
  class_id: string;
  learning_area_id: string;
  term_id?: string | null;
  week_number: number;
  objectives: string;
  activities: string;
  resources?: string;
  homework?: string;
}

/**
 * GET /api/v1/teachers/me/lesson-plans
 * List the logged-in teacher's own lesson plans.
 */
export const getMyLessonPlans = async (params?: {
  class_id?: string;
  learning_area_id?: string;
  week_number?: number;
  status?: LessonPlanStatus;
}): Promise<ApiResponse<{ plans: LessonPlan[] }>> => {
  const query = new URLSearchParams();
  if (params?.class_id) query.set('class_id', params.class_id);
  if (params?.learning_area_id) query.set('learning_area_id', params.learning_area_id);
  if (params?.week_number) query.set('week_number', String(params.week_number));
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  const url = `${API_URL}/api/v1/teachers/me/lesson-plans${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse(response);
};

/**
 * POST /api/v1/teachers/me/lesson-plans
 * Create (or update, if one already exists for the same class/subject/week)
 * a draft lesson plan.
 */
export const saveLessonPlan = async (
  input: LessonPlanInput
): Promise<ApiResponse<LessonPlan>> => {
  const url = `${API_URL}/api/v1/teachers/me/lesson-plans`;
  const response = await fetch(url, getFetchOptions('POST', input));
  return handleResponse(response);
};

/**
 * PATCH /api/v1/teachers/me/lesson-plans/:id/submit
 * Locks a draft for principal review.
 */
export const submitLessonPlan = async (planId: string): Promise<ApiResponse<LessonPlan>> => {
  const url = `${API_URL}/api/v1/teachers/me/lesson-plans/${planId}/submit`;
  const response = await fetch(url, getFetchOptions('PATCH'));
  return handleResponse(response);
};

/**
 * DELETE /api/v1/teachers/me/lesson-plans/:id
 * Only drafts can be deleted.
 */
export const deleteLessonPlan = async (planId: string): Promise<ApiResponse<{ message: string }>> => {
  const url = `${API_URL}/api/v1/teachers/me/lesson-plans/${planId}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  return handleResponse(response);
};
