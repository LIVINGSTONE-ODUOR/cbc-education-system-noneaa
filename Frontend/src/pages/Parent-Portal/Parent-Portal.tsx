import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User, BookOpen, Loader2, AlertCircle, CalendarCheck, Wallet, ClipboardList,
  FileText, MessageSquare, Megaphone, MessageCircle, Clock, PartyPopper,
} from 'lucide-react';
import { getMyChildren } from '@/lib/api/parentsApi';
import { getLearnerResults, ExamSummary } from '@/lib/api/resultsApi';
import { getLearnerAttendanceSummary, LearnerAttendanceSummaryResponse, AttendanceStatus } from '@/lib/api/attendanceApi';
import { getLearnerAssignmentsDue, LearnerAssignmentsDueResponse } from '@/lib/api/assignmentApi';
import MarksPanel from '@/components/marks/MarksPanel';

// Shapes matching the backend response (snake_case, as returned by the API)
interface Child {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  grade_level: string;
  stream_name: string | null;
  relationship: string | null;
  is_primary_guardian: boolean;
}


const ParentPortal = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [attendance, setAttendance] = useState<LearnerAttendanceSummaryResponse | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [assignmentsDue, setAssignmentsDue] = useState<LearnerAssignmentsDueResponse | null>(null);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);

  // Load every child linked to the logged-in parent (handles 1 or many children)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingChildren(true);
        const res = await getMyChildren();
        if (cancelled) return;
        const kids = (res.data?.children || []) as unknown as Child[];
        setChildren(kids);
        if (kids.length > 0) setSelectedChildId(kids[0].id);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load your children');
      } finally {
        if (!cancelled) setLoadingChildren(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Whenever the selected child changes, pull their performance history
  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingResults(true);
        setError(null);
        const res = await getLearnerResults(selectedChildId);
        if (cancelled) return;
        setExams((res.data?.exams || []) as unknown as ExamSummary[]);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load performance data');
          setExams([]);
        }
      } finally {
        if (!cancelled) setLoadingResults(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedChildId]);

  // Whenever the selected child changes, pull their attendance summary for
  // the school's current term.
  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingAttendance(true);
        setAttendanceError(null);
        const res = await getLearnerAttendanceSummary(selectedChildId);
        if (cancelled) return;
        setAttendance(res.data);
      } catch (err: any) {
        if (!cancelled) {
          setAttendanceError(err.message || 'Failed to load attendance');
          setAttendance(null);
        }
      } finally {
        if (!cancelled) setLoadingAttendance(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedChildId]);

  // Whenever the selected child changes, pull their outstanding assignments.
  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingAssignments(true);
        setAssignmentsError(null);
        const res = await getLearnerAssignmentsDue(selectedChildId);
        if (cancelled) return;
        setAssignmentsDue(res.data);
      } catch (err: any) {
        if (!cancelled) {
          setAssignmentsError(err.message || 'Failed to load assignments');
          setAssignmentsDue(null);
        }
      } finally {
        if (!cancelled) setLoadingAssignments(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedChildId]);

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const latestExam = exams[0] || null;

  const isAssignmentDueSoon = (dueDate: string) => {
    const days = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days <= 3 && days >= 0;
  };

  const attendanceStatusColor = (status: AttendanceStatus) => {
    if (status === 'present') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'late') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (status === 'excused') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const attendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-amber-600';
    return 'text-red-600';
  };

  const gradeColor = (grade: string) => {
    if (grade === 'EE') return 'text-green-600';
    if (grade === 'ME') return 'text-blue-600';
    if (grade === 'AE') return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Parent Portal</CardTitle>
              <CardDescription>
                {children.length > 1
                  ? `You have ${children.length} children linked to your account`
                  : 'Welcome back'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2">
                <span className="text-sm text-muted-foreground">Select Child</span>
                {loadingChildren ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </div>
                ) : children.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No children are linked to your account yet. Contact the school office.
                  </p>
                ) : (
                  <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a child" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.first_name} {child.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2 mt-4">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <User className="mr-2 h-4 w-4" /> Profile
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <BookOpen className="mr-2 h-4 w-4" /> Academics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="col-span-1 md:col-span-3 space-y-6">
          {error && (
            <Card className="border-red-200">
              <CardContent className="p-4 flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" /> {error}
              </CardContent>
            </Card>
          )}

          {/* Child overview */}
          {selectedChild && (
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-4 border-primary/20">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2 text-center md:text-left">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedChild.first_name} {selectedChild.last_name}
                      </h2>
                      <p className="text-muted-foreground">
                        {selectedChild.grade_level}
                        {selectedChild.stream_name ? ` • ${selectedChild.stream_name}` : ''}
                        {' • Adm. No. '}{selectedChild.admission_number}
                      </p>
                    </div>
                    {latestExam && (
                      <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                        <span>Latest average: <strong>{latestExam.average_percentage}%</strong></span>
                        <span>Overall grade: <strong className={gradeColor(latestExam.overall_grade)}>{latestExam.overall_grade}</strong></span>
                        {latestExam.position && (
                          <span>Class position: <strong>{latestExam.position} of {latestExam.class_size}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dashboard modules */}
          {selectedChild && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Dashboard</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* 1. Attendance summary — fully wired to /api/v1/attendance/learner/:id/summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4 text-primary" /> Attendance summary
                    </CardTitle>
                    {attendance?.term && (
                      <CardDescription>{attendance.term.name}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {loadingAttendance ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : attendanceError ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> {attendanceError}
                      </p>
                    ) : !attendance || attendance.summary.total_days === 0 ? (
                      <p className="text-sm text-muted-foreground">No attendance records yet this term.</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                          <span className={`text-2xl font-bold ${attendanceRateColor(attendance.summary.attendance_rate)}`}>
                            {attendance.summary.attendance_rate}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {attendance.summary.present + attendance.summary.late} / {attendance.summary.total_days} days
                          </span>
                        </div>
                        <Progress value={attendance.summary.attendance_rate} />
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          <Badge variant="outline" className={attendanceStatusColor('present')}>Present {attendance.summary.present}</Badge>
                          <Badge variant="outline" className={attendanceStatusColor('absent')}>Absent {attendance.summary.absent}</Badge>
                          <Badge variant="outline" className={attendanceStatusColor('late')}>Late {attendance.summary.late}</Badge>
                          <Badge variant="outline" className={attendanceStatusColor('excused')}>Excused {attendance.summary.excused}</Badge>
                        </div>
                        {attendance.recent_records.length > 0 && (
                          <div className="pt-2 border-t space-y-1.5">
                            <span className="text-xs text-muted-foreground">Recent</span>
                            {attendance.recent_records.slice(0, 4).map((r) => (
                              <div key={r.attendance_date} className="flex items-center justify-between text-xs">
                                <span>{new Date(r.attendance_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                <Badge variant="outline" className={`capitalize ${attendanceStatusColor(r.status)}`}>{r.status}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 2. Latest average — reuses the exam summary already fetched above for the overview card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" /> Latest average
                    </CardTitle>
                    {latestExam && <CardDescription>{latestExam.exam_name}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    {loadingResults ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : !latestExam ? (
                      <p className="text-sm text-muted-foreground">No exam results recorded yet.</p>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-2xl font-bold">{latestExam.average_percentage}%</span>
                        <div className="flex items-center gap-2 text-sm">
                          <span>Grade:</span>
                          <span className={`font-semibold ${gradeColor(latestExam.overall_grade)}`}>{latestExam.overall_grade}</span>
                        </div>
                        {latestExam.position && (
                          <p className="text-xs text-muted-foreground">
                            Position {latestExam.position} of {latestExam.class_size}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 3. Assignments due — wired to /api/v1/assignments/learner/:id/due */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" /> Assignments due
                    </CardTitle>
                    {assignmentsDue?.class && (
                      <CardDescription>
                        {assignmentsDue.class.grade_level}{assignmentsDue.class.stream_name ? ` • ${assignmentsDue.class.stream_name}` : ''}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {loadingAssignments ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : assignmentsError ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> {assignmentsError}
                      </p>
                    ) : !assignmentsDue || assignmentsDue.assignments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No outstanding assignments. All caught up!</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-bold">{assignmentsDue.total_due}</span>
                          <span className="text-xs text-muted-foreground">outstanding</span>
                        </div>
                        <div className="space-y-2">
                          {assignmentsDue.assignments.slice(0, 4).map((a) => (
                            <div key={a.id} className="flex items-start justify-between gap-2 text-xs border-t pt-2 first:border-t-0 first:pt-0">
                              <div className="min-w-0">
                                <p className="font-medium truncate">{a.title}</p>
                                <p className="text-muted-foreground truncate">{a.learning_area?.name || 'General'}</p>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  a.is_overdue
                                    ? 'bg-red-100 text-red-700 border-red-200 shrink-0'
                                    : isAssignmentDueSoon(a.due_date)
                                    ? 'bg-amber-100 text-amber-700 border-amber-200 shrink-0'
                                    : 'shrink-0'
                                }
                              >
                                {a.is_overdue
                                  ? 'Overdue'
                                  : new Date(a.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 4–10. Remaining modules — placeholders until their backends are built in later steps */}
                {[
                  { icon: Wallet, title: 'Fees balance' },
                  { icon: FileText, title: 'Upcoming exams' },
                  { icon: MessageSquare, title: 'Unread messages' },
                  { icon: Megaphone, title: 'Latest announcements' },
                  { icon: MessageCircle, title: 'Teacher comments' },
                  { icon: Clock, title: "Today's timetable" },
                  { icon: PartyPopper, title: 'School events' },
                ].map(({ icon: Icon, title }) => (
                  <Card key={title} className="opacity-70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" /> {title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Coming soon</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Marks — filterable by year, term, and exam name */}
          {selectedChild && (
            <MarksPanel
              fetchResults={(filters) => getLearnerResults(selectedChildId, filters)}
              reloadKey={selectedChildId}
              emptyMessage={`No marks have been recorded for ${selectedChild.first_name} yet.`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentPortal;
