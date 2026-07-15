import React, { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { BookOpen, Calendar, ClipboardList, AlertCircle, CalendarCheck, TrendingUp, Megaphone, CalendarDays } from 'lucide-react';
import MarksPanel from '@/components/marks/MarksPanel';
import { getMyResults, ExamSummary, PerformanceLevel } from '@/lib/api/resultsApi';
import { getLearners } from '@/lib/api/learnersApi';
import { getClassById, ClassApiTeacherPayload } from '@/lib/api/classApi';
import { useAuth } from '@/contexts/AuthContext';
import { getLearnerAttendanceSummary } from '@/lib/api/attendanceApi';
import { getLearnerAssignmentsDue } from '@/lib/api/assignmentApi';
import { getLearnerUpcomingExams, LearnerUpcomingExam } from '@/lib/api/examApi';
import { getAnnouncements, getSchoolEvents, SchoolEvent } from '@/lib/api/parentDashboardApi';
// Reuse the Parent Portal's already-real, backend-backed components instead
// of re-implementing assignments/attendance with fake data — the backend
// resolves the caller's own learner record for both when the role is
// 'student', so the same components work here unchanged.
import Assignments from '../Parent-Portal/components/Assignments';
import Attendance from '../Parent-Portal/components/Attendance';
import Timetable from '../Parent-Portal/components/Timetable';
import SubjectsAndTeachers from './components/SubjectsAndTeachers';
import SyllabusOutline from './components/SyllabusOutline';
import ClassResources from './components/ClassResources';

const GRADE_STYLES: Record<PerformanceLevel, string> = {
  EE: 'text-green-600',
  ME: 'text-blue-600',
  AE: 'text-amber-600',
  BE: 'text-red-600',
};

const GRADE_REMARKS: Record<PerformanceLevel, string> = {
  EE: 'Exceeding expectations.',
  ME: 'Meeting expectations.',
  AE: 'Approaching expectations.',
  BE: 'Below expectations.',
};

interface StudentLearner {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  grade_level: string;
  stream_name: string | null;
  class_id: string | null;
  date_of_birth: string | null;
  admission_date: string | null;
  photo_url: string | null;
}

const calculateAge = (dob: string | null): number | null => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const formatDate = (value: string | null): string | null => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

const StudentPortal = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  const [learner, setLearner] = useState<StudentLearner | null>(null);
  const [loadingLearner, setLoadingLearner] = useState(true);
  const [learnerError, setLearnerError] = useState<string | null>(null);

  const [classTeacherName, setClassTeacherName] = useState<string | null>(null);

  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [resultsError, setResultsError] = useState<string | null>(null);

  // Dashboard quick-summary cards + calendar
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<number | null>(null);
  const [upcomingExams, setUpcomingExams] = useState<LearnerUpcomingExam[]>([]);
  const [announcementsCount, setAnnouncementsCount] = useState<number | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<SchoolEvent[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Load the logged-in student's own learner profile.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingLearner(true);
        setLearnerError(null);
        const res = await getLearners();
        const own = res.students?.[0] || null;
        if (!cancelled) setLearner(own);
      } catch (err: any) {
        if (!cancelled) setLearnerError(err.message || 'Failed to load your profile');
      } finally {
        if (!cancelled) setLoadingLearner(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Once we know the class, look up the class teacher's name.
  useEffect(() => {
    if (!learner?.class_id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getClassById(learner.class_id as string);
        const teacher = res.data?.teachers as ClassApiTeacherPayload | null | undefined;
        const name = teacher?.users ? `${teacher.users.first_name || ''} ${teacher.users.last_name || ''}`.trim() : null;
        if (!cancelled) setClassTeacherName(name || null);
      } catch {
        // Non-critical — just leave the class teacher field blank.
      }
    })();
    return () => { cancelled = true; };
  }, [learner?.class_id]);

  // Load results (marks) for the "Subject Progress" and "Academic
  // Performance" summaries — same endpoint the Marks tab uses, most recent
  // exam first.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingResults(true);
        setResultsError(null);
        const res = await getMyResults();
        if (!cancelled) setExams(res.data.exams || []);
      } catch (err: any) {
        if (!cancelled) setResultsError(err.message || 'Failed to load results');
      } finally {
        if (!cancelled) setLoadingResults(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load the quick-summary cards (attendance %, pending assignments,
  // upcoming exams, announcements) and the events calendar. These reuse
  // the same backend endpoints as the Parent Portal dashboard.
  useEffect(() => {
    if (!learner?.id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingSummary(true);
        const [attendanceRes, dueRes, examsRes, announcementsRes, eventsRes] = await Promise.all([
          getLearnerAttendanceSummary(learner.id).catch(() => null),
          getLearnerAssignmentsDue(learner.id).catch(() => null),
          getLearnerUpcomingExams(learner.id, 5).catch(() => null),
          getAnnouncements(5).catch(() => null),
          getSchoolEvents(5).catch(() => null),
        ]);
        if (cancelled) return;
        setAttendanceRate(attendanceRes?.data?.summary?.attendance_rate ?? null);
        setPendingAssignments(dueRes?.data?.total_due ?? null);
        setUpcomingExams(examsRes?.data?.upcoming_exams || []);
        setAnnouncementsCount(announcementsRes?.data?.announcements?.length ?? null);
        setUpcomingEvents(eventsRes?.data?.events || []);
      } finally {
        if (!cancelled) setLoadingSummary(false);
      }
    })();
    return () => { cancelled = true; };
  }, [learner?.id]);

  const latestExam = exams[0] || null;

  // Average score across the most recent exam's subjects, used for the
  // "Average Grade" quick-summary card.
  const averageScore = useMemo(() => {
    if (!latestExam || latestExam.subjects.length === 0) return null;
    const graded = latestExam.subjects.filter((s) => !s.is_absent);
    if (graded.length === 0) return null;
    const sum = graded.reduce((acc, s) => acc + (s.percentage || 0), 0);
    return Math.round(sum / graded.length);
  }, [latestExam]);

  const age = useMemo(() => calculateAge(learner?.date_of_birth || null), [learner]);
  const joined = useMemo(() => formatDate(learner?.admission_date || null), [learner]);

  const displayName = learner
    ? `${learner.first_name} ${learner.last_name}`
    : user
      ? `${user.firstName} ${user.lastName}`
      : '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="col-span-1">
            <Card className="mb-6">
              <CardContent className="pt-6">
                {loadingLearner ? (
                  <div className="flex flex-col items-center mb-6 gap-3">
                    <Skeleton className="w-32 h-32 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center mb-6">
                    <Avatar className="w-32 h-32 border-4 border-primary/30">
                      <AvatarImage src={learner?.photo_url || user?.avatarUrl || undefined} alt={displayName} className="object-cover" />
                      <AvatarFallback className="text-2xl">{initials || 'S'}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold mt-4">{displayName}</h2>
                    <p className="text-muted-foreground">
                      {learner?.grade_level || '—'}{learner?.stream_name ? `, ${learner.stream_name}` : ''}
                    </p>
                    {learner?.admission_number && (
                      <div className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full mt-2">
                        ID: {learner.admission_number}
                      </div>
                    )}
                  </div>
                )}

                {learnerError ? (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {learnerError}
                  </div>
                ) : (
                  <div className="space-y-1 border-t pt-4">
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">School:</span>
                      <span className="font-medium">{user?.schoolName || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Class Teacher:</span>
                      <span className="font-medium">{classTeacherName || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Age:</span>
                      <span className="font-medium">{age != null ? `${age} years` : '—'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="font-medium">{joined || '—'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('attendance')}>
                  <Calendar className="mr-2 h-4 w-4" /> View Attendance
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('marks')}>
                  <BookOpen className="mr-2 h-4 w-4" /> View Marks
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('dashboard')}>
                  <ClipboardList className="mr-2 h-4 w-4" /> View Assignments
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="col-span-1 md:col-span-3 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-8">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="academics">Academics</TabsTrigger>
                <TabsTrigger value="marks">Marks</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
              </TabsList>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6">
                {/* Quick summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <CalendarCheck className="h-5 w-5 mx-auto text-primary mb-1" />
                      {loadingSummary ? (
                        <Skeleton className="h-7 w-12 mx-auto" />
                      ) : (
                        <p className="text-2xl font-bold">{attendanceRate != null ? `${Math.round(attendanceRate)}%` : '—'}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Attendance</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" />
                      {loadingResults ? (
                        <Skeleton className="h-7 w-12 mx-auto" />
                      ) : (
                        <p className="text-2xl font-bold">{averageScore != null ? `${averageScore}%` : '—'}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Average Grade</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <ClipboardList className="h-5 w-5 mx-auto text-primary mb-1" />
                      {loadingSummary ? (
                        <Skeleton className="h-7 w-12 mx-auto" />
                      ) : (
                        <p className="text-2xl font-bold">{pendingAssignments ?? '—'}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Pending Assignments</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <BookOpen className="h-5 w-5 mx-auto text-primary mb-1" />
                      {loadingSummary ? (
                        <Skeleton className="h-7 w-12 mx-auto" />
                      ) : (
                        <p className="text-2xl font-bold">{upcomingExams.length}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Upcoming Exams</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Megaphone className="h-5 w-5 mx-auto text-primary mb-1" />
                      {loadingSummary ? (
                        <Skeleton className="h-7 w-12 mx-auto" />
                      ) : (
                        <p className="text-2xl font-bold">{announcementsCount ?? '—'}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Announcements</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Calendar — upcoming school events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-primary" />
                      Upcoming Events
                    </CardTitle>
                    <CardDescription>School events, holidays, and activities coming up</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingSummary ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : upcomingEvents.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">No upcoming events scheduled.</p>
                    ) : (
                      <div className="space-y-2">
                        {upcomingEvents.map((e) => (
                          <div key={e.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                            <div>
                              <p className="font-medium">{e.title}</p>
                              {e.location && <p className="text-xs text-muted-foreground">{e.location}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-medium">
                                {new Date(e.event_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              </p>
                              {e.start_time && <p className="text-xs text-muted-foreground">{e.start_time.slice(0, 5)}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Subject Progress — most recent exam's per-subject scores */}
                <Card>
                  <CardHeader>
                    <CardTitle>Subject Progress</CardTitle>
                    <CardDescription>
                      {latestExam?.exam?.exam_name ? `Scores from ${latestExam.exam.exam_name}` : 'Your most recent exam scores by subject'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingResults ? (
                      <div className="space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : resultsError ? (
                      <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {resultsError}
                      </div>
                    ) : !latestExam || latestExam.subjects.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No exam results have been recorded for you yet.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {latestExam.subjects.map((s, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">{s.learning_area?.name || 'Subject'}</span>
                              <span className="text-muted-foreground">
                                {s.is_absent ? 'Absent' : `${Math.round(s.percentage)}%`}
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${s.is_absent ? 0 : Math.min(100, Math.round(s.percentage))}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>{s.performance_level || '—'}</span>
                              <span>Score: {s.marks_obtained}/{s.max_marks}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Assignments — real due/submitted assignments from the backend */}
                <Assignments learnerId={learner?.id || ''} emptyMessage="No assignments have been posted yet." />
              </TabsContent>

              {/* Academics Tab */}
              <TabsContent value="academics" className="space-y-6">
                {/* Subjects and teachers */}
                <SubjectsAndTeachers classId={learner?.class_id || null} learnerId={learner?.id || ''} />

                {/* Timetable */}
                <Timetable learnerId={learner?.id || ''} />

                {/* Learning materials and notes / Class resources */}
                <ClassResources />

                {/* Syllabus and course outline */}
                <SyllabusOutline gradeLevel={learner?.grade_level || null} />

                {/* Homework and assignments */}
                <Assignments learnerId={learner?.id || ''} emptyMessage="No homework or assignments have been posted yet." />

                <Card>
                  <CardHeader>
                    <CardTitle>Academic Performance</CardTitle>
                    <CardDescription>
                      {latestExam?.exam?.exam_name ? `Subject-wise results for ${latestExam.exam.exam_name}` : 'Subject-wise performance analytics'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingResults ? (
                      <div className="space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : resultsError ? (
                      <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {resultsError}
                      </div>
                    ) : !latestExam || latestExam.subjects.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No exam results have been recorded for you yet.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Teacher Comments</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {latestExam.subjects.map((s, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{s.learning_area?.name || 'Subject'}</TableCell>
                              <TableCell>{s.is_absent ? 'Absent' : `${s.marks_obtained}/${s.max_marks}`}</TableCell>
                              <TableCell>
                                {s.performance_level ? (
                                  <span className={`font-semibold ${GRADE_STYLES[s.performance_level]}`}>
                                    {s.performance_level}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {s.remarks || (s.performance_level ? GRADE_REMARKS[s.performance_level] : 'No comments yet.')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Marks Tab — real data from the backend, filterable by year/term/exam */}
              <TabsContent value="marks" className="space-y-6">
                <MarksPanel
                  fetchResults={(filters) => getMyResults(filters)}
                  emptyMessage="No marks have been recorded for you yet."
                />
              </TabsContent>

              {/* Attendance Tab — real records from the backend */}
              <TabsContent value="attendance" className="space-y-6">
                <Attendance learnerId={learner?.id || ''} emptyMessage="No attendance records yet this term." />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
  );
};

export default StudentPortal;
