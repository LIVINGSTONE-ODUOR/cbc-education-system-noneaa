import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Megaphone, CalendarDays, Trophy, ClipboardList, Users, CheckCircle2 } from 'lucide-react';

// TODO: replace with real API once /announcements backend exists.
// Expected shape: GET /api/v1/announcements (school-scoped, posted by principal/admin),
// POST /api/v1/announcements/:id/acknowledge for the "acknowledge receipt" action.

type AnnouncementCategory = 'staff_meeting' | 'holiday' | 'sports_day' | 'cbc_update';

interface Announcement {
  id: string;
  category: AnnouncementCategory;
  title: string;
  body: string;
  postedBy: string;
  postedAt: string;
  acknowledged: boolean;
}

const CATEGORY_META: Record<AnnouncementCategory, { label: string; icon: React.ReactNode }> = {
  staff_meeting: { label: 'Staff Meeting', icon: <Users className="h-4 w-4" /> },
  holiday: { label: 'Holiday', icon: <CalendarDays className="h-4 w-4" /> },
  sports_day: { label: 'Sports Day', icon: <Trophy className="h-4 w-4" /> },
  cbc_update: { label: 'CBC Update', icon: <ClipboardList className="h-4 w-4" /> },
};

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    category: 'staff_meeting',
    title: 'Mandatory Staff Meeting — Thursday',
    body: 'All teachers to attend the staff meeting in the staff room at 3:30 PM to discuss end-of-term reporting.',
    postedBy: 'Principal Otieno',
    postedAt: '2 hours ago',
    acknowledged: false,
  },
  {
    id: 'a2',
    category: 'cbc_update',
    title: 'Updated CBC Assessment Rubric',
    body: 'The Ministry has released an updated competency-based assessment rubric for Grade 6. Please review before the next marking period.',
    postedBy: 'Principal Otieno',
    postedAt: 'Yesterday',
    acknowledged: true,
  },
  {
    id: 'a3',
    category: 'sports_day',
    title: 'Inter-house Sports Day — Next Friday',
    body: 'Sports day will be held next Friday starting 8:00 AM. Class teachers should submit house lists by Wednesday.',
    postedBy: 'Principal Otieno',
    postedAt: '2 days ago',
    acknowledged: false,
  },
  {
    id: 'a4',
    category: 'holiday',
    title: 'Mid-term Break Dates Confirmed',
    body: 'Mid-term break will run from the 24th to the 28th. School resumes on the 29th.',
    postedBy: 'Principal Otieno',
    postedAt: '4 days ago',
    acknowledged: true,
  },
];

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);

  const acknowledge = (id: string) => {
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
    // TODO: POST /api/v1/announcements/:id/acknowledge
  };

  const pendingCount = announcements.filter((a) => !a.acknowledged).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" /> Announcements
        </CardTitle>
        <CardDescription>
          Posts from the Principal — staff meetings, holidays, sports day, CBC updates.
          {pendingCount > 0 && (
            <span className="ml-1 font-medium text-amber-600">{pendingCount} awaiting your acknowledgement.</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="border rounded-md p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
                  {CATEGORY_META[a.category].icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">{a.title}</h4>
                    <Badge variant="outline" className="text-[10px]">{CATEGORY_META[a.category].label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Posted by {a.postedBy} · {a.postedAt}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {a.acknowledged ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Acknowledged
                  </Badge>
                ) : (
                  <Button size="sm" onClick={() => acknowledge(a.id)}>
                    Acknowledge
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default Announcements;
