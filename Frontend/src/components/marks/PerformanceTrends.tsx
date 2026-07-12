import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, TrendingDown, Minus, Trophy, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { compareResults, ExamSummary } from '@/lib/api/resultsApi';

interface PerformanceTrendsProps {
  /** The learner whose trend data to load (a parent's selected child, or a student's own id) */
  learnerId: string;
  /** Re-fetch when this changes, e.g. the parent switching which child is selected */
  reloadKey?: string;
  emptyMessage?: string;
}

const SUBJECT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Exams don't come back pre-sorted, and "academic_years" is the field this
// codebase uses to carry term info on an exam (see MarksPanel — same
// naming). Sort chronologically so trend lines read left-to-right in time.
const examSortKey = (e: ExamSummary) => e.exam?.start_date || '';

const PerformanceTrends: React.FC<PerformanceTrendsProps> = ({ learnerId, reloadKey, emptyMessage }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [subjectTrend, setSubjectTrend] = useState<Record<string, { exam_id: string; exam_name?: string; percentage: number }[]>>({});

  useEffect(() => {
    if (!learnerId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await compareResults(learnerId);
        if (cancelled) return;
        setExams(res.data.exams || []);
        setSubjectTrend(res.data.subject_trend || {});
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load performance trends');
          setExams([]);
          setSubjectTrend({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnerId, reloadKey]);

  const sortedExams = useMemo(
    () => [...exams].sort((a, b) => examSortKey(a).localeCompare(examSortKey(b))),
    [exams]
  );

  // 1. Overall academic growth — one point per exam, chronological.
  const growthData = useMemo(
    () =>
      sortedExams.map((e) => ({
        exam_name: e.exam?.exam_name || 'Exam',
        average: e.average_percentage,
      })),
    [sortedExams]
  );

  // 2. Subject progress — reshape { subject: [{exam_id, percentage}] } into
  //    one row per exam with each subject as a column, so recharts can draw
  //    one <Line> per subject against a shared x-axis.
  const subjectNames = useMemo(() => Object.keys(subjectTrend), [subjectTrend]);
  const subjectProgressData = useMemo(() => {
    return sortedExams.map((e) => {
      const row: Record<string, string | number> = { exam_name: e.exam?.exam_name || 'Exam' };
      subjectNames.forEach((name) => {
        const point = subjectTrend[name]?.find((p) => p.exam_id === e.exam_id);
        if (point) row[name] = point.percentage;
      });
      return row;
    });
  }, [sortedExams, subjectTrend, subjectNames]);

  // 3. Term comparison — average the exam averages within each term
  //    ("academic_years" is this codebase's field name for term info on an exam).
  const termComparisonData = useMemo(() => {
    const byTerm: Record<string, { label: string; total: number; count: number; sortKey: string }> = {};
    sortedExams.forEach((e) => {
      const term = e.exam?.academic_years;
      const key = term ? `${term.name} ${term.year}` : 'Unknown term';
      if (!byTerm[key]) byTerm[key] = { label: key, total: 0, count: 0, sortKey: term ? `${term.year}-${term.name}` : '' };
      byTerm[key].total += e.average_percentage;
      byTerm[key].count += 1;
    });
    return Object.values(byTerm)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map((t) => ({ term: t.label, average: Math.round((t.total / t.count) * 10) / 10 }));
  }, [sortedExams]);

  // 4. Performance analytics — best subject, subject needing most
  //    improvement, and overall growth direction, all derived client-side
  //    from the same trend data (no extra backend call).
  const analytics = useMemo(() => {
    if (subjectNames.length === 0 || sortedExams.length === 0) return null;

    const subjectAverages = subjectNames.map((name) => {
      const points = subjectTrend[name] || [];
      const avg = points.length ? points.reduce((s, p) => s + p.percentage, 0) / points.length : 0;
      const trend = points.length >= 2 ? points[points.length - 1].percentage - points[0].percentage : 0;
      return { name, avg: Math.round(avg * 10) / 10, trend: Math.round(trend * 10) / 10 };
    });

    const bestSubject = [...subjectAverages].sort((a, b) => b.avg - a.avg)[0];
    const weakestSubject = [...subjectAverages].sort((a, b) => a.avg - b.avg)[0];

    const overallFirst = growthData[0]?.average ?? 0;
    const overallLast = growthData[growthData.length - 1]?.average ?? 0;
    const overallChange = Math.round((overallLast - overallFirst) * 10) / 10;

    return { bestSubject, weakestSubject, overallChange, examCount: sortedExams.length };
  }, [subjectNames, subjectTrend, sortedExams, growthData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6 flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </CardContent>
      </Card>
    );
  }

  if (sortedExams.length < 2) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          {emptyMessage || 'At least two exams are needed to show performance trends.'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance analytics summary */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                {analytics.overallChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : analytics.overallChange < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <Minus className="h-4 w-4" />
                )}
                Overall academic growth
              </div>
              <p className={`text-2xl font-bold ${analytics.overallChange > 0 ? 'text-green-600' : analytics.overallChange < 0 ? 'text-red-600' : ''}`}>
                {analytics.overallChange > 0 ? '+' : ''}{analytics.overallChange}%
              </p>
              <p className="text-xs text-muted-foreground">Since first recorded exam ({analytics.examCount} exams)</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Trophy className="h-4 w-4 text-amber-500" /> Strongest subject
              </div>
              <p className="text-lg font-bold truncate">{analytics.bestSubject.name}</p>
              <p className="text-xs text-muted-foreground">Average {analytics.bestSubject.avg}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <AlertTriangle className="h-4 w-4 text-red-500" /> Needs the most attention
              </div>
              <p className="text-lg font-bold truncate">{analytics.weakestSubject.name}</p>
              <p className="text-xs text-muted-foreground">Average {analytics.weakestSubject.avg}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overall academic growth */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall academic growth</CardTitle>
          <CardDescription>Average score across every exam, in order</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={growthData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="exam_name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Average']} />
              <Line type="monotone" dataKey="average" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Subject progress charts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subject progress</CardTitle>
          <CardDescription>Per-subject score across exams</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={subjectProgressData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="exam_name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`${v}%`, '']} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {subjectNames.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={SUBJECT_COLORS[i % SUBJECT_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Term comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Term comparison</CardTitle>
          <CardDescription>Average score per term</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={termComparisonData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="term" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Average']} />
              <Bar dataKey="average" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceTrends;
