/**
 * Academic Terms API Service (read access)
 *
 * NOTE: In this backend, each row of the `academic_years` table represents a
 * single "Term" (e.g. "Term 1 2026") and carries its own `year` number. The
 * "Academic Year" concept shown to users is simply the distinct set of
 * `year` values across a school's terms — see academicTermsController.js and
 * Frontend/src/pages/Calendar/Calendar.tsx (Term Management), which this
 * client mirrors.
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

const authHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface AcademicTerm {
  id: string;
  school_id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
  created_at: string;
}

/**
 * GET /api/v1/academic-terms/school/:school_id
 * Returns every term (row) for the school; group by `year` client-side to
 * build the "Academic Year" dropdown.
 */
export const getAcademicTerms = async (schoolId: string): Promise<AcademicTerm[]> => {
  const response = await fetch(`${API_URL}/api/v1/academic-terms/school/${schoolId}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch academic years / terms');
  }

  const data = await response.json();
  return data.data || [];
};
