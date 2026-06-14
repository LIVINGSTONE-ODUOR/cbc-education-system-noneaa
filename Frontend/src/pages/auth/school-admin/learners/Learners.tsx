'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Loader2,
  AlertCircle,
  Users,
  UserCheck,
  User,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Filter,
  BookOpen,
  Trash2,
  Upload,
  BarChart3,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getLearners } from '@/lib/api/learnersApi';
import type { Learner } from './Learners';
import { cn } from '@/lib/utils';

interface ParentInfo {
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  occupation?: string;
}

interface LearnerParent {
  id: string;
  relationship: string;
  is_primary: boolean;
  parents: ParentInfo | null;
}

interface Learner {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  date_of_birth: string | null;
  grade_level: string;
  stream_name: string | null;
  gender: string;
  special_needs: boolean | null;
  is_active: boolean;
  created_at: string;
  learner_parents: LearnerParent[] | null;
  parent?: ParentInfo | null;
}

interface FetchOptions {
  search?: string;
  grade_level?: string;
  gender?: string;
  is_active?: string;
  page?: number;
  pageSize?: number;
  retryCount?: number;
}

interface ApiResponse {
  data?: Learner[];
  students?: Learner[];
  total: number;
  page: number;
  pageSize: number;
}

interface CacheEntry {
  data: ApiResponse;
  timestamp: number;
}

const GRADES = [
  'PP1',
  'PP2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const CACHE_DURATION = 5 * 60 * 1000;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// ✅ IMPROVED: Get primary parent with better null handling
const getPrimaryParent = (learnerParents: Learner['learner_parents']): ParentInfo | null => {
  if (!learnerParents || learnerParents.length === 0) return null;

  // Find primary parent
  const primaryParent = learnerParents.find((lp) => lp.is_primary);
  if (primaryParent?.parents) return primaryParent.parents;

  // Fallback to first parent if no primary
  return learnerParents[0]?.parents ?? null;
};

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

const getAvatarColor = (id: string) => {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-green-100 text-green-700',
    'bg-pink-100 text-pink-700',
    'bg-yellow-100 text-yellow-700',
    'bg-indigo-100 text-indigo-700',
    'bg-orange-100 text-orange-700',
    'bg-cyan-100 text-cyan-700',
  ];
  return colors[id.charCodeAt(0) % colors.length];
};

const formatDateOfBirth = (dob: string): string => {
  try {
    return new Date(dob).toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
};

const getPaginationPages = (currentPage: number, totalPages: number): (number | '…')[] => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
  );
  return pages.reduce<(number | '…')[]>((acc, p, idx, arr) => {
    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
    acc.push(p);
    return acc;
  }, []);
};

const exportToCsv = (students: Learner[]) => {
  const headers = [
    'Adm. No',
    'First Name',
    'Last Name',
    'Grade',
    'Stream',
    'Gender',
    'Date of Birth',
    'Status',
    'Guardian Name',
    'Guardian Phone',
    'Guardian Email',
    'Guardian Relationship',
  ];

  const rows = students.map((s) => {
    const parent = getPrimaryParent(s.learner_parents);
    return [
      s.admission_number,
      s.first_name,
      s.last_name,
      s.grade_level,
      s.stream_name ?? '',
      s.gender,
      s.date_of_birth ?? '',
      s.is_active ? 'Active' : 'Inactive',
      parent ? `${parent.first_name} ${parent.last_name}` : '',
      parent?.phone_number ?? '',
      parent?.email ?? '',
      parent?.occupation ?? '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
  });

  const today = new Date().toISOString().split('T')[0];
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `learners_${today}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

class ApiCacheManager {
  private cache = new Map<string, CacheEntry>();

  generateKey(options: FetchOptions): string {
    return JSON.stringify({
      search: options.search || '',
      grade_level: options.grade_level || '',
      gender: options.gender || '',
      is_active: options.is_active || '',
      page: options.page || 1,
      pageSize: options.pageSize || 1000,
    });
  }

  get(options: FetchOptions): ApiResponse | null {
    const key = this.generateKey(options);
    const entry = this.cache.get(key);

    if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
      return entry.data;
    }

    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  set(options: FetchOptions, data: ApiResponse): void {
    const key = this.generateKey(options);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const apiCache = new ApiCacheManager();

const retryWithBackoff = async (
  fn: () => Promise<ApiResponse>,
  attempt = 0
): Promise<ApiResponse> => {
  try {
    return await fn();
  } catch (error) {
    if (attempt < RETRY_ATTEMPTS) {
      const delay = RETRY_DELAY * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(fn, attempt + 1);
    }
    throw error;
  }
};

const StudentManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [students, setStudents] = useState<Learner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [retrying, setRetrying] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const fetchStudents = useCallback(
    async (forceRefresh = false) => {
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);
        setRetrying(false);

        if (!user?.schoolId) {
          setError('School ID not found. Please login again.');
          setLoading(false);
          return;
        }

        const fetchOptions: FetchOptions = {
          search: searchTerm || undefined,
          grade_level: selectedGrade !== 'all' ? selectedGrade : undefined,
          gender: selectedGender !== 'all' ? selectedGender : undefined,
          is_active:
            selectedStatus !== 'all'
              ? selectedStatus === 'active'
                ? 'true'
                : 'false'
              : undefined,
          page: 1,
          pageSize: 1000,
        };

        if (!forceRefresh) {
          const cachedData = apiCache.get(fetchOptions);
          if (cachedData) {
            const data = cachedData.data || cachedData.students || [];
            setStudents(Array.isArray(data) ? data : []);
            setLastUpdated(new Date());
            setLoading(false);
            return;
          }
        }

        const response = await retryWithBackoff(() =>
          getLearners({
            ...fetchOptions,
            signal: abortControllerRef.current?.signal,
          } as any)
        );

        const studentData = response.data || response.students || [];
        if (!Array.isArray(studentData)) {
          throw new Error('Invalid response format from server');
        }

        setStudents(studentData);
        apiCache.set(fetchOptions, response);
        setLastUpdated(new Date());

        toast({
          title: 'Success',
          description: `Loaded ${studentData.length} learners`,
          duration: 2000,
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Fetch request cancelled');
          return;
        }

        console.error('Error fetching students:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load students. Please try again.';
        setError(errorMessage);

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        setRetrying(false);
      }
    },
    [user?.schoolId, searchTerm, selectedGrade, selectedStatus, selectedGender, toast]
  );

  useEffect(() => {
    void fetchStudents();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStudents]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGrade, selectedStatus, selectedGender, pageSize]);

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          fullName.includes(searchTerm.toLowerCase()) ||
          student.admission_number.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGrade = selectedGrade === 'all' || student.grade_level === selectedGrade;
        const matchesStatus =
          selectedStatus === 'all' ||
          (selectedStatus === 'active' && student.is_active) ||
          (selectedStatus === 'inactive' && !student.is_active);
        const matchesGender =
          selectedGender === 'all' || student.gender.toLowerCase() === selectedGender;
        return matchesSearch && matchesGrade && matchesStatus && matchesGender;
      }),
    [students, searchTerm, selectedGrade, selectedStatus, selectedGender]
  );

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const pagedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.is_active).length;
  const inactiveStudents = totalStudents - activeStudents;
  const maleStudents = students.filter((s) => s.gender.toLowerCase() === 'male').length;
  const femaleStudents = students.filter((s) => s.gender.toLowerCase() === 'female').length;

  // Chart data derived from real student records
  const genderChartData = useMemo(() => {
    const data: { name: string; value: number; color: string }[] = [];
    if (maleStudents > 0) data.push({ name: 'Boys', value: maleStudents, color: '#3b82f6' });
    if (femaleStudents > 0) data.push({ name: 'Girls', value: femaleStudents, color: '#ec4899' });
    const other = totalStudents - maleStudents - femaleStudents;
    if (other > 0) data.push({ name: 'Other', value: other, color: '#94a3b8' });
    return data;
  }, [maleStudents, femaleStudents, totalStudents]);

  const statusChartData = useMemo(() => {
    const data: { name: string; value: number; color: string }[] = [];
    if (activeStudents > 0) data.push({ name: 'Active', value: activeStudents, color: '#10b981' });
    if (inactiveStudents > 0) data.push({ name: 'Inactive', value: inactiveStudents, color: '#ef4444' });
    return data;
  }, [activeStudents, inactiveStudents]);

  const gradeDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      const grade = s.grade_level || 'Unknown';
      counts[grade] = (counts[grade] || 0) + 1;
    });
    const gradeOrder = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
    return gradeOrder
      .filter((g) => counts[g])
      .map((g) => ({ grade: g, count: counts[g] }));
  }, [students]);

  const genderPerGradeData = useMemo(() => {
    const data: Record<string, { grade: string; boys: number; girls: number }> = {};
    students.forEach((s) => {
      const grade = s.grade_level || 'Unknown';
      if (!data[grade]) data[grade] = { grade, boys: 0, girls: 0 };
      if (s.gender.toLowerCase() === 'male') data[grade].boys++;
      else if (s.gender.toLowerCase() === 'female') data[grade].girls++;
    });
    const gradeOrder = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
    return gradeOrder.filter((g) => data[g]).map((g) => data[g]);
  }, [students]);

  const schoolGenderPercent = useMemo(() => {
    if (totalStudents === 0) return { boysPercent: 0, girlsPercent: 0 };
    return {
      boysPercent: Math.round((maleStudents / totalStudents) * 100),
      girlsPercent: Math.round((femaleStudents / totalStudents) * 100),
    };
  }, [maleStudents, femaleStudents, totalStudents]);

  const gradeGenderPercent = useMemo(() => {
    const data: { grade: string; boys: number; girls: number; total: number; boysPercent: number; girlsPercent: number }[] = [];
    const counts: Record<string, { boys: number; girls: number; total: number }> = {};
    students.forEach((s) => {
      const grade = s.grade_level || 'Unknown';
      if (!counts[grade]) counts[grade] = { boys: 0, girls: 0, total: 0 };
      counts[grade].total++;
      if (s.gender.toLowerCase() === 'male') counts[grade].boys++;
      else if (s.gender.toLowerCase() === 'female') counts[grade].girls++;
    });
    const gradeOrder = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
    gradeOrder.forEach((g) => {
      if (counts[g]) {
        const c = counts[g];
        data.push({
          grade: g,
          boys: c.boys,
          girls: c.girls,
          total: c.total,
          boysPercent: Math.round((c.boys / c.total) * 100),
          girlsPercent: Math.round((c.girls / c.total) * 100),
        });
      }
    });
    return data;
  }, [students]);

  const streamGenderPercent = useMemo(() => {
    const counts: Record<string, { boys: number; girls: number; total: number }> = {};
    students.forEach((s) => {
      const stream = s.stream_name?.trim() || 'No Stream';
      if (!counts[stream]) counts[stream] = { boys: 0, girls: 0, total: 0 };
      counts[stream].total++;
      if (s.gender.toLowerCase() === 'male') counts[stream].boys++;
      else if (s.gender.toLowerCase() === 'female') counts[stream].girls++;
    });
    return Object.entries(counts)
      .map(([stream, c]) => ({
        stream,
        boys: c.boys,
        girls: c.girls,
        total: c.total,
        boysPercent: Math.round((c.boys / c.total) * 100),
        girlsPercent: Math.round((c.girls / c.total) * 100),
      }))
      .sort((a, b) => b.total - a.total);
  }, [students]);

  const hasActiveFilters =
    searchTerm || selectedGrade !== 'all' || selectedStatus !== 'all' || selectedGender !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGrade('all');
    setSelectedStatus('all');
    setSelectedGender('all');
    setShowFilters(false);
  };

  const handleRefresh = async () => {
    setRetrying(true);
    await fetchStudents(true);
  };

  const handleDeactivateStudent = async () => {
    if (!selectedStudentId) return;

    try {
      const response = await fetch(`/api/v1/learners/${selectedStudentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('cbe_access_token')}`,
        },
        body: JSON.stringify({ is_active: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate student');
      }

      setStudents((prev) =>
        prev.map((s) => (s.id === selectedStudentId ? { ...s, is_active: false } : s))
      );

      toast({
        title: 'Success',
        description: 'Student deactivated successfully',
      });

      setDeleteDialogOpen(false);
      setSelectedStudentId(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate student',
        variant: 'destructive',
      });
    }
  };

  if (loading && !students.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-lg font-medium text-slate-900">Loading students...</p>
          <p className="text-sm text-slate-500">This may take a moment...</p>
        </div>
      </div>
    );
  }

  if (error && !students.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md w-full border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-600" />
            <div>
              <p className="font-semibold text-red-900 mb-1">Unable to Load Students</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => void handleRefresh()}
                disabled={retrying}
                className="bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                {retrying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </>
                )}
              </Button>
              <Button onClick={() => navigate(-1)} variant="outline">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            All Students
          </h1>
          <p className="text-slate-600">
            View and manage every enrolled learner across all grades and classes
          </p>
          {lastUpdated && (
            <p className="text-xs text-slate-500">
              Last updated: {lastUpdated.toLocaleTimeString('en-KE')}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            disabled={loading || retrying}
            className="border-slate-200 hover:bg-slate-100 gap-2 h-10"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${loading || retrying ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCsv(filteredStudents)}
            disabled={filteredStudents.length === 0}
            className="border-slate-200 hover:bg-slate-100 gap-2 h-10"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          {/* ✅ NEW: Bulk Import Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/school-admin/learners/bulk-import')}
            className="border-slate-200 hover:bg-slate-100 gap-2 h-10 border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Bulk Import</span>
          </Button>
          <Button
            onClick={() => navigate('/school-admin/learners/add')}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10 px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Student</span>
          </Button>
        </div>
      </div>

      {/* Error Alert for partial load */}
      {error && students.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-yellow-700 font-medium">Warning</p>
            <p className="text-sm text-yellow-600 mt-1">{error}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleRefresh()}
            disabled={loading || retrying}
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-100 ml-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Students</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{totalStudents}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{activeStudents}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Boys</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{maleStudents}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Girls</p>
                <p className="text-3xl font-bold text-pink-600 mt-2">{femaleStudents}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                <User className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Visualization Charts */}
      {totalStudents > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Gender Distribution - Donut */}
          <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-blue-100 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                </div>
                Boys vs Girls
              </CardTitle>
              <CardDescription className="text-xs">Gender distribution</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              {genderChartData.length > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-[120px] h-[120px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={genderChartData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {genderChartData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                        </Pie>
                        <Tooltip formatter={(val: number) => [val, 'Students']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {genderChartData.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
                          <span className="text-xs text-slate-600">{entry.name}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{entry.value}</span>
                      </div>
                    ))}
                    <div className="pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Ratio</span>
                        <span className="text-xs font-bold text-slate-700">{maleStudents}:{femaleStudents}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No data</p>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution - Donut */}
          <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-emerald-100 flex items-center justify-center">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                Enrollment Status
              </CardTitle>
              <CardDescription className="text-xs">Active vs Inactive</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              {statusChartData.length > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-[120px] h-[120px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {statusChartData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                        </Pie>
                        <Tooltip formatter={(val: number) => [val, 'Students']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {statusChartData.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
                          <span className="text-xs text-slate-600">{entry.name}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{entry.value}</span>
                      </div>
                    ))}
                    <div className="pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Active Rate</span>
                        <span className="text-xs font-bold text-emerald-600">{Math.round((activeStudents / Math.max(totalStudents, 1)) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No data</p>
              )}
            </CardContent>
          </Card>

          {/* Students per Grade - Bar Chart */}
          <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-purple-100 flex items-center justify-center">
                  <BarChart3 className="h-3.5 w-3.5 text-purple-600" />
                </div>
                Students per Grade
              </CardTitle>
              <CardDescription className="text-xs">Enrollment count by grade level</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              {gradeDistributionData.length > 0 ? (
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeDistributionData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="grade" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(val: number) => [val, 'Students']} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No grade data</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Boys vs Girls per Grade - Grouped Bar */}
      {genderPerGradeData.length > 1 && (
        <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-indigo-100 flex items-center justify-center">
                <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              Boys vs Girls per Grade
            </CardTitle>
            <CardDescription className="text-xs">Gender comparison across each grade level</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genderPerGradeData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="grade" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="boys" name="Boys" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="girls" name="Girls" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gender Percentage Breakdown */}
      {totalStudents > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Per School */}
          <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-blue-100 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                </div>
                Gender % — School
              </CardTitle>
              <CardDescription className="text-xs">Overall gender percentage across the school</CardDescription>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Boys</span>
                  <span className="font-bold text-blue-600">{schoolGenderPercent.boysPercent}% ({maleStudents})</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${schoolGenderPercent.boysPercent}%` }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Girls</span>
                  <span className="font-bold text-pink-600">{schoolGenderPercent.girlsPercent}% ({femaleStudents})</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-pink-500 transition-all" style={{ width: `${schoolGenderPercent.girlsPercent}%` }} />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 text-center">
                Total: {totalStudents} students
              </div>
            </CardContent>
          </Card>

          {/* Per Class (Grade) */}
          <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-purple-100 flex items-center justify-center">
                  <GraduationCap className="h-3.5 w-3.5 text-purple-600" />
                </div>
                Gender % — Per Class
              </CardTitle>
              <CardDescription className="text-xs">Boys and girls percentage in each grade</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              {gradeGenderPercent.length > 0 ? (
                <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                  {gradeGenderPercent.map((g) => (
                    <div key={g.grade} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">{g.grade}</span>
                        <span className="text-[10px] text-slate-400">{g.total} students</span>
                      </div>
                      <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${g.boysPercent}%` }} title={`Boys: ${g.boysPercent}%`} />
                        <div className="h-full bg-pink-500 transition-all" style={{ width: `${g.girlsPercent}%` }} title={`Girls: ${g.girlsPercent}%`} />
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-blue-600 font-medium">Boys {g.boysPercent}% ({g.boys})</span>
                        <span className="text-pink-600 font-medium">Girls {g.girlsPercent}% ({g.girls})</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No class data</p>
              )}
            </CardContent>
          </Card>

          {/* Per Stream */}
          <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-emerald-100 flex items-center justify-center">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                Gender % — Per Stream
              </CardTitle>
              <CardDescription className="text-xs">Boys and girls percentage in each stream</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              {streamGenderPercent.length > 0 ? (
                <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                  {streamGenderPercent.map((s) => (
                    <div key={s.stream} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">{s.stream}</span>
                        <span className="text-[10px] text-slate-400">{s.total} students</span>
                      </div>
                      <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${s.boysPercent}%` }} title={`Boys: ${s.boysPercent}%`} />
                        <div className="h-full bg-pink-500 transition-all" style={{ width: `${s.girlsPercent}%` }} title={`Girls: ${s.girlsPercent}%`} />
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-blue-600 font-medium">Boys {s.boysPercent}% ({s.boys})</span>
                        <span className="text-pink-600 font-medium">Girls {s.girlsPercent}% ({s.girls})</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No stream data</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters Card */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="pt-6 pb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by student name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-10 h-11 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
              disabled={loading}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Collapsible Filters */}
          <div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'gap-2 border-slate-200 text-slate-700 hover:bg-slate-100',
                hasActiveFilters && 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100'
              )}
              disabled={loading}
            >
              <Filter className="h-4 w-4" />
              Advanced Filters
              {hasActiveFilters && <span className="text-xs font-bold ml-1">●</span>}
            </Button>
          </div>

          {/* Expandable Filter Panel */}
          {showFilters && (
            <div className="border-t border-slate-200 pt-4 space-y-3 bg-slate-50 p-4 -mx-6 mb-0 rounded-b-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={loading}>
                    <SelectTrigger className="h-10 bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Grade Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Grade</label>
                  <Select value={selectedGrade} onValueChange={setSelectedGrade} disabled={loading}>
                    <SelectTrigger className="h-10 bg-white border-slate-200">
                      <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {GRADES.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gender Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Gender</label>
                  <Select value={selectedGender} onValueChange={setSelectedGender} disabled={loading}>
                    <SelectTrigger className="h-10 bg-white border-slate-200">
                      <SelectValue placeholder="All Genders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 gap-2"
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students Table Card */}
      <Card className="border-slate-200 bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Student Directory
              </CardTitle>
              <CardDescription className="mt-1">
                Showing{' '}
                <span className="font-semibold text-slate-900">{filteredStudents.length}</span> of{' '}
                <span className="font-semibold text-slate-900">{totalStudents}</span> students
                {hasActiveFilters && (
                  <span className="ml-2 text-blue-600">
                    ({((filteredStudents.length / totalStudents) * 100).toFixed(0)}% filtered)
                  </span>
                )}
              </CardDescription>
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v))}
                disabled={loading}
              >
                <SelectTrigger className="w-24 h-9 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 relative">
          {loading && students.length > 0 && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg z-10">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          )}

          {pagedStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-slate-700 h-12">#</TableHead>
                    <TableHead className="font-semibold text-slate-700 h-12">Student</TableHead>
                    <TableHead className="font-semibold text-slate-700 h-12">Adm. No</TableHead>
                    <TableHead className="font-semibold text-slate-700 h-12">Grade / Class</TableHead>
                    <TableHead className="font-semibold text-slate-700 h-12">Gender</TableHead>
                    <TableHead className="font-semibold text-slate-700 h-12">Guardian</TableHead>
                    <TableHead className="font-semibold text-slate-700 h-12">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700 h-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedStudents.map((student, idx) => {
                    const parent = getPrimaryParent(student.learner_parents);
                    const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <TableRow
                        key={student.id}
                        className={cn(
                          'border-b border-slate-100 hover:bg-blue-50/50 transition-colors',
                          idx % 2 === 0 && 'bg-white',
                          idx % 2 === 1 && 'bg-slate-50'
                        )}
                      >
                        {/* Row Number */}
                        <TableCell className="text-slate-500 text-sm font-medium py-4">
                          {rowNumber}
                        </TableCell>

                        {/* Student Info */}
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm',
                                getAvatarColor(student.id)
                              )}
                            >
                              {getInitials(student.first_name, student.last_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">
                                {student.first_name}
                                {student.middle_name ? ` ${student.middle_name}` : ''} {student.last_name}
                              </p>
                              {student.date_of_birth && (
                                <p className="text-xs text-slate-500">
                                  {formatDateOfBirth(student.date_of_birth)}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Admission Number */}
                        <TableCell className="py-4 font-mono text-sm font-medium text-slate-700">
                          {student.admission_number}
                        </TableCell>

                        {/* Grade / Stream */}
                        <TableCell className="py-4">
                          <div>
                            <p className="font-medium text-slate-900">{student.grade_level}</p>
                            {student.stream_name && (
                              <p className="text-xs text-slate-500">{student.stream_name}</p>
                            )}
                          </div>
                        </TableCell>

                        {/* Gender */}
                        <TableCell className="py-4 capitalize text-slate-700 text-sm">
                          {student.gender}
                        </TableCell>

                        {/* ✅ IMPROVED Guardian Cell */}
                        <TableCell className="py-4">
                          {parent ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                <span className="text-sm font-medium text-slate-900 truncate max-w-[160px]">
                                  {parent.first_name} {parent.last_name}
                                </span>
                              </div>
                              {parent.phone_number && (
                                <p className="text-xs text-slate-500 ml-6 truncate max-w-[160px]">
                                  📱 {parent.phone_number}
                                </p>
                              )}
                              {parent.email && (
                                <p className="text-xs text-slate-400 ml-6 truncate max-w-[160px]">
                                  {parent.email}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400 italic">Not assigned</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-4">
                          <Badge
                            className={cn(
                              'font-medium',
                              student.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-100'
                            )}
                          >
                            {student.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/school-admin/learners/profile?id=${student.id}`)
                                }
                                className="gap-2 cursor-pointer"
                              >
                                <Eye className="h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/school-admin/learners/add?edit=${student.id}`)
                                }
                                className="gap-2 cursor-pointer"
                              >
                                <Edit className="h-4 w-4" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/school-admin/learners/classes?student=${student.id}`)
                                }
                                className="gap-2 cursor-pointer"
                              >
                                <BookOpen className="h-4 w-4" />
                                View Classes
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {student.is_active && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedStudentId(student.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="gap-2 cursor-pointer text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16 px-6">
              <div className="space-y-3">
                <GraduationCap className="h-12 w-12 mx-auto text-slate-300" />
                <p className="text-slate-700 font-medium text-lg">
                  {hasActiveFilters ? 'No students match your filters.' : 'No students enrolled yet.'}
                </p>
                <p className="text-slate-500 text-sm">
                  {hasActiveFilters
                    ? 'Try adjusting your search terms or filters.'
                    : 'Get started by enrolling your first student.'}
                </p>
                {!hasActiveFilters && (
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={() => navigate('/school-admin/learners/add')}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Student
                    </Button>
                    <Button
                      onClick={() => navigate('/school-admin/learners/bulk-import')}
                      variant="outline"
                      className="mt-4 gap-2 border-blue-300 text-blue-700"
                    >
                      <Upload className="h-4 w-4" />
                      Bulk Import
                    </Button>
                  </div>
                )}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="mt-4 border-slate-300 text-slate-700"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {filteredStudents.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600 bg-white rounded-lg p-4 border border-slate-200">
          <p>
            Showing{' '}
            <span className="font-semibold text-slate-900">
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredStudents.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-900">{filteredStudents.length}</span> student
            {filteredStudents.length !== 1 ? 's' : ''}
            {inactiveStudents > 0 && (
              <span className="ml-2 text-slate-500">({inactiveStudents} inactive)</span>
            )}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="border-slate-200 gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {getPaginationPages(currentPage, totalPages).map((item, idx) =>
                item === '…' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-500">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={currentPage === item ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0 text-xs"
                    onClick={() => setCurrentPage(item as number)}
                    disabled={loading}
                  >
                    {item}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="border-slate-200 gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Deactivate Student</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate this student? They will no longer appear in active student lists but their records will be preserved.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateStudent}
              className="bg-red-600 hover:bg-red-700"
            >
              Deactivate
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentManagement;

