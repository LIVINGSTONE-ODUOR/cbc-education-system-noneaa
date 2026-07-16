import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Bell, MapPin, CalendarDays, CalendarRange, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getMyTimetable, type MyTimetableSlot } from '@/lib/api/teacherApi';
import { getPrintHeader, type PrintHeader } from '@/lib/api/timetableApi';
import { TableBodySkeleton } from './skeletons';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

// Only weekdays carry lessons in this system (see backend: days array in
// getTeacherTimetable), but we still resolve today's real day-of-week name
// so weekends correctly show "no lessons" instead of stale data.
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
};

type ViewMode = 'today' | 'weekly';

// Converts "HH:MM" or "HH:MM:SS" into minutes-since-midnight for comparison.
const toMinutes = (time: string | null | undefined): number | null => {
  if (!time) return null;
  const parts = time.split(':').map(Number);
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1];
};

const formatClass = (cls: MyTimetableSlot['class']) =>
  cls ? `Grade ${cls.grade_level}${cls.stream_name || ''}` : '—';

const Timetable: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const teacherName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const [timetable, setTimetable] = useState<Record<string, MyTimetableSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('today');
  const [printHeader, setPrintHeader] = useState<PrintHeader | null>(null);

  const handlePrint = async () => {
    if (!printHeader) {
      try {
        const res = await getPrintHeader();
        setPrintHeader(res.data);
      } catch {
        // Print still works without the header — just falls back silently.
      }
    }
    setTimeout(() => window.print(), 50);
  };

  // Ticks every 30s so the "current lesson" highlight and the "starts in
  // X min" reminder banner stay accurate without requiring a page refresh.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyTimetable();
        setTimetable(res.data.timetable || {});
      } catch (error) {
        toast({
          title: 'Could not load your timetable',
          description: getErrorMessage(error, 'Please refresh and try again.'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const todayName = DAY_NAMES[now.getDay()];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const todayLessons = useMemo(
    () =>
      (timetable[todayName] || [])
        .slice()
        .sort((a, b) => a.period_number - b.period_number),
    [timetable, todayName]
  );

  // The lesson happening right now, if any, and the next one coming up —
  // used both to highlight rows and to drive the reminder banner.
  const { currentLesson, nextLesson, minutesToNext } = useMemo(() => {
    let current: MyTimetableSlot | null = null;
    let next: MyTimetableSlot | null = null;
    let minsToNext: number | null = null;

    for (const lesson of todayLessons) {
      const start = toMinutes(lesson.start_time);
      const end = toMinutes(lesson.end_time);
      if (start === null || end === null) continue;

      if (nowMinutes >= start && nowMinutes < end) {
        current = lesson;
      } else if (start > nowMinutes) {
        if (minsToNext === null || start - nowMinutes < minsToNext) {
          minsToNext = start - nowMinutes;
          next = lesson;
        }
      }
    }

    return { currentLesson: current, nextLesson: next, minutesToNext: minsToNext };
  }, [todayLessons, nowMinutes]);

  const showReminder = !loading && nextLesson && minutesToNext !== null && minutesToNext <= 15;

  return (
    <div className="space-y-6">
      {/* Print-only header — shown only when printing */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold uppercase">{printHeader?.school_name}</h1>
        <h2 className="text-base font-semibold mt-1">Teacher Timetable</h2>
        {teacherName && <p className="text-sm font-medium mt-1">{teacherName}</p>}
        <p className="text-sm">
          {printHeader?.term_name || 'Term'} — {printHeader?.academic_year_name || 'Academic Year'}
        </p>
      </div>

      {/* Lesson reminder banner — only appears within 15 minutes of the next lesson */}
      {showReminder && nextLesson && (
        <div className="no-print flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
          <Bell className="h-5 w-5 shrink-0 animate-pulse" />
          <div className="text-sm">
            <span className="font-semibold">
              {formatClass(nextLesson.class)} ({nextLesson.learning_area?.name || 'Lesson'})
            </span>{' '}
            starts in {minutesToNext} minute{minutesToNext === 1 ? '' : 's'}
            {nextLesson.room ? (
              <>
                {' '}in <span className="font-medium">{nextLesson.room}</span>
              </>
            ) : null}
            .
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Timetable</CardTitle>
            <CardDescription>
              {view === 'today'
                ? now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                : 'Your full weekly schedule'}
            </CardDescription>
          </div>
          <div className="flex gap-2 no-print">
            <Button
              size="sm"
              variant={view === 'today' ? 'default' : 'outline'}
              onClick={() => setView('today')}
            >
              <CalendarDays className="mr-2 h-4 w-4" /> Today
            </Button>
            <Button
              size="sm"
              variant={view === 'weekly' ? 'default' : 'outline'}
              onClick={() => setView('weekly')}
            >
              <CalendarRange className="mr-2 h-4 w-4" /> Weekly
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Classroom</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableBodySkeleton columns={5} />
              </TableBody>
            </Table>
          ) : view === 'today' ? (
            todayLessons.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No lessons scheduled for today.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Classroom</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayLessons.map((lesson) => {
                    const isCurrent = currentLesson?.id === lesson.id;
                    const isNext = nextLesson?.id === lesson.id;
                    return (
                      <TableRow key={lesson.id} className={isCurrent ? 'bg-primary/5' : undefined}>
                        <TableCell className="font-medium">
                          {lesson.start_time} - {lesson.end_time}
                        </TableCell>
                        <TableCell>{formatClass(lesson.class)}</TableCell>
                        <TableCell>{lesson.learning_area?.name || '—'}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            {lesson.room || 'Not assigned'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {isCurrent ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Now</Badge>
                          ) : isNext ? (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Next</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          ) : (
            <div className="space-y-6">
              {WEEK_DAYS.map((day) => {
                const lessons = (timetable[day] || [])
                  .slice()
                  .sort((a, b) => a.period_number - b.period_number);
                return (
                  <div key={day}>
                    <h4 className="mb-2 flex items-center gap-2 font-semibold">
                      {DAY_LABELS[day]}
                      {day === todayName && (
                        <Badge variant="outline" className="text-xs">Today</Badge>
                      )}
                    </h4>
                    {lessons.length === 0 ? (
                      <p className="text-sm text-muted-foreground pb-2">No lessons scheduled.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Classroom</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lessons.map((lesson) => (
                            <TableRow key={lesson.id}>
                              <TableCell className="font-medium">
                                {lesson.start_time} - {lesson.end_time}
                              </TableCell>
                              <TableCell>{formatClass(lesson.class)}</TableCell>
                              <TableCell>{lesson.learning_area?.name || '—'}</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  {lesson.room || 'Not assigned'}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground no-print">
          Reminders appear automatically when your next lesson starts within 15 minutes. Switch to "Weekly" before printing for the full schedule.
        </CardFooter>
      </Card>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; font-size: 11pt; }
          .no-print { display: none !important; }
          @page { margin: 1.2cm; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
        }
      `}</style>
    </div>
  );
};

export default Timetable;
