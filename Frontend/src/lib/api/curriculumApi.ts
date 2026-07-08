/**
 * Curriculum API Service
 * Handles all HTTP requests to the curriculum backend API
 */

// API URL - normalize VITE_API_URL to avoid duplicate '/api' segments
const getApiUrl = (): string => {
  const raw = import.meta.env.VITE_API_URL || '';
  if (!raw) return '';
  return raw.replace(/\/api(?:\/v1)?\/?$/, '').replace(/\/+$/, '');
};

const API_URL = getApiUrl();
console.log('[curriculumApi] API_URL:', API_URL, 'PROD:', import.meta.env.PROD);

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('cbe_access_token');
};

// Common fetch options with auth header
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

// Handle API response
const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'An error occurred');
  }
  
  // Return the full response data (includes success, message, data)
  return data;
};

// ==================== Types ====================

export interface Competency {
  id: string;
  name: string;
  description: string | null;
  sub_strand_id: string;
  performance_indicators: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface SubStrand {
  id: string;
  name: string;
  code: string;
  description: string | null;
  strand_id: string;
  is_active: boolean;
  created_at: string;
  competency_count?: number;
  competencies?: Competency[];
}

export interface Strand {
  id: string;
  name: string;
  code: string;
  description: string | null;
  learning_area_id: string;
  is_active: boolean;
  created_at: string;
  sub_strand_count?: number;
  subStrands?: SubStrand[];
  sub_strands?: SubStrand[];
}

export interface LearningArea {
  id: string;
  name: string;
  code: string;
  description: string | null;
  school_id: string | null;
  grade_levels: string[] | null;
  is_active: boolean;
  created_at: string;
  is_national?: boolean;
  strand_count?: number;
  strands?: Strand[];
}

export interface CurriculumTreeNode {
  id: string;
  name: string;
  code: string;
  description: string | null;
  grade_levels: string[] | null;
  is_national: boolean;
  strands: CurriculumStrandNode[];
}

export interface CurriculumStrandNode {
  id: string;
  name: string;
  code: string;
  description: string;
  sub_strands: CurriculumSubStrandNode[];
}

export interface CurriculumSubStrandNode {
  id: string;
  name: string;
  code: string;
  description: string;
  competencies: CurriculumCompetencyNode[];
}

export interface CurriculumCompetencyNode {
  id: string;
  name: string;
  description: string | null;
  performance_indicators: string[] | null;
}

// API Response wrapper type
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// API Response types
export interface LearningAreasResponse {
  learning_areas: LearningArea[];
  national_count: number;
  custom_count: number;
  total: number;
}

export interface LearningAreaResponse {
  learning_area: LearningArea;
}

export interface StrandsResponse {
  learning_area_id: string;
  learning_area_name: string;
  strands: Strand[];
  total: number;
}

export interface SubStrandsResponse {
  strand_id: string;
  strand_name: string;
  learning_area_name: string;
  sub_strands: SubStrand[];
  total: number;
}

export interface CompetenciesResponse {
  sub_strand_id: string;
  sub_strand_name: string;
  strand_name: string;
  learning_area_name: string;
  competencies: Competency[];
  total: number;
}

export interface CurriculumTreeResponse {
  grade: string;
  grade_band: string;
  learning_area_count: number;
  tree: CurriculumTreeNode[];
}

export interface SeedResponse {
  summary: {
    learning_areas_created: number;
    strands_created: number;
    note: string;
  };
}

// ==================== API Functions ====================

/**
 * GET /api/v1/curriculum/learning-areas
 * List all learning areas (national + custom)
 */
export const getLearningAreas = async (filters?: {
  grade_level?: string;
  is_active?: boolean;
  school_only?: boolean;
}): Promise<ApiResponse<LearningAreasResponse>> => {
  const params = new URLSearchParams();
  
  if (filters?.grade_level) params.append('grade_level', filters.grade_level);
  if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
  if (filters?.school_only) params.append('school_only', 'true');
  
  const queryString = params.toString();
  const url = `${API_URL}/api/v1/curriculum/learning-areas${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<ApiResponse<LearningAreasResponse>>(response);
};

/**
 * GET /api/v1/curriculum/learning-areas/:id
 * Get a single learning area by ID
 */
export const getLearningAreaById = async (id: string): Promise<LearningAreaResponse> => {
  const url = `${API_URL}/api/v1/curriculum/learning-areas/${id}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<LearningAreaResponse>(response);
};

/**
 * POST /api/v1/curriculum/learning-areas
 * Create a new learning area
 */
export const createLearningArea = async (payload: {
  name: string;
  code?: string;
  description?: string;
  grade_levels?: string[];
}): Promise<LearningAreaResponse> => {
  const url = `${API_URL}/api/v1/curriculum/learning-areas`;
  const response = await fetch(url, getFetchOptions('POST', payload));
  return handleResponse<LearningAreaResponse>(response);
};

/**
 * PUT /api/v1/curriculum/learning-areas/:id
 * Update a learning area
 */
export const updateLearningArea = async (
  id: string,
  payload: {
    name?: string;
    code?: string;
    description?: string;
    grade_levels?: string[];
    is_active?: boolean;
  }
): Promise<LearningAreaResponse> => {
  const url = `${API_URL}/api/v1/curriculum/learning-areas/${id}`;
  const response = await fetch(url, getFetchOptions('PUT', payload));
  return handleResponse<LearningAreaResponse>(response);
};

/**
 * DELETE /api/v1/curriculum/learning-areas/:id
 * Delete a learning area (soft delete)
 * @param cascade - if true, deletes all child strands, sub-strands, and competencies
 */
export const deleteLearningArea = async (id: string, cascade: boolean = true): Promise<void> => {
  const url = `${API_URL}/api/v1/curriculum/learning-areas/${id}?cascade=${cascade}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message || 'Failed to delete learning area');
  }
};

/**
 * DELETE /api/v1/curriculum/learning-areas/:id/hard
 * Permanently delete a learning area and all its children (strands, sub-strands, competencies)
 */
export const hardDeleteLearningArea = async (id: string): Promise<void> => {
  const url = `${API_URL}/api/v1/curriculum/learning-areas/${id}/hard`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to permanently delete learning area');
  }
};

/**
 * GET /api/v1/curriculum/learning-areas/:id/strands
 * Get strands for a learning area
 */
export const getStrands = async (learningAreaId: string, filters?: {
  is_active?: boolean;
}): Promise<StrandsResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
  
  const queryString = params.toString();
  const url = `${API_URL}/api/v1/curriculum/learning-areas/${learningAreaId}/strands${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<StrandsResponse>(response);
};

/**
 * POST /api/v1/curriculum/strands
 * Create a new strand
 */
export const createStrand = async (payload: {
  learning_area_id: string;
  name: string;
  code?: string;
  description?: string;
}): Promise<{ strand: Strand }> => {
  const url = `${API_URL}/api/v1/curriculum/strands`;
  const response = await fetch(url, getFetchOptions('POST', payload));
  return handleResponse<{ strand: Strand }>(response);
};

/**
 * DELETE /api/v1/curriculum/strands/:id
 * Delete a strand (soft delete)
 */
export const deleteStrand = async (id: string): Promise<void> => {
  const url = `${API_URL}/api/v1/curriculum/strands/${id}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete strand');
  }
};

/**
 * GET /api/v1/curriculum/strands/:id/sub-strands
 * Get sub-strands for a strand
 */
export const getSubStrands = async (strandId: string, filters?: {
  is_active?: boolean;
}): Promise<SubStrandsResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
  
  const queryString = params.toString();
  const url = `${API_URL}/api/v1/curriculum/strands/${strandId}/sub-strands${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<SubStrandsResponse>(response);
};

/**
 * POST /api/v1/curriculum/sub-strands
 * Create a new sub-strand
 */
export const createSubStrand = async (payload: {
  strand_id: string;
  name: string;
  code?: string;
  description?: string;
}): Promise<{ sub_strand: SubStrand }> => {
  const url = `${API_URL}/api/v1/curriculum/sub-strands`;
  const response = await fetch(url, getFetchOptions('POST', payload));
  return handleResponse<{ sub_strand: SubStrand }>(response);
};

/**
 * DELETE /api/v1/curriculum/sub-strands/:id
 * Delete a sub-strand (soft delete)
 */
export const deleteSubStrand = async (id: string): Promise<void> => {
  const url = `${API_URL}/api/v1/curriculum/sub-strands/${id}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete sub-strand');
  }
};

/**
 * GET /api/v1/curriculum/sub-strands/:id/competencies
 * Get competencies for a sub-strand
 */
export const getCompetencies = async (subStrandId: string, filters?: {
  is_active?: boolean;
}): Promise<CompetenciesResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
  
  const queryString = params.toString();
  const url = `${API_URL}/api/v1/curriculum/sub-strands/${subStrandId}/competencies${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<CompetenciesResponse>(response);
};

/**
 * POST /api/v1/curriculum/competencies
 * Create a new competency
 */
export const createCompetency = async (payload: {
  sub_strand_id: string;
  name: string;
  description?: string;
  performance_indicators?: string[];
}): Promise<{ competency: Competency }> => {
  const url = `${API_URL}/api/v1/curriculum/competencies`;
  const response = await fetch(url, getFetchOptions('POST', payload));
  return handleResponse<{ competency: Competency }>(response);
};

/**
 * DELETE /api/v1/curriculum/competencies/:id
 * Delete a competency (soft delete)
 */
export const deleteCompetency = async (id: string): Promise<void> => {
  const url = `${API_URL}/api/v1/curriculum/competencies/${id}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete competency');
  }
};

/**
 * GET /api/v1/curriculum/tree/:grade
 * Get full curriculum tree for a grade (used by assessment entry)
 */
export const getCurriculumTree = async (grade: string): Promise<CurriculumTreeResponse> => {
  const encodedGrade = encodeURIComponent(grade);
  const url = `${API_URL}/api/v1/curriculum/tree/${encodedGrade}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<CurriculumTreeResponse>(response);
};

/**
 * POST /api/v1/curriculum/seed-cbc
 * Seed national CBC curriculum (super_admin only)
 */
export const seedCBCCurriculum = async (): Promise<SeedResponse> => {
  const url = `${API_URL}/api/v1/curriculum/seed-cbc`;
  const response = await fetch(url, getFetchOptions('POST'));
  return handleResponse<SeedResponse>(response);
};

// ==================== Constants ====================

export const VALID_GRADES = [
  'PP1','PP2',
  'Grade 1','Grade 2','Grade 3',
  'Grade 4','Grade 5','Grade 6',
  'Grade 7','Grade 8','Grade 9',
  'Grade 10','Grade 11','Grade 12',
] as const;

export type ValidGrade = typeof VALID_GRADES[number];

export const GRADE_BANDS: Record<string, string> = {
  PP1: 'ecde',
  PP2: 'ecde',
  'Grade 1': 'lower_primary',
  'Grade 2': 'lower_primary',
  'Grade 3': 'lower_primary',
  'Grade 4': 'upper_primary',
  'Grade 5': 'upper_primary',
  'Grade 6': 'upper_primary',
  'Grade 7': 'junior_secondary',
  'Grade 8': 'junior_secondary',
  'Grade 9': 'junior_secondary',
  'Grade 10': 'senior_secondary',
  'Grade 11': 'senior_secondary',
  'Grade 12': 'senior_secondary',
};

export const GRADE_BAND_LABELS: Record<string, string> = {
  ecde: 'Early Childhood Development',
  lower_primary: 'Lower Primary',
  upper_primary: 'Upper Primary',
  junior_secondary: 'Junior Secondary',
  senior_secondary: 'Senior Secondary',
};
