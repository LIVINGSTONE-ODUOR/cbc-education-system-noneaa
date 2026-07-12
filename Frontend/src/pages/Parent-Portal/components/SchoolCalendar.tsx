import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarClock,
  AlertCircle,
  DoorOpen,
  DoorClosed,
  CalendarHeart,
  FileText,
  Trophy,
  PartyPopper,
} from 'lucide-react';
import { getSchoolEvents, SchoolEvent } from '@/lib/api/parentDashboardApi';
import { getLearnerUpcomingExams, LearnerUpcomingExam } from '@/lib/api/examApi';

interface SchoolCalendarProps {
  /** Optional — needed only for the "Exams" tab, which is per-child. */
  learnerId?: string;
  reloadKey?: string;
}

type Tab = 'opening' | 'closing' | 'holidays' | 'exams' | 'sports' | 'activities';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'opening', label: 'Opening dates', icon: <DoorOpen className="h-3.5 w-3.5" /> },
  { key: 'closing', label: 'Closing dates', icon: <DoorClosed className="h-3.5 w-3.5" /> },
  { key: 'holidays', label: 'Holidays', icon: <CalendarHeart className="h-3.5 w-3.5" /> },
  { key: 'exams', label: 'Exams', icon: <FileText className="h-3.5 w-3.5" /> },
  { key: 'sports', label: 'Sports events', icon: <Trophy className="h-3.5 w-3.5" /> },
  { key: 'activities', label: 'School activities', icon: <PartyPopper className="h-3.5 w-3.5" /> },
];

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

const SchoolCalendar: React.FC<SchoolCalendarProps> = ({ learnerId, reloadKey }) => {
  const [tab, setTab] = useState<Tab>('opening');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingDates, setOpeningDates] = useState<SchoolEvent[]>([]);
  const [closingDates, setClosingDates] = useState<SchoolEvent[]>([]);
  const [holidays, setHolidays] = useState<SchoolEvent[]>([]);
  const [sportsEvents, setSportsEvents] = useState<SchoolEvent[]>([]);
  const [activities, setActivities] = useState<SchoolEvent[]>([]);

  const [examsLoading, setExamsLoading] = useState(true);
  const [examsError, setExamsError] = useState<string | null>(null);
  const [exams, setExams] = useState<LearnerUpcomingExam[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [openingRes, closingRes, holidaysRes, sportsRes, activitiesRes] = await Promise.all([
          getSchoolEvents(30, 'term_start'),
          getSchoolEvents(30, 'term_end'),
          getSchoolEvents(30, 'holiday'),
          getSchoolEvents(30, 'sports'),
          getSchoolEvents(30, 'activity'),
        ]);
        if (cancelled) return;
        setOpeningDates(openingRes.data.events || []);
        setClosingDates(closingRes.data.events || []);
        setHolidays(holidaysRes.data.events || []);
        setSportsEvents(sportsRes.data.events || []);
        setActivities(activitiesRes.data.events || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load the school calendar');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!learnerId) {
      setExamsLoading(false);
      setExams([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setExamsLoading(true);
        setExamsError(null);
        const res = await getLearnerUpcomingExams(learnerId, 50);
        if (!cancelled) setExams(res.data.upcoming_exams || []);
      } catch (err: any) {
        if (!cancelled) {
          setExamsError(err.message || 'Failed to load exams');
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

  const renderEventList = (list: SchoolEvent[], emptyText: string) =>
    list.length === 0 ? (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
    ) : (
      <div className="space-y-2">
        {list.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
            <div>
              <p className="font-medium">{e.title}</p>
              {e.description && <p className="text-muted-foreground">{e.description}</p>}
              {e.location && <p className="text-xs text-muted-foreground">{e.location}</p>}
            </div>
            <Badge variant="outline">
              {formatDate(e.event_date)}{e.start_time ? ` • ${e.start_time.slice(0, 5)}` : ''}
            </Badge>
          </div>
        ))}
      </div>
    );

  return (
    <Card id="school-calendar-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          School Calendar
        </CardTitle>
        <CardDescription>Opening dates, closing dates, holidays, exams, sports events, and school activities</CardDescription>

        <div className="mt-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Button key={t.key} size="sm" variant={tab === t.key ? 'default' : 'outline'} onClick={() => setTab(t.key)}>
              {t.icon}
              <span className="ml-1.5">{t.label}</span>
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {tab === 'exams' ? (
          !learnerId ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Select a child to see their exam dates.</p>
          ) : examsLoading ? (
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
            <p className="py-8 text-center text-sm text-muted-foreground">No exams scheduled.</p>
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
        ) : loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : (
          <>
            {tab === 'opening' && renderEventList(openingDates, 'No opening dates announced yet.')}
            {tab === 'closing' && renderEventList(closingDates, 'No closing dates announced yet.')}
            {tab === 'holidays' && renderEventList(holidays, 'No upcoming holidays listed.')}
            {tab === 'sports' && renderEventList(sportsEvents, 'No sports events scheduled.')}
            {tab === 'activities' && renderEventList(activities, 'No school activities scheduled.')}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SchoolCalendar;
