import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, CalendarCheck, ClipboardCheck, Sparkles } from 'lucide-react';
import { getLearnerAttendanceSummary } from '@/lib/api/attendanceApi';
import { getLearnerAssignmentsDue, type LearnerAssignmentStatus } from '@/lib/api/assignmentApi';
import { useLanguage, type TranslationKey } from '@/contexts/LanguageContext';

interface CreditsPointsSystemProps {
  learnerId: string;
}

// Point values are intentionally simple and transparent so a student can see
// exactly why they earned what they earned.
const POINTS = {
  attendancePresent: 2,
  attendanceLate: 1,
  assignmentOnTime: 15,
  assignmentLate: 5,
};

const ON_TIME_STATUSES: LearnerAssignmentStatus[] = ['submitted', 'graded', 'returned'];

const LEVELS: { nameKey: TranslationKey; min: number }[] = [
  { nameKey: 'levelBronze', min: 0 },
  { nameKey: 'levelSilver', min: 150 },
  { nameKey: 'levelGold', min: 400 },
  { nameKey: 'levelPlatinum', min: 800 },
];

const getLevel = (points: number) => {
  const idx = [...LEVELS].reverse().find((l) => points >= l.min);
  return idx || LEVELS[0];
};

const nextLevel = (points: number) => LEVELS.find((l) => l.min > points) || null;

const CreditsPointsSystem: React.FC<CreditsPointsSystemProps> = ({ learnerId }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendancePoints, setAttendancePoints] = useState(0);
  const [attendanceBreakdown, setAttendanceBreakdown] = useState({ present: 0, late: 0 });
  const [assignmentPoints, setAssignmentPoints] = useState(0);
  const [assignmentBreakdown, setAssignmentBreakdown] = useState({ onTime: 0, late: 0 });

  useEffect(() => {
    if (!learnerId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [attendanceRes, assignmentsRes] = await Promise.all([
          getLearnerAttendanceSummary(learnerId),
          getLearnerAssignmentsDue(learnerId, true), // includeSubmitted — need the full history to count completions
        ]);
        if (cancelled) return;

        const { present, late } = attendanceRes.data.summary;
        setAttendanceBreakdown({ present, late });
        setAttendancePoints(present * POINTS.attendancePresent + late * POINTS.attendanceLate);

        const assignments = assignmentsRes.data.assignments || [];
        const onTime = assignments.filter(
          (a) => ON_TIME_STATUSES.includes(a.submission_status as LearnerAssignmentStatus) && a.submission_status !== 'late'
        ).length;
        const late2 = assignments.filter((a) => a.submission_status === 'late').length;
        setAssignmentBreakdown({ onTime, late: late2 });
        setAssignmentPoints(onTime * POINTS.assignmentOnTime + late2 * POINTS.assignmentLate);
      } catch {
        if (!cancelled) setError(t('couldNotLoadPoints', 'Could not load your points right now.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learnerId]);

  const total = attendancePoints + assignmentPoints;
  const level = getLevel(total);
  const next = nextLevel(total);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          {t('creditsPoints', 'Credits & Points')}
        </CardTitle>
        <CardDescription>{t('creditsPointsDesc', 'Earned from attendance and assignment activity.')}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-6">
            <Skeleton className="h-14 w-20" />
            <Skeleton className="h-10 w-40" />
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="text-center shrink-0">
                <p className="text-4xl font-bold text-amber-500 leading-none">{total}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('points', 'points')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> {t(level.nameKey)} {t('levelWord', 'level')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {next
                    ? `${next.min - total} ${t('points', 'points')} ${t('toReach', 'to')} ${t(next.nameKey)}`
                    : t('reachedTopLevel', "You've reached the top level.")}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarCheck className="h-4 w-4" /> {t('attendanceLabel', 'Attendance')} ({attendanceBreakdown.present} {t('presentLower', 'present')}, {attendanceBreakdown.late} {t('lateLower', 'late')})
                </span>
                <span className="font-medium">+{attendancePoints}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <ClipboardCheck className="h-4 w-4" /> {t('assignmentsLabel', 'Assignments')} ({assignmentBreakdown.onTime} {t('onTimeLower', 'on time')}, {assignmentBreakdown.late} {t('lateLower', 'late')})
                </span>
                <span className="font-medium">+{assignmentPoints}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-1 border-t">
              {t('extracurricularNote', "Extracurricular activity points aren't tracked yet — ask your school admin if you'd like that added.")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditsPointsSystem;
