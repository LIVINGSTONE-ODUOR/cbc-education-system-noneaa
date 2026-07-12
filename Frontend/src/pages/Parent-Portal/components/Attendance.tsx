import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarCheck, AlertCircle, Clock3, ChevronLeft, ChevronRight, ListChecks, Grid3x3 } from 'lucide-react';
import {
  getLearnerAttendanceSummary,
  LearnerAttendanceSummaryResponse,
  AttendanceApiRecord,
  AttendanceStatus,
} from '@/lib/api/attendanceApi';

interface AttendanceProps {
  learnerId: string;
  reloadKey?: string;
  emptyMessage?: string;
}

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-700 border-green-200',
  late: 'bg-amber-100 text-amber-700 border-amber-200',
  absent: 'bg-red-100 text-red-700 border-red-200',
  excused: 'bg-blue-100 text-blue-700 border-blue-200',
};

const rateColor = (rate: number) =>
  rate >= 90 ? 'text-green-600' : rate >= 75 ? 'text-amber-600' : 'text-red-600';

type ViewMode = 'records' | 'late' | 'calendar' | 'reasons';

const Attendance: React.FC<AttendanceProps> = ({ learnerId, reloadKey, emptyMessage }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LearnerAttendanceSummaryResponse | null>(null);
  const [view, setView] = useState<ViewMode>('records');
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month, -1 = previous, etc.

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getLearnerAttendanceSummary(learnerId);
        if (!cancelled) setData(res.data);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load attendance');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learnerId, reloadKey]);

  const allRecords = data?.all_records || [];

  const lateArrivals = useMemo(
    () => allRecords.filter((r) => r.status === 'late'),
    [allRecords]
  );

  const absencesWithReasons = useMemo(
    () => allRecords.filter((r) => r.status === 'absent' || r.status === 'excused'),
    [allRecords]
  );

  // Build the calendar grid for the month currently being viewed
  const calendarMonth = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + monthOffset);
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = (firstDay.getDay() + 6) % 7; // convert Sun=0 -> Mon=0 based grid

    const byDate: Record<string, AttendanceApiRecord> = {};
    allRecords.forEach((r) => {
      byDate[r.attendance_date] = r;
    });

    const cells: { date: string | null; record: AttendanceApiRecord | null }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, record: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ date: iso, record: byDate[iso] || null });
    }

    return {
      label: base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      cells,
    };
  }, [allRecords, monthOffset]);

  const viewButtons: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
    { key: 'records', label: 'Records', icon: <ListChecks className="h-3.5 w-3.5" /> },
    { key: 'late', label: 'Late arrivals', icon: <Clock3 className="h-3.5 w-3.5" /> },
    { key: 'calendar', label: 'Calendar', icon: <Grid3x3 className="h-3.5 w-3.5" /> },
    { key: 'reasons', label: 'Absence reasons', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  ];

  return (
    <Card id="attendance-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          Attendance
        </CardTitle>
        <CardDescription>
          {data?.term ? `${data.term.name} ${data.term.year}` : 'Present/absent records, late arrivals, and trends'}
        </CardDescription>

        <div className="mt-3 flex flex-wrap gap-2">
          {viewButtons.map((b) => (
            <Button
              key={b.key}
              size="sm"
              variant={view === b.key ? 'default' : 'outline'}
              onClick={() => setView(b.key)}
            >
              {b.icon}
              <span className="ml-1.5">{b.label}</span>
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : !data || data.summary.total_days === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage || 'No attendance records yet this term.'}
          </p>
        ) : (
          <>
            {/* Attendance percentage — always visible above whichever view is selected */}
            <div className="mb-4 flex items-center gap-4 rounded-lg border p-4">
              <div>
                <span className={`text-3xl font-bold ${rateColor(data.summary.attendance_rate)}`}>
                  {data.summary.attendance_rate}%
                </span>
                <p className="text-xs text-muted-foreground">
                  {data.summary.present + data.summary.late} / {data.summary.total_days} days present
                </p>
              </div>
              <div className="flex-1">
                <Progress value={data.summary.attendance_rate} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className={STATUS_STYLES.present}>Present {data.summary.present}</Badge>
                  <Badge variant="outline" className={STATUS_STYLES.absent}>Absent {data.summary.absent}</Badge>
                  <Badge variant="outline" className={STATUS_STYLES.late}>Late {data.summary.late}</Badge>
                  <Badge variant="outline" className={STATUS_STYLES.excused}>Excused {data.summary.excused}</Badge>
                </div>
              </div>
            </div>

            {/* Present/Absent records — full list */}
            {view === 'records' && (
              <div className="max-h-96 space-y-1 overflow-y-auto">
                {allRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No records found.</p>
                ) : (
                  allRecords.map((r) => (
                    <div
                      key={r.attendance_date}
                      className="flex items-center justify-between border-t py-2 text-sm first:border-t-0"
                    >
                      <span>
                        {new Date(r.attendance_date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <Badge variant="outline" className={`capitalize ${STATUS_STYLES[r.status]}`}>
                        {r.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Late arrivals — filtered list with arrival time */}
            {view === 'late' && (
              <div className="max-h-96 space-y-1 overflow-y-auto">
                {lateArrivals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No late arrivals recorded. Great job!</p>
                ) : (
                  lateArrivals.map((r) => (
                    <div
                      key={r.attendance_date}
                      className="flex items-center justify-between border-t py-2 text-sm first:border-t-0"
                    >
                      <span>
                        {new Date(r.attendance_date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-2">
                        {r.arrival_time && (
                          <Badge variant="outline" className={STATUS_STYLES.late}>
                            Arrived {r.arrival_time.slice(0, 5)}
                          </Badge>
                        )}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Attendance calendar — month grid, color-coded by status */}
            {view === 'calendar' && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <Button size="icon" variant="ghost" onClick={() => setMonthOffset((m) => m - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{calendarMonth.label}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setMonthOffset((m) => Math.min(0, m + 1))}
                    disabled={monthOffset >= 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <div key={d} className="py-1 font-medium">{d}</div>
                  ))}
                  {calendarMonth.cells.map((cell, idx) =>
                    cell.date ? (
                      <div
                        key={cell.date}
                        title={cell.record ? `${cell.date}: ${cell.record.status}` : cell.date}
                        className={`flex aspect-square items-center justify-center rounded-md border text-xs ${
                          cell.record ? STATUS_STYLES[cell.record.status] : 'bg-muted/30 text-muted-foreground'
                        }`}
                      >
                        {Number(cell.date.slice(-2))}
                      </div>
                    ) : (
                      <div key={`empty-${idx}`} />
                    )
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className={STATUS_STYLES.present}>Present</Badge>
                  <Badge variant="outline" className={STATUS_STYLES.late}>Late</Badge>
                  <Badge variant="outline" className={STATUS_STYLES.absent}>Absent</Badge>
                  <Badge variant="outline" className={STATUS_STYLES.excused}>Excused</Badge>
                </div>
              </div>
            )}

            {/* Absence reasons — remarks recorded against absent/excused days */}
            {view === 'reasons' && (
              <div className="max-h-96 space-y-1 overflow-y-auto">
                {absencesWithReasons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No absences recorded.</p>
                ) : (
                  absencesWithReasons.map((r) => (
                    <div key={r.attendance_date} className="border-t py-2 text-sm first:border-t-0">
                      <div className="flex items-center justify-between">
                        <span>
                          {new Date(r.attendance_date).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <Badge variant="outline" className={`capitalize ${STATUS_STYLES[r.status]}`}>
                          {r.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {r.remarks ? r.remarks : 'No reason recorded'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Attendance;
