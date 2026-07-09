import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Progress } from '@/components/ui/progress';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Search,
  Loader2,
  ServerCrash,
  FileSpreadsheet,
  GraduationCap,
  BarChart3,
  Trophy,
  Users,
  RefreshCcw,
} from 'lucide-react';

import { getClasses, ClassApiItem } from '@/lib/api/classApi';
import { getAcademicTerms, AcademicTerm } from '@/lib/api/academicTermsApi';
import { getExams, ExamApiItem } from '@/lib/api/examApi';
import { getLearningAreas, LearningArea } from '@/lib/api/curriculumApi';
import {
  getResults,
  searchLearners,
  getLearnerResults,
  compareResults,
  ExamResultRow,
  ResultLearner,
  ExamSummary,
  PerformanceLevel,
} from '@/lib/api/resultsApi';

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const gradeBadgeStyles: Record<PerformanceLevel, string> = {
  EE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  ME: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  AE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  BE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

const gradeLabels: Record<PerformanceLevel, string> = {
  EE: 'Exceeding Expectation',
  ME: 'Meeting Expectation',
  AE: 'Approaching Expectation',
  BE: 'Below Expectation',
};

const GradeBadge: React.FC<{ grade: PerformanceLevel | null | undefined }> = ({ grade }) => {
  if (!grade) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge className={gradeBadgeStyles[grade]} title={gradeLabels[grade]}>
      {grade}
    </Badge>
  );
};

const classLabel = (cls?: { grade_level: string; stream_name: string | null } | null) =>
  cls ? (cls.stream_name ? `${cls.grade_level} — ${cls.stream_name}` : cls.grade_level) : '—';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'dd MMM yyyy');
  } catch {
    return value;
  }
};

const learnerName = (l?: { first_name: string; last_name: string } | null) =>
  l ? `${l.first_name} ${l.last_name}` : '—';

// ─────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────

const FinalResults: React.FC = () => {
  const [userData, setUserData] = useState<{ schoolId: string | null } | null>(null);
  const [activeTab, setActiveTab] = useState('view');

  // Reference data
  const [classes, setClasses] = useState<ClassApiItem[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [exams, setExams] = useState<ExamApiItem[]>([]);
  const [subjects, setSubjects] = useState<LearningArea[]>([]);
  const [loadingReference, setLoadingReference] = useState(true);
  const [referenceError, setReferenceError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('cbe_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setUserData({ schoolId: user.schoolId || user.school_id || null });
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
  }, []);

  const loadReferenceData = useCallback(async () => {
    if (!userData?.schoolId) return;
    setLoadingReference(true);
    setReferenceError(null);
    try {
      const [classesRes, termsRes, examsRes, subjectsRes] = await Promise.all([
        getClasses({ is_active: 'true', limit: 200 }),
        getAcademicTerms(userData.schoolId),
        getExams({ limit: 200, sort_by: 'start_date', sort_order: 'desc' }),
        getLearningAreas({}),
      ]);
      setClasses(classesRes.data?.classes || []);
      setTerms(termsRes || []);
      setExams(examsRes.data?.exams || []);
      setSubjects(subjectsRes.data?.learning_areas || []);
    } catch (error: any) {
      setReferenceError(error.message || 'Failed to load reference data');
    } finally {
      setLoadingReference(false);
    }
  }, [userData?.schoolId]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Final Results
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            View published exam results, search a learner's results, and compare performance across exams.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadReferenceData} disabled={loadingReference}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${loadingReference ? 'animate-spin' : ''}`} />
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="view">
            <BarChart3 className="h-4 w-4 mr-1.5" /> Exam Results
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-1.5" /> Search Learner
          </TabsTrigger>
          <TabsTrigger value="compare">
            <Trophy className="h-4 w-4 mr-1.5" /> Compare Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <ViewResultsTab exams={exams} classes={classes} terms={terms} subjects={subjects} />
        </TabsContent>

        <TabsContent value="search">
          <SearchLearnerTab />
        </TabsContent>

        <TabsContent value="compare">
          <CompareResultsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Tab 1 — View Exam Results
// ─────────────────────────────────────────────────────────────────────────

const ViewResultsTab: React.FC<{
  exams: ExamApiItem[];
  classes: ClassApiItem[];
  terms: AcademicTerm[];
  subjects: LearningArea[];
}> = ({ exams, classes, subjects }) => {
  const [examId, setExamId] = useState('');
  const [classId, setClassId] = useState('all');
  const [subjectId, setSubjectId] = useState('all');
  const [rows, setRows] = useState<ExamResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const loadResults = useCallback(async () => {
    if (!examId) {
      toast.error('Select an exam first');
      return;
    }
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await getResults({
        exam_id: examId,
        class_id: classId !== 'all' ? classId : undefined,
        learning_area_id: subjectId !== 'all' ? subjectId : undefined,
        limit: 200,
      });
      setRows(res.data?.results || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load results');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [examId, classId, subjectId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>View Exam Results</CardTitle>
        <CardDescription>Pick an exam (and optionally a class or subject) to view marks.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Select value={examId} onValueChange={setExamId}>
            <SelectTrigger className="w-64">
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

          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {classLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={loadResults} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            View Results
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {hasSearched && !loading && rows.length === 0 && !error && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No results found for the selected filters.
          </p>
        )}

        {rows.length > 0 && (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner</TableHead>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Marks</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{learnerName(r.learners)}</TableCell>
                    <TableCell>{r.learners?.admission_number || '—'}</TableCell>
                    <TableCell>{classLabel(r.classes)}</TableCell>
                    <TableCell>{r.learning_areas?.name || '—'}</TableCell>
                    <TableCell className="text-right">
                      {r.is_absent ? (
                        <span className="text-muted-foreground">Absent</span>
                      ) : (
                        `${r.marks_obtained} / ${r.max_marks}`
                      )}
                    </TableCell>
                    <TableCell className="text-right">{r.is_absent ? '—' : `${r.percentage}%`}</TableCell>
                    <TableCell>
                      <GradeBadge grade={r.performance_level} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.remarks || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Shared: learner search box
// ─────────────────────────────────────────────────────────────────────────

const useLearnerSearch = () => {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<ResultLearner[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setMatches([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchLearners(query.trim());
        setMatches(res.data?.learners || []);
      } catch {
        setMatches([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  return { query, setQuery, matches, searching, setMatches };
};

// ─────────────────────────────────────────────────────────────────────────
// Tab 2 — Search a learner's final result
// ─────────────────────────────────────────────────────────────────────────

const SearchLearnerTab: React.FC = () => {
  const { query, setQuery, matches, searching, setMatches } = useLearnerSearch();
  const [selectedLearner, setSelectedLearner] = useState<ResultLearner | null>(null);
  const [examSummaries, setExamSummaries] = useState<ExamSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectLearner = async (learner: ResultLearner) => {
    setSelectedLearner(learner);
    setMatches([]);
    setQuery('');
    setLoading(true);
    setError(null);
    try {
      const res = await getLearnerResults(learner.id);
      setExamSummaries(res.data?.exams || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load results for this learner');
      setExamSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search a Learner's Final Result</CardTitle>
        <CardDescription>Search by name or admission number to view their complete result history.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or admission number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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

        {loading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading results...
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {selectedLearner && !loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-md border p-4 bg-muted/40">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">{learnerName(selectedLearner)}</p>
                <p className="text-sm text-muted-foreground">
                  Admission No. {selectedLearner.admission_number} · {classLabel(selectedLearner.classes)}
                </p>
              </div>
            </div>

            {examSummaries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No results have been recorded for this learner yet.
              </p>
            ) : (
              examSummaries.map((summary) => <ExamSummaryCard key={summary.exam_id} summary={summary} />)
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ExamSummaryCard: React.FC<{ summary: ExamSummary }> = ({ summary }) => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="text-base">{summary.exam?.exam_name || 'Exam'}</CardTitle>
          <CardDescription>
            {summary.exam?.exam_type} · {formatDate(summary.exam?.start_date)}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <GradeBadge grade={summary.overall_grade} />
          {summary.position && summary.class_size && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" /> Position {summary.position} of {summary.class_size}
            </Badge>
          )}
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">
              Total: {summary.total_marks} / {summary.total_max}
            </span>
            <span className="font-medium">{summary.average_percentage}%</span>
          </div>
          <Progress value={summary.average_percentage} />
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead className="text-right">Marks</TableHead>
              <TableHead className="text-right">%</TableHead>
              <TableHead>Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.subjects.map((s, idx) => (
              <TableRow key={idx}>
                <TableCell>{s.learning_area?.name || '—'}</TableCell>
                <TableCell className="text-right">
                  {s.is_absent ? <span className="text-muted-foreground">Absent</span> : `${s.marks_obtained} / ${s.max_marks}`}
                </TableCell>
                <TableCell className="text-right">{s.is_absent ? '—' : `${s.percentage}%`}</TableCell>
                <TableCell>
                  <GradeBadge grade={s.performance_level} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

// ─────────────────────────────────────────────────────────────────────────
// Tab 3 — Compare a learner's results across exams
// ─────────────────────────────────────────────────────────────────────────

const CompareResultsTab: React.FC = () => {
  const { query, setQuery, matches, searching, setMatches } = useLearnerSearch();
  const [selectedLearner, setSelectedLearner] = useState<ResultLearner | null>(null);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [subjectTrend, setSubjectTrend] = useState<Record<string, { exam_id: string; exam_name?: string; percentage: number; performance_level: PerformanceLevel | null }[]>>({});
  const [checkedExamIds, setCheckedExamIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectLearner = async (learner: ResultLearner) => {
    setSelectedLearner(learner);
    setMatches([]);
    setQuery('');
    setLoading(true);
    setError(null);
    try {
      const res = await compareResults(learner.id);
      const examList = res.data?.exams || [];
      setExams(examList);
      setSubjectTrend(res.data?.subject_trend || {});
      setCheckedExamIds(new Set(examList.map((e) => e.exam_id)));
    } catch (e: any) {
      setError(e.message || 'Failed to load comparison data');
      setExams([]);
      setSubjectTrend({});
    } finally {
      setLoading(false);
    }
  };

  const toggleExam = (examId: string) => {
    setCheckedExamIds((prev) => {
      const next = new Set(prev);
      if (next.has(examId)) next.delete(examId);
      else next.add(examId);
      return next;
    });
  };

  const visibleExams = useMemo(
    () => exams.filter((e) => checkedExamIds.has(e.exam_id)),
    [exams, checkedExamIds]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compare a Learner's Results</CardTitle>
        <CardDescription>Search a learner, then choose which exams to compare side by side.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or admission number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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

        {loading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading comparison...
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {selectedLearner && !loading && exams.length === 0 && !error && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No results found for {learnerName(selectedLearner)} yet — nothing to compare.
          </p>
        )}

        {selectedLearner && exams.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-md border p-4 bg-muted/40">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">{learnerName(selectedLearner)}</p>
                <p className="text-sm text-muted-foreground">
                  Admission No. {selectedLearner.admission_number} · {classLabel(selectedLearner.classes)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {exams.map((e) => (
                <button
                  key={e.exam_id}
                  onClick={() => toggleExam(e.exam_id)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    checkedExamIds.has(e.exam_id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground'
                  }`}
                >
                  {e.exam?.exam_name || 'Exam'}
                </button>
              ))}
            </div>

            {visibleExams.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Select at least one exam above.</p>
            ) : (
              <>
                {/* Overall average trend */}
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Overall</TableHead>
                        {visibleExams.map((e) => (
                          <TableHead key={e.exam_id} className="text-right">
                            {e.exam?.exam_name || 'Exam'}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Average %</TableCell>
                        {visibleExams.map((e) => (
                          <TableCell key={e.exam_id} className="text-right">
                            {e.average_percentage}%
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Grade</TableCell>
                        {visibleExams.map((e) => (
                          <TableCell key={e.exam_id} className="text-right">
                            <GradeBadge grade={e.overall_grade} />
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Class Position</TableCell>
                        {visibleExams.map((e) => (
                          <TableCell key={e.exam_id} className="text-right">
                            {e.position ? `${e.position} / ${e.class_size}` : '—'}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Per-subject trend */}
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        {visibleExams.map((e) => (
                          <TableHead key={e.exam_id} className="text-right">
                            {e.exam?.exam_name || 'Exam'}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(subjectTrend).map(([subjectName, points]) => (
                        <TableRow key={subjectName}>
                          <TableCell className="font-medium">{subjectName}</TableCell>
                          {visibleExams.map((e) => {
                            const point = points.find((p) => p.exam_id === e.exam_id);
                            return (
                              <TableCell key={e.exam_id} className="text-right">
                                {point ? `${point.percentage}%` : '—'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinalResults;
