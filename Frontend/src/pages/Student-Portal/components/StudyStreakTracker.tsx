import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Trophy } from 'lucide-react';
import { getLearnerAttendanceSummary, type AttendanceApiRecord } from '@/lib/api/attendanceApi';

interface StudyStreakTrackerProps {
  learnerId: string;
}

// A day "counts" toward the streak if the student was at school (present or
// late both count — arriving late still means they showed up and engaged).
const COUNTS_TOWARD_STREAK = new Set(['present', 'late']);

const toDateKey = (isoDate: string) => isoDate.slice(0, 10);

/**
 * Walks the sorted attendance history backwards from the most recent school
 * day and counts how many days in a row were marked present/late. Any gap
 * (an absence, or a school day with no record at all) breaks the streak.
 */
const computeStreaks = (records: AttendanceApiRecord[]) => {
  const sorted = [...records]
    .map((r) => ({ ...r, dateKey: toDateKey(r.attendance_date) }))
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1)); // newest first

  let current = 0;
  for (const r of sorted) {
    if (COUNTS_TOWARD_STREAK.has(r.status)) current++;
    else break;
  }

  let best = 0;
  let running = 0;
  // Walk oldest-to-newest for the best-ever streak.
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (COUNTS_TOWARD_STREAK.has(sorted[i].status)) {
      running++;
      best = Math.max(best, running);
    } else {
      running = 0;
    }
  }

  // Last 7 recorded school days, oldest first, for the dot row.
  const last7 = sorted.slice(0, 7).reverse();

  return { current, best, last7 };
};

const StudyStreakTracker: React.FC<StudyStreakTrackerProps> = ({ learnerId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState<{ current: number; best: number; last7: (AttendanceApiRecord & { dateKey: string })[] }>({
    current: 0,
    best: 0,
    last7: [],
  });

  useEffect(() => {
    if (!learnerId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getLearnerAttendanceSummary(learnerId);
        if (cancelled) return;
        setStreak(computeStreaks(res.data.all_records || []));
      } catch {
        if (!cancelled) setError('Could not load your streak right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learnerId]);

  const streakMessage = (days: number) => {
    if (days === 0) return "Show up tomorrow to start a new streak.";
    if (days === 1) return "Nice start — keep it going tomorrow.";
    if (days < 5) return "You're building momentum.";
    if (days < 10) return "Great consistency — don't break it now.";
    return "Outstanding streak — you're on fire!";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Study Streak
        </CardTitle>
        <CardDescription>Consecutive school days you've shown up and engaged.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-6">
            <Skeleton className="h-14 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-orange-500 leading-none">{streak.current}</p>
                <p className="text-xs text-muted-foreground mt-1">day{streak.current === 1 ? '' : 's'} in a row</p>
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{streakMessage(streak.current)}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5" /> Best streak: {streak.best} day{streak.best === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {streak.last7.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {streak.last7.map((day) => {
                  const hit = COUNTS_TOWARD_STREAK.has(day.status);
                  const label = new Date(day.attendance_date).toLocaleDateString(undefined, { weekday: 'short' });
                  return (
                    <div key={day.dateKey} className="flex flex-col items-center gap-1">
                      <div
                        className={
                          hit
                            ? 'h-6 w-6 rounded-full bg-orange-500'
                            : 'h-6 w-6 rounded-full bg-muted border border-dashed border-muted-foreground/40'
                        }
                        title={`${label}: ${day.status}`}
                      />
                      <span className="text-[10px] text-muted-foreground">{label.slice(0, 2)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyStreakTracker;
