import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  Search,
  Loader2,
  ServerCrash,
  ClipboardList,
  GraduationCap,
  Save,
  Trash2,
  RefreshCcw,
} from 'lucide-react';

import { getExams, ExamApiItem } from '@/lib/api/examApi';
import { LearningArea } from '@/lib/api/curriculumApi';
import { getClassLearningAreas } from '@/lib/api/classApi';
import { useAuth } from '@/contexts/AuthContext';
import { getMyClasses } from '@/lib/api/teacherApi';
import {
  searchLearners as apiSearchLearners,
  getResults,
  bulkUpsertResults,
  deleteResult,
  ResultLearner,
  ExamResultRow,
} from '@/lib/api/resultsApi';

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const classLabel = (cls?: { grade_level: string; stream_name: string | null } | null) =>
  cls ? (cls.stream_name ? `${cls.grade_level} — ${cls.stream_name}` : cls.grade_level) : '—';

const learnerName = (l?: { first_name: string; last_name: string } | null) =>
  l ? `${l.first_name} ${l.last_name}` : '—';

const gradeBadgeStyles: Record<string, string> = {
  EE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  ME: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  AE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  BE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

// One editable row per subject the learner's class/grade takes
interface MarkRow {
  learning_area_id: string;
  subject_name: string;
  subject_code: string;
  result_id: string | null; // set once saved -> lets us edit/delete
  marks_obtained: string; // kept as string while editing the input
  max_marks: string;
  is_absent: boolean;
  remarks: string;
  performance_level: string | null;
  saving: boolean;
  deleting: boolean;
  dirty: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────

const MarksEntry: React.FC = () => {
  const { user } = useAuth();
  const isTeacherRole = user?.role === 'teacher';
  const location = useLocation();

  // Reference data
  const [exams, setExams] = useState<ExamApiItem[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [examId, setExamId] = useState('');

  // Learner search
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<ResultLearner[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<ResultLearner | null>(null);

  // Arriving from the Teacher Portal's "Add Assessment" button skips the
  // manual search step — the student is already known. handleExamChange
  // (below) picks up from here once the teacher selects an exam.
  useEffect(() => {
    const prefill = (location.state as { prefillLearner?: ResultLearner } | null)?.prefillLearner;
    if (prefill) setSelectedLearner(prefill);
  }, [location.state]);

  // Marks sheet for the selected learner + exam
  const [rows, setRows] = useState<MarkRow[]>([]);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  // Teacher scoping: class_id -> Set of learning_area_ids this teacher is
  // assigned to teach. Only populated for role === 'teacher'. Admins have
  // no restriction, so this stays null for them (meaning "show everything").
  const [myAssignedByClass, setMyAssignedByClass] = useState<Record<string, Set<string>> | null>(
    null
  );

  useEffect(() => {
    if (!isTeacherRole) {
      setMyAssignedByClass(null);
      return;
    }
    (async () => {
      try {
        const res = await getMyClasses();
        const map: Record<string, Set<string>> = {};
        (res.data?.assignments || []).forEach((a) => {
          const classId = a.class?.id;
          const subjectId = a.learning_area?.id;
          if (!classId || !subjectId) return;
          if (!map[classId]) map[classId] = new Set();
          map[classId].add(subjectId);
        });
        setMyAssignedByClass(map);
      } catch {
        // If this fails, fall back to an empty map (no subjects shown)
        // rather than silently showing everything.
        setMyAssignedByClass({});
      }
    })();
  }, [isTeacherRole]);

  // ── Load exams (active ones first) ─────────────────────────────────────
  const loadExams = useCallback(async () => {
    setLoadingExams(true);
    setReferenceError(null);
    try {
      const res = await getExams({ limit: 200, sort_by: 'start_date', sort_order: 'desc' });
      setExams(res.data?.exams || []);
    } catch (e: any) {
      setReferenceError(e.message || 'Failed to load exams');
    } finally {
      setLoadingExams(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  // ── Debounced learner search ────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) {
      setMatches([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiSearchLearners(query.trim());
        setMatches(res.data?.learners || []);
      } catch {
        setMatches([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  // ── Build the marks sheet: subjects the learner's CLASS takes + any existing marks ──
  const loadSheet = useCallback(
    async (learner: ResultLearner, exam_id: string) => {
      if (!learner || !exam_id) return;
      if (!learner.class_id) {
        setSheetError('This learner is not assigned to a class, so their subjects cannot be determined.');
        setRows([]);
        return;
      }

      setLoadingSheet(true);
      setSheetError(null);
      try {
        const [subjectsRes, resultsRes] = await Promise.all([
          getClassLearningAreas(learner.class_id),
          getResults({ exam_id, class_id: learner.class_id, limit: 500 }),
        ]);

        // Subjects assigned to this learner's class specifically (falls back
        // to the grade-level default on the backend if the class has no
        // explicit subject assignment yet).
        let subjects: LearningArea[] = (subjectsRes.data?.learning_areas || []) as LearningArea[];

        // Teachers only see/enter marks for subjects they're assigned to
        // teach in THIS class — everything else is hidden from the sheet
        // entirely (the backend enforces the same rule on save).
        if (isTeacherRole && myAssignedByClass) {
          const allowed = myAssignedByClass[learner.class_id] || new Set<string>();
          subjects = subjects.filter((s) => allowed.has(s.id));
        }

        const existing: ExamResultRow[] = (resultsRes.data?.results || []).filter(
          (r: ExamResultRow) => r.learner_id === learner.id
        );

        const existingByArea = new Map(existing.map((r) => [r.learning_area_id, r]));

        const built: MarkRow[] = subjects.map((s) => {
          const found = existingByArea.get(s.id);
          return {
            learning_area_id: s.id,
            subject_name: s.name,
            subject_code: s.code,
            result_id: found?.id || null,
            marks_obtained: found ? String(found.marks_obtained) : '',
            max_marks: found ? String(found.max_marks) : '100',
            is_absent: found?.is_absent || false,
            remarks: found?.remarks || '',
            performance_level: found?.performance_level || null,
            saving: false,
            deleting: false,
            dirty: false,
          };
        });

        setRows(built);
        if (subjects.length === 0) {
          setSheetError(
            isTeacherRole
              ? `You aren't assigned to teach any subject in ${classLabel(learner.classes)}.`
              : `No subjects are configured for ${classLabel(learner.classes)} yet.`
          );
        }
      } catch (e: any) {
        setSheetError(e.message || 'Failed to load the marks sheet');
        setRows([]);
      } finally {
        setLoadingSheet(false);
      }
    },
    [isTeacherRole, myAssignedByClass]
  );

  const selectLearner = (learner: ResultLearner) => {
    setSelectedLearner(learner);
    setMatches([]);
    setQuery('');
    if (examId) loadSheet(learner, examId);
  };

  const handleExamChange = (id: string) => {
    setExamId(id);
    if (selectedLearner) loadSheet(selectedLearner, id);
  };

  const updateRow = (learning_area_id: string, patch: Partial<MarkRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.learning_area_id === learning_area_id ? { ...r, ...patch, dirty: true } : r))
    );
  };

  // ── Save (create or update) one subject's mark ──────────────────────────
  const saveRow = async (row: MarkRow) => {
    if (!selectedLearner || !examId) return;

    if (!row.is_absent) {
      const marks = Number(row.marks_obtained);
      const max = Number(row.max_marks || 100);
      if (row.marks_obtained === '' || Number.isNaN(marks)) {
        toast.error(`Enter marks for ${row.subject_name}`);
        return;
      }
      if (marks < 0 || marks > max) {
        toast.error(`Marks for ${row.subject_name} must be between 0 and ${max}`);
        return;
      }
    }

    setRows((prev) =>
      prev.map((r) => (r.learning_area_id === row.learning_area_id ? { ...r, saving: true } : r))
    );

    try {
      const res = await bulkUpsertResults({
        exam_id: examId,
        learning_area_id: row.learning_area_id,
        class_id: selectedLearner.class_id || undefined,
        results: [
          {
            learner_id: selectedLearner.id,
            marks_obtained: row.is_absent ? 0 : Number(row.marks_obtained),
            max_marks: Number(row.max_marks || 100),
            is_absent: row.is_absent,
            remarks: row.remarks || undefined,
          },
        ],
      });

      const saved = res.data?.results?.[0];
      setRows((prev) =>
        prev.map((r) =>
          r.learning_area_id === row.learning_area_id
            ? {
                ...r,
                result_id: saved?.id || r.result_id,
                performance_level: saved?.performance_level || r.performance_level,
                saving: false,
                dirty: false,
              }
            : r
        )
      );
      toast.success(`Saved ${row.subject_name} marks for ${learnerName(selectedLearner)}`);
    } catch (e: any) {
      setRows((prev) =>
        prev.map((r) => (r.learning_area_id === row.learning_area_id ? { ...r, saving: false } : r))
      );
      toast.error(e.message || 'Failed to save marks');
    }
  };

  // ── Delete a previously saved mark ──────────────────────────────────────
  const removeRow = async (row: MarkRow) => {
    if (!row.result_id) return;
    setRows((prev) =>
      prev.map((r) => (r.learning_area_id === row.learning_area_id ? { ...r, deleting: true } : r))
    );
    try {
      await deleteResult(row.result_id);
      setRows((prev) =>
        prev.map((r) =>
          r.learning_area_id === row.learning_area_id
            ? {
                ...r,
                result_id: null,
                marks_obtained: '',
                max_marks: '100',
                is_absent: false,
                remarks: '',
                performance_level: null,
                deleting: false,
                dirty: false,
              }
            : r
        )
      );
      toast.success(`Deleted ${row.subject_name} marks`);
    } catch (e: any) {
      setRows((prev) =>
        prev.map((r) => (r.learning_area_id === row.learning_area_id ? { ...r, deleting: false } : r))
      );
      toast.error(e.message || 'Failed to delete marks');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Marks Entry
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Search a learner, then enter, edit, or delete their marks for each subject their class takes.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadExams} disabled={loadingExams}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${loadingExams ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {referenceError && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <ServerCrash className="h-4 w-4" />
            {referenceError}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>1. Choose Exam &amp; Learner</CardTitle>
          <CardDescription>Pick the exam you're entering marks for, then search for the learner.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={examId} onValueChange={handleExamChange}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.exam_name} ({e.exam_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search learner by name or admission number..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={!examId}
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {matches.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-64 overflow-y-auto">
                  {matches.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => selectLearner(m)}
                      className="w-full text-left px-3 py-2 hover:bg-muted flex items-center justify-between text-sm"
                    >
                      <span className="font-medium">{learnerName(m)}</span>
                      <span className="text-muted-foreground">
                        {m.admission_number} · {classLabel(m.classes)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!examId && (
            <p className="text-sm text-muted-foreground">Select an exam first to enable learner search.</p>
          )}
        </CardContent>
      </Card>

      {selectedLearner && examId && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-base">{learnerName(selectedLearner)}</CardTitle>
                <CardDescription>
                  Admission No. {selectedLearner.admission_number} · {classLabel(selectedLearner.classes)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingSheet && (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading subjects...
              </div>
            )}

            {sheetError && !loadingSheet && <p className="text-sm text-destructive">{sheetError}</p>}

            {!loadingSheet && rows.length > 0 && (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="w-28">Marks</TableHead>
                      <TableHead className="w-24">Out of</TableHead>
                      <TableHead className="w-20">Absent</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="w-20">Grade</TableHead>
                      <TableHead className="w-32 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.learning_area_id}>
                        <TableCell className="font-medium">
                          {row.subject_name}
                          <span className="block text-xs text-muted-foreground">{row.subject_code}</span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={row.marks_obtained}
                            disabled={row.is_absent}
                            onChange={(e) => updateRow(row.learning_area_id, { marks_obtained: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={row.max_marks}
                            onChange={(e) => updateRow(row.learning_area_id, { max_marks: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={row.is_absent}
                            onCheckedChange={(checked) =>
                              updateRow(row.learning_area_id, { is_absent: Boolean(checked) })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.remarks}
                            onChange={(e) => updateRow(row.learning_area_id, { remarks: e.target.value })}
                            placeholder="Optional"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          {row.performance_level ? (
                            <Badge className={gradeBadgeStyles[row.performance_level]}>
                              {row.performance_level}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            size="sm"
                            onClick={() => saveRow(row)}
                            disabled={row.saving || (!row.dirty && !!row.result_id)}
                          >
                            {row.saving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          {row.result_id && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeRow(row)}
                              disabled={row.deleting}
                            >
                              {row.deleting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MarksEntry;
