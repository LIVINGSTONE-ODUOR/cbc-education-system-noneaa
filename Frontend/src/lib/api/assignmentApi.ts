/**
 * Assignments API Service
 * Handles HTTP requests for the Assignments backend endpoints (/api/v1/assignments).
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

const formOptions = (method: string, form: FormData): RequestInit => ({
  method,
  headers: { ...authHeaders() }, // no Content-Type — browser sets the multipart boundary
  body: form,
});

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok || !data.success) {
    const message =
      data.message ||
      (Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
      'An error occurred while communicating with the assignments API.';
    throw new Error(message);
  }
  return data;
};

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ─────────────────────────────────────────────────────────────────────────
// Shapes
// ─────────────────────────────────────────────────────────────────────────

export type SubmissionStatus = 'submitted' | 'late' | 'graded' | 'returned';
export type AttachmentType = 'pdf' | 'word';

export interface AssignmentClass {
  id: string;
  grade_level: string;
  stream_name: string | null;
}

export interface AssignmentSubject {
  id: string;
  name: string;
  code: string;
}

export interface AssignmentTeacher {
  id: string;
  first_name: string;
  last_name: string;
}

export interface Assignment {
  id: string;
  school_id: string;
  class_id: string;
  learning_area_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  due_date: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: AttachmentType | null;
  max_grade: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  classes?: AssignmentClass | null;
  learning_areas?: AssignmentSubject | null;
  teachers?: AssignmentTeacher | null;
  submission_counts?: { submitted: number; graded: number };
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  learner_id: string;
  submission_text: string | null;
  file_url: string | null;
  file_name: string | null;
  status: SubmissionStatus;
  grade: number | null;
  teacher_comment: string | null;
  submitted_at: string;
  graded_at: string | null;
  graded_by: string | null;
}

export interface RosterLearner {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  profile_photo: string | null;
}

export interface SubmissionRow {
  learner_id: string;
  learner: RosterLearner;
  submission: AssignmentSubmission | null;
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Create — POST /api/v1/assignments
// ─────────────────────────────────────────────────────────────────────────

export interface CreateAssignmentPayload {
  class_id: string;
  learning_area_id: string;
  title: string;
  description?: string;
  due_date: string; // ISO date/time string
  max_grade?: number;
  attachment?: File | null;
}

export const createAssignment = async (
  payload: CreateAssignmentPayload
): Promise<ApiResponse<Assignment>> => {
  const form = new FormData();
  form.append('class_id', payload.class_id);
  form.append('learning_area_id', payload.learning_area_id);
  form.append('title', payload.title);
  if (payload.description) form.append('description', payload.description);
  form.append('due_date', payload.due_date);
  if (payload.max_grade !== undefined) form.append('max_grade', String(payload.max_grade));
  if (payload.attachment) form.append('attachment', payload.attachment);

  const response = await fetch(`${API_URL}/api/v1/assignments`, formOptions('POST', form));
  return handleResponse(response);
};

// ─────────────────────────────────────────────────────────────────────────
// 2. List — GET /api/v1/assignments
// ─────────────────────────────────────────────────────────────────────────

export interface ListAssignmentsParams {
  class_id?: string;
  learning_area_id?: string;
  page?: number;
  limit?: number;
}

export const getAssignments = async (
  params: ListAssignmentsParams = {}
): Promise<ApiResponse<{ assignments: Assignment[] }>> => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  const response = await fetch(
    `${API_URL}/api/v1/assignments${query ? `?${query}` : ''}`,
    { headers: authHeaders() }
  );
  return handleResponse(response);
};

// ─────────────────────────────────────────────────────────────────────────
// 3. Get one — GET /api/v1/assignments/:id
// ─────────────────────────────────────────────────────────────────────────

export const getAssignment = async (id: string): Promise<ApiResponse<Assignment>> => {
  const response = await fetch(`${API_URL}/api/v1/assignments/${id}`, { headers: authHeaders() });
  return handleResponse(response);
};

// ─────────────────────────────────────────────────────────────────────────
// 4. Update — PUT /api/v1/assignments/:id
// ─────────────────────────────────────────────────────────────────────────

export interface UpdateAssignmentPayload {
  title?: string;
  description?: string;
  due_date?: string;
  max_grade?: number;
  is_active?: boolean;
  attachment?: File | null;
}

export const updateAssignment = async (
  id: string,
  payload: UpdateAssignmentPayload
): Promise<ApiResponse<Assignment>> => {
  const form = new FormData();
  if (payload.title !== undefined) form.append('title', payload.title);
  if (payload.description !== undefined) form.append('description', payload.description);
  if (payload.due_date !== undefined) form.append('due_date', payload.due_date);
  if (payload.max_grade !== undefined) form.append('max_grade', String(payload.max_grade));
  if (payload.is_active !== undefined) form.append('is_active', String(payload.is_active));
  if (payload.attachment) form.append('attachment', payload.attachment);

  const response = await fetch(`${API_URL}/api/v1/assignments/${id}`, formOptions('PUT', form));
  return handleResponse(response);
};

// ─────────────────────────────────────────────────────────────────────────
// 5. Delete — DELETE /api/v1/assignments/:id
// ─────────────────────────────────────────────────────────────────────────

export const deleteAssignment = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await fetch(`${API_URL}/api/v1/assignments/${id}`, jsonOptions('DELETE'));
  return handleResponse(response);
};

// ─────────────────────────────────────────────────────────────────────────
// 6. Submissions for one assignment — GET /api/v1/assignments/:id/submissions
// ─────────────────────────────────────────────────────────────────────────

export const getSubmissions = async (
  assignmentId: string
): Promise<ApiResponse<{ assignment_id: string; students: SubmissionRow[] }>> => {
  const response = await fetch(
    `${API_URL}/api/v1/assignments/${assignmentId}/submissions`,
    { headers: authHeaders() }
  );
  return handleResponse(response);
};

// ─────────────────────────────────────────────────────────────────────────
// 7. Grade / comment / return — PUT /api/v1/assignments/submissions/:id
// ─────────────────────────────────────────────────────────────────────────

export interface GradeSubmissionPayload {
  grade?: number | null;
  teacher_comment?: string;
  status?: 'graded' | 'returned';
}

export const gradeSubmission = async (
  submissionId: string,
  payload: GradeSubmissionPayload
): Promise<ApiResponse<AssignmentSubmission>> => {
  const response = await fetch(
    `${API_URL}/api/v1/assignments/submissions/${submissionId}`,
    jsonOptions('PUT', payload)
  );
  return handleResponse(response);
};

// ─────────────────────────────────────────────────────────────────────────
// 8. Student submit — POST /api/v1/assignments/:id/submit
// ─────────────────────────────────────────────────────────────────────────

export const submitAssignment = async (
  assignmentId: string,
  submission_text?: string,
  file?: File | null
): Promise<ApiResponse<AssignmentSubmission>> => {
  const form = new FormData();
  if (submission_text) form.append('submission_text', submission_text);
  if (file) form.append('file', file);
  const response = await fetch(
    `${API_URL}/api/v1/assignments/${assignmentId}/submit`,
    formOptions('POST', form)
  );
  return handleResponse(response);
};

// ─────────────────────────────────────────────────────────────────────────
// 9. Learner assignments due — GET /api/v1/assignments/learner/:learnerId/due
//    Used by the Parent Portal dashboard's "Assignments due" card.
// ─────────────────────────────────────────────────────────────────────────

export type LearnerAssignmentStatus = 'not_submitted' | SubmissionStatus;

export interface LearnerDueAssignment {
  id: string;
  title: string;
  learning_area: AssignmentSubject | null;
  due_date: string;
  max_grade: number;
  submission_status: LearnerAssignmentStatus;
  grade: number | null;
  is_overdue: boolean;
}

export interface LearnerAssignmentsDueResponse {
  learner: { id: string; first_name: string; last_name: string };
  class: AssignmentClass | null;
  total_due: number;
  assignments: LearnerDueAssignment[];
}

export const getLearnerAssignmentsDue = async (
  learnerId: string,
  includeSubmitted = false
): Promise<ApiResponse<LearnerAssignmentsDueResponse>> => {
  const query = includeSubmitted ? '?include_submitted=true' : '';
  const response = await fetch(
    `${API_URL}/api/v1/assignments/learner/${learnerId}/due${query}`,
    { headers: authHeaders() }
  );
  return handleResponse(response);
};
