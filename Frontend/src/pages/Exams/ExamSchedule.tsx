import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CalendarDays,
  Search,
  Loader2,
  AlertCircle,
  CalendarRange,
  RefreshCcw,
  Filter,
  ServerCrash,
} from 'lucide-react';

import { getClasses, ClassApiItem } from '@/lib/api/classApi';
import { getAcademicTerms, AcademicTerm } from '@/lib/api/academicTermsApi';
import { getExams, ExamApiItem, ExamType } from '@/lib/api/examApi';

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const examTypeBadgeStyles: Record<ExamType, string> = {
  CAT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'Mid-Term': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'End-Term': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  Mock: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  Final: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'dd MMM yyyy');
  } catch {
    return value;
  }
};

const classLabel = (cls: Pick<ClassApiItem, 'grade_level' | 'stream_name'>) =>
  cls.stream_name ? `${cls.grade_level} — ${cls.stream_name}` : `${cls.grade_level} (No Stream)`;

// ─────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────

const ExamSchedule: React.FC = () => {
  const [userData, setUserData] = useState<{ schoolId: string | null; role: string } | null>(
    null
  );

  // Reference data (fetched from backend — never hardcoded)
  const [classes, setClasses] = useState<ClassApiItem[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [loadingReferenceData, setLoadingReferenceData] = useState(true);
  const [referenceError, setReferenceError] = useState<string | null>(null);

  // Exams
  const [exams, setExams] = useState<ExamApiItem[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examsError, setExamsError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterTermId, setFilterTermId] = useState('all');
  const [filterGradeLevel, setFilterGradeLevel] = useState('all');
  const [filterClassId, setFilterClassId] = useState('all');

  // ── Load current user (school scoping) ──────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('cbe_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setUserData({ schoolId: user.schoolId || user.school_id || null, role: user.role });
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
  }, []);

  // ── Reference data: classes (grade/stream) + academic years/terms ──────
  const loadReferenceData = useCallback(async () => {
    if (!userData?.schoolId) return;
    setLoadingReferenceData(true);
    setReferenceError(null);
    try {
      const [classesRes, termsRes] = await Promise.all([
        getClasses({ is_active: 'true', limit: 200 }),
        getAcademicTerms(userData.schoolId),
      ]);
      setClasses(classesRes.data?.classes || []);
      setTerms(termsRes || []);
    } catch (error: any) {
      console.error('Failed to load reference data:', error);
      const message =
        error?.message || 'Could not load classes / academic years from the server.';
      setReferenceError(message);
      toast.error(message);
    } finally {
      setLoadingReferenceData(false);
    }
  }, [userData?.schoolId]);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  // ── Exams list ────────────────────────────────────────────────────────
  const loadExams = useCallback(async () => {
    setLoadingExams(true);
    setExamsError(null);
    try {
      const res = await getExams({
        search: search || undefined,
        term_id: filterTermId !== 'all' ? filterTermId : undefined,
        class_id: filterClassId !== 'all' ? filterClassId : undefined,
        grade_level: filterGradeLevel !== 'all' ? filterGradeLevel : undefined,
        limit: 200,
        sort_by: 'start_date',
        sort_order: 'asc',
      });
      setExams(res.data?.exams || []);
    } catch (error: any) {
      console.error('Failed to load exams:', error);
      const message = error?.message || 'Could not load exams. Check your connection and try again.';
      setExamsError(message);
      toast.error(message);
    } finally {
      setLoadingExams(false);
    }
  }, [search, filterTermId, filterClassId, filterGradeLevel]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadExams();
    }, 300);
    return () => clearTimeout(timeout);
  }, [loadExams]);

  // ── Derived reference lists ──────────────────────────────────────────────
  const academicYears = useMemo(
    () => Array.from(new Set(terms.map((t) => t.year))).sort((a, b) => b - a),
    [terms]
  );

  const termsForFilterYear = useMemo(
    () => (filterYear === 'all' ? terms : terms.filter((t) => String(t.year) === filterYear)),
    [terms, filterYear]
  );

  const gradeLevels = useMemo(
    () => Array.from(new Set(classes.map((c) => c.grade_level))).sort(),
    [classes]
  );

  const streamsForFilterGrade = useMemo(
    () =>
      filterGradeLevel === 'all'
        ? classes
        : classes.filter((c) => c.grade_level === filterGradeLevel),
    [classes, filterGradeLevel]
  );

  // ── Filter handlers that keep dependent filters consistent ─────────────
  const handleYearChange = (value: string) => {
    setFilterYear(value);
    setFilterTermId('all');
  };

  const handleGradeChange = (value: string) => {
    setFilterGradeLevel(value);
    setFilterClassId('all');
  };

  const hasActiveFilters =
    search ||
    filterYear !== 'all' ||
    filterTermId !== 'all' ||
    filterGradeLevel !== 'all' ||
    filterClassId !== 'all';

  const handleRefresh = () => {
    void loadReferenceData();
    void loadExams();
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exam Schedule</h1>
            <p className="text-sm text-gray-500">
              View examinations created in Exam Setup, ready for scheduling
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handleRefresh}
            disabled={loadingExams || loadingReferenceData}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${loadingExams ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {!loadingReferenceData && referenceError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{referenceError}</span>
          </CardContent>
        </Card>
      )}

      {!loadingReferenceData && !referenceError && (classes.length === 0 || terms.length === 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-amber-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>
              {classes.length === 0 &&
                'No classes found for your school — add classes under Administration → Classes. '}
              {terms.length === 0 &&
                'No academic years / terms found — add a term under Administration → Term Management.'}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="rounded-2xl border border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search exams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>

            <Select value={filterYear} onValueChange={handleYearChange}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Academic Years</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTermId} onValueChange={setFilterTermId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {termsForFilterYear.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterGradeLevel} onValueChange={handleGradeChange}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Grade / Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {gradeLevels.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterClassId} onValueChange={setFilterClassId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Stream" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                {streamsForFilterGrade.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {classLabel(cls)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            Exams ({exams.length})
          </CardTitle>
          <CardDescription>
            Examinations created in Exam Setup. Scheduling actions are coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingExams ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading exams...
            </div>
          ) : examsError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
              <ServerCrash className="h-10 w-10 mb-3 text-red-300" />
              <p className="font-medium text-red-700">Could not load exams</p>
              <p className="text-sm max-w-sm">{examsError}</p>
              <Button
                variant="outline"
                className="rounded-xl mt-4"
                onClick={() => void loadExams()}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
              <CalendarRange className="h-10 w-10 mb-3 text-gray-300" />
              <p className="font-medium">No exams found</p>
              <p className="text-sm">
                {hasActiveFilters
                  ? 'Try adjusting your search or filters.'
                  : 'Create an exam under Exam Setup to see it here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Academic Year / Term</TableHead>
                    <TableHead>Grade &amp; Stream</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Schedule</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium text-gray-900">{exam.exam_name}</TableCell>
                      <TableCell>
                        <Badge className={`border-0 ${examTypeBadgeStyles[exam.exam_type]}`}>
                          {exam.exam_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {exam.academic_years
                          ? `${exam.academic_years.name} (${exam.academic_years.year})`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {exam.classes ? classLabel(exam.classes) : '—'}
                      </TableCell>
                      <TableCell className="text-gray-600">{formatDate(exam.start_date)}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(exam.end_date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            exam.is_active
                              ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                              : 'border-gray-200 text-gray-500 bg-gray-50'
                          }
                        >
                          {exam.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          disabled
                          title="Scheduling is coming soon"
                        >
                          Schedule
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamSchedule;
