/**
 * Fee Structure API Service
 * Handles all HTTP requests to the fee-structures backend API
 */

// API URL - uses relative path in production (proxied by Vercel) to avoid CORS
const getApiUrl = (): string => {
  // Production: always use relative path → proxied by Vercel, no CORS
  if (import.meta.env.PROD) return '';
  // Development: use VITE_API_URL if set, otherwise fall back to Vite proxy
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
};

const API_URL = getApiUrl();
console.log('[feeStructureApi] API_URL:', API_URL, 'PROD:', import.meta.env.PROD);

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('cbc_access_token');
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
  
  return data;
};

// ==================== Types ====================

export interface FeeStructure {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  grade_level: string | null;
  category: string;
  amount: number;
  frequency: string;
  description: string | null;
  is_mandatory: boolean;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  // Joined fields
  academic_year_name?: string;
  academic_year?: string;
}

export interface FeeStructureSummary {
  grade_level: string;
  fee_count: string;
  mandatory_total: string;
  optional_total: string;
  grand_total: string;
  mandatory_count: string;
  optional_count: string;
}

export interface FeeStructuresResponse {
  fee_structures: FeeStructure[];
  grouped_by_grade: Record<string, FeeStructure[]>;
  total: number;
}

export interface FeeStructureDetailResponse {
  fee_structure: FeeStructure;
}

export interface CreateFeeStructurePayload {
  academic_year_id: string;
  name: string;
  grade_level?: string;
  category: string;
  amount: number;
  frequency: string;
  description?: string;
  is_mandatory?: boolean;
}

export interface UpdateFeeStructurePayload {
  name?: string;
  grade_level?: string;
  category?: string;
  amount?: number;
  frequency?: string;
  description?: string;
  is_mandatory?: boolean;
  is_active?: boolean;
}

// ==================== API Functions ====================

/**
 * GET /api/v1/fee-structures
 * List all fee structures for the school
 */
export const getFeeStructures = async (filters?: {
  grade_level?: string;
  category?: string;
  academic_year_id?: string;
  is_active?: boolean;
  is_mandatory?: boolean;
}): Promise<FeeStructuresResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.grade_level) params.append('grade_level', filters.grade_level);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.academic_year_id) params.append('academic_year_id', filters.academic_year_id);
  if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
  if (filters?.is_mandatory !== undefined) params.append('is_mandatory', String(filters.is_mandatory));
  
  const queryString = params.toString();
  const url = `${API_URL}/api/v1/fee-structures${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<FeeStructuresResponse>(response);
};

/**
 * GET /api/v1/fee-structures/:id
 * Get a single fee structure by ID
 */
export const getFeeStructureById = async (id: string): Promise<FeeStructureDetailResponse> => {
  const url = `${API_URL}/api/v1/fee-structures/${id}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<FeeStructureDetailResponse>(response);
};

/**
 * GET /api/v1/fee-structures/summary
 * Get fee summary by grade
 */
export const getFeeStructuresSummary = async (academic_year_id?: string): Promise<{
  academic_year_id: string;
  summary_by_grade: FeeStructureSummary[];
  total_structures: number;
}> => {
  const params = academic_year_id ? `?academic_year_id=${academic_year_id}` : '';
  const url = `${API_URL}/api/v1/fee-structures/summary${params}`;
  const response = await fetch(url, getFetchOptions('GET'));
  return handleResponse<unknown>(response) as Promise<{
    academic_year_id: string;
    summary_by_grade: FeeStructureSummary[];
    total_structures: number;
  }>;
};

/**
 * POST /api/v1/fee-structures
 * Create a new fee structure
 */
export const createFeeStructure = async (payload: CreateFeeStructurePayload): Promise<{
  fee_structure: FeeStructure;
}> => {
  const url = `${API_URL}/api/v1/fee-structures`;
  const response = await fetch(url, getFetchOptions('POST', payload));
  return handleResponse<{ fee_structure: FeeStructure }>(response);
};

/**
 * PUT /api/v1/fee-structures/:id
 * Update a fee structure
 */
export const updateFeeStructure = async (
  id: string, 
  payload: UpdateFeeStructurePayload
): Promise<{ fee_structure: FeeStructure }> => {
  const url = `${API_URL}/api/v1/fee-structures/${id}`;
  const response = await fetch(url, getFetchOptions('PUT', payload));
  return handleResponse<{ fee_structure: FeeStructure }>(response);
};

/**
 * DELETE /api/v1/fee-structures/:id
 * Delete a fee structure (soft delete)
 */
export const deleteFeeStructure = async (id: string): Promise<void> => {
  const url = `${API_URL}/api/v1/fee-structures/${id}`;
  const response = await fetch(url, getFetchOptions('DELETE'));
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete fee structure');
  }
};

/**
 * POST /api/v1/fee-structures/duplicate-from-year
 * Duplicate fee structures from one academic year to another
 */
export const duplicateFromYear = async (payload: {
  source_academic_year_id: string;
  target_academic_year_id: string;
  adjust_percentage?: number;
}): Promise<unknown> => {
  const url = `${API_URL}/api/v1/fee-structures/duplicate-from-year`;
  const response = await fetch(url, getFetchOptions('POST', payload));
  return handleResponse<unknown>(response);
};

// ==================== Data Transformation ====================

/**
 * Map database category to UI key
 */
const mapCategoryToKey = (category: string): string | null => {
  const categoryMap: Record<string, string> = {
    'tuition': 'tuitionFee',
    'registration': 'admissionFee',
    'uniform': 'uniformFee',
    'books': 'booksNStationery',
    'stationery': 'booksNStationery',
    'activity': 'activityFee',
    'transport': 'transportFee',
    'boarding': 'boardingFee',
    'meals': 'boardingFee',
    'library': 'libraryFee',
    'medical': 'medicalFee',
    'health': 'medicalFee',
    'examination': 'examFee',
    'exam': 'examFee',
    'ict': 'ictFee',
    'technology': 'ictFee',
    'sports': 'sportsFee',
    'arts': 'artsFee',
    'music': 'artsFee',
    'other': 'activityFee',
  };
  
  return categoryMap[category.toLowerCase()] || null;
};

/**
 * Determine CBC level from grade
 */
const getLevelFromGrade = (grade: string): string => {
  const lowerPrimary = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3'];
  const upperPrimary = ['Grade 4', 'Grade 5', 'Grade 6'];
  const juniorSecondary = ['Grade 7', 'Grade 8', 'Grade 9'];
  const seniorSecondary = ['Grade 10', 'Grade 11', 'Grade 12'];
  
  if (lowerPrimary.includes(grade)) return 'Lower Primary';
  if (upperPrimary.includes(grade)) return 'Upper Primary';
  if (juniorSecondary.includes(grade)) return 'Junior Secondary';
  if (seniorSecondary.includes(grade)) return 'Senior Secondary';
  return 'Other';
};

/**
 * Transform API response to match FeeStructure component's data format
 * Maps database categories to UI fee keys
 */
export const transformFeeStructureToComponent = (
  apiFees: FeeStructure[]
): Record<string, unknown>[] => {
  // Group by grade level
  const groupedByGrade: Record<string, Record<string, unknown>> = {};
  
  for (const fee of apiFees) {
    const grade = fee.grade_level || 'All Grades';
    
    if (!groupedByGrade[grade]) {
      // Initialize with default values
      groupedByGrade[grade] = {
        id: grade.toLowerCase().replace(/\s+/g, ''),
        className: grade,
        level: getLevelFromGrade(grade),
        tuitionFee: 0,
        admissionFee: 0,
        uniformFee: 0,
        booksNStationery: 0,
        activityFee: 0,
        transportFee: 0,
        boardingFee: 0,
        libraryFee: 0,
        medicalFee: 0,
        examFee: 0,
        ictFee: 0,
        sportsFee: 0,
        artsFee: 0,
        totalStudents: 0,
        isBoarding: false,
      };
    }
    
    // Map category to UI key
    const key = mapCategoryToKey(fee.category);
    if (key) {
      groupedByGrade[grade][key] = Number(fee.amount);
    }
  }
  
  return Object.values(groupedByGrade);
};

/**
 * Transform component data to API payload for update
 */
export const transformComponentToApiPayload = (
  componentData: Record<string, unknown>,
  grade: string,
  academicYearId: string
): UpdateFeeStructurePayload[] => {
  const payloads: UpdateFeeStructurePayload[] = [];
  
  const keyToCategory: Record<string, string> = {
    tuitionFee: 'tuition',
    admissionFee: 'registration',
    uniformFee: 'uniform',
    booksNStationery: 'books',
    activityFee: 'activity',
    transportFee: 'transport',
    boardingFee: 'boarding',
    libraryFee: 'library',
    medicalFee: 'medical',
    examFee: 'examination',
    ictFee: 'ict',
    sportsFee: 'sports',
    artsFee: 'arts',
  };
  
  for (const [key, amount] of Object.entries(componentData)) {
    if (keyToCategory[key] && typeof amount === 'number' && amount > 0) {
      payloads.push({
        grade_level: grade,
        category: keyToCategory[key],
        amount: amount,
        frequency: 'per_term',
      });
    }
  }
  
  return payloads;
};
