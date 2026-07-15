import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus, Users } from 'lucide-react';
import type { ExamSummary } from '@/lib/api/resultsApi';
import { useLanguage } from '@/contexts/LanguageContext';

interface ClassRankMovementProps {
  // Most-recent-exam-first, same ordering already used elsewhere in
  // Student.tsx (exams[0] is treated as the latest exam there too).
  exams: ExamSummary[];
  loading?: boolean;
}

const ClassRankMovement: React.FC<ClassRankMovementProps> = ({ exams, loading }) => {
  const { t } = useLanguage();
  const latest = exams[0] || null;
  const previous = exams[1] || null;

  const movement = useMemo(() => {
    if (!latest || latest.position == null || !previous || previous.position == null) return null;
    // Lower position number = better rank, so a decrease is an improvement.
    return previous.position - latest.position;
  }, [latest, previous]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {t('classRank', 'Class Rank')}
        </CardTitle>
        <CardDescription>{t('classRankDesc', 'Your position compared to the previous exam.')}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('loadingEllipsis', 'Loading...')}</p>
        ) : !latest || latest.position == null ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('noRankedExamsYet', 'No ranked exam results yet.')}</p>
        ) : (
          <div className="flex items-center gap-6">
            <div className="text-center shrink-0">
              <p className="text-4xl font-bold text-primary leading-none">{latest.position}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('ofClassSize', 'of')} {latest.class_size ?? '—'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{latest.exam?.exam_name || t('latestExam', 'Latest exam')}</p>
              {movement === null ? (
                <p className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
                  <Minus className="h-4 w-4" /> {t('noPreviousRankedExam', 'No previous ranked exam to compare.')}
                </p>
              ) : movement > 0 ? (
                <p className="text-sm font-medium flex items-center gap-1 text-green-600">
                  <ArrowUp className="h-4 w-4" /> {t('upPlacePrefix', 'Up')} {movement} {movement === 1 ? t('place', 'place') : t('places', 'places')} {t('sincePrefix', 'since')} {previous?.exam?.exam_name || t('lastExam', 'last exam')}
                </p>
              ) : movement < 0 ? (
                <p className="text-sm font-medium flex items-center gap-1 text-red-600">
                  <ArrowDown className="h-4 w-4" /> {t('downPlacePrefix', 'Down')} {Math.abs(movement)} {Math.abs(movement) === 1 ? t('place', 'place') : t('places', 'places')} {t('sincePrefix', 'since')} {previous?.exam?.exam_name || t('lastExam', 'last exam')}
                </p>
              ) : (
                <p className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
                  <Minus className="h-4 w-4" /> {t('unchangedSince', 'Unchanged since')} {previous?.exam?.exam_name || t('lastExam', 'last exam')}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClassRankMovement;
