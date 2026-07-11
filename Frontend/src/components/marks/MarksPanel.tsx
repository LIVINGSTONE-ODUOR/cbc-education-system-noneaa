import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import type {
  ApiResponse,
  AvailableFilters,
  ExamSummary,
  LearnerResultsFilters,
  ResultLearner,
} from '@/lib/api/resultsApi';

type ResultsFetcher = (
  filters?: LearnerResultsFilters
) => Promise<ApiResponse<{ learner: ResultLearner; exams: ExamSummary[]; available_filters: AvailableFilters }>>;

interface MarksPanelProps {
  /** Bound to either getMyResults() (student) or getLearnerResults(childId) (parent) */
  fetchResults: ResultsFetcher;
  /** Re-fetch when this changes, e.g. the parent switching which child is selected */
  reloadKey?: string;
  emptyMessage?: string;
}

const GRADE_STYLES: Record<string, string> = {
  EE: 'bg-green-100 text-green-700 hover:bg-green-100',
  ME: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  AE: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  BE: 'bg-red-100 text-red-700 hover:bg-red-100',
};

const gradeBadgeClass = (grade?: string | null) =>
  (grade && GRADE_STYLES[grade]) || 'bg-muted text-muted-foreground';

const ALL = 'all';

const MarksPanel: React.FC<MarksPanelProps> = ({ fetchResults, reloadKey, emptyMessage }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [filterOptions, setFilterOptions] = useState<AvailableFilters>({ years: [], terms: [], exams: [] });

  const [year, setYear] = useState<string>(ALL);
  const [termId, setTermId] = useState<string>(ALL);
  const [examId, setExamId] = useState<string>(ALL);

  const load = async (filters?: LearnerResultsFilters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchResults(filters);
      setExams(res.data.exams || []);
      setFilterOptions(
        res.data.available_filters || { years: [], terms: [], exams: [] }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load marks');
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset filters and reload whenever the underlying learner changes
  // (e.g. a parent switching between children).
  useEffect(() => {
    setYear(ALL);
    setTermId(ALL);
    setExamId(ALL);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  useEffect(() => {
    load({
      year: year !== ALL ? year : undefined,
      term_id: termId !== ALL ? termId : undefined,
      exam_id: examId !== ALL ? examId : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, termId, examId]);

  const termsForYear = filterOptions.terms.filter(
    (t) => year === ALL || String(t.year) === year
  );
  const examsForSelection = filterOptions.exams.filter(
    (e) =>
      (year === ALL || String(e.year) === year) &&
      (termId === ALL || e.term_id === termId)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Marks</CardTitle>
          <CardDescription>Filter by year, term, or a specific exam</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-muted-foreground mb-1 block">Year</span>
              <Select
                value={year}
                onValueChange={(v) => {
                  setYear(v);
                  setTermId(ALL);
                  setExamId(ALL);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All years</SelectItem>
                  {filterOptions.years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <span className="text-sm text-muted-foreground mb-1 block">Term</span>
              <Select
                value={termId}
                onValueChange={(v) => {
                  setTermId(v);
                  setExamId(ALL);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All terms</SelectItem>
                  {termsForYear.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <span className="text-sm text-muted-foreground mb-1 block">Exam</span>
              <Select value={examId} onValueChange={setExamId}>
                <SelectTrigger>
                  <SelectValue placeholder="All exams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All exams</SelectItem>
                  {examsForSelection.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.exam_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {!loading && error && (
        <Card className="border-red-200">
          <CardContent className="pt-6 flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" /> {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && exams.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {emptyMessage || 'No marks recorded yet for the selected filters.'}
          </CardContent>
        </Card>
      )}

      {!loading &&
        !error &&
        exams.map((examSummary) => (
          <Card key={examSummary.exam_id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">{examSummary.exam?.exam_name || 'Exam'}</CardTitle>
                <CardDescription>
                  {[
                    examSummary.exam?.academic_years?.name,
                    examSummary.exam?.academic_years?.year,
                    examSummary.exam?.exam_type,
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </CardDescription>
              </div>
              <Badge className={gradeBadgeClass(examSummary.overall_grade)}>
                {examSummary.overall_grade}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div>
                  <p className="text-2xl font-bold">
                    {examSummary.total_marks}/{examSummary.total_max}
                  </p>
                  <p className="text-xs text-muted-foreground">Total marks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{examSummary.average_percentage}%</p>
                  <p className="text-xs text-muted-foreground">Average</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {examSummary.position ? `${examSummary.position}/${examSummary.class_size}` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Class position</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examSummary.subjects.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{s.learning_area?.name || '—'}</TableCell>
                      <TableCell>
                        {s.is_absent ? 'Absent' : `${s.marks_obtained}/${s.max_marks}`}
                      </TableCell>
                      <TableCell>{s.is_absent ? '—' : `${s.percentage}%`}</TableCell>
                      <TableCell>
                        {s.performance_level ? (
                          <Badge className={gradeBadgeClass(s.performance_level)}>
                            {s.performance_level}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.remarks || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
    </div>
  );
};

export default MarksPanel;
