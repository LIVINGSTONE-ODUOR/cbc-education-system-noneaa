import React, { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { BookOpen, Calendar, ChevronRight, Users, ArrowRight, Printer, FileText } from 'lucide-react';
import StudentProfileHeader from '@/components/student-profile/StudentProfileHeader';
import LearnerProfileSkeleton from '@/components/student-profile/LearnerProfileSkeleton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getLearnerById } from '@/lib/api/learnersApi';
import { getLearnerAttendanceSummary, type LearnerAttendanceSummaryResponse, type AttendanceApiRecord } from '@/lib/api/attendanceApi';
import { getLearnerResults, type ExamSummary } from '@/lib/api/resultsApi';
import { getLearnerAssignmentsDue, type LearnerDueAssignment } from '@/lib/api/assignmentApi';

type LearnerProfileData = Awaited<ReturnType<typeof getLearnerById>>;

const StudentProfile = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const learnerId = searchParams.get('id');

  const [learner, setLearner] = useState<LearnerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real data for the dashboard/academics/attendance tabs. Each is fetched
  // independently and defaults to an empty state on failure, so one missing
  // endpoint (e.g. no terms configured yet) doesn't block the whole page.
  const [attendance, setAttendance] = useState<LearnerAttendanceSummaryResponse | null>(null);
  const [examSummaries, setExamSummaries] = useState<ExamSummary[]>([]);
  const [dueAssignments, setDueAssignments] = useState<LearnerDueAssignment[]>([]);

  useEffect(() => {
    if (!learnerId) {
      setError('Learner ID is missing. Please select a learner from the list.');
      setIsLoading(false);
      return;
    }

    const fetchLearner = async () => {
      // Flex skeleton loader to users: ensure at least a short minimum duration.
      const MIN_SKELETON_MS = 900;
      const start = Date.now();

      try {
        setIsLoading(true);
        setError(null);
        const data = await getLearnerById(learnerId);
        setLearner(data);

        // Fire the three supplementary reads in parallel. These power
        // real subject scores, attendance, and homework — no mock data.
        const [attendanceRes, resultsRes, assignmentsRes] = await Promise.allSettled([
          getLearnerAttendanceSummary(learnerId),
          getLearnerResults(learnerId),
          getLearnerAssignmentsDue(learnerId, true),
        ]);

        if (attendanceRes.status === 'fulfilled' && attendanceRes.value.success) {
          setAttendance(attendanceRes.value.data);
        }
        if (resultsRes.status === 'fulfilled' && resultsRes.value.success) {
          setExamSummaries(resultsRes.value.data.exams || []);
        }
        if (assignmentsRes.status === 'fulfilled' && assignmentsRes.value.success) {
          setDueAssignments(assignmentsRes.value.data.assignments || []);
        }
      } catch (err) {
        console.error('Failed to load learner profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load learner profile.');
      } finally {
        const elapsed = Date.now() - start;
        const remaining = MIN_SKELETON_MS - elapsed;
        if (remaining > 0) {
          await new Promise((res) => setTimeout(res, remaining));
        }
        setIsLoading(false);
      }
    };

    void fetchLearner();
  }, [learnerId]);

  const student = useMemo(() => {
    if (!learner) return null;

    const fullName = [learner.first_name, learner.middle_name, learner.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    const guardianName = (learner as any).parents
      ? [(learner as any).parents.first_name, (learner as any).parents.last_name].filter(Boolean).join(' ').trim()
      : 'Not assigned';

    const guardianPhone = (learner as any).parents?.phone_number || 'Not provided';
    const status = learner.is_active ? 'active' : 'inactive';
    const profileImage = learner.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || learner.admission_number || learner.id)}`;

    return {
      id: (learner as any).admission_number || (learner as any).id,
      name: fullName || 'Unnamed learner',
      email: (learner as any).email || 'Not provided',
      phone: guardianPhone,
      grade: (learner as any).grade_level || 'Not assigned',
      school: 'CBE Education',
      class: (learner as any).stream_name || '-',
      joinDate: (learner as any).admission_date ? new Date((learner as any).admission_date).toLocaleDateString() : 'N/A',
      dateOfBirth: (learner as any).date_of_birth ? new Date((learner as any).date_of_birth).toLocaleDateString() : 'Not provided',
      nationality: (learner as any).nationality || 'Not provided',
      gender: (learner as any).gender || 'Not provided',
      image: profileImage,
      status: status as any,
      guardianName,
      guardianPhone,
      lastUpdated: (learner as any).updated_at
        ? new Date((learner as any).updated_at).toLocaleDateString()
        : null,
    };
  }, [learner]);

  // Most recent exam (results endpoint returns every exam sat; take the
  // latest by start_date so "Subject Progress" reflects current standing).
  const latestExam = useMemo(() => {
    if (!examSummaries.length) return null;
    return [...examSummaries].sort((a, b) => {
      const dateA = a.exam?.start_date ? new Date(a.exam.start_date).getTime() : 0;
      const dateB = b.exam?.start_date ? new Date(b.exam.start_date).getTime() : 0;
      return dateB - dateA;
    })[0];
  }, [examSummaries]);

  // Count of not-yet-submitted assignments per subject, so the subject
  // progress bars can show real "X due" figures instead of invented ones.
  const dueCountBySubject = useMemo(() => {
    const map: Record<string, number> = {};
    dueAssignments.forEach((a: LearnerDueAssignment) => {
      if (a.submission_status !== 'not_submitted') return;
      const name = a.learning_area?.name || 'Other';
      map[name] = (map[name] || 0) + 1;
    });
    return map;
  }, [dueAssignments]);

  // A real "recent activity" feed, built by merging actual attendance
  // records with actual assignment submissions - not fabricated events.
  const recentActivity = useMemo(() => {
    type Item = { key: string; label: string; date: Date };
    const items: Item[] = [];

    (attendance?.recent_records || []).forEach((r: AttendanceApiRecord, i: number) => {
      items.push({
        key: `att-${i}`,
        label: `Marked ${r.status} for attendance`,
        date: new Date(r.attendance_date),
      });
    });

    dueAssignments
      .filter((a: LearnerDueAssignment) => a.submitted_at)
      .forEach((a: LearnerDueAssignment) => {
        items.push({
          key: `sub-${a.id}`,
          label: `Submitted "${a.title}"${a.grade != null ? ` — graded ${a.grade}/${a.max_grade}` : ''}`,
          date: new Date(a.submitted_at as string),
        });
      });

    return items
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 6);
  }, [attendance, dueAssignments]);

  // Attendance percentages, computed from real counts (no random numbers).
  const attendanceStats = useMemo(() => {
    const s = attendance?.summary;
    if (!s || s.total_days === 0) return { present: 0, late: 0, absent: 0, rate: 0, total: 0 };
    return {
      present: Math.round((s.present / s.total_days) * 100),
      late: Math.round((s.late / s.total_days) * 100),
      absent: Math.round((s.absent / s.total_days) * 100),
      rate: s.attendance_rate,
      total: s.total_days,
    };
  }, [attendance]);

  // Monthly attendance breakdown, grouped client-side from the real
  // attendance history returned for the current term.
  const monthlyAttendance = useMemo(() => {
    const records = attendance?.all_records || [];
    const byMonth: Record<string, { present: number; late: number; absent: number; total: number }> = {};

    records.forEach((r: AttendanceApiRecord) => {
      const d = new Date(r.attendance_date);
      const key = d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
      if (!byMonth[key]) byMonth[key] = { present: 0, late: 0, absent: 0, total: 0 };
      byMonth[key].total += 1;
      if (r.status === 'present') byMonth[key].present += 1;
      if (r.status === 'late') byMonth[key].late += 1;
      if (r.status === 'absent') byMonth[key].absent += 1;
    });

    return Object.entries(byMonth)
      .map(([month, v]) => ({
        month,
        present: v.total ? Math.round((v.present / v.total) * 100) : 0,
        late: v.total ? Math.round((v.late / v.total) * 100) : 0,
        absent: v.total ? Math.round((v.absent / v.total) * 100) : 0,
      }))
      .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
  }, [attendance]);

  // Helper functions for styling
  const getStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      submitted: "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200",
      graded: "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200",
      late: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200",
      returned: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200",
      not_submitted: "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200",
    };
    return styles[status] || styles.not_submitted;
  };

  const getGradeStyles = (score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getAttendanceCardStyles = (type: string) => {
    const styles: Record<string, string> = {
      present: "bg-emerald-50 dark:bg-emerald-950/30 border dark:border-emerald-900",
      late: "bg-amber-50 dark:bg-amber-950/30 border dark:border-amber-900",
      absent: "bg-red-50 dark:bg-red-950/30 border dark:border-red-900"
    };
    return styles[type] || "";
  };

  const getAttendanceTextStyles = (type: string) => {
    const styles: Record<string, string> = {
      present: "text-emerald-600 dark:text-emerald-400",
      late: "text-amber-600 dark:text-amber-400",
      absent: "text-red-600 dark:text-red-400"
    };
    return styles[type] || "";
  };

  const getAttendanceLabelStyles = (type: string) => {
    const styles: Record<string, string> = {
      present: "text-emerald-800 dark:text-emerald-300",
      late: "text-amber-800 dark:text-amber-300",
      absent: "text-red-800 dark:text-red-300"
    };
    return styles[type] || "";
  };

  if (isLoading) {
    return <LearnerProfileSkeleton />;
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unable to load learner profile</CardTitle>
              <CardDescription>{error || 'Learner profile could not be found.'}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/school-admin/learners')} variant="outline">
                Back to Learners
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 md:p-5">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Compact header - identity, contact, and actions in one row */}
        <StudentProfileHeader
          student={student}
          onEdit={() => setIsEditMode(!isEditMode)}
          lastUpdated={student.lastUpdated}
        />

        {/* Action Bar */}
        <div className="flex flex-wrap gap-2 justify-between items-center -mt-1">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="h-4 w-4" />
              Print Profile
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Guardian & Learner Info */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base">Guardian & Info</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2.5">
                <div>
                  <p className="text-xs text-muted-foreground">Guardian</p>
                  <p className="text-sm font-medium">{student.guardianName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Guardian Phone</p>
                  <p className="text-sm font-medium">{student.guardianPhone}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-border pt-2.5">
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="text-sm font-medium">{student.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="text-sm font-medium capitalize">{student.gender}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Admitted</p>
                    <p className="text-sm font-medium">{student.joinDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nationality</p>
                    <p className="text-sm font-medium">{student.nationality}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-1.5">
                <Button variant="outline" size="sm" className="w-full justify-start hover:bg-primary/5 dark:hover:bg-primary/10" onClick={() => setActiveTab('attendance')}>
                  <Calendar className="mr-2 h-4 w-4" /> View Attendance
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start hover:bg-primary/5 dark:hover:bg-primary/10" onClick={() => setActiveTab('academics')}>
                  <BookOpen className="mr-2 h-4 w-4" /> View Academics
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start hover:bg-primary/5 dark:hover:bg-primary/10" onClick={() => navigate(`/school-admin/learners/classes?student=${(learner as any)?.id}`)}>
                  <Users className="mr-2 h-4 w-4" /> Class & Enrollment
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-4 w-full">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="academics">Academics</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
              </TabsList>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-4">
                {/* Subject Progress Overview - from the most recent exam sat */}
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">Subject Progress</CardTitle>
                    <CardDescription>
                      {latestExam?.exam ? `Latest exam: ${latestExam.exam.exam_name}` : 'No exam results recorded yet'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {latestExam ? (
                      <div className="space-y-3">
                        {latestExam.subjects.map((subject, index) => {
                          const name = subject.learning_area?.name || 'Subject';
                          const due = dueCountBySubject[name] || 0;
                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{name}</span>
                                <span className="text-muted-foreground">{subject.percentage}%</span>
                              </div>
                              <div className="h-1.5 bg-muted dark:bg-muted/50 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-primary to-primary/80 dark:from-primary/80 dark:to-primary/60 rounded-full transition-all"
                                  style={{ width: `${Math.min(100, Math.max(0, subject.percentage))}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{due > 0 ? `${due} assignment${due > 1 ? 's' : ''} due` : 'No assignments due'}</span>
                                <span>{subject.performance_level || '—'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">No exam results have been recorded for this learner yet.</p>
                    )}
                  </CardContent>
                  {examSummaries.length > 0 && (
                    <CardFooter className="p-4 pt-0">
                      <Button className="ml-auto" variant="outline" size="sm" onClick={() => setActiveTab('academics')}>
                        View All Subjects <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  )}
                </Card>

                {/* Assignments - real due/submitted data */}
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">Homework & Assignments</CardTitle>
                    <CardDescription>Pending and completed tasks for the current class</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {dueAssignments.length > 0 ? (
                      <div className="space-y-2">
                        {dueAssignments.slice(0, 6).map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex justify-between items-center p-2.5 hover:bg-muted/50 dark:hover:bg-muted/30 rounded-md transition-colors"
                          >
                            <div>
                              <h4 className="text-sm font-semibold">{assignment.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                                {assignment.learning_area?.name ? ` • ${assignment.learning_area.name}` : ''}
                              </p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusStyles(assignment.submission_status)}`}>
                              {assignment.submission_status.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">No assignments recorded for this learner's class.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity - derived from real attendance + submission records */}
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {recentActivity.length > 0 ? (
                      <div className="space-y-1">
                        {recentActivity.map((item) => (
                          <div
                            key={item.key}
                            className="flex justify-between items-center p-2.5 hover:bg-muted/50 dark:hover:bg-muted/30 rounded-md transition-colors"
                          >
                            <div>
                              <h4 className="text-sm font-semibold">{item.label}</h4>
                              <p className="text-xs text-muted-foreground">{item.date.toLocaleDateString()}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">No recent attendance or submission activity yet.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Academics Tab */}
              <TabsContent value="academics" className="space-y-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">Academic Performance</CardTitle>
                    <CardDescription>
                      {latestExam?.exam ? `${latestExam.exam.exam_name} • ${latestExam.exam.exam_type}` : 'Subject-wise performance'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {latestExam ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Marks</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {latestExam.subjects.map((subject, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{subject.learning_area?.name || 'Subject'}</TableCell>
                              <TableCell>
                                {subject.is_absent ? 'Absent' : `${subject.marks_obtained}/${subject.max_marks}`}
                              </TableCell>
                              <TableCell>
                                <span className={`font-semibold ${getGradeStyles(subject.percentage)}`}>
                                  {subject.performance_level || '—'}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {subject.remarks || '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">No exam results have been recorded for this learner yet.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">Attendance Overview</CardTitle>
                    <CardDescription>
                      {attendance?.term ? `${attendance.term.name}, ${attendance.term.year}` : 'All recorded attendance'}
                      {attendanceStats.total > 0 ? ` • ${attendanceStats.total} days recorded` : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {attendanceStats.total > 0 ? (
                      <>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <Card className={getAttendanceCardStyles("present")}>
                            <CardContent className="p-3 pt-4 text-center">
                              <h3 className={`text-2xl font-bold ${getAttendanceTextStyles("present")}`}>
                                {attendanceStats.present}%
                              </h3>
                              <p className={`text-sm font-medium ${getAttendanceLabelStyles("present")}`}>Present</p>
                            </CardContent>
                          </Card>
                          <Card className={getAttendanceCardStyles("late")}>
                            <CardContent className="p-3 pt-4 text-center">
                              <h3 className={`text-2xl font-bold ${getAttendanceTextStyles("late")}`}>
                                {attendanceStats.late}%
                              </h3>
                              <p className={`text-sm font-medium ${getAttendanceLabelStyles("late")}`}>Late</p>
                            </CardContent>
                          </Card>
                          <Card className={getAttendanceCardStyles("absent")}>
                            <CardContent className="p-3 pt-4 text-center">
                              <h3 className={`text-2xl font-bold ${getAttendanceTextStyles("absent")}`}>
                                {attendanceStats.absent}%
                              </h3>
                              <p className={`text-sm font-medium ${getAttendanceLabelStyles("absent")}`}>Absent</p>
                            </CardContent>
                          </Card>
                        </div>

                        {monthlyAttendance.length > 0 && (
                          <div className="mt-4">
                            <h3 className="text-sm font-semibold mb-2">Monthly Breakdown</h3>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Month</TableHead>
                                  <TableHead>Present</TableHead>
                                  <TableHead>Late</TableHead>
                                  <TableHead>Absent</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {monthlyAttendance.map((m) => (
                                  <TableRow key={m.month}>
                                    <TableCell>{m.month}</TableCell>
                                    <TableCell>{m.present}%</TableCell>
                                    <TableCell>{m.late}%</TableCell>
                                    <TableCell>{m.absent}%</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">No attendance records found for this learner.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
