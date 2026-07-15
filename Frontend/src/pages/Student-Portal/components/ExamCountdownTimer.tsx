import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarClock } from 'lucide-react';
import type { LearnerUpcomingExam } from '@/lib/api/examApi';

interface ExamCountdownTimerProps {
  exams: LearnerUpcomingExam[];
  loading?: boolean;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const daysUntil = (isoDate: string): number => {
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(isoDate));
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
};

const formatCountdown = (exam: LearnerUpcomingExam): string => {
  const days = daysUntil(exam.start_date);
  if (days < 0) return `${exam.exam_name} is underway.`;
  if (days === 0) return `${exam.exam_name} begins today.`;
  if (days === 1) return `${exam.exam_name} begins tomorrow.`;
  return `${exam.exam_name} begins in ${days} days.`;
};

const ExamCountdownTimer: React.FC<ExamCountdownTimerProps> = ({ exams, loading }) => {
  // Exams are already filtered to "upcoming" by the backend; just make sure
  // the soonest one is first, in case the API order ever changes.
  const sorted = useMemo(
    () => [...exams].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()),
    [exams]
  );
  const next = sorted[0];
  const following = sorted.slice(1, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          Exam Countdown
        </CardTitle>
        <CardDescription>Time left until your next exam.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !next ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No exams scheduled yet.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="text-center shrink-0">
                <p className="text-4xl font-bold text-primary leading-none">
                  {Math.max(daysUntil(next.start_date), 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  day{Math.max(daysUntil(next.start_date), 0) === 1 ? '' : 's'} left
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">{formatCountdown(next)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {next.exam_type}
                  {next.term ? ` · ${next.term.name} ${next.term.year}` : ''} · starts{' '}
                  {new Date(next.start_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            {following.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Also coming up</p>
                {following.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span>{e.exam_name}</span>
                    <span className="text-muted-foreground">
                      {Math.max(daysUntil(e.start_date), 0)} day{Math.max(daysUntil(e.start_date), 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExamCountdownTimer;
