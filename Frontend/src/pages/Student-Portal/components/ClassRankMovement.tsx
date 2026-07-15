import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus, Users } from 'lucide-react';
import type { ExamSummary } from '@/lib/api/resultsApi';

interface ClassRankMovementProps {
  // Most-recent-exam-first, same ordering already used elsewhere in
  // Student.tsx (exams[0] is treated as the latest exam there too).
  exams: ExamSummary[];
  loading?: boolean;
}

const ClassRankMovement: React.FC<ClassRankMovementProps> = ({ exams, loading }) => {
  const latest = exams[0] || null;
  const previous = exams[1] || null;

  const movement = useMemo(() => {
    if (!latest || latest.position == null || !previous || previous.position == null) return null;
    // Lower position number = better rank, so a decrease is an improvement.
    return previous.position - latest.position;
  }, [latest, previous]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Class Rank
        </CardTitle>
        <CardDescription>Your position compared to the previous exam.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !latest || latest.position == null ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No ranked exam results yet.</p>
        ) : (
          <div className="flex items-center gap-6">
            <div className="text-center shrink-0">
              <p className="text-4xl font-bold text-primary leading-none">{latest.position}</p>
              <p className="text-xs text-muted-foreground mt-1">
                of {latest.class_size ?? '—'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{latest.exam?.exam_name || 'Latest exam'}</p>
              {movement === null ? (
                <p className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
                  <Minus className="h-4 w-4" /> No previous ranked exam to compare.
                </p>
              ) : movement > 0 ? (
                <p className="text-sm font-medium flex items-center gap-1 text-green-600">
                  <ArrowUp className="h-4 w-4" /> Up {movement} place{movement === 1 ? '' : 's'} since {previous?.exam?.exam_name || 'last exam'}
                </p>
              ) : movement < 0 ? (
                <p className="text-sm font-medium flex items-center gap-1 text-red-600">
                  <ArrowDown className="h-4 w-4" /> Down {Math.abs(movement)} place{Math.abs(movement) === 1 ? '' : 's'} since {previous?.exam?.exam_name || 'last exam'}
                </p>
              ) : (
                <p className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
                  <Minus className="h-4 w-4" /> Unchanged since {previous?.exam?.exam_name || 'last exam'}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClassRankMovement;
