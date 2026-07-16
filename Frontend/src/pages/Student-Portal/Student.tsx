import React, { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  BookOpen, Calendar, ClipboardList, AlertCircle, CalendarCheck, TrendingUp, Megaphone,
  CalendarDays, Settings, LayoutDashboard, GraduationCap, MessageSquare, Users,
  NotebookPen, PackageSearch, MapPin, Briefcase, ChevronLeft, ChevronRight, LogOut,
} from 'lucide-react';
import MarksPanel from '@/components/marks/MarksPanel';
import { getMyResults, ExamSummary, PerformanceLevel } from '@/lib/api/resultsApi';
import { getLearners } from '@/lib/api/learnersApi';
import { getClassById, ClassApiTeacherPayload } from '@/lib/api/classApi';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
import ReportCards from '../Parent-Portal/components/ReportCards';
import SubjectsAndTeachers from './components/SubjectsAndTeachers';
import SyllabusOutline from './components/SyllabusOutline';
import ClassResources from './components/ClassResources';
import TeacherComments from './components/TeacherComments';
import GradeHistory from './components/GradeHistory';
import AttendanceInsights from './components/AttendanceInsights';
import LeaveRequests from './components/LeaveRequests';
import StudentAssignments from './components/StudentAssignments';
import AssignmentReminders from './components/AssignmentReminders';
import StudentSettings from './components/StudentSettings';
import StudyStreakTracker from './components/StudyStreakTracker';
import ExamCountdownTimer from './components/ExamCountdownTimer';
import ClassRankMovement from './components/ClassRankMovement';
import CreditsPointsSystem from './components/CreditsPointsSystem';
import DigitalNotebook from './components/DigitalNotebook';
import PeerStudyGroups from './components/PeerStudyGroups';
import RecommendedResources from './components/RecommendedResources';
import LearningHeatmap from './components/LearningHeatmap';
import ExamRevisionPlanner from './components/ExamRevisionPlanner';
import ExportToCalendar from './components/ExportToCalendar';
import LostAndFound from './components/LostAndFound';
import CampusMap from './components/CampusMap';
import Portfolio from './components/Portfolio';
import Messages from './components/Messages';
import Announcements from '../Parent-Portal/components/Announcements';
import PerformanceTrends from '@/components/marks/PerformanceTrends';

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

const SIDEBAR_NAV_ITEMS = [
  { value: 'dashboard', label: 'Dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { value: 'academics', label: 'Academics', labelKey: 'academics', icon: GraduationCap },
  { value: 'marks', label: 'Marks', labelKey: 'marks', icon: BookOpen },
  { value: 'attendance', label: 'Attendance', labelKey: 'attendance', icon: CalendarCheck },
  { value: 'communication', label: 'Communication', labelKey: 'communication', icon: MessageSquare },
  { value: 'groups', label: 'Study Groups', labelKey: 'studyGroups', icon: Users },
  { value: 'notebook', label: 'Notebook', labelKey: 'notebook', icon: NotebookPen },
  { value: 'lostfound', label: 'Lost & Found', labelKey: 'lostFound', icon: PackageSearch },
  { value: 'campusmap', label: 'Campus Map', labelKey: 'campusMap', icon: MapPin },
  { value: 'portfolio', label: 'Portfolio', labelKey: 'portfolio', icon: Briefcase },
];

const StudentPortal = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { tab: tabParam } = useParams();
  const VALID_TABS = [...SIDEBAR_NAV_ITEMS.map((item) => item.value), 'settings'];
  const activeTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'dashboard';
  const setActiveTab = (value: string) => {
    navigate(value === 'dashboard' ? '/student/portal' : `/student/portal/${value}`);
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
    const subjects = latestExam?.subjects || [];
    if (subjects.length === 0) return null;
    const graded = subjects.filter((s) => !s.is_absent);
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
    <div className="student-portal-theme lg:h-screen lg:overflow-hidden bg-background">
      <div className="w-full lg:h-full px-3 sm:px-4 lg:px-6 py-6 md:py-8 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col lg:flex-row gap-4 items-start lg:items-stretch w-full flex-1 lg:min-h-0">
          {/* Left: collapsible sidebar navigation, styled like the school-admin sidebar */}
          <div className={cn('order-1 w-full min-w-0 flex-shrink-0 transition-all duration-300 lg:h-full lg:flex lg:flex-col', sidebarCollapsed ? 'lg:w-20' : 'lg:w-64')}>
            <div className="rounded-2xl bg-[#152C21] border border-[#2A4A3A] flex flex-col overflow-hidden lg:flex-1 lg:min-h-0">
              {/* Header */}
              <div className="hidden lg:flex items-center justify-between gap-2 px-3 py-4 border-b border-[#2A4A3A]">
                {!sidebarCollapsed && (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 ring-1 ring-amber-300/40">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-white truncate">{user?.schoolName || 'School'}</p>
                      <p className="text-xs text-emerald-200/60 truncate">Student Portal</p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((prev) => !prev)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                  aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  title={sidebarCollapsed ? 'Expand' : 'Collapse'}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-emerald-200/70" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-emerald-200/70" />
                  )}
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden gap-1 lg:gap-0 lg:space-y-1 py-2 lg:py-3 px-2 lg:flex-1 lg:min-h-0">
                {SIDEBAR_NAV_ITEMS.map(({ value, label, icon: Icon }) => {
                  const isActive = activeTab === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setActiveTab(value)}
                      title={label}
                      aria-label={label}
                      className={cn(
                        'flex-shrink-0 lg:w-full flex items-center justify-center lg:justify-start gap-3 rounded-lg h-10 text-sm font-medium transition-all duration-200 px-3',
                        sidebarCollapsed && 'lg:justify-center lg:px-2',
                        isActive
                          ? 'bg-gradient-to-r from-amber-500/20 to-transparent text-amber-300 border-r-2 lg:border-r-2 border-amber-400 shadow-sm'
                          : 'text-emerald-100/80 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-amber-300')} />
                      {!sidebarCollapsed && <span className="hidden lg:inline truncate">{label}</span>}
                    </button>
                  );
                })}
              </nav>

              {/* Mobile-only: current section label, since the icon strip has no room for text labels */}
              <div className="lg:hidden px-3 pb-2 -mt-1 text-xs font-medium text-amber-300 truncate">
                {(() => {
                  const item = SIDEBAR_NAV_ITEMS.find((i) => i.value === activeTab);
                  return item ? t(item.labelKey, item.label) : null;
                })()}
              </div>

              {/* User footer */}
              <div className="hidden lg:block flex-shrink-0 border-t border-[#2A4A3A] p-3">
                <div className={cn('flex items-center gap-2 mb-2', sidebarCollapsed && 'justify-center')}>
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">{initials || 'S'}</span>
                  </div>
                  {!sidebarCollapsed && (
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{displayName || 'Student'}</p>
                      <p className="text-xs text-emerald-200/60 truncate">student</p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-lg h-9 text-sm text-red-300 hover:bg-white/5 transition-colors',
                    sidebarCollapsed ? 'justify-center' : 'px-3'
                  )}
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{t('signOut')}</span>}
                </button>
              </div>
            </div>

            <Button
              variant={activeTab === 'settings' ? 'default' : 'outline'}
              className={cn('w-full justify-center gap-2 rounded-xl h-11 shadow-sm mt-3 lg:flex-shrink-0', sidebarCollapsed && 'px-0')}
              onClick={() => setActiveTab('settings')}
              title={sidebarCollapsed ? 'Account & Settings' : undefined}
            >
              <Settings className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-medium">{t('accountSettings')}</span>}
            </Button>
          </div>

          {/* Right: profile card, quick actions, credits (small) */}
          <div className="order-2 lg:order-3 w-full lg:w-72 flex-shrink-0 space-y-3 min-w-0 lg:h-full lg:overflow-y-auto">
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <div className="h-10 bg-gradient-to-r from-primary to-primary/80" />
              <CardContent className="pt-0 px-3 pb-3">
                {loadingLearner ? (
                  <div className="flex flex-col items-center -mt-7 mb-4 gap-2">
                    <Skeleton className="w-14 h-14 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center -mt-7 mb-3">
                    <Avatar className="w-14 h-14 border-2 border-background shadow-md ring-2 ring-accent/40">
                      <AvatarImage src={learner?.photo_url || user?.avatarUrl || undefined} alt={displayName} className="object-cover" />
                      <AvatarFallback className="text-sm bg-primary text-primary-foreground">{initials || 'S'}</AvatarFallback>
                    </Avatar>
                    <p className="font-serif italic text-accent text-[11px] mt-2">Student Profile</p>
                    <h2 className="text-sm font-bold mt-0.5 text-center leading-tight break-words">{displayName}</h2>
                    <p className="text-muted-foreground text-xs">
                      {learner?.grade_level || '—'}{learner?.stream_name ? `, ${learner.stream_name}` : ''}
                    </p>
                    {learner?.admission_number && (
                      <div className="bg-accent/10 text-accent text-[11px] font-medium px-2 py-0.5 rounded-full mt-1.5">
                        ID: {learner.admission_number}
                      </div>
                    )}
                  </div>
                )}

                {learnerError ? (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {learnerError}
                  </div>
                ) : (
                  <div className="space-y-0.5 border-t pt-3 text-xs">
                    <div className="flex justify-between gap-2 py-0.5">
                      <span className="text-muted-foreground">School:</span>
                      <span className="font-medium text-right truncate">{user?.schoolName || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-2 py-0.5">
                      <span className="text-muted-foreground">Class Teacher:</span>
                      <span className="font-medium text-right truncate">{classTeacherName || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-2 py-0.5">
                      <span className="text-muted-foreground">Age:</span>
                      <span className="font-medium">{age != null ? `${age} years` : '—'}</span>
                    </div>
                    <div className="flex justify-between gap-2 py-0.5">
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="font-medium">{joined || '—'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader className="py-3 px-3">
                <CardTitle className="text-sm font-serif italic text-accent font-normal">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 px-3 pb-3">
                <Button size="sm" variant="outline" className="w-full justify-start rounded-xl text-xs h-8 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors" onClick={() => setActiveTab('attendance')}>
                  <Calendar className="mr-2 h-3.5 w-3.5" /> View Attendance
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start rounded-xl text-xs h-8 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors" onClick={() => setActiveTab('marks')}>
                  <BookOpen className="mr-2 h-3.5 w-3.5" /> View Marks
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start rounded-xl text-xs h-8 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors" onClick={() => setActiveTab('dashboard')}>
                  <ClipboardList className="mr-2 h-3.5 w-3.5" /> View Assignments
                </Button>
              </CardContent>
            </Card>

            <CreditsPointsSystem learnerId={learner?.id || ''} />
          </div>

          {/* Middle: active tab's content */}
          <div className="order-3 lg:order-2 flex-1 w-full space-y-6 min-w-0 lg:h-full lg:overflow-y-auto">
              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6">
                {/* Quick summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
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

                {/* Study streak, exam countdown, class rank movement, and points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  <StudyStreakTracker learnerId={learner?.id || ''} />
                  <ExamCountdownTimer exams={upcomingExams} loading={loadingSummary} />
                  <ClassRankMovement exams={exams} loading={loadingResults} />
                </div>

                {/* Exam revision planner — auto-built study schedule ahead of the next exam */}
                <ExamRevisionPlanner
                  exams={exams}
                  upcomingExams={upcomingExams}
                  loading={loadingSummary}
                />

                {/* Export to calendar — .ics download + one-click Google Calendar links */}
                <ExportToCalendar
                  learnerId={learner?.id || ''}
                  upcomingExams={upcomingExams}
                  upcomingEvents={upcomingEvents}
                  loading={loadingSummary}
                />

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
                    ) : !latestExam || (latestExam.subjects || []).length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No exam results have been recorded for you yet.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {(latestExam.subjects || []).map((s, index) => (
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

                {/* Recommended resources — personalized suggestions derived
                    from weak subjects in the learner's exam history */}
                <RecommendedResources exams={exams} emptyMessage="No exam results yet — recommendations will appear once your marks are recorded." />

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

                {/* Homework and assignments, with real file-upload submission */}
                <StudentAssignments learnerId={learner?.id || ''} emptyMessage="No homework or assignments have been posted yet." />

                {/* Reminder notifications — due-soon / overdue, derived from due dates */}
                <AssignmentReminders learnerId={learner?.id || ''} />

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
                    ) : !latestExam || (latestExam.subjects || []).length === 0 ? (
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
                          {(latestExam.subjects || []).map((s, index) => (
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
                {/* CAT and exam results */}
                <MarksPanel
                  fetchResults={(filters) => getMyResults(filters)}
                  emptyMessage="No marks have been recorded for you yet."
                />

                {/* Subject-wise performance charts + academic progress analytics
                    (overall growth line, per-subject trend lines, term comparison,
                    and the strongest/weakest-subject summary all live in this one
                    component, since they're derived from the same trend data). */}
                <PerformanceTrends
                  learnerId={learner?.id || ''}
                  emptyMessage="At least two exams are needed to show performance trends."
                />

                {/* Learning heatmap — visual grid of strong/weak topics across exams */}
                <LearningHeatmap exams={exams} />

                {/* Grade history */}
                <GradeHistory exams={exams} />

                {/* Report cards */}
                <ReportCards
                  fetchResults={(filters) => getMyResults(filters)}
                  child={learner}
                  emptyMessage="No report cards are available yet."
                />

                {/* Teacher comments */}
                <TeacherComments learnerId={learner?.id || ''} />
              </TabsContent>

              {/* Attendance Tab — real records from the backend */}
              <TabsContent value="attendance" className="space-y-6">
                {/* Daily attendance records, late arrivals, calendar, and
                    absence reasons — all in this one existing component. */}
                <Attendance learnerId={learner?.id || ''} emptyMessage="No attendance records yet this term." />

                {/* Monthly attendance statistics + attendance trends */}
                <AttendanceInsights learnerId={learner?.id || ''} />

                {/* Leave requests */}
                <LeaveRequests />
              </TabsContent>

              {/* Communication Tab — uses the dedicated Student Portal
                  Messages component (./components/Messages), which calls
                  the general-purpose /api/v1/messages endpoints built for
                  teacher/student/school_admin roles. This is the same API
                  the Teacher Portal's Messages component uses; the Parent
                  Portal keeps its own separate /api/v1/parent-dashboard
                  messaging endpoints, unchanged. */}
              <TabsContent value="communication" className="space-y-6">
                {user?.id && <Messages />}
                <Announcements />
              </TabsContent>

              {/* Peer Study Groups Tab */}
              <TabsContent value="groups" className="space-y-6">
                <PeerStudyGroups />
              </TabsContent>

              {/* Digital Notebook Tab */}
              <TabsContent value="notebook" className="space-y-6">
                <DigitalNotebook userId={user?.id || ''} />
              </TabsContent>

              {/* Lost & Found Tab */}
              <TabsContent value="lostfound" className="space-y-6">
                <LostAndFound />
              </TabsContent>

              {/* Campus Map Tab */}
              <TabsContent value="campusmap" className="space-y-6">
                <CampusMap />
              </TabsContent>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio" className="space-y-6">
                <Portfolio />
              </TabsContent>

              {/* Account & Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <StudentSettings />
              </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentPortal;
