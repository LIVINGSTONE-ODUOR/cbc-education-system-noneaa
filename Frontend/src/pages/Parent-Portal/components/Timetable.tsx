import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, AlertCircle, CalendarDays, CalendarRange, FileText } from 'lucide-react';
import { getLearnerTimetable, TimetablePeriod } from '@/lib/api/parentDashboardApi';
import { getLearnerUpcomingExams, LearnerUpcomingExam } from '@/lib/api/examApi';

interface TimetableProps {
  learnerId: string;
  reloadKey?: string;
  emptyMessage?: string;
}

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const todayDayOfWeek = () => {
  const jsDay = new Date().getDay(); // 0 = Sunday ... 6 = Saturday
  return jsDay === 0 ? 7 : jsDay; // convert to 1 = Monday ... 7 = Sunday
};
const formatTime = (t: string) => t?.slice(0, 5) || '';

type ViewMode = 'daily' | 'weekly' | 'exam';

const TimetableWidget: React.FC<TimetableProps> = ({ learnerId, reloadKey, emptyMessage }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);

  const [examsLoading, setExamsLoading] = useState(true);
  const [examsError, setExamsError] = useState<string | null>(null);
  const [exams, setExams] = useState<LearnerUpcomingExam[]>([]);

  const [view, setView] = useState<ViewMode>('daily');
  const [selectedDay, setSelectedDay] = useState<number>(todayDayOfWeek());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getLearnerTimetable(learnerId);
        if (!cancelled) setPeriods(res.data.periods || []);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load timetable');
          setPeriods([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learnerId, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setExamsLoading(true);
        setExamsError(null);
        // Higher limit than the compact dashboard widget — this is the full exam timetable.
        const res = await getLearnerUpcomingExams(learnerId, 50);
        if (!cancelled) setExams(res.data.upcoming_exams || []);
      } catch (err: any) {
        if (!cancelled) {
          setExamsError(err.message || 'Failed to load exam timetable');
          setExams([]);
        }
      } finally {
        if (!cancelled) setExamsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learnerId, reloadKey]);

  const periodsForDay = (day: number) =>
    periods
      .filter((p) => p.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const viewButtons: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
    { key: 'daily', label: 'Daily', icon: <Clock className="h-3.5 w-3.5" /> },
    { key: 'weekly', label: 'Weekly', icon: <CalendarDays className="h-3.5 w-3.5" /> },
    { key: 'exam', label: 'Exam timetable', icon: <FileText className="h-3.5 w-3.5" /> },
  ];

  return (
    <Card id="timetable-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-primary" />
          Timetable
        </CardTitle>
        <CardDescription>Daily and weekly class schedule, plus upcoming exam dates</CardDescription>

        <div className="mt-3 flex flex-wrap gap-2">
          {viewButtons.map((b) => (
            <Button
              key={b.key}
              size="sm"
              variant={view === b.key ? 'default' : 'outline'}
              onClick={() => setView(b.key)}
            >
              {b.icon}
              <span className="ml-1.5">{b.label}</span>
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {/* Daily timetable */}
        {view === 'daily' && (
          <>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={selectedDay === d ? 'default' : 'outline'}
                  onClick={() => setSelectedDay(d)}
                >
                  {DAY_NAMES[d].slice(0, 3)}
                </Button>
              ))}
            </div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            ) : periodsForDay(selectedDay).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage || `No lessons scheduled for ${DAY_NAMES[selectedDay]}.`}
              </p>
            ) : (
              <div className="space-y-2">
                {periodsForDay(selectedDay).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div>
                      <p className="font-medium">{p.learning_areas?.name || 'Lesson'}</p>
                      <p className="text-muted-foreground">
                        {p.teachers ? `${p.teachers.first_name} ${p.teachers.last_name}` : ''}
                        {p.room ? ` • ${p.room}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline">{formatTime(p.start_time)}–{formatTime(p.end_time)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Weekly timetable — full grid, Monday to Friday */}
        {view === 'weekly' && (
          loading ? (
            <Skeleton className="h-64 w-full" />
          ) : error ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-[700px] grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((d) => (
                  <div key={d}>
                    <p className="mb-2 text-center text-sm font-semibold">{DAY_NAMES[d]}</p>
                    <div className="space-y-2">
                      {periodsForDay(d).length === 0 ? (
                        <p className="text-center text-xs text-muted-foreground">—</p>
                      ) : (
                        periodsForDay(d).map((p) => (
                          <div key={p.id} className="rounded-md border p-2 text-xs">
                            <p className="font-medium truncate">{p.learning_areas?.name || 'Lesson'}</p>
                            <p className="text-muted-foreground">{formatTime(p.start_time)}–{formatTime(p.end_time)}</p>
                            {p.room && <p className="text-muted-foreground truncate">{p.room}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* Exam timetable */}
        {view === 'exam' && (
          examsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : examsError ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {examsError}
            </div>
          ) : exams.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No exams scheduled.</p>
          ) : (
            <div className="space-y-2">
              {[...exams]
                .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                .map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div>
                      <p className="font-medium">{e.exam_name}</p>
                      <p className="text-muted-foreground">
                        {e.exam_type}
                        {e.term ? ` • ${e.term.name} ${e.term.year}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {new Date(e.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {e.end_date && e.end_date !== e.start_date
                        ? ` – ${new Date(e.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                        : ''}
                    </Badge>
                  </div>
                ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default TimetableWidget;
