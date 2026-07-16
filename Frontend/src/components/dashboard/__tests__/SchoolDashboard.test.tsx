/**
 * Unit tests for SchoolDashboard component
 *
 * Covers all states:
 * - Loading state (initial render)
 * - Error state (API failure)
 * - Empty state (no data from API)
 * - Populated main dashboard
 * - 401 redirect
 * - Retry on error
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SchoolDashboard from '../SchoolDashboard';

// ── Module-level mocks (Vitest hoists these to top of file) ──────

const mockUser = {
  id: 'user-1',
  email: 'admin@school.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'school_admin',
  schoolId: 'school-1',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Test data ────────────────────────────────────────────────────

const mockStats = {
  school_id: 'school-1',
  total_learners: 450,
  active_learners: 420,
  total_teachers: 28,
  active_teachers: 26,
  total_classes: 15,
  average_score: 68.5,
  attendance_rate: 92.3,
  active_term_name: 'Term 1',
};

const mockActivities = [
  { id: '1', school_id: 'school-1', user_id: 'u1', activity_type: 'learner_added', description: 'New student enrolled', metadata: {}, created_at: new Date().toISOString() },
  { id: '2', school_id: 'school-1', user_id: 'u2', activity_type: 'assessment_saved', description: 'Math assessment saved', metadata: {}, created_at: new Date(Date.now() - 3600000).toISOString() },
];

const mockGradeDistribution = [
  { grade_code: 'EE', count: 120, percentage: 26.7 },
  { grade_code: 'AE', count: 180, percentage: 40.0 },
  { grade_code: 'ME', count: 100, percentage: 22.2 },
  { grade_code: 'BE', count: 50, percentage: 11.1 },
];

const mockPerformers = [
  { learner_id: 'l1', first_name: 'Alice', last_name: 'Wanjiku', admission_number: 'ADM001', class_id: 'c1', class_name: 'Grade 5A', academic_term_id: 't1', average_score: 92.5, overall_grade: 'EE', class_rank: 1 },
  { learner_id: 'l2', first_name: 'Bob', last_name: 'Kamau', admission_number: 'ADM002', class_id: 'c1', class_name: 'Grade 5A', academic_term_id: 't1', average_score: 88.0, overall_grade: 'AE', class_rank: 2 },
];

// ── Helpers ──────────────────────────────────────────────────────

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function mockApiSuccess(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data }),
  };
}

function mockApiAll(populated: boolean) {
  if (populated) {
    return vi.fn()
      .mockResolvedValueOnce(mockApiSuccess(mockStats))
      .mockResolvedValueOnce(mockApiSuccess(mockActivities))
      .mockResolvedValueOnce(mockApiSuccess(mockGradeDistribution))
      .mockResolvedValueOnce(mockApiSuccess(mockPerformers))
      .mockResolvedValueOnce(mockApiSuccess(mockPerformers));
  }
  // Empty data — use proper types for each endpoint:
  // stats -> {}, activities -> [], distribution -> [], performers -> []
  return vi.fn()
    .mockResolvedValueOnce(mockApiSuccess({}))
    .mockResolvedValueOnce(mockApiSuccess([]))
    .mockResolvedValueOnce(mockApiSuccess([]))
    .mockResolvedValueOnce(mockApiSuccess([]))
    .mockResolvedValueOnce(mockApiSuccess([]));
}

// ── Setup / Teardown ─────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────

describe('SchoolDashboard', () => {
  it('shows loading state on initial render', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {}) // never resolves — keeps loading
    );

    renderWithProviders(<SchoolDashboard />);

    expect(screen.getByText('Loading Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Fetching your school data...')).toBeInTheDocument();
  });

  it('shows error state when API calls fail', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Failed to fetch'));

    renderWithProviders(<SchoolDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('shows empty state when school has no data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockApiSuccess({}));

    renderWithProviders(<SchoolDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to Your Dashboard!')).toBeInTheDocument();
    });

    expect(screen.getByText('Add Learners')).toBeInTheDocument();
    expect(screen.getByText('Add Teachers')).toBeInTheDocument();
    expect(screen.getByText('Create Classes')).toBeInTheDocument();
  });

  it('shows main populated dashboard with KPI cards and charts', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(mockApiAll(true));

    renderWithProviders(<SchoolDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/John/)).toBeInTheDocument();
    });

    // KPI cards
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('68.5%')).toBeInTheDocument();

    // Term badge
    expect(screen.getByText('Term 1')).toBeInTheDocument();

    // Quick actions
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('redirects to login on 401 API response', async () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    // Simulate 401
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: 'Invalid token' }),
    });

    // Mock window.location.href
    const originalLocation = window.location;
    // @ts-expect-error - we need to override href for the test
    delete window.location;
    window.location = { ...originalLocation, href: '' };

    renderWithProviders(<SchoolDashboard />);

    await waitFor(() => {
      expect(removeItemSpy).toHaveBeenCalledWith('cbe_access_token');
      expect(removeItemSpy).toHaveBeenCalledWith('cbe_refresh_token');
    });

    // Restore
    window.location = originalLocation;
  });

  it('retries fetch when Try Again is clicked after error', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    // The component makes 5 parallel fetch calls per load attempt.
    // Initial load: all 5 reject -> Promise.all rejects -> error state
    for (let i = 0; i < 5; i++) {
      fetchSpy.mockRejectedValueOnce(new Error('Failed to fetch'));
    }
    // Retry (after clicking Try Again): 5 parallel calls resolve with empty data
    fetchSpy.mockResolvedValueOnce(mockApiSuccess({}));  // stats
    fetchSpy.mockResolvedValueOnce(mockApiSuccess([]));  // activities
    fetchSpy.mockResolvedValueOnce(mockApiSuccess([]));  // grade distribution
    fetchSpy.mockResolvedValueOnce(mockApiSuccess([]));  // top performers
    fetchSpy.mockResolvedValueOnce(mockApiSuccess([]));  // bottom performers

    renderWithProviders(<SchoolDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Dashboard')).toBeInTheDocument();
    });

    const tryAgainButton = screen.getByText('Try Again');
    await userEvent.click(tryAgainButton);

    await waitFor(() => {
      expect(screen.getByText('Welcome to Your Dashboard!')).toBeInTheDocument();
    });
  });

});
