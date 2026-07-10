/**
 * Department API Service
 * Real backend calls for /api/v1/departments — no mock data.
 * Learning areas attached to a department are always the actual
 * rows fetched from /api/v1/curriculum/learning-areas.
 */
import type {
  Department,
  DepartmentFormData,
  DepartmentTeacher,
  DepartmentLearningArea,
} from './types';

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

export class DepartmentApiError extends Error {
  errors?: { field: string; message: string }[];
  constructor(message: string, errors?: { field: string; message: string }[]) {
    super(message);
    this.name = 'DepartmentApiError';
    this.errors = errors;
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new DepartmentApiError(data.message || 'An error occurred', data.errors);
  }
  return data.data as T;
};

// ==================== Departments ====================

export async function getDepartments(): Promise<Department[]> {
  const res = await fetch(`${API_URL}/api/v1/departments`, getFetchOptions('GET'));
  const data = await handleResponse<{ departments: Department[] }>(res);
  return data.departments;
}

export async function createDepartment(data: DepartmentFormData): Promise<Department> {
  const res = await fetch(`${API_URL}/api/v1/departments`, getFetchOptions('POST', {
    name: data.name,
    code: data.code,
    description: data.description,
    hodId: data.hodId,
    status: data.status,
    learningAreaIds: data.learningAreaIds,
  }));
  const result = await handleResponse<{ department: Department }>(res);
  return result.department;
}

export async function updateDepartment(id: string, data: DepartmentFormData): Promise<Department> {
  const res = await fetch(`${API_URL}/api/v1/departments/${id}`, getFetchOptions('PUT', {
    name: data.name,
    code: data.code,
    description: data.description,
    hodId: data.hodId,
    status: data.status,
    learningAreaIds: data.learningAreaIds,
  }));
  const result = await handleResponse<{ department: Department }>(res);
  return result.department;
}

export async function deleteDepartment(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/departments/${id}`, getFetchOptions('DELETE'));
  await handleResponse<null>(res);
}

// ==================== Learning areas on a department ====================

export async function getDepartmentLearningAreas(deptId: string): Promise<DepartmentLearningArea[]> {
  const res = await fetch(`${API_URL}/api/v1/departments/${deptId}/learning-areas`, getFetchOptions('GET'));
  const data = await handleResponse<{ learning_areas: DepartmentLearningArea[] }>(res);
  return data.learning_areas;
}

export async function assignLearningAreaToDepartment(
  deptId: string,
  learningAreaId: string
): Promise<string[]> {
  const res = await fetch(
    `${API_URL}/api/v1/departments/${deptId}/learning-areas`,
    getFetchOptions('POST', { learningAreaId })
  );
  const data = await handleResponse<{ learning_area_ids: string[] }>(res);
  return data.learning_area_ids;
}

export async function removeLearningAreaFromDepartment(
  deptId: string,
  learningAreaId: string
): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/v1/departments/${deptId}/learning-areas/${learningAreaId}`,
    getFetchOptions('DELETE')
  );
  await handleResponse<null>(res);
}

// ==================== Teachers on a department ====================

export async function getDepartmentTeachers(deptId: string): Promise<DepartmentTeacher[]> {
  const res = await fetch(`${API_URL}/api/v1/departments/${deptId}/teachers`, getFetchOptions('GET'));
  const data = await handleResponse<{ teachers: DepartmentTeacher[] }>(res);
  return data.teachers;
}

export async function assignTeacher(
  deptId: string,
  teacherId: string,
  role: 'HOD' | 'Teacher' | 'Assistant'
): Promise<DepartmentTeacher> {
  const res = await fetch(
    `${API_URL}/api/v1/departments/${deptId}/teachers`,
    getFetchOptions('POST', { teacherId, role })
  );
  const data = await handleResponse<{ teacher: DepartmentTeacher }>(res);
  return data.teacher;
}

export async function removeTeacher(deptId: string, assignmentId: string): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/v1/departments/${deptId}/teachers/${assignmentId}`,
    getFetchOptions('DELETE')
  );
  await handleResponse<null>(res);
}
