import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BellRing } from 'lucide-react';
import { getLearnerAssignmentsDue, LearnerDueAssignment } from '@/lib/api/assignmentApi';
import { useLanguage } from '@/contexts/LanguageContext';

interface AssignmentRemindersProps {
  learnerId: string;
}

const DUE_SOON_DAYS = 3;

// NOTE: There's no push/email/in-app notification system in the backend
// (only account-level notification *preference* toggles exist — see
// /api/v1/users/me/notification-preferences — nothing that actually sends
// a reminder). Rather than fabricate alerts, this derives real "due soon"
// and "overdue" reminders client-side from the same due-date data the
// Assignments list already loads, and re-fetches independently here so it
// can be dropped in anywhere on the page.
const AssignmentReminders: React.FC<AssignmentRemindersProps> = ({ learnerId }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<LearnerDueAssignment[]>([]);

  useEffect(() => {
    if (!learnerId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Not-yet-submitted only (include_submitted defaults to false) —
        // reminders only make sense for outstanding work.
        const res = await getLearnerAssignmentsDue(learnerId);
        if (!cancelled) setAssignments(res.data.assignments || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message || t('failedToLoadReminders', 'Failed to load reminders'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learnerId]);

  const reminders = useMemo(() => {
    const now = Date.now();
    return [...assignments]
      .map((a) => {
        const dueMs = new Date(a.due_date).getTime();
        const daysLeft = Math.ceil((dueMs - now) / (1000 * 60 * 60 * 24));
        return { ...a, daysLeft };
      })
      .filter((a) => a.is_overdue || a.daysLeft <= DUE_SOON_DAYS)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [assignments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" />
          {t('reminders', 'Reminders')}
        </CardTitle>
        <CardDescription>{t('remindersDesc', 'Assignments due soon or overdue')}</CardDescription>
      </CardHeader>
      <CardContent>
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
        ) : reminders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('allCaughtUpPrefix', "You're all caught up — nothing due in the next")} {DUE_SOON_DAYS} {t('days', 'days')}.
          </p>
        ) : (
          <div className="space-y-2">
            {reminders.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-muted-foreground">{a.learning_area?.name || t('generalSubject', 'General')}</p>
                </div>
                <Badge
                  variant="outline"
                  className={a.is_overdue ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}
                >
                  {a.is_overdue
                    ? t('overdue', 'Overdue')
                    : a.daysLeft <= 0
                      ? t('dueToday', 'Due today')
                      : `${t('dueInPrefix', 'Due in')} ${a.daysLeft} ${a.daysLeft === 1 ? t('day', 'day') : t('days', 'days')}`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignmentReminders;
