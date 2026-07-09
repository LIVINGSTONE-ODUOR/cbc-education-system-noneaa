import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  CalendarRange,
  ClipboardList,
  Eye,
  Filter,
  Info,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  AlertCircle,
} from 'lucide-react';

import { getClasses, ClassApiItem } from '@/lib/api/classApi';
import { getAcademicTerms, AcademicTerm } from '@/lib/api/academicTermsApi';
import {
  createExam,
  deleteExam,
  getExams,
  updateExam,
  EXAM_TYPES,
  ExamApiItem,
  ExamType,
} from '@/lib/api/examApi';

interface UserData {
  schoolId: string | null;
  role: string;
}

interface ExamFormState {
  id: string | null;
  year: string;
  term_id: string;
  grade_level: string;
  class_id: string;
  exam_name: string;
  exam_type: ExamType | '';
  start_date: string;
  end_date: string;
  description: string;
}

const emptyForm: ExamFormState = {
  id: null,
  year: '',
  term_id: '',
  grade_level: '',
  class_id: '',
  exam_name: '',
  exam_type: '',
  start_date: '',
  end_date: '',
  description: '',
};

const examTypeBadgeStyles: Record<ExamType, string> = {
  CAT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'Mid-Term':
    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'End-Term':
    'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
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
  cls.stream_name
    ? `${cls.grade_level} — ${cls.stream_name}`
    : `${cls.grade_level} (No Stream)`;

export default function ExamGroupsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);

  // reference data
  const [classes, setClasses] = useState<ClassApiItem[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [loadingReferenceData, setLoadingReferenceData] = useState(true);

  // exams
  const [exams, setExams] = useState<ExamApiItem[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examsError, setExamsError] = useState<string | null>(null);

  // filters
  const [search, setSearch] = useState('');
  const [filterExamType, setFilterExamType] = useState('all');
  const [filterTermId, setFilterTermId] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [filterGradeLevel, setFilterGradeLevel] = useState('all');

  // dialogs
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const [form, setForm] = useState<ExamFormState>(emptyForm);
  const [selectedExam, setSelectedExam] = useState<ExamApiItem | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('cbe_user');
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      setUserData({
        schoolId: parsed.schoolId || parsed.school_id || null,
        role: parsed.role,
      });
    } catch (e) {
      console.error('Failed to parse stored user:', e);
    }
  }, []);

  const loadReferenceData = useCallback(async () => {
    if (!userData?.schoolId) return;
    setLoadingReferenceData(true);
    try {
      const [classesRes, termsRes] = await Promise.all([
        getClasses({ is_active: 'true', limit: 200 }),
        getAcademicTerms(userData.schoolId),
      ]);
      setClasses(classesRes.data?.classes || []);
      setTerms(termsRes || []);
    } catch (error) {
      console.error('Failed to load reference data:', error);
      toast.error('Could not load classes / academic years from the server.');
    } finally {
      setLoadingReferenceData(false);
    }
  }, [userData?.schoolId]);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  const loadExams = useCallback(async () => {
    setLoadingExams(true);
    setExamsError(null);
    try {
      const res = await getExams({
        search: search || undefined,
        exam_type: filterExamType !== 'all' ? filterExamType : undefined,
        term_id: filterTermId !== 'all' ? filterTermId : undefined,
        is_active: filterStatus !== 'all' ? (filterStatus === 'active' ? 'true' : 'false') : undefined,
        limit: 200,
        sort_by: 'start_date',
        sort_order: 'desc',
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
  }, [search, filterExamType, filterTermId, filterStatus]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadExams();
    }, 300);
    return () => clearTimeout(t);
  }, [loadExams]);

  const academicYears = useMemo(
    () => Array.from(new Set(terms.map((t) => t.year))).sort((a, b) => b - a),
    [terms],
  );

  const gradeLevels = useMemo(
    () => Array.from(new Set(classes.map((c) => c.grade_level))).sort(),
    [classes],
  );

  const termsForFormYear = useMemo(
    () => terms.filter((t) => String(t.year) === form.year),
    [terms, form.year],
  );

  const streamsForFormGrade = useMemo(
    () => classes.filter((c) => c.grade_level === form.grade_level),
    [classes, form.grade_level],
  );

  const streamsForFilterGrade = useMemo(() => {
    if (filterGradeLevel === 'all') return classes;
    return classes.filter((c) => c.grade_level === filterGradeLevel);
  }, [classes, filterGradeLevel]);

  // Additional client-side filter for grouping/grade-level (API supports grade_level only client-side too)
  const examsForGradeFilter = useMemo(() => {
    if (filterGradeLevel === 'all') return exams;
    return exams.filter((e) => e.classes?.grade_level === filterGradeLevel);
  }, [exams, filterGradeLevel]);

  const groupedByTerm = useMemo(() => {
    // group key: term id (academic_years.name/year + term name/year)
    const map = new Map<string, { termLabel: string; exams: ExamApiItem[] }>();

    for (const exam of examsForGradeFilter) {
      const termId = exam.term_id;
      const termLabel = exam.academic_years
        ? `${exam.academic_years.name} (${exam.academic_years.year})`
        : '—';

      if (!map.has(termId)) {
        map.set(termId, { termLabel, exams: [] });
      }
      map.get(termId)!.exams.push(exam);
    }

    // sort by latest start_date inside each term
    for (const v of map.values()) {
      v.exams.sort((a, b) => String(b.start_date).localeCompare(String(a.start_date)));
    }

    return Array.from(map.entries())
      .map(([termId, value]) => ({ termId, ...value }))
      .sort((a, b) => {
        const da = a.exams[0]?.start_date ? new Date(a.exams[0].start_date).getTime() : 0;
        const db = b.exams[0]?.start_date ? new Date(b.exams[0].start_date).getTime() : 0;
        return db - da;
      });
  }, [examsForGradeFilter]);

  const groupedByGradeWithinTerm = useCallback((termExams: ExamApiItem[]) => {
    const gradeMap = new Map<string, ExamApiItem[]>();

    for (const exam of termExams) {
      const grade = exam.classes?.grade_level || 'Unassigned';
      if (!gradeMap.has(grade)) gradeMap.set(grade, []);
      gradeMap.get(grade)!.push(exam);
    }

    return Array.from(gradeMap.entries())
      .map(([grade, exams]) => ({ grade, exams }))
      .sort((a, b) => (a.grade === 'Unassigned' ? 1 : b.grade === 'Unassigned' ? -1 : a.grade.localeCompare(b.grade)));
  }, []);

  const openCreateDialog = () => {
    setForm(emptyForm);
    setFormErrors([]);
    setIsEditing(false);
    setSelectedExam(null);
    setShowFormDialog(true);
  };

  const openEditDialog = (exam: ExamApiItem) => {
    const cls = exam.classes;
    setForm({
      id: exam.id,
      year: exam.academic_years?.year ? String(exam.academic_years.year) : '',
      term_id: exam.term_id,
      grade_level: cls?.grade_level || '',
      class_id: exam.class_id || '',
      exam_name: exam.exam_name,
      exam_type: exam.exam_type,
      start_date: exam.start_date?.slice(0, 10) || '',
      end_date: exam.end_date?.slice(0, 10) || '',
      description: exam.description || '',
    });

    setFormErrors([]);
    setIsEditing(true);
    setSelectedExam(exam);
    setShowFormDialog(true);
  };

  const openViewDialog = (exam: ExamApiItem) => {
    setSelectedExam(exam);
    setShowViewDialog(true);
  };

  const openDeleteDialog = (exam: ExamApiItem) => {
    setSelectedExam(exam);
    setShowDeleteDialog(true);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!form.year) errors.push('Academic year is required');
    if (!form.term_id) errors.push('Term is required');
    if (!form.grade_level) errors.push('Grade / Class is required');
    if (!form.class_id) errors.push('Stream is required');
    if (!form.exam_name.trim()) errors.push('Exam name is required');
    if (!form.exam_type) errors.push('Exam type is required');
    if (!form.start_date) errors.push('Start date is required');
    if (!form.end_date) errors.push('End date is required');

    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      errors.push('End date cannot be before start date');
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    setFormErrors(errors);
    if (errors.length > 0) return;

    setActionLoading(true);
    try {
      const payload = {
        term_id: form.term_id,
        class_id: form.class_id,
        exam_name: form.exam_name.trim(),
        exam_type: form.exam_type as ExamType,
        start_date: form.start_date,
        end_date: form.end_date,
        description: form.description.trim() || undefined,
      };

      if (isEditing && form.id) {
        await updateExam(form.id, payload);
        toast.success('Exam updated successfully');
      } else {
        await createExam(payload);
        toast.success('Exam created successfully');
      }

      setShowFormDialog(false);
      void loadExams();
    } catch (error: any) {
      console.error('Failed to save exam:', error);
      toast.error(error?.message || 'Could not save exam. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedExam) return;
    setActionLoading(true);
    try {
      await deleteExam(selectedExam.id);
      toast.success('Exam deleted successfully');
      setShowDeleteDialog(false);
      setSelectedExam(null);
      void loadExams();
    } catch (error: any) {
      console.error('Failed to delete exam:', error);
      toast.error(error?.message || 'Could not delete exam. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const hasReferenceReady = !loadingReferenceData && classes.length > 0 && terms.length > 0;

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exam Groups</h1>
            <p className="text-sm text-gray-500">
              Group and manage your exams by academic term and grade/stream.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              void loadReferenceData();
              void loadExams();
            }}
            disabled={loadingExams || loadingReferenceData}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${loadingExams ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
            onClick={openCreateDialog}
            disabled={!hasReferenceReady}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Exam
          </Button>
        </div>
      </div>

      {/* Info / missing data */}
      {!loadingReferenceData && (classes.length === 0 || terms.length === 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-amber-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>
              {classes.length === 0 &&
                'No classes found for your school — add classes under Administration → Classes before creating exam groups.'}
              {terms.length === 0 &&
                'No academic years / terms found — add a term under Administration → Term Management before creating exam groups.'}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="rounded-2xl border border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search exams by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>

            <Select value={filterExamType} onValueChange={setFilterExamType}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Exam Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exam Types</SelectItem>
                {EXAM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
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
                {terms.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterGradeLevel} onValueChange={setFilterGradeLevel}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Grade / Stream" />
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
          </div>
        </CardContent>
      </Card>

      {/* Grouped view */}
      <Card className="rounded-2xl border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            Exam Groups
            <span className="ml-2 text-sm text-gray-500 font-normal">
              {examsForGradeFilter.length} exam(s)
            </span>
          </CardTitle>
          <CardDescription>
            Each group is organized by academic term, then by grade/stream.
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
              <CalendarRange className="h-10 w-10 mb-3 text-red-300" />
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
          ) : examsForGradeFilter.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
              <CalendarRange className="h-10 w-10 mb-3 text-gray-300" />
              <p className="font-medium">No exam groups found</p>
              <p className="text-sm">
                {search || filterExamType !== 'all' || filterTermId !== 'all' || filterStatus !== 'all' || filterGradeLevel !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Create an exam first under Exam Setup to see it here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedByTerm.map((term) => {
                const gradeGroups = groupedByGradeWithinTerm(term.exams);
                return (
                  <div key={term.termId} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                          <CalendarDays className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            {term.termLabel}
                          </h2>
                          <p className="text-sm text-gray-500">
                            {term.exams.length} exam(s)
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="gap-2">
                        <Info className="h-3.5 w-3.5" />
                        Organized by grade/stream
                      </Badge>
                    </div>

                    {gradeGroups.map((g) => {
                      const filteredStreamClasses = filterGradeLevel === 'all' ? streamsForFilterGrade : classes;
                      const gradeHasClasses = filteredStreamClasses.some((c) => c.grade_level === g.grade);
                      return (
                        <div key={g.grade} className="rounded-xl border border-gray-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {g.grade}
                                {!gradeHasClasses && g.grade !== 'Unassigned' ? (
                                  <span className="ml-2 text-xs font-normal text-gray-500">
                                    (no current stream class)
                                  </span>
                                ) : null}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {g.exams.length} exam(s)
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="outline">Manage</Badge>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Exam Name</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Grade &amp; Stream</TableHead>
                                  <TableHead>Start</TableHead>
                                  <TableHead>End</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {g.exams.map((exam) => (
                                  <TableRow key={exam.id}>
                                    <TableCell className="font-medium text-gray-900">
                                      {exam.exam_name}
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={`border-0 ${examTypeBadgeStyles[exam.exam_type]}`}>
                                        {exam.exam_type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                      {exam.classes ? classLabel(exam.classes) : '—'}
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                      {formatDate(exam.start_date)}
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                      {formatDate(exam.end_date)}
                                    </TableCell>
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
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8"
                                          onClick={() => openViewDialog(exam)}
                                          title="View"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8"
                                          onClick={() => openEditDialog(exam)}
                                          title="Edit"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => openDeleteDialog(exam)}
                                          title="Delete"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Exam' : 'Create New Exam'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the details for this examination.'
                : 'Fill in the details to schedule a new examination.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formErrors.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 space-y-1">
                {formErrors.map((err) => (
                  <div key={err} className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {err}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Academic Year</Label>
                <Select
                  value={form.year}
                  onValueChange={(value) => setForm((f) => ({ ...f, year: value, term_id: '' }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Term</Label>
                <Select
                  value={form.term_id}
                  onValueChange={(value) => setForm((f) => ({ ...f, term_id: value }))}
                  disabled={!form.year}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {termsForFormYear.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Grade / Class</Label>
                <Select
                  value={form.grade_level}
                  onValueChange={(value) => setForm((f) => ({ ...f, grade_level: value, class_id: '' }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Stream</Label>
                <Select
                  value={form.class_id}
                  onValueChange={(value) => setForm((f) => ({ ...f, class_id: value }))}
                  disabled={!form.grade_level}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select stream" />
                  </SelectTrigger>
                  <SelectContent>
                    {streamsForFormGrade.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.stream_name || 'No Stream'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Exam Name</Label>
              <Input
                placeholder="e.g. Mid-Term Mathematics Exam"
                value={form.exam_name}
                onChange={(e) => setForm((f) => ({ ...f, exam_name: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Exam Type</Label>
              <Select
                value={form.exam_type}
                onValueChange={(value) => setForm((f) => ({ ...f, exam_type: value as ExamType }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Any additional notes about this exam..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="rounded-xl"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowFormDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
              onClick={handleSubmit}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {isEditing ? 'Save Changes' : 'Create Exam'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedExam?.exam_name}</DialogTitle>
            <DialogDescription>Exam details</DialogDescription>
          </DialogHeader>

          {selectedExam && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Exam Type</span>
                <Badge className={`border-0 ${examTypeBadgeStyles[selectedExam.exam_type]}`}>
                  {selectedExam.exam_type}
                </Badge>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Academic Year / Term</span>
                <span className="font-medium text-gray-900">
                  {selectedExam.academic_years
                    ? `${selectedExam.academic_years.name} (${selectedExam.academic_years.year})`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Grade &amp; Stream</span>
                <span className="font-medium text-gray-900">
                  {selectedExam.classes ? classLabel(selectedExam.classes) : '—'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Start Date</span>
                <span className="font-medium text-gray-900">
                  {formatDate(selectedExam.start_date)}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">End Date</span>
                <span className="font-medium text-gray-900">
                  {formatDate(selectedExam.end_date)}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Status</span>
                <Badge
                  variant="outline"
                  className={
                    selectedExam.is_active
                      ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                      : 'border-gray-200 text-gray-500 bg-gray-50'
                  }
                >
                  {selectedExam.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {selectedExam.description && (
                <div className="pt-1">
                  <span className="text-gray-500 block mb-1">Description</span>
                  <p className="text-gray-800">{selectedExam.description}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowViewDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-3 text-lg font-bold">
              <AlertCircle className="h-5 w-5" />
              Delete Exam
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-600">
            Are you sure you want to delete{' '}
            <span className="font-bold text-gray-900">{selectedExam?.exam_name}</span>? This cannot be undone.
          </p>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowDeleteDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


