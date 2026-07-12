import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone, AlertCircle, Users, CalendarHeart, PartyPopper, Wallet } from 'lucide-react';
import {
  getAnnouncements,
  getSchoolEvents,
  DashboardAnnouncement,
  SchoolEvent,
} from '@/lib/api/parentDashboardApi';

type Tab = 'notices' | 'pta' | 'holidays' | 'events' | 'fees';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'notices', label: 'School notices', icon: <Megaphone className="h-3.5 w-3.5" /> },
  { key: 'pta', label: 'PTA meetings', icon: <Users className="h-3.5 w-3.5" /> },
  { key: 'holidays', label: 'Holidays', icon: <CalendarHeart className="h-3.5 w-3.5" /> },
  { key: 'events', label: 'Events', icon: <PartyPopper className="h-3.5 w-3.5" /> },
  { key: 'fees', label: 'Fee reminders', icon: <Wallet className="h-3.5 w-3.5" /> },
];

const Announcements: React.FC = () => {
  const [tab, setTab] = useState<Tab>('notices');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<DashboardAnnouncement[]>([]);
  const [feeReminders, setFeeReminders] = useState<DashboardAnnouncement[]>([]);
  const [ptaMeetings, setPtaMeetings] = useState<SchoolEvent[]>([]);
  const [holidays, setHolidays] = useState<SchoolEvent[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [noticesRes, feesRes, ptaRes, holidaysRes, eventsRes] = await Promise.all([
          getAnnouncements(30, 'general'),
          getAnnouncements(30, 'fee_reminder'),
          getSchoolEvents(30, 'pta_meeting'),
          getSchoolEvents(30, 'holiday'),
          getSchoolEvents(30, 'event'),
        ]);
        if (cancelled) return;
        setNotices(noticesRes.data.announcements || []);
        setFeeReminders(feesRes.data.announcements || []);
        setPtaMeetings(ptaRes.data.events || []);
        setHolidays(holidaysRes.data.events || []);
        setEvents(eventsRes.data.events || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load announcements');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Card id="announcements-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Announcements
        </CardTitle>
        <CardDescription>School notices, PTA meetings, holidays, events, and fee reminders</CardDescription>

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
        {loading ? (
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
            {tab === 'notices' && (
              notices.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No school notices right now.</p>
              ) : (
                <div className="space-y-2">
                  {notices.map((a) => (
                    <div key={a.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{a.title}</p>
                        <Badge variant="outline" className="shrink-0">{formatDate(a.created_at)}</Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">{a.body}</p>
                      {a.classes && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          For {a.classes.grade_level}{a.classes.stream_name ? ` ${a.classes.stream_name}` : ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === 'pta' && (
              ptaMeetings.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No PTA meetings scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {ptaMeetings.map((e) => (
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
              )
            )}

            {tab === 'holidays' && (
              holidays.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No upcoming holidays listed.</p>
              ) : (
                <div className="space-y-2">
                  {holidays.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div>
                        <p className="font-medium">{e.title}</p>
                        {e.description && <p className="text-muted-foreground">{e.description}</p>}
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                        {formatDate(e.event_date)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === 'events' && (
              events.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No upcoming events scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((e) => (
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
              )
            )}

            {tab === 'fees' && (
              feeReminders.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No fee reminders right now.</p>
              ) : (
                <div className="space-y-2">
                  {feeReminders.map((a) => (
                    <div key={a.id} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-amber-900">{a.title}</p>
                        <Badge variant="outline" className="shrink-0 border-amber-300 text-amber-800">
                          {formatDate(a.created_at)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-amber-800">{a.body}</p>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Announcements;
