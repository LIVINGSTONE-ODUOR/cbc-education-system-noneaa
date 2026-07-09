import React, { useEffect, useMemo, useState } from 'react';
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
  Trash2,
  Unlock,
} from 'lucide-react';

type PromotionKind = 'promotion' | 'graduation';

type PromotionStatus =
  | 'draft'
  | 'ready'
  | 'running'
  | 'completed'
  | 'locked'
  | 'cancelled';

type GradeLevel = string;

type StreamName = string;

interface PromotionBatch {
  id: string;
  kind: PromotionKind;
  academicYear: string; // display label
  academicYearId: string;
  gradeLevel: GradeLevel;
  streamName: StreamName | null;
  criteria: string;
  effectiveDate: string; // yyyy-mm-dd
  learnerCountTarget: number;
  learnerCountSelected: number;
  learnerCountPromotedOrGraduated: number;
  status: PromotionStatus;
  createdAt: string;
  updatedAt: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'dd MMM yyyy');
  } catch {
    return value;
  }
};

const statusBadge = (status: PromotionStatus) => {
  switch (status) {
    case 'draft':
      return {
        variant: 'outline' as const,
        className: 'border-gray-200 bg-gray-50 text-gray-600',
        label: 'Draft',
      };
    case 'ready':
      return {
        variant: 'outline' as const,
        className: 'border-indigo-200 bg-indigo-50 text-indigo-700',
        label: 'Ready',
      };
    case 'running':
      return {
        variant: 'outline' as const,
        className: 'border-amber-200 bg-amber-50 text-amber-700',
        label: 'Running',
      };
    case 'completed':
      return {
        variant: 'outline' as const,
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        label: 'Completed',
      };
    case 'locked':
      return {
        variant: 'outline' as const,
        className: 'border-sky-200 bg-sky-50 text-sky-700',
        label: 'Locked',
      };
    case 'cancelled':
      return {
        variant: 'outline' as const,
        className: 'border-red-200 bg-red-50 text-red-700',
        label: 'Cancelled',
      };
    default:
      return {
        variant: 'outline' as const,
        className: 'border-gray-200 bg-gray-50 text-gray-600',
        label: status,
      };
  }
};

const promotionKindBadge = (kind: PromotionKind) => {
  if (kind === 'graduation') {
    return {
      className:
        'border-0 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      label: 'Graduation',
    };
  }

  return {
    className:
      'border-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    label: 'Promotion',
  };
};

const createBatchSchema = z.object({
  kind: z.enum(['promotion', 'graduation']),
  academicYearId: z.string().min(1),
  gradeLevel: z.string().min(1),
  streamName: z.string().nullable(),
  effectiveDate: z.string().min(1),
  criteria: z.string().min(10).max(1200),
});

const makeId = () =>
  `pb_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;

const nowIso = () => new Date().toISOString();

const seededBatches = (): PromotionBatch[] => {
  const t = Date.now();
  return [
    {
      id: 'pb_001',
      kind: 'promotion',
      academicYear: '2025/2026',
      academicYearId: 'ay_2026',
      gradeLevel: 'Grade 6',
      streamName: null,
      criteria:
        'Learners who meet attendance and continuous assessment thresholds move to Junior High School. Prioritize learners with improved performance over the last two terms.',
      effectiveDate: '2026-02-20',
      learnerCountTarget: 132,
      learnerCountSelected: 126,
      learnerCountPromotedOrGraduated: 124,
      status: 'locked',
      createdAt: new Date(t - 1000 * 60 * 60 * 48).toISOString(),
      updatedAt: new Date(t - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'pb_002',
      kind: 'promotion',
      academicYear: '2025/2026',
      academicYearId: 'ay_2026',
      gradeLevel: 'Grade 9',
      streamName: 'Science',
      criteria:
        'Select learners based on end-term results and final examinations. Learners with special needs may be considered under approved adjustments.',
      effectiveDate: '2026-01-30',
      learnerCountTarget: 88,
      learnerCountSelected: 84,
      learnerCountPromotedOrGraduated: 82,
      status: 'completed',
      createdAt: new Date(t - 1000 * 60 * 60 * 72).toISOString(),
      updatedAt: new Date(t - 1000 * 60 * 60 * 20).toISOString(),
    },
    {
      id: 'pb_003',
      kind: 'graduation',
      academicYear: '2024/2025',
      academicYearId: 'ay_2025',
      gradeLevel: 'Senior High',
      streamName: 'Arts',
      criteria:
        'Graduates are learners who complete SHS requirements and satisfy attendance, conduct, and examination minimums. Ensure audit trail before issuing certificates.',
      effectiveDate: '2025-12-10',
      learnerCountTarget: 64,
      learnerCountSelected: 60,
      learnerCountPromotedOrGraduated: 58,
      status: 'completed',
      createdAt: new Date(t - 1000 * 60 * 60 * 24 * 12).toISOString(),
      updatedAt: new Date(t - 1000 * 60 * 60 * 24 * 5).toISOString(),
    },
  ];
};

export default function PromotionsPage() {
  const [userData, setUserData] = useState<{ schoolId: string | null; role: string } | null>(
    null,
  );

  // Reference-like data (client-side)
  const [academicYears] = useState(() => [
    { id: 'ay_2025', label: '2024/2025' },
    { id: 'ay_2026', label: '2025/2026' },
    { id: 'ay_2027', label: '2026/2027' },
  ]);

  const [gradeLevels] = useState<GradeLevel[]>(() => [
    'Grade 6',
    'Grade 9',
    'Grade 12',
    'Junior High',
    'Senior High',
  ]);

  const [streams] = useState<StreamName[]>(() => ['Science', 'Arts', 'Business', 'Technology']);

  const [batches, setBatches] = useState<PromotionBatch[]>(() => seededBatches());

  // Filters
  const [search, setSearch] = useState('');
  const [filterKind, setFilterKind] = useState<'all' | PromotionKind>('all');
  const [filterYearId, setFilterYearId] = useState<'all' | string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | PromotionStatus>('all');
  const [filterGrade, setFilterGrade] = useState<'all' | string>('all');

  // Loading actions
  const [actionLoading, setActionLoading] = useState(false);

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);

  const [formErrors, setFormErrors] = useState<string[]>([]);

  const emptyForm = {
    kind: 'promotion' as PromotionKind,
    academicYearId: 'ay_2026',
    gradeLevel: 'Grade 6',
    streamName: null as string | null,
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

  const filteredBatches = useMemo(() => {
    const s = search.trim().toLowerCase();

    return batches
      .filter((b) => {
        if (filterKind !== 'all' && b.kind !== filterKind) return false;
        if (filterYearId !== 'all' && b.academicYearId !== filterYearId) return false;
        if (filterStatus !== 'all' && b.status !== filterStatus) return false;
        if (filterGrade !== 'all' && b.gradeLevel !== filterGrade) return false;
        return true;
      })
      .filter((b) => {
        if (!s) return true;
        const haystack = [
          b.id,
          b.gradeLevel,
          b.streamName || '',
          b.academicYear,
          b.kind,
          b.criteria,
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(s);
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [
    batches,
    filterGrade,
    filterKind,
    filterStatus,
    filterYearId,
    search,
  ]);

  const counts = useMemo(() => {
    const total = batches.length;
    const completed = batches.filter((b) => b.status === 'completed').length;
    const locked = batches.filter((b) => b.status === 'locked').length;
    const running = batches.filter((b) => b.status === 'running').length;
    const selectedTotal = batches.reduce((acc, b) => acc + b.learnerCountSelected, 0);

    return { total, completed, locked, running, selectedTotal };
  }, [batches]);

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

  const openCreate = () => {
    setFormErrors([]);
    setForm({ ...emptyForm, effectiveDate: format(new Date(), 'yyyy-MM-dd') });
    setShowCreateDialog(true);
  };

  const openDetails = (batchId: string) => {
    setSelectedBatchId(batchId);
    setShowDetailsDialog(true);
  };

  const canRun = (b: PromotionBatch) =>
    b.status === 'ready' || b.status === 'draft' || b.status === 'cancelled';

  const canLock = (b: PromotionBatch) => b.status === 'completed';

  const refreshClientData = () => {
    // Client-only refresh simulation.
    toast.message('Promotion batches refreshed (demo data).');
    setBatches(seededBatches());
  };

  const handleCreateBatch = async () => {
    const toValidate = {
      kind: form.kind,
      academicYearId: form.academicYearId,
      gradeLevel: form.gradeLevel,
      streamName: form.streamName,
      effectiveDate: form.effectiveDate,
      criteria: form.criteria,
    };

    const parsed = createBatchSchema.safeParse(toValidate);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => i.message);
      setFormErrors(issues);
      return;
    }

    setActionLoading(true);
    try {
      const yearLabel = academicYears.find((y) => y.id === form.academicYearId)?.label || '';

      // Demo “real data required”: generate target/selected counts based on grade.
      const baseTarget =
        form.gradeLevel === 'Grade 6'
          ? 120
          : form.gradeLevel === 'Grade 9'
            ? 86
            : form.gradeLevel === 'Grade 12'
              ? 44
              : form.gradeLevel === 'Senior High'
                ? 64
                : form.gradeLevel === 'Junior High'
                  ? 90
                  : 60;

      const streamFactor = form.streamName ? 0.85 : 1.0;
      const target = Math.round(baseTarget * streamFactor);
      const selected = Math.round(target * 0.95);

      const batch: PromotionBatch = {
        id: makeId(),
        kind: form.kind,
        academicYear: yearLabel,
        academicYearId: form.academicYearId,
        gradeLevel: form.gradeLevel,
        streamName: form.streamName,
        criteria: form.criteria.trim(),
        effectiveDate: form.effectiveDate,
        learnerCountTarget: target,
        learnerCountSelected: selected,
        learnerCountPromotedOrGraduated: 0,
        status: 'ready',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      setBatches((prev) => [batch, ...prev]);
      setShowCreateDialog(false);
      toast.success('Promotion batch created. You can now run it.');
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
      // Simulate running with a quick timeout.
      setBatches((prev) =>
        prev.map((b) =>
          b.id === selectedBatch.id
            ? {
                ...b,
                status: 'running',
                updatedAt: nowIso(),
              }
            : b,
        ),
      );

      await new Promise((r) => setTimeout(r, 700));

      setBatches((prev) =>
        prev.map((b) => {
          if (b.id !== selectedBatch.id) return b;

          const promoteOrGraduate =
            b.kind === 'graduation'
              ? Math.round(b.learnerCountSelected * 0.96)
              : Math.round(b.learnerCountSelected * 0.98);

          return {
            ...b,
            status: 'completed',
            learnerCountPromotedOrGraduated: promoteOrGraduate,
            updatedAt: nowIso(),
          };
        }),
      );

      setShowRunDialog(false);
      toast.success('Batch run completed. Results are ready for review.');
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
        setBatches((prev) =>
          prev.map((b) =>
            b.id === selectedBatch.id
              ? { ...b, status: 'completed', updatedAt: nowIso() }
              : b,
          ),
        );
        toast.message('Batch unlocked.');
      } else {
        setBatches((prev) =>
          prev.map((b) =>
            b.id === selectedBatch.id
              ? { ...b, status: 'locked', updatedAt: nowIso() }
              : b,
          ),
        );
        toast.success('Batch locked. Decisions are now protected.');
      }

      setShowLockDialog(false);
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
      effectiveDate: batch.effectiveDate,
      status: batch.status,
      criteria: batch.criteria,
      counts: {
        target: batch.learnerCountTarget,
        selected: batch.learnerCountSelected,
        promotedOrGraduated: batch.learnerCountPromotedOrGraduated,
      },
      exportedAt: nowIso(),
      note:
        'This export is generated from the current UI state (demo). Connect backend endpoints to export official records.',
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promotion-batch-${batch.id}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Export generated (JSON).');
  };

  const statusOptions: Array<{ value: 'all' | PromotionStatus; label: string }> = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'ready', label: 'Ready' },
    { value: 'running', label: 'Running' },
    { value: 'completed', label: 'Completed' },
    { value: 'locked', label: 'Locked' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const kindOptions: Array<{ value: 'all' | PromotionKind; label: string }> = [
    { value: 'all', label: 'All Types' },
    { value: 'promotion', label: 'Promotions' },
    { value: 'graduation', label: 'Graduations' },
  ];

  return (
    <div className="min-h-screen w-full p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promotions & Graduations</h1>
            <p className="text-sm text-gray-500">
              Manage promotion batches (learners moving to the next class) and graduation runs (certificates for a level).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={refreshClientData}
            disabled={actionLoading}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
            onClick={openCreate}
            disabled={actionLoading}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            New Batch
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="rounded-2xl shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-indigo-600" />
              Total Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{counts.total}</div>
            <p className="text-xs text-gray-500 mt-1">For promotions & graduations</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{counts.completed}</div>
            <p className="text-xs text-gray-500 mt-1">Results generated</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4 text-sky-600" />
              Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{counts.locked}</div>
            <p className="text-xs text-gray-500 mt-1">Decisions protected</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              Selected Learners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{counts.selectedTotal}</div>
            <p className="text-xs text-gray-500 mt-1">Across all batches</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            Find a promotion / graduation run
            <span className="ml-2 text-sm text-gray-500 font-normal">
              {filteredBatches.length} batch(es)
            </span>
          </CardTitle>
          <CardDescription>
            Search by grade/stream, academic year, or learner criteria. Then run, lock, or export results.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by grade, stream, criteria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>

            <Select value={filterKind} onValueChange={(v) => setFilterKind(v as any)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {kindOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYearId} onValueChange={(v) => setFilterYearId(v as any)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Academic year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterGrade} onValueChange={(v) => setFilterGrade(v as any)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Grade / Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {gradeLevels.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
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
            <CalendarDays className="h-4 w-4 text-gray-400" />
            Promotion & Graduation Batches
          </CardTitle>
          <CardDescription>
            A batch represents a single decision cycle for learners moving to the next class or graduating from a level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
              <AlertCircle className="h-10 w-10 mb-3 text-gray-300" />
              <p className="font-medium">No batches match your filters</p>
              <p className="text-sm max-w-md">
                Create a new batch using <b>New Batch</b> and then run it to generate promotion/graduation results.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Grade & Stream</TableHead>
                    <TableHead>Effective</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Counts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((b) => {
                    const kind = promotionKindBadge(b.kind);
                    const sb = statusBadge(b.status);
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium text-gray-900">
                          <div className="flex flex-col">
                            <span className="text-sm">{b.id}</span>
                            <span className="text-xs text-gray-500">Updated {formatDate(b.updatedAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={kind.className}>{kind.label}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{b.academicYear}</TableCell>
                        <TableCell className="text-gray-600">
                          <div className="flex flex-col">
                            <span className="text-sm">{b.gradeLevel}</span>
                            <span className="text-xs text-gray-500">
                              {b.streamName ? b.streamName : 'No stream'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{formatDate(b.effectiveDate)}</TableCell>
                        <TableCell>
                          <Badge variant={sb.variant} className={sb.className}>
                            {sb.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          <div className="flex flex-col">
                            <span className="text-sm">
                              Selected <b>{b.learnerCountSelected}</b>
                            </span>
                            <span className="text-xs text-gray-500">
                              {b.kind === 'graduation' ? 'Graduated' : 'Promoted'}{' '}
                              <b>{b.learnerCountPromotedOrGraduated}</b>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openDetails(b.id)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              disabled={!canRun(b) || actionLoading}
                              onClick={() => {
                                setSelectedBatchId(b.id);
                                setShowRunDialog(true);
                              }}
                              title="Run batch"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              disabled={!(canLock(b) || b.status === 'locked') || actionLoading}
                              onClick={() => {
                                setSelectedBatchId(b.id);
                                setShowLockDialog(true);
                              }}
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
                              className="h-8 w-8"
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
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Promotion / Graduation Batch</DialogTitle>
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
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, kind: v as PromotionKind }))
                  }
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
                      <SelectItem key={y.id} value={y.id}>
                        {y.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Grade / Level</Label>
                <Select
                  value={form.gradeLevel}
                  onValueChange={(v) => {
                    const grade = v;
                    // If user selects a high-level graduation, keep stream optional.
                    setForm((f) => ({ ...f, gradeLevel: grade }));
                  }}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Stream (optional)</Label>
                <Select
                  value={form.streamName ?? 'none'}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      streamName: v === 'none' ? null : v,
                    }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select stream" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No stream</SelectItem>
                    {streams.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                      You will run a batch for <b>{form.gradeLevel}</b>{' '}
                      {form.streamName ? `(${form.streamName})` : '(all streams)'}.
                    </span>
                  </div>
                  <div className="mt-2 text-gray-600">
                    Learners selected & results will be generated after running.
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
            <DialogTitle>{selectedBatch ? selectedBatch.id : 'Batch details'}</DialogTitle>
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
                  {selectedBatch.gradeLevel} {selectedBatch.streamName ? `• ${selectedBatch.streamName}` : ''}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-500">Effective</span>
                <span className="font-medium text-gray-900">{formatDate(selectedBatch.effectiveDate)}</span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-500">Status</span>
                <Badge
                  variant={statusBadge(selectedBatch.status).variant}
                  className={statusBadge(selectedBatch.status).className}
                >
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
                You are about to run batch <b>{selectedBatch.id}</b> for{' '}
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
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setShowRunDialog(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => void handleRunBatch()}
                  disabled={actionLoading}
                >
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
              {selectedBatch?.status === 'locked' ? (
                <Unlock className="h-5 w-5" />
              ) : (
                <Lock className="h-5 w-5" />
              )}
              {selectedBatch?.status === 'locked' ? 'Unlock Batch' : 'Lock Batch'}
            </DialogTitle>
          </DialogHeader>

          {selectedBatch ? (
            <>
              <p className="text-sm text-gray-600">
                Batch <b>{selectedBatch.id}</b> is currently <b>{statusBadge(selectedBatch.status).label}</b>.
                {selectedBatch.status === 'locked'
                  ? ' Unlocking allows edits and re-running selection.'
                  : ' Locking protects decisions and makes results official for records.'}
              </p>

              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800 mt-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>
                    Use lock after you confirm the list of learners promoted or graduated.
                  </span>
                </div>
              </div>

              <DialogFooter className="gap-3 mt-4">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setShowLockDialog(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-xl bg-sky-700 hover:bg-sky-800"
                  onClick={() => void handleToggleLock()}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {selectedBatch.status === 'locked' ? 'Unlock' : 'Lock'}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Notes for role / school (optional UI) */}
      {userData?.schoolId ? null : (
        <div className="hidden" />
      )}
    </div>
  );
}

