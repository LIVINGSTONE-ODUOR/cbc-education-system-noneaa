import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarClock } from 'lucide-react';
import type { LearnerUpcomingExam } from '@/lib/api/examApi';
import { useLanguage, type TranslationKey } from '@/contexts/LanguageContext';

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

const formatCountdown = (exam: LearnerUpcomingExam, t: (key: TranslationKey) => string): string => {
  const days = daysUntil(exam.start_date);
  if (days < 0) return t('examUnderway').replace('{exam}', exam.exam_name);
  if (days === 0) return t('examBeginsToday').replace('{exam}', exam.exam_name);
  if (days === 1) return t('examBeginsTomorrow').replace('{exam}', exam.exam_name);
  return t('examBeginsInDays').replace('{exam}', exam.exam_name).replace('{n}', String(days));
};

const ExamCountdownTimer: React.FC<ExamCountdownTimerProps> = ({ exams, loading }) => {
  const { t } = useLanguage();
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
          {t('examCountdown')}
        </CardTitle>
        <CardDescription>{t('examCountdownDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('loadingWord')}</p>
        ) : !next ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('noExamsScheduledYet')}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="text-center shrink-0">
                <p className="text-4xl font-bold text-primary leading-none">
                  {Math.max(daysUntil(next.start_date), 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('daysLeftWord')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">{formatCountdown(next, t)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {next.exam_type}
                  {next.term ? ` · ${next.term.name} ${next.term.year}` : ''} · {t('startsWord')}{' '}
                  {new Date(next.start_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            {following.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">{t('alsoComingUp')}</p>
                {following.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span>{e.exam_name}</span>
                    <span className="text-muted-foreground">
                      {Math.max(daysUntil(e.start_date), 0)} {t('daysWord')}
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
