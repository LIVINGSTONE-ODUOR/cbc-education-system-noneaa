/**
 * Results API Service
 * Handles HTTP requests for the Final Results backend endpoints (/api/v1/results).
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
    const message =
      data.message ||
      (Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
      'An error occurred while communicating with the results API.';
    throw new Error(message);
  }
  return data;
};

export const PERFORMANCE_LEVELS = ['EE', 'ME', 'AE', 'BE'] as const;
export type PerformanceLevel = (typeof PERFORMANCE_LEVELS)[number];

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ─────────────────────────────────────────────────────────────────────────
// Shared shapes
// ─────────────────────────────────────────────────────────────────────────

export interface ResultLearner {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_id?: string | null;
  classes?: { grade_level: string; stream_name: string | null } | null;
}

export interface ResultSubject {
  id: string;
  name: string;
  code: string;
}

export interface ResultExam {
  id: string;
  exam_name: string;
  exam_type: string;
  term_id: string;
  start_date?: string;
}

export interface ResultClass {
  id: string;
  grade_level: string;
  stream_name: string | null;
}

export interface ExamResultRow {
  id: string;
  school_id: string;
  exam_id: string;
  learner_id: string;
  learning_area_id: string;
  class_id: string | null;
  term_id: string | null;
  marks_obtained: number;
  max_marks: number;
  percentage: number;
  performance_level: PerformanceLevel | null;
  remarks: string | null;
  is_absent: boolean;
  created_at: string;
  updated_at: string;
  learners?: ResultLearner | null;
  learning_areas?: ResultSubject | null;
  exams?: ResultExam | null;
  classes?: ResultClass | null;
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Bulk entry — POST /api/v1/results/bulk
// ─────────────────────────────────────────────────────────────────────────

export interface BulkResultEntry {
  learner_id: string;
  marks_obtained: number;
  max_marks?: number;
  is_absent?: boolean;
  remarks?: string;
}

export interface BulkResultsPayload {
  exam_id: string;
  learning_area_id: string;
  class_id?: string;
  results: BulkResultEntry[];
}

export const bulkUpsertResults = async (
  payload: BulkResultsPayload
): Promise<ApiResponse<{ saved_count: number; results: ExamResultRow[] }>> => {
  const url = `${API_URL}/api/v1/results/bulk`;
  const response = await fetch(url, getFetchOptions('POST', payload));
  return handleResponse(response);
};

// ─────────────────────────────────────────────────────────────────────────
// 2. View results for an exam — GET /api/v1/results
// ─────────────────────────────────────────────────────────────────────────

export interface ListResultsParams {
  exam_id: string;
  class_id?: string;
  learning_area_id?: string;
  page?: number;
  limit?: number;
}

export const getResults = async (
  params: ListResultsParams
): Promise<ApiResponse<{ results: ExamResultRow[] }>> => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const url = `${API_URL}/api/v1/results?${searchParams.toString()}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse(response);
};

// ─────────────────────────────────────────────────────────────────────────
// 3. Search learners — GET /api/v1/results/search
// ─────────────────────────────────────────────────────────────────────────

export const searchLearners = async (
  query: string
): Promise<ApiResponse<{ learners: ResultLearner[] }>> => {
  const url = `${API_URL}/api/v1/results/search?query=${encodeURIComponent(query)}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse(response);
};

// ─────────────────────────────────────────────────────────────────────────
// 4. A learner's full result history — GET /api/v1/results/learner/:id
// ─────────────────────────────────────────────────────────────────────────

export interface ExamSummary {
  exam_id: string;
  exam: ResultExam | null;
  total_marks: number;
  total_max: number;
  average_percentage: number;
  overall_grade: PerformanceLevel;
  position: number | null;
  class_size: number | null;
  subjects: {
    learning_area: ResultSubject | null;
    marks_obtained: number;
    max_marks: number;
    percentage: number;
    performance_level: PerformanceLevel | null;
    is_absent: boolean;
    remarks: string | null;
  }[];
}

export const getLearnerResults = async (
  learnerId: string
): Promise<ApiResponse<{ learner: ResultLearner; exams: ExamSummary[] }>> => {
  const url = `${API_URL}/api/v1/results/learner/${learnerId}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse(response);
};

// ─────────────────────────────────────────────────────────────────────────
// 5. Compare a learner across exams — GET /api/v1/results/compare
// ─────────────────────────────────────────────────────────────────────────

export interface SubjectTrendPoint {
  exam_id: string;
  exam_name?: string;
  percentage: number;
  performance_level: PerformanceLevel | null;
}

export const compareResults = async (
  learnerId: string,
  examIds?: string[]
): Promise<ApiResponse<{ exams: ExamSummary[]; subject_trend: Record<string, SubjectTrendPoint[]> }>> => {
  const searchParams = new URLSearchParams({ learner_id: learnerId });
  if (examIds && examIds.length) {
    searchParams.append('exam_ids', examIds.join(','));
  }
  const url = `${API_URL}/api/v1/results/compare?${searchParams.toString()}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse(response);
};

// ─────────────────────────────────────────────────────────────────────────
// 6. Delete a result — DELETE /api/v1/results/:id
// ─────────────────────────────────────────────────────────────────────────

export const deleteResult = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const url = `${API_URL}/api/v1/results/${id}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  return handleResponse(response);
};
