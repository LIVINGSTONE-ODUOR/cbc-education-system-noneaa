import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarPlus, Download, AlertCircle } from 'lucide-react';
import { getLearnerAssignmentsDue } from '@/lib/api/assignmentApi';
import type { LearnerUpcomingExam } from '@/lib/api/examApi';
import type { SchoolEvent } from '@/lib/api/parentDashboardApi';

interface ExportToCalendarProps {
  learnerId: string;
  /** Reuses the exams/events already loaded for the dashboard — no extra fetch for these two. */
  upcomingExams: LearnerUpcomingExam[];
  upcomingEvents: SchoolEvent[];
  loading?: boolean;
}

type CalendarItemType = 'exam' | 'assignment' | 'event';

interface CalendarItem {
  id: string;
  type: CalendarItemType;
  title: string;
  /** yyyy-mm-dd — every exported item is treated as all-day to avoid
   * guessing the school's timezone for exact class/exam start times. */
  date: string;
  description?: string;
  location?: string | null;
}

const TYPE_BADGE: Record<CalendarItemType, string> = {
  exam: 'bg-blue-100 text-blue-700 border-blue-200',
  assignment: 'bg-amber-100 text-amber-700 border-amber-200',
  event: 'bg-purple-100 text-purple-700 border-purple-200',
};

const TYPE_LABEL: Record<CalendarItemType, string> = {
  exam: 'Exam',
  assignment: 'Assignment',
  event: 'School Event',
};

// ─────────────────────────────────────────────────────────────────────────
// ICS generation — RFC 5545 all-day VEVENTs, importable into Apple
// Calendar, Google Calendar, Outlook, or any calendar app.
// ─────────────────────────────────────────────────────────────────────────

const toICSDate = (isoDate: string): string => isoDate.replace(/-/g, '').slice(0, 8);

const addOneDay = (isoDate: string): string => {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const escapeICSText = (text: string): string =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

const buildICS = (items: CalendarItem[]): string => {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const events = items
    .map((item) => {
      const start = toICSDate(item.date);
      const end = toICSDate(addOneDay(item.date));
      const lines = [
        'BEGIN:VEVENT',
        `UID:${item.id}@noneaa-student-portal`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${escapeICSText(item.title)}`,
      ];
      if (item.description) lines.push(`DESCRIPTION:${escapeICSText(item.description)}`);
      if (item.location) lines.push(`LOCATION:${escapeICSText(item.location)}`);
      lines.push('END:VEVENT');
      return lines.join('\r\n');
    })
    .join('\r\n');

  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NONEAA//Student Portal//EN', 'CALSCALE:GREGORIAN', events, 'END:VCALENDAR'].join('\r\n');
};

const downloadICS = (filename: string, items: CalendarItem[]) => {
  const blob = new Blob([buildICS(items)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const googleCalendarUrl = (item: CalendarItem): string => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: item.title,
    dates: `${toICSDate(item.date)}/${toICSDate(addOneDay(item.date))}`,
  });
  if (item.description) params.set('details', item.description);
  if (item.location) params.set('location', item.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const formatDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

const ExportToCalendar: React.FC<ExportToCalendarProps> = ({ learnerId, upcomingExams, upcomingEvents, loading }) => {
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);
  const [assignmentItems, setAssignmentItems] = useState<CalendarItem[]>([]);

  useEffect(() => {
    if (!learnerId) {
      setAssignmentsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setAssignmentsLoading(true);
        setAssignmentsError(null);
        const res = await getLearnerAssignmentsDue(learnerId);
        if (cancelled) return;
        const items: CalendarItem[] = (res.data.assignments || [])
          .filter((a) => a.submission_status === 'not_submitted')
          .map((a) => ({
            id: `assignment-${a.id}`,
            type: 'assignment' as const,
            title: `Assignment due: ${a.title}`,
            date: a.due_date.slice(0, 10),
            description: a.learning_area?.name ? `Subject: ${a.learning_area.name}` : undefined,
          }));
        setAssignmentItems(items);
      } catch (err: any) {
        if (!cancelled) setAssignmentsError(err.message || 'Failed to load assignment deadlines');
      } finally {
        if (!cancelled) setAssignmentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learnerId]);

  const items = useMemo<CalendarItem[]>(() => {
    const examItems: CalendarItem[] = upcomingExams.map((e) => ({
      id: `exam-${e.id}`,
      type: 'exam',
      title: `Exam: ${e.exam_name}`,
      date: e.start_date.slice(0, 10),
      description: e.term ? `${e.exam_type} — ${e.term.name} ${e.term.year}` : e.exam_type,
    }));

    const eventItems: CalendarItem[] = upcomingEvents.map((e) => ({
      id: `event-${e.id}`,
      type: 'event',
      title: e.title,
      date: e.event_date.slice(0, 10),
      description: [e.start_time ? `Time: ${e.start_time.slice(0, 5)}` : null, e.description].filter(Boolean).join(' — ') || undefined,
      location: e.location,
    }));

    return [...examItems, ...assignmentItems, ...eventItems].sort((a, b) => a.date.localeCompare(b.date));
  }, [upcomingExams, upcomingEvents, assignmentItems]);

  const isLoading = loading || assignmentsLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-primary" />
          Export to Calendar
        </CardTitle>
        <CardDescription>Sync your exams, assignment deadlines, and school events with Google or Apple Calendar</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : assignmentsError ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {assignmentsError}
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nothing upcoming to export yet — exams, deadlines, and events will show up here as they're scheduled.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">{items.length} upcoming item{items.length === 1 ? '' : 's'}</span>
              <Button size="sm" variant="outline" onClick={() => downloadICS('noneaa-calendar.ics', items)}>
                <Download className="h-4 w-4 mr-1.5" /> Export all (.ics)
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{item.title}</p>
                      <Badge variant="outline" className={TYPE_BADGE[item.type]}>{TYPE_LABEL[item.type]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.date)}
                      {item.location ? ` · ${item.location}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={googleCalendarUrl(item)} target="_blank" rel="noopener noreferrer">
                        Google Calendar
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => downloadICS(`${item.type}-${item.id}.ics`, [item])}>
                      <Download className="h-3.5 w-3.5 mr-1" /> .ics
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              The .ics file works with Apple Calendar, Outlook, and Google Calendar (Settings → Import). "Google Calendar"
              adds a single item directly with one click.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExportToCalendar;
