import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Grid3x3 } from 'lucide-react';
import type { ExamSummary } from '@/lib/api/resultsApi';
import { useLanguage, type TranslationKey } from '@/contexts/LanguageContext';

interface LearningHeatmapProps {
  /** Reuses the exams already loaded for the dashboard/marks cards — no extra fetch. */
  exams: ExamSummary[];
  emptyMessage?: string;
}

interface HeatmapCell {
  percentage: number | null;
  isAbsent: boolean;
}

interface HeatmapRow {
  subject: string;
  cells: HeatmapCell[];
  average: number | null;
}

// Oldest → newest so the grid reads left-to-right like a timeline, and
// builds a subject x exam matrix so every row has one cell per exam
// (missing marks render as an empty cell rather than shifting columns).
const buildMatrix = (exams: ExamSummary[]): { columns: ExamSummary[]; rows: HeatmapRow[] } => {
  const columns = [...exams].sort((a, b) => {
    const ad = a.exam?.start_date ? new Date(a.exam.start_date).getTime() : 0;
    const bd = b.exam?.start_date ? new Date(b.exam.start_date).getTime() : 0;
    return ad - bd;
  });

  const subjectNames = new Set<string>();
  columns.forEach((exam) => {
    exam.subjects.forEach((s) => {
      if (s.learning_area?.name) subjectNames.add(s.learning_area.name);
    });
  });

  const rows: HeatmapRow[] = Array.from(subjectNames)
    .sort((a, b) => a.localeCompare(b))
    .map((subject) => {
      const cells: HeatmapCell[] = columns.map((exam) => {
        const match = exam.subjects.find((s) => s.learning_area?.name === subject);
        if (!match) return { percentage: null, isAbsent: false };
        if (match.is_absent) return { percentage: null, isAbsent: true };
        return { percentage: match.percentage, isAbsent: false };
      });
      const graded = cells.filter((c) => c.percentage != null) as { percentage: number }[];
      const average = graded.length ? Math.round((graded.reduce((sum, c) => sum + c.percentage, 0) / graded.length) * 10) / 10 : null;
      return { subject, cells, average };
    })
    // Weakest subjects first, so the topics that need attention are the
    // first thing the student sees.
    .sort((a, b) => (a.average ?? 100) - (b.average ?? 100));

  return { columns, rows };
};

// Five-band scale, from struggling to excelling. Kept as discrete bands
// (rather than a continuous gradient) so the legend maps 1:1 to what's
// on the grid.
const bandFor = (percentage: number | null): { bg: string; text: string; labelKey: TranslationKey } => {
  if (percentage == null) return { bg: 'bg-muted', text: 'text-muted-foreground', labelKey: 'noDataBand' };
  if (percentage < 50) return { bg: 'bg-red-500', text: 'text-white', labelKey: 'belowExpectation' };
  if (percentage < 65) return { bg: 'bg-orange-400', text: 'text-white', labelKey: 'approachingExpectation' };
  if (percentage < 75) return { bg: 'bg-amber-300', text: 'text-amber-950', labelKey: 'meetingExpectation' };
  if (percentage < 90) return { bg: 'bg-lime-400', text: 'text-lime-950', labelKey: 'strongBand' };
  return { bg: 'bg-green-500', text: 'text-white', labelKey: 'exceedingExpectation' };
};

const LEGEND: { swatch: string; rangeLabel?: string; labelKey?: TranslationKey }[] = [
  { swatch: 'bg-red-500', rangeLabel: '< 50%' },
  { swatch: 'bg-orange-400', rangeLabel: '50–64%' },
  { swatch: 'bg-amber-300', rangeLabel: '65–74%' },
  { swatch: 'bg-lime-400', rangeLabel: '75–89%' },
  { swatch: 'bg-green-500', rangeLabel: '90%+' },
  { swatch: 'bg-muted', labelKey: 'noDataAbsentLegend' },
];

const LearningHeatmap: React.FC<LearningHeatmapProps> = ({ exams, emptyMessage }) => {
  const { t } = useLanguage();
  const { columns, rows } = useMemo(() => buildMatrix(exams), [exams]);

  const strongest = rows.length ? rows[rows.length - 1] : null;
  const weakest = rows.length ? rows[0] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3x3 className="h-5 w-5 text-primary" />
          {t('learningHeatmap', 'Learning Heatmap')}
        </CardTitle>
        <CardDescription>{t('learningHeatmapDesc', 'Your strong and weak topics at a glance, exam by exam')}</CardDescription>
      </CardHeader>
      <CardContent>
        {columns.length === 0 || rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage || t('noHeatmapDataYet', 'No exam results yet — the heatmap will appear once your marks are recorded.')}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-1">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground pr-2 sticky left-0 bg-card">
                      {t('subjectHeader', 'Subject')}
                    </th>
                    {columns.map((exam) => (
                      <th
                        key={exam.exam_id}
                        className="text-xs font-medium text-muted-foreground px-1 pb-1 whitespace-nowrap"
                        title={exam.exam?.exam_name || t('examFallback', 'Exam')}
                      >
                        {exam.exam?.exam_name
                          ? exam.exam.exam_name.length > 10
                            ? `${exam.exam.exam_name.slice(0, 9)}…`
                            : exam.exam.exam_name
                          : '—'}
                      </th>
                    ))}
                    <th className="text-xs font-medium text-muted-foreground px-1 pb-1">{t('avgHeader', 'Avg')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.subject}>
                      <td className="text-sm font-medium pr-2 whitespace-nowrap sticky left-0 bg-card">
                        {row.subject}
                      </td>
                      {row.cells.map((cell, i) => {
                        const band = bandFor(cell.percentage);
                        return (
                          <td key={i} className="p-0">
                            <div
                              className={`h-9 w-9 rounded-md flex items-center justify-center text-[11px] font-semibold ${band.bg} ${band.text}`}
                              title={
                                cell.isAbsent
                                  ? `${row.subject} — ${columns[i].exam?.exam_name || t('examFallback', 'Exam')}: ${t('absentWord', 'Absent')}`
                                  : cell.percentage != null
                                    ? `${row.subject} — ${columns[i].exam?.exam_name || t('examFallback', 'Exam')}: ${cell.percentage}%`
                                    : `${row.subject} — ${columns[i].exam?.exam_name || t('examFallback', 'Exam')}: ${t('noRecordWord', 'No record')}`
                              }
                            >
                              {cell.isAbsent ? 'AB' : cell.percentage != null ? Math.round(cell.percentage) : ''}
                            </div>
                          </td>
                        );
                      })}
                      <td className="text-sm font-semibold text-center px-1">
                        {row.average != null ? `${row.average}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
              {LEGEND.map((item) => (
                <div key={item.rangeLabel || item.labelKey} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`h-3 w-3 rounded-sm ${item.swatch}`} />
                  {item.rangeLabel || (item.labelKey ? t(item.labelKey) : '')}
                </div>
              ))}
            </div>

            {/* Quick takeaway */}
            {weakest && strongest && weakest.subject !== strongest.subject && (
              <p className="text-xs text-muted-foreground">
                {t('strongestTopic', 'Strongest topic:')} <span className="font-medium text-foreground">{strongest.subject}</span>
                {strongest.average != null ? ` (${strongest.average}% ${t('avgSuffix', 'avg')})` : ''} · {t('needsMostAttention', 'Needs the most attention:')}{' '}
                <span className="font-medium text-foreground">{weakest.subject}</span>
                {weakest.average != null ? ` (${weakest.average}% ${t('avgSuffix', 'avg')})` : ''}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LearningHeatmap;
