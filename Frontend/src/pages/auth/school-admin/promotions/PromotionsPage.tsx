import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { z } from 'zod';

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
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  Download,
  Eye,
  Filter,
  GraduationCap,
  Info,
  Loader2,
  Lock,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Unlock,
} from 'lucide-react';

import {
  getPromotionBatches,
  createPromotionBatch,
  runPromotionBatch,
  lockPromotionBatch,
  unlockPromotionBatch,
  type PromotionBatchApiItem,
  type BatchKind,
  type BatchStatus,
} from '@/lib/api/promotionApi';
import { getAcademicTerms, type AcademicTerm } from '@/lib/api/academicTermsApi';
import { getClasses, type ClassApiItem } from '@/lib/api/classApi';

// -----------------------------------------------------------------------------
// View model — thin wrapper around the API shape for display convenience.
// -----------------------------------------------------------------------------
interface PromotionBatch {
  id: string;
  kind: BatchKind;
  academicYear: string; // display label
  academicYearId: string;
  gradeLevel: string;
  streamName: string | null;
  toGradeLevel: string | null;
  criteria: string;
  effectiveDate: string;
  learnerCountTarget: number;
  learnerCountSelected: number;
  learnerCountPromotedOrGraduated: number;
  status: BatchStatus;
  createdAt: string;
  updatedAt: string;
}

const toViewModel = (b: PromotionBatchApiItem): PromotionBatch => ({
  id: b.id,
  kind: b.kind,
  academicYear: b.academic_years ? `${b.academic_years.name} (${b.academic_years.year})` : '—',
  academicYearId: b.academic_year_id,
  gradeLevel: b.grade_level,
  streamName: b.stream_name,
  toGradeLevel: b.to_grade_level,
  criteria: b.criteria,
  effectiveDate: b.effective_date,
  learnerCountTarget: b.learner_count_target ?? 0,
  learnerCountSelected: b.learner_count_selected ?? 0,
  learnerCountPromotedOrGraduated: b.learner_count_completed ?? 0,
  status: b.status,
  createdAt: b.created_at,
  updatedAt: b.updated_at,
});

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'dd MMM yyyy');
  } catch {
    return value;
  }
};

const statusBadge = (status: BatchStatus) => {
  switch (status) {
    case 'draft':
      return { variant: 'outline' as const, className: 'border-gray-200 bg-gray-50 text-gray-600', label: 'Draft' };
    case 'ready':
      return { variant: 'outline' as const, className: 'border-indigo-200 bg-indigo-50 text-indigo-700', label: 'Ready' };
    case 'running':
      return { variant: 'outline' as const, className: 'border-amber-200 bg-amber-50 text-amber-700', label: 'Running' };
    case 'completed':
      return { variant: 'outline' as const, className: 'border-emerald-200 bg-emerald-50 text-emerald-700', label: 'Completed' };
    case 'locked':
      return { variant: 'outline' as const, className: 'border-sky-200 bg-sky-50 text-sky-700', label: 'Locked' };
    case 'cancelled':
      return { variant: 'outline' as const, className: 'border-red-200 bg-red-50 text-red-700', label: 'Cancelled' };
    default:
      return { variant: 'outline' as const, className: 'border-gray-200 bg-gray-50 text-gray-600', label: status };
  }
};

const promotionKindBadge = (kind: BatchKind) => {
  if (kind === 'graduation') {
    return {
      className: 'border-0 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      label: 'Graduation',
    };
  }
  return {
    className: 'border-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    label: 'Promotion',
  };
};

const createBatchSchema = z.object({
  kind: z.enum(['promotion', 'graduation']),
  academicYearId: z.string().min(1, 'Academic year is required'),
  gradeLevel: z.string().min(1, 'Grade / level is required'),
  streamName: z.string().nullable(),
  toGradeLevel: z.string().nullable(),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  criteria: z.string().min(10, 'Criteria must be at least 10 characters').max(1200),
}).refine((v) => v.kind !== 'promotion' || !!v.toGradeLevel, {
  message: 'Destination grade is required for promotion batches',
  path: ['toGradeLevel'],
});

export default function PromotionsPage() {
  const [userData, setUserData] = useState<{ schoolId: string | null; role: string } | null>(null);

  // Reference data (from real backend)
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([]);
  const [classes, setClasses] = useState<ClassApiItem[]>([]);
  const [refDataLoading, setRefDataLoading] = useState(false);

  const academicYears = useMemo(() => {
    // Each academic_years row is a Term; group by year for the "Academic Year" dropdown.
    const byYear = new Map<number, AcademicTerm>();
    academicTerms.forEach((t) => {
      const existing = byYear.get(t.year);
      if (!existing || (t.is_current && !existing.is_current)) byYear.set(t.year, t);
    });
    return Array.from(byYear.values())
      .sort((a, b) => b.year - a.year)
      .map((t) => ({ id: t.id, label: `${t.year}` }));
  }, [academicTerms]);

  const gradeLevels = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => { if (c.grade_level) set.add(c.grade_level); });
    return Array.from(set).sort();
  }, [classes]);

  const streams = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => { if (c.stream_name) set.add(c.stream_name); });
    return Array.from(set).sort();
  }, [classes]);

  const [batches, setBatches] = useState<PromotionBatch[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterKind, setFilterKind] = useState<'all' | BatchKind>('all');
  const [filterYearId, setFilterYearId] = useState<'all' | string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | BatchStatus>('all');
  const [filterGrade, setFilterGrade] = useState<'all' | string>('all');

  const [actionLoading, setActionLoading] = useState(false);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);

  const [formErrors, setFormErrors] = useState<string[]>([]);

  const emptyForm = {
    kind: 'promotion' as BatchKind,
    academicYearId: '',
    gradeLevel: '',
    streamName: null as string | null,
    toGradeLevel: null as string | null,
    effectiveDate: format(new Date(), 'yyyy-MM-dd'),
    criteria:
      'Select learners who meet academic and attendance requirements. Ensure decisions are aligned with school policy and approved assessment records.',
  };

  const [form, setForm] = useState({ ...emptyForm });
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId) || null,
    [batches, selectedBatchId],
  );

  // ---------------------------------------------------------------------------
  // Load user, reference data, and batches
  // ---------------------------------------------------------------------------
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

  const loadReferenceData = useCallback(async (schoolId: string) => {
    setRefDataLoading(true);
    try {
      const [terms, classesRes] = await Promise.all([
        getAcademicTerms(schoolId),
        getClasses({ school_id: schoolId, is_active: 'true', limit: 200 }),
      ]);
      setAcademicTerms(terms || []);
      setClasses(classesRes?.data?.classes || []);
    } catch (e: any) {
      toast.error(e?.message || 'Could not load academic years / classes.');
    } finally {
      setRefDataLoading(false);
    }
  }, []);

  const loadBatches = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await getPromotionBatches({
        kind: filterKind === 'all' ? undefined : filterKind,
        status: filterStatus === 'all' ? undefined : filterStatus,
        academic_year_id: filterYearId === 'all' ? undefined : filterYearId,
        grade_level: filterGrade === 'all' ? undefined : filterGrade,
        search: search.trim() || undefined,
      });
      setBatches((res.data || []).map(toViewModel));
    } catch (e: any) {
      toast.error(e?.message || 'Could not load promotion/graduation batches.');
    } finally {
      setListLoading(false);
    }
  }, [filterKind, filterStatus, filterYearId, filterGrade, search]);

  useEffect(() => {
    if (userData?.schoolId) {
      loadReferenceData(userData.schoolId);
    }
  }, [userData?.schoolId, loadReferenceData]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const filteredBatches = useMemo(() => {
    // Search/kind/status/year/grade are applied server-side; this just keeps
    // the list stable for rendering (already filtered by loadBatches).
    return [...batches].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [batches]);

  const counts = useMemo(() => {
    const total = batches.length;
    const completed = batches.filter((b) => b.status === 'completed').length;
    const locked = batches.filter((b) => b.status === 'locked').length;
    const running = batches.filter((b) => b.status === 'running').length;
    const selectedTotal = batches.reduce((acc, b) => acc + b.learnerCountSelected, 0);
    return { total, completed, locked, running, selectedTotal };
  }, [batches]);

  const openCreate = () => {
    setFormErrors([]);
    setForm({
      ...emptyForm,
      academicYearId: academicYears[0]?.id || '',
      gradeLevel: gradeLevels[0] || '',
      effectiveDate: format(new Date(), 'yyyy-MM-dd'),
    });
    setShowCreateDialog(true);
  };

  const openDetails = (batchId: string) => {
    setSelectedBatchId(batchId);
    setShowDetailsDialog(true);
  };

  const canRun = (b: PromotionBatch) =>
    b.status === 'ready' || b.status === 'draft' || b.status === 'cancelled';

  const canLock = (b: PromotionBatch) => b.status === 'completed';

  const handleCreateBatch = async () => {
    const parsed = createBatchSchema.safeParse({
      kind: form.kind,
      academicYearId: form.academicYearId,
      gradeLevel: form.gradeLevel,
      streamName: form.streamName,
      toGradeLevel: form.kind === 'promotion' ? form.toGradeLevel : null,
      effectiveDate: form.effectiveDate,
      criteria: form.criteria,
    });

    if (!parsed.success) {
      setFormErrors(parsed.error.issues.map((i) => i.message));
      return;
    }

    setActionLoading(true);
    try {
      await createPromotionBatch({
        kind: form.kind,
        academic_year_id: form.academicYearId,
        grade_level: form.gradeLevel,
        stream_name: form.streamName,
        to_grade_level: form.kind === 'promotion' ? form.toGradeLevel : null,
        criteria: form.criteria.trim(),
        effective_date: form.effectiveDate,
      });

      setShowCreateDialog(false);
      toast.success('Batch created. You can now run it.');
      await loadBatches();
    } catch (e: any) {
      toast.error(e?.message || 'Could not create promotion batch.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunBatch = async () => {
    if (!selectedBatch) return;
    if (!canRun(selectedBatch)) {
      toast.message('This batch cannot be run in its current state.');
      return;
    }

    setActionLoading(true);
    try {
      await runPromotionBatch(selectedBatch.id);
      setShowRunDialog(false);
      toast.success('Batch run completed. Results are ready for review.');
      await loadBatches();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to run batch.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLock = async () => {
    if (!selectedBatch) return;

    setActionLoading(true);
    try {
      if (selectedBatch.status === 'locked') {
        await unlockPromotionBatch(selectedBatch.id);
        toast.message('Batch unlocked.');
      } else {
        await lockPromotionBatch(selectedBatch.id);
        toast.success('Batch locked. Decisions are now protected.');
      }
      setShowLockDialog(false);
      await loadBatches();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update lock state.');
    } finally {
      setActionLoading(false);
    }
  };

  const exportBatch = (batch: PromotionBatch) => {
    const payload = {
      batchId: batch.id,
      kind: batch.kind,
      academicYear: batch.academicYear,
      gradeLevel: batch.gradeLevel,
      streamName: batch.streamName,
      toGradeLevel: batch.toGradeLevel,
      effectiveDate: batch.effectiveDate,
      status: batch.status,
      criteria: batch.criteria,
      counts: {
        target: batch.learnerCountTarget,
        selected: batch.learnerCountSelected,
        promotedOrGraduated: batch.learnerCountPromotedOrGraduated,
      },
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promotion-batch-${batch.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export generated (JSON).');
  };

  const statusOptions: Array<{ value: 'all' | BatchStatus; label: string }> = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'ready', label: 'Ready' },
    { value: 'running', label: 'Running' },
    { value: 'completed', label: 'Completed' },
    { value: 'locked', label: 'Locked' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const kindOptions: Array<{ value: 'all' | BatchKind; label: string }> = [
    { value: 'all', label: 'All Types' },
    { value: 'promotion', label: 'Promotions' },
    { value: 'graduation', label: 'Graduations' },
  ];

  const isBusy = actionLoading || listLoading || refDataLoading;

  const statCards = [
    {
      label: 'Total Batches',
      value: counts.total,
      hint: 'For promotions & graduations',
      icon: ClipboardList,
      chip: 'bg-indigo-50 text-indigo-600',
      bar: 'bg-indigo-500',
    },
    {
      label: 'Completed',
      value: counts.completed,
      hint: 'Results generated',
      icon: BadgeCheck,
      chip: 'bg-emerald-50 text-emerald-600',
      bar: 'bg-emerald-500',
    },
    {
      label: 'Locked',
      value: counts.locked,
      hint: 'Decisions protected',
      icon: Lock,
      chip: 'bg-sky-50 text-sky-600',
      bar: 'bg-sky-500',
    },
    {
      label: 'Selected Learners',
      value: counts.selectedTotal,
      hint: 'Across all batches',
      icon: ShieldCheck,
      chip: 'bg-amber-50 text-amber-600',
      bar: 'bg-amber-500',
    },
  ];

  const activeFilterCount = [
    filterKind !== 'all',
    filterYearId !== 'all',
    filterStatus !== 'all',
    filterGrade !== 'all',
    search.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100/60 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 py-7 sm:px-8 sm:py-8 shadow-lg shadow-indigo-200/50">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Promotions & Graduations</h1>
              <p className="mt-1 max-w-xl text-sm text-indigo-100">
                Manage promotion batches for learners moving to the next class, and graduation runs for certificates at a level.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={() => loadBatches()}
              disabled={isBusy}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${listLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              className="rounded-xl bg-white text-indigo-700 shadow-sm hover:bg-indigo-50"
              onClick={openCreate}
              disabled={isBusy || gradeLevels.length === 0 || academicYears.length === 0}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              New Batch
            </Button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card
            key={s.label}
            className="group relative overflow-hidden rounded-2xl border-gray-200/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className={`absolute inset-x-0 top-0 h-1 ${s.bar}`} />
            <CardContent className="flex items-start justify-between pt-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{s.label}</p>
                <div className="mt-1.5 text-3xl font-bold text-gray-900">{s.value}</div>
                <p className="mt-1 text-xs text-gray-400">{s.hint}</p>
              </div>
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${s.chip}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <Filter className="h-4 w-4" />
              </span>
              Find a promotion / graduation run
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="rounded-full border-indigo-200 bg-indigo-50 text-indigo-700 font-normal">
                {filteredBatches.length} batch{filteredBatches.length === 1 ? '' : 'es'}
              </Badge>
              {activeFilterCount > 0 && (
                <Badge variant="outline" className="rounded-full border-gray-200 bg-gray-50 text-gray-500 font-normal">
                  {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} active
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            Search by grade/stream, academic year, or learner criteria. Then run, lock, or export results.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by criteria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border-gray-200 bg-gray-50/60 pl-9 focus-visible:bg-white"
              />
            </div>

            <Select value={filterKind} onValueChange={(v) => setFilterKind(v as any)}>
              <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50/60">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {kindOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYearId} onValueChange={(v) => setFilterYearId(v as any)}>
              <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50/60">
                <SelectValue placeholder="Academic year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50/60">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterGrade} onValueChange={(v) => setFilterGrade(v as any)}>
              <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50/60 md:col-start-5">
                <SelectValue placeholder="Grade / Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {gradeLevels.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              <CalendarDays className="h-4 w-4" />
            </span>
            Promotion & Graduation Batches
          </CardTitle>
          <CardDescription>
            A batch represents a single decision cycle for learners moving to the next class or graduating from a level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
              <Loader2 className="h-8 w-8 mb-3 animate-spin text-indigo-500" />
              <p>Loading batches…</p>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center text-gray-500">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                <AlertCircle className="h-7 w-7 text-gray-300" />
              </div>
              <p className="font-medium text-gray-700">No batches match your filters</p>
              <p className="max-w-md text-sm">
                Create a new batch using <b>New Batch</b> and then run it to generate promotion/graduation results.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Batch</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Type</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Academic Year</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Grade & Stream</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Effective</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Progress</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.map((b) => {
                      const kind = promotionKindBadge(b.kind);
                      const sb = statusBadge(b.status);
                      const isGraduation = b.kind === 'graduation';
                      const pct = b.learnerCountTarget > 0
                        ? Math.min(100, Math.round((b.learnerCountSelected / b.learnerCountTarget) * 100))
                        : 0;
                      return (
                        <TableRow key={b.id} className="transition-colors hover:bg-indigo-50/30">
                          <TableCell className="font-medium text-gray-900">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                                  isGraduation ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                                }`}
                              >
                                {isGraduation ? <GraduationCap className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-mono text-sm">{b.id.slice(0, 8)}</span>
                                <span className="text-xs text-gray-400">Updated {formatDate(b.updatedAt)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`rounded-full px-2.5 ${kind.className}`}>{kind.label}</Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">{b.academicYear}</TableCell>
                          <TableCell className="text-gray-600">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-800">
                                {b.gradeLevel}{b.toGradeLevel ? ` → ${b.toGradeLevel}` : ''}
                              </span>
                              <span className="text-xs text-gray-400">
                                {b.streamName ? b.streamName : 'No stream'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">{formatDate(b.effectiveDate)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={sb.variant}
                              className={`rounded-full px-2.5 ${sb.className} flex w-fit items-center gap-1.5`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {sb.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">
                            <div className="flex w-36 flex-col gap-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">
                                  Selected <b className="text-gray-800">{b.learnerCountSelected}</b>/{b.learnerCountTarget}
                                </span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className={`h-full rounded-full ${isGraduation ? 'bg-blue-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400">
                                {isGraduation ? 'Graduated' : 'Promoted'} <b className="text-gray-600">{b.learnerCountPromotedOrGraduated}</b>
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg hover:bg-gray-100"
                                onClick={() => openDetails(b.id)}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg hover:bg-indigo-50 hover:text-indigo-700"
                                disabled={!canRun(b) || actionLoading}
                                onClick={() => { setSelectedBatchId(b.id); setShowRunDialog(true); }}
                                title="Run batch"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>

                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg hover:bg-sky-50"
                                disabled={!(canLock(b) || b.status === 'locked') || actionLoading}
                                onClick={() => { setSelectedBatchId(b.id); setShowLockDialog(true); }}
                                title={b.status === 'locked' ? 'Unlock batch' : 'Lock batch'}
                              >
                                {b.status === 'locked' ? (
                                  <Unlock className="h-4 w-4 text-sky-700" />
                                ) : (
                                  <Lock className="h-4 w-4 text-sky-700" />
                                )}
                              </Button>

                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg hover:bg-gray-100"
                                disabled={b.status !== 'completed' && b.status !== 'locked'}
                                onClick={() => exportBatch(b)}
                                title="Export summary"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Sparkles className="h-4 w-4" />
              </span>
              Create Promotion / Graduation Batch
            </DialogTitle>
            <DialogDescription>
              Define which learners will move to the next class or graduate from a level, then run the batch.
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
                <Label>Batch Type</Label>
                <Select
                  value={form.kind}
                  onValueChange={(v) => setForm((f) => ({ ...f, kind: v as BatchKind, toGradeLevel: v === 'graduation' ? null : f.toGradeLevel }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotion">Promotion (next class)</SelectItem>
                    <SelectItem value="graduation">Graduation (certificates)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Academic Year</Label>
                <Select
                  value={form.academicYearId}
                  onValueChange={(v) => setForm((f) => ({ ...f, academicYearId: v }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((y) => (
                      <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Grade / Level</Label>
                <Select
                  value={form.gradeLevel}
                  onValueChange={(v) => setForm((f) => ({ ...f, gradeLevel: v }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Stream (optional)</Label>
                <Select
                  value={form.streamName ?? 'none'}
                  onValueChange={(v) => setForm((f) => ({ ...f, streamName: v === 'none' ? null : v }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select stream" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No stream</SelectItem>
                    {streams.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.kind === 'promotion' && (
                <div className="space-y-1.5 col-span-2">
                  <Label>Destination Grade (promoting to)</Label>
                  <Select
                    value={form.toGradeLevel ?? ''}
                    onValueChange={(v) => setForm((f) => ({ ...f, toGradeLevel: v }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select destination grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeLevels
                        .filter((g) => g !== form.gradeLevel)
                        .map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Effective Date</Label>
                <Input
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Preview</Label>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-indigo-600" />
                    <span>
                      You will run a batch for <b>{form.gradeLevel || '—'}</b>{' '}
                      {form.streamName ? `(${form.streamName})` : '(all streams)'}
                      {form.kind === 'promotion' && form.toGradeLevel ? <> → <b>{form.toGradeLevel}</b></> : null}.
                    </span>
                  </div>
                  <div className="mt-2 text-gray-600">
                    Target learner count is calculated from current enrollments when the batch is created.
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Selection Criteria (required)</Label>
              <Textarea
                value={form.criteria}
                onChange={(e) => setForm((f) => ({ ...f, criteria: e.target.value }))}
                className="rounded-xl"
                rows={5}
                placeholder="Describe the promotion/graduation rules used to select learners."
              />
              <p className="text-xs text-gray-500">
                Example: attendance threshold, assessment weighting, special consideration rules.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowCreateDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
              onClick={() => void handleCreateBatch()}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <Eye className="h-4 w-4" />
              </span>
              {selectedBatch ? selectedBatch.id.slice(0, 8) : 'Batch details'}
            </DialogTitle>
            <DialogDescription>Review criteria and results summary.</DialogDescription>
          </DialogHeader>

          {selectedBatch ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-500">Type</span>
                <Badge className={promotionKindBadge(selectedBatch.kind).className}>
                  {promotionKindBadge(selectedBatch.kind).label}
                </Badge>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-500">Academic Year</span>
                <span className="font-medium text-gray-900">{selectedBatch.academicYear}</span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-500">Grade & Stream</span>
                <span className="font-medium text-gray-900">
                  {selectedBatch.gradeLevel}
                  {selectedBatch.toGradeLevel ? ` → ${selectedBatch.toGradeLevel}` : ''}
                  {selectedBatch.streamName ? ` • ${selectedBatch.streamName}` : ''}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-500">Effective</span>
                <span className="font-medium text-gray-900">{formatDate(selectedBatch.effectiveDate)}</span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-500">Status</span>
                <Badge variant={statusBadge(selectedBatch.status).variant} className={statusBadge(selectedBatch.status).className}>
                  {statusBadge(selectedBatch.status).label}
                </Badge>
              </div>

              <div className="pt-1">
                <span className="text-gray-500 block mb-1">Criteria</span>
                <p className="text-gray-800 whitespace-pre-wrap">{selectedBatch.criteria}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Target learners</span>
                  <span className="font-semibold text-gray-900">{selectedBatch.learnerCountTarget}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">Selected learners</span>
                  <span className="font-semibold text-gray-900">{selectedBatch.learnerCountSelected}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">
                    {selectedBatch.kind === 'graduation' ? 'Graduated' : 'Promoted'}
                  </span>
                  <span className="font-semibold text-gray-900">{selectedBatch.learnerCountPromotedOrGraduated}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-sm text-gray-500 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Select a batch to view details.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run dialog */}
      <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-indigo-700 flex items-center gap-3 text-lg font-bold">
              <ArrowRight className="h-5 w-5" /> Run Batch
            </DialogTitle>
          </DialogHeader>

          {selectedBatch ? (
            <>
              <p className="text-sm text-gray-600">
                You are about to run batch <b>{selectedBatch.id.slice(0, 8)}</b> for{' '}
                <b>{selectedBatch.gradeLevel}</b> {selectedBatch.streamName ? `(${selectedBatch.streamName})` : ''}.
                This will generate the promotion/graduation results.
              </p>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 mt-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    During running, learners selection is finalized for this batch. Lock after review.
                  </span>
                </div>
              </div>

              <DialogFooter className="gap-3 mt-4">
                <Button variant="outline" className="rounded-xl" onClick={() => setShowRunDialog(false)} disabled={actionLoading}>
                  Cancel
                </Button>
                <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700" onClick={() => void handleRunBatch()} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Run
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Lock dialog */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sky-700 flex items-center gap-3 text-lg font-bold">
              {selectedBatch?.status === 'locked' ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              {selectedBatch?.status === 'locked' ? 'Unlock Batch' : 'Lock Batch'}
            </DialogTitle>
          </DialogHeader>

          {selectedBatch ? (
            <>
              <p className="text-sm text-gray-600">
                Batch <b>{selectedBatch.id.slice(0, 8)}</b> is currently <b>{statusBadge(selectedBatch.status).label}</b>.
                {selectedBatch.status === 'locked'
                  ? ' Unlocking allows edits and re-running selection.'
                  : ' Locking protects decisions and makes results official for records.'}
              </p>

              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800 mt-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>Use lock after you confirm the list of learners promoted or graduated.</span>
                </div>
              </div>

              <DialogFooter className="gap-3 mt-4">
                <Button variant="outline" className="rounded-xl" onClick={() => setShowLockDialog(false)} disabled={actionLoading}>
                  Cancel
                </Button>
                <Button className="rounded-xl bg-sky-700 hover:bg-sky-800" onClick={() => void handleToggleLock()} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {selectedBatch.status === 'locked' ? 'Unlock' : 'Lock'}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
