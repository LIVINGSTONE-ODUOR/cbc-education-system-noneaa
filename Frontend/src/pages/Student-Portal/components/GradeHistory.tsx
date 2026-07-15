import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History } from 'lucide-react';
import type { ExamSummary, PerformanceLevel } from '@/lib/api/resultsApi';

interface GradeHistoryProps {
  /** Reuses the exams already loaded for the dashboard/academics cards — no extra fetch. */
  exams: ExamSummary[];
  emptyMessage?: string;
}

const GRADE_STYLES: Record<PerformanceLevel, string> = {
  EE: 'bg-green-100 text-green-700 hover:bg-green-100',
  ME: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  AE: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  BE: 'bg-red-100 text-red-700 hover:bg-red-100',
};

const gradeBadgeClass = (grade?: PerformanceLevel | null) =>
  (grade && GRADE_STYLES[grade]) || 'bg-muted text-muted-foreground';

const GradeHistory: React.FC<GradeHistoryProps> = ({ exams, emptyMessage }) => {
  // Oldest first, so the table reads chronologically like a history log.
  const sorted = useMemo(
    () =>
      [...exams].sort((a, b) => {
        const ad = a.exam?.start_date ? new Date(a.exam.start_date).getTime() : 0;
        const bd = b.exam?.start_date ? new Date(b.exam.start_date).getTime() : 0;
        return ad - bd;
      }),
    [exams]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Grade History
        </CardTitle>
        <CardDescription>Your overall grade across every recorded exam</CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage || 'No exams have been recorded for you yet.'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Average</TableHead>
                <TableHead>Overall Grade</TableHead>
                <TableHead>Class Position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((e) => (
                <TableRow key={e.exam_id}>
                  <TableCell className="font-medium">{e.exam?.exam_name || 'Exam'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.exam?.academic_years ? `${e.exam.academic_years.name} ${e.exam.academic_years.year}` : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.exam?.start_date ? new Date(e.exam.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </TableCell>
                  <TableCell>{e.average_percentage != null ? `${e.average_percentage.toFixed(1)}%` : '—'}</TableCell>
                  <TableCell>
                    <Badge className={gradeBadgeClass(e.overall_grade)}>{e.overall_grade || '—'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.position && e.class_size ? `${e.position}/${e.class_size}` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default GradeHistory;
