import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone, AlertCircle } from 'lucide-react';
import { getAnnouncements, DashboardAnnouncement } from '@/lib/api/parentDashboardApi';

// Real data from the backend's `announcements` table (same one the school
// admin's Communication > Announcements page posts to, and the Parent
// Portal reads from). getAnnouncements() already treats teacher/school_admin
// /super_admin as "staff" and returns everything posted for their school —
// see parentDashboard.controller.js:getAnnouncements.
//
// Note: there's no "acknowledge receipt" tracking in the backend yet (no
// table/endpoint for it), so unlike the old placeholder UI this is a
// read-only feed. Acknowledgement tracking would need a new
// announcement_acknowledgements table + endpoint if that's wanted later.

const Announcements: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<DashboardAnnouncement[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getAnnouncements(30);
        if (!cancelled) setAnnouncements(res.data.announcements || []);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" /> Announcements
        </CardTitle>
        <CardDescription>Posts from the school admin — staff meetings, holidays, events, CBC updates.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
        ) : announcements.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="rounded-md border p-4">
              <div className="flex items-start justify-between gap-4">
                <h4 className="font-semibold">{a.title}</h4>
                <Badge variant="outline" className="shrink-0 text-[10px]">{formatDate(a.created_at)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
              {a.classes && (
                <p className="text-xs text-muted-foreground mt-2">
                  For {a.classes.grade_level}{a.classes.stream_name ? ` ${a.classes.stream_name}` : ''}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default Announcements;
