import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Download, Printer, History, AlertCircle, FileText } from 'lucide-react';
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

interface ChildInfo {
  first_name: string;
  last_name: string;
  admission_number: string;
  grade_level: string;
  stream_name: string | null;
}

interface ReportCardsProps {
  /** Bound to getLearnerResults(selectedChildId) from the parent dashboard */
  fetchResults: ResultsFetcher;
  /** Re-fetch whenever this changes, e.g. the parent switching which child is selected */
  reloadKey?: string;
  child?: ChildInfo | null;
  emptyMessage?: string;
}

const GRADE_STYLES: Record<string, string> = {
  EE: 'bg-green-100 text-green-700 hover:bg-green-100',
  ME: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  AE: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  BE: 'bg-red-100 text-red-700 hover:bg-red-100',
};

const GRADE_LABELS: Record<string, string> = {
  EE: 'Exceeding Expectations',
  ME: 'Meeting Expectations',
  AE: 'Approaching Expectations',
  BE: 'Below Expectations',
};

const gradeBadgeClass = (grade?: string | null) =>
  (grade && GRADE_STYLES[grade]) || 'bg-muted text-muted-foreground';

const ALL = 'all';

const ReportCards: React.FC<ReportCardsProps> = ({ fetchResults, reloadKey, child, emptyMessage }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [filterOptions, setFilterOptions] = useState<AvailableFilters>({ years: [], terms: [], exams: [] });

  // "Historical reports" filters
  const [year, setYear] = useState<string>(ALL);
  const [termId, setTermId] = useState<string>(ALL);

  const [selectedExam, setSelectedExam] = useState<ExamSummary | null>(null);

  const load = async (filters?: LearnerResultsFilters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchResults(filters);
      setExams(res.data.exams || []);
      setFilterOptions(res.data.available_filters || { years: [], terms: [], exams: [] });
    } catch (err: any) {
      setError(err.message || 'Failed to load report cards');
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setYear(ALL);
    setTermId(ALL);
    setSelectedExam(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const applyFilters = (nextYear: string, nextTermId: string) => {
    load({
      year: nextYear !== ALL ? nextYear : undefined,
      term_id: nextTermId !== ALL ? nextTermId : undefined,
    });
  };

  const sortedExams = useMemo(
    () =>
      [...exams].sort((a, b) => {
        const ad = a.exam?.start_date ? new Date(a.exam.start_date).getTime() : 0;
        const bd = b.exam?.start_date ? new Date(b.exam.start_date).getTime() : 0;
        return bd - ad; // most recent first
      }),
    [exams]
  );

  const handlePrintOrDownload = (exam: ExamSummary) => {
    setSelectedExam(exam);
    // Let the dialog render, then invoke the browser print dialog. Choosing
    // "Save as PDF" as the destination there covers "Download PDF" without
    // needing an extra client-side PDF library.
    setTimeout(() => window.print(), 150);
  };

  return (
    <Card id="report-cards-section">
      <CardHeader>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Report Cards
            </CardTitle>
            <CardDescription>View, print, or download your child's report cards</CardDescription>
          </div>
        </div>

        {/* Historical reports: filter by year / term */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Select
            value={year}
            onValueChange={(v) => {
              setYear(v);
              applyFilters(v, termId);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Year" />
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

          <Select
            value={termId}
            onValueChange={(v) => {
              setTermId(v);
              applyFilters(year, v);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All terms</SelectItem>
              {filterOptions.terms.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} {t.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="outline" className="flex items-center gap-1 self-center">
            <History className="h-3 w-3" />
            {sortedExams.length} report{sortedExams.length === 1 ? '' : 's'} found
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : sortedExams.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage || 'No report cards are available yet.'}
          </p>
        ) : (
          <div className="space-y-3">
            {sortedExams.map((exam) => (
              <div
                key={exam.exam_id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{exam.exam?.exam_name || 'Exam'}</p>
                  <p className="text-sm text-muted-foreground">
                    {exam.exam?.academic_years
                      ? `${exam.exam.academic_years.name} ${exam.exam.academic_years.year}`
                      : ''}
                    {exam.exam?.start_date
                      ? ` • ${new Date(exam.exam.start_date).toLocaleDateString()}`
                      : ''}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={gradeBadgeClass(exam.overall_grade)}>
                    Overall: {exam.overall_grade || '—'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {exam.average_percentage != null ? `${exam.average_percentage.toFixed(1)}%` : '—'}
                  </span>
                  {exam.position && exam.class_size && (
                    <span className="text-sm text-muted-foreground">
                      Rank {exam.position}/{exam.class_size}
                    </span>
                  )}

                  <Button size="sm" variant="outline" onClick={() => setSelectedExam(exam)}>
                    <Eye className="mr-1.5 h-4 w-4" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handlePrintOrDownload(exam)}>
                    <Printer className="mr-1.5 h-4 w-4" />
                    Print
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handlePrintOrDownload(exam)}>
                    <Download className="mr-1.5 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Full report card view */}
      <Dialog open={!!selectedExam} onOpenChange={(open) => !open && setSelectedExam(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto print:max-h-none print:max-w-none print:overflow-visible">
          {selectedExam && (
            <div id="report-card-printable">
              <DialogHeader>
                <DialogTitle>Report Card</DialogTitle>
                <DialogDescription>
                  {selectedExam.exam?.exam_name}
                  {selectedExam.exam?.academic_years
                    ? ` • ${selectedExam.exam.academic_years.name} ${selectedExam.exam.academic_years.year}`
                    : ''}
                </DialogDescription>
              </DialogHeader>

              {child && (
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Learner: </span>
                    {child.first_name} {child.last_name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Admission No: </span>
                    {child.admission_number}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Grade: </span>
                    {child.grade_level}
                    {child.stream_name ? ` ${child.stream_name}` : ''}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Overall Grade: </span>
                    <Badge className={gradeBadgeClass(selectedExam.overall_grade)}>
                      {selectedExam.overall_grade || '—'}
                    </Badge>
                  </div>
                </div>
              )}

              <Separator className="my-4" />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learning Area</TableHead>
                    <TableHead className="text-right">Marks</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedExam.subjects.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {s.learning_area?.name || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.is_absent ? 'Absent' : `${s.marks_obtained}/${s.max_marks}`}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.is_absent ? '—' : `${s.percentage.toFixed(1)}%`}
                      </TableCell>
                      <TableCell>
                        <Badge className={gradeBadgeClass(s.performance_level)}>
                          {s.performance_level || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                        {s.remarks || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">Total Marks</p>
                  <p className="font-medium">
                    {selectedExam.total_marks}/{selectedExam.total_max}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Average</p>
                  <p className="font-medium">{selectedExam.average_percentage.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Class Position</p>
                  <p className="font-medium">
                    {selectedExam.position && selectedExam.class_size
                      ? `${selectedExam.position} of ${selectedExam.class_size}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Overall Level</p>
                  <p className="font-medium">
                    {GRADE_LABELS[selectedExam.overall_grade || ''] || selectedExam.overall_grade || '—'}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 print:hidden">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-1.5 h-4 w-4" />
                  Print
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Download className="mr-1.5 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print styles: only the open report card dialog is printed */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-card-printable, #report-card-printable * { visibility: visible; }
          #report-card-printable { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </Card>
  );
};

export default ReportCards;
