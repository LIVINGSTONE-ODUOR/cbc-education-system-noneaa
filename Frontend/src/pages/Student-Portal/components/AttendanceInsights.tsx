import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  getLearnerAttendanceSummary,
  AttendanceApiRecord,
} from '@/lib/api/attendanceApi';

interface AttendanceInsightsProps {
  learnerId: string;
  emptyMessage?: string;
}

// Groups the term's day-by-day records into calendar months and computes
// a present/late rate per month. There's no dedicated "monthly stats" or
// "trends" endpoint — both views are derived client-side from the same
// all_records list the Records/Calendar views already use, so this adds
// zero extra backend calls.
const monthlyStatsFrom = (records: AttendanceApiRecord[]) => {
  const byMonth: Record<string, { total: number; present: number; absent: number; late: number; excused: number; sortKey: string }> = {};

  records.forEach((r) => {
    const d = new Date(r.attendance_date);
    if (Number.isNaN(d.getTime())) return;
    const key = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = { total: 0, present: 0, absent: 0, late: 0, excused: 0, sortKey };
    byMonth[key].total += 1;
    if (r.status === 'present') byMonth[key].present += 1;
    else if (r.status === 'absent') byMonth[key].absent += 1;
    else if (r.status === 'late') byMonth[key].late += 1;
    else if (r.status === 'excused') byMonth[key].excused += 1;
  });

  return Object.entries(byMonth)
    .map(([month, v]) => ({
      month,
      sortKey: v.sortKey,
      total: v.total,
      present: v.present,
      absent: v.absent,
      late: v.late,
      excused: v.excused,
      rate: v.total > 0 ? Math.round(((v.present + v.late) / v.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
};

const AttendanceInsights: React.FC<AttendanceInsightsProps> = ({ learnerId, emptyMessage }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceApiRecord[]>([]);

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
        const res = await getLearnerAttendanceSummary(learnerId);
        if (!cancelled) setRecords(res.data.all_records || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message || t('failedToLoadAttendanceStats', 'Failed to load attendance statistics'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learnerId]);

  const monthly = useMemo(() => monthlyStatsFrom(records), [records]);

  return (
    <>
      {/* Monthly attendance statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t('monthlyAttendanceStats', 'Monthly Attendance Statistics')}
          </CardTitle>
          <CardDescription>{t('monthlyAttendanceStatsDesc', 'Present, late, absent, and excused days by month')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : error ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : monthly.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {emptyMessage || t('noAttendanceRecordsTerm', 'No attendance records yet this term.')}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="present" stackId="a" fill="#22c55e" name={t('present', 'Present')} radius={[0, 0, 0, 0]} />
                <Bar dataKey="late" stackId="a" fill="#f59e0b" name={t('late', 'Late')} />
                <Bar dataKey="excused" stackId="a" fill="#3b82f6" name={t('excused', 'Excused')} />
                <Bar dataKey="absent" stackId="a" fill="#ef4444" name={t('absent', 'Absent')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Attendance trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('attendanceTrends', 'Attendance Trends')}</CardTitle>
          <CardDescription>{t('attendanceTrendsDesc', 'Attendance rate by month, in order')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : error ? null : monthly.length < 2 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('attendanceTrendMinMonths', 'At least two months of records are needed to show a trend.')}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthly} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [`${v}%`, t('attendanceRate', 'Attendance rate')]} />
                <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default AttendanceInsights;
