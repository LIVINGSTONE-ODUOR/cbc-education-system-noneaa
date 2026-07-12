import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  User, BookOpen, Loader2, AlertCircle, CalendarCheck, Wallet, ClipboardList,
  FileText, MessageSquare, Megaphone, MessageCircle, Clock, PartyPopper,
  HeartPulse, Phone, GraduationCap, Cake, LayoutDashboard, CalendarClock,
  Settings as SettingsIcon, LogOut,
} from 'lucide-react';
import { getMyChildren } from '@/lib/api/parentsApi';
import { getLearnerResults, ExamSummary } from '@/lib/api/resultsApi';
import { getLearnerAttendanceSummary, LearnerAttendanceSummaryResponse, AttendanceStatus } from '@/lib/api/attendanceApi';
import { getLearnerAssignmentsDue, LearnerAssignmentsDueResponse } from '@/lib/api/assignmentApi';
import { getLearnerUpcomingExams, LearnerUpcomingExamsResponse } from '@/lib/api/examApi';
import {
  getMessages, markMessageRead, DashboardMessage,
  getAnnouncements, DashboardAnnouncement,
  getLearnerTeacherComments, TeacherComment,
  getLearnerTimetable, TimetablePeriod,
  getSchoolEvents, SchoolEvent,
  getChildProfile, ChildProfileResponse,
} from '@/lib/api/parentDashboardApi';
import MarksPanel from '@/components/marks/MarksPanel';
import PerformanceTrends from '@/components/marks/PerformanceTrends';
import ReportCards from './components/ReportCards';
import Attendance from './components/Attendance';
import Assignments from './components/Assignments';
import Timetable from './components/Timetable';
import Messages from './components/Messages';
import Announcements from './components/Announcements';
import SchoolCalendar from './components/SchoolCalendar';
import Settings from './components/Settings';
import { useAuth } from '@/contexts/AuthContext';

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const todayDayOfWeek = () => {
  const jsDay = new Date().getDay(); // 0 = Sunday ... 6 = Saturday
  return jsDay === 0 ? 7 : jsDay; // convert to 1 = Monday ... 7 = Sunday
};
const formatTime = (t: string) => t?.slice(0, 5) || '';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'academics', label: 'Academics', icon: BookOpen },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { key: 'assignments', label: 'Assignments', icon: ClipboardList },
  { key: 'timetable', label: 'Timetable', icon: Clock },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'announcements', label: 'Announcements', icon: Megaphone },
  { key: 'calendar', label: 'Calendar', icon: CalendarClock },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
] as const;

type TabKey = typeof NAV_ITEMS[number]['key'];

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
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
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

  const [upcomingExams, setUpcomingExams] = useState<LearnerUpcomingExamsResponse | null>(null);
  const [loadingExams, setLoadingExams] = useState(false);
  const [examsError, setExamsError] = useState<string | null>(null);

  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [announcements, setAnnouncements] = useState<DashboardAnnouncement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);

  const [teacherComments, setTeacherComments] = useState<TeacherComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  const [timetable, setTimetable] = useState<TimetablePeriod[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [timetableError, setTimetableError] = useState<string | null>(null);

  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [childProfile, setChildProfile] = useState<ChildProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

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

  // Whenever the selected child changes, pull their upcoming exams.
  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingExams(true);
        setExamsError(null);
        const res = await getLearnerUpcomingExams(selectedChildId);
        if (cancelled) return;
        setUpcomingExams(res.data);
      } catch (err: any) {
        if (!cancelled) {
          setExamsError(err.message || 'Failed to load upcoming exams');
          setUpcomingExams(null);
        }
      } finally {
        if (!cancelled) setLoadingExams(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedChildId]);

  // Inbox messages don't depend on which child is selected — load once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingMessages(true);
        setMessagesError(null);
        const res = await getMessages(10);
        if (cancelled) return;
        setMessages(res.data.messages);
        setUnreadCount(res.data.unread_count);
      } catch (err: any) {
        if (!cancelled) setMessagesError(err.message || 'Failed to load messages');
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Announcements are scoped server-side to school-wide + the parent's own
  // children's classes — also load once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingAnnouncements(true);
        setAnnouncementsError(null);
        const res = await getAnnouncements(10);
        if (cancelled) return;
        setAnnouncements(res.data.announcements);
      } catch (err: any) {
        if (!cancelled) setAnnouncementsError(err.message || 'Failed to load announcements');
      } finally {
        if (!cancelled) setLoadingAnnouncements(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Whenever the selected child changes, pull their recent teacher comments.
  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingComments(true);
        setCommentsError(null);
        const res = await getLearnerTeacherComments(selectedChildId, 10);
        if (cancelled) return;
        setTeacherComments(res.data.comments);
      } catch (err: any) {
        if (!cancelled) {
          setCommentsError(err.message || 'Failed to load teacher comments');
          setTeacherComments([]);
        }
      } finally {
        if (!cancelled) setLoadingComments(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedChildId]);

  // Whenever the selected child changes, pull their class timetable.
  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingTimetable(true);
        setTimetableError(null);
        const res = await getLearnerTimetable(selectedChildId);
        if (cancelled) return;
        setTimetable(res.data.periods);
      } catch (err: any) {
        if (!cancelled) {
          setTimetableError(err.message || 'Failed to load timetable');
          setTimetable([]);
        }
      } finally {
        if (!cancelled) setLoadingTimetable(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedChildId]);

  // School events don't depend on which child is selected — load once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingEvents(true);
        setEventsError(null);
        const res = await getSchoolEvents(10);
        if (cancelled) return;
        setSchoolEvents(res.data.events);
      } catch (err: any) {
        if (!cancelled) setEventsError(err.message || 'Failed to load school events');
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Whenever the selected child changes, pull their full profile (photo,
  // DOB, class teacher, medical info, emergency contacts).
  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingProfile(true);
        setProfileError(null);
        const res = await getChildProfile(selectedChildId);
        if (cancelled) return;
        setChildProfile(res.data);
      } catch (err: any) {
        if (!cancelled) {
          setProfileError(err.message || 'Failed to load child profile');
          setChildProfile(null);
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedChildId]);

  const handleMarkMessageRead = async (id: string) => {
    try {
      await markMessageRead(id);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Non-critical — leave the message as-is if the update fails.
    }
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const latestExam = exams[0] || null;
  const todaysPeriods = timetable.filter((p) => p.day_of_week === todayDayOfWeek());

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
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold leading-tight truncate">Parent Portal</h1>
              <p className="text-[11px] text-muted-foreground truncate">
                {loadingChildren
                  ? 'Loading...'
                  : children.length > 1
                  ? `${children.length} children linked`
                  : 'Welcome back'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!loadingChildren && children.length > 0 && (
              <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                <SelectTrigger className="h-8 text-xs w-[130px] sm:w-[180px]">
                  <SelectValue placeholder="Select a child" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id} className="text-xs">
                      {child.first_name} {child.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Avatar className="h-8 w-8 border shrink-0">
              <AvatarImage src={user?.avatarUrl} alt={user?.firstName || 'You'} />
              <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-semibold">
                {(user?.firstName?.[0] || 'P')}{(user?.lastName?.[0] || '')}
              </AvatarFallback>
            </Avatar>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors duration-150"
              onClick={logout}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile horizontal nav — scrolls sideways so every section fits on small screens */}
        <nav className="md:hidden overflow-x-auto border-t">
          <div className="flex gap-1.5 px-3 py-2 min-w-max">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                  {item.key === 'messages' && unreadCount > 0 && (
                    <span className="ml-0.5 rounded-full bg-red-500 text-white text-[10px] leading-none px-1.5 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <div className="container mx-auto px-4 py-5">
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-56 shrink-0">
            <nav className="sticky top-20 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground/80 hover:bg-secondary'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.key === 'messages' && unreadCount > 0 && (
                      <span className="ml-auto rounded-full bg-red-500 text-white text-[10px] leading-none px-1.5 py-1">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-5">
            {error && (
              <Card className="border-red-200">
                <CardContent className="p-4 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </CardContent>
              </Card>
            )}

            {!loadingChildren && children.length === 0 && (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No children are linked to your account yet. Contact the school office.
                </CardContent>
              </Card>
            )}

            <div key={activeTab} className="animate-fade-in space-y-5">
              {/* ── Overview tab ── */}
              {activeTab === 'overview' && selectedChild && (
                <div className="space-y-5">
          {/* Child overview */}
          {selectedChild && (
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-4 border-primary/20 overflow-hidden shadow-sm">
                    {childProfile?.photo_url ? (
                      <img src={childProfile.photo_url} alt={`${selectedChild.first_name} ${selectedChild.last_name}`} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div className="space-y-2 text-center md:text-left">
                    <div>
                      <h2 className="text-xl font-bold">
                        {selectedChild.first_name} {selectedChild.last_name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* 1. Attendance summary — fully wired to /api/v1/attendance/learner/:id/summary */}
                <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
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
                          <span className={`text-xl font-bold ${attendanceRateColor(attendance.summary.attendance_rate)}`}>
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
                <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
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
                        <span className="text-xl font-bold">{latestExam.average_percentage}%</span>
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
                <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
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
                          <span className="text-xl font-bold">{assignmentsDue.total_due}</span>
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

                {/* 4. Upcoming exams — wired to /api/v1/exams/learner/:id/upcoming */}
                <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Upcoming exams
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingExams ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : examsError ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> {examsError}
                      </p>
                    ) : !upcomingExams || upcomingExams.upcoming_exams.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No upcoming exams scheduled.</p>
                    ) : (
                      <div className="space-y-2">
                        {upcomingExams.upcoming_exams.map((e) => (
                          <div key={e.id} className="flex items-start justify-between gap-2 text-xs border-t pt-2 first:border-t-0 first:pt-0">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{e.exam_name}</p>
                              <p className="text-muted-foreground truncate">{e.exam_type}{e.term ? ` • ${e.term.name}` : ''}</p>
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {new Date(e.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 5. Fees balance — placeholder until the billing backend is built */}
                <Card className="opacity-70 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" /> Fees balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Coming soon</p>
                  </CardContent>
                </Card>

                {/* 6. Unread messages — wired to /api/v1/parent-dashboard/messages */}
                <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" /> Unread messages
                      {unreadCount > 0 && (
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 ml-auto">
                          {unreadCount}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingMessages ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : messagesError ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> {messagesError}
                      </p>
                    ) : messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No messages yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {messages.slice(0, 4).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => !m.is_read && handleMarkMessageRead(m.id)}
                            className="w-full text-left text-xs border-t pt-2 first:border-t-0 first:pt-0"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`truncate ${!m.is_read ? 'font-semibold' : 'text-muted-foreground'}`}>
                                {m.subject || 'No subject'}
                              </p>
                              {!m.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                            </div>
                            <p className="text-muted-foreground truncate">
                              {m.sender ? `${m.sender.first_name} ${m.sender.last_name}` : 'Unknown sender'}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 7. Latest announcements — wired to /api/v1/parent-dashboard/announcements */}
                <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-primary" /> Latest announcements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingAnnouncements ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : announcementsError ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> {announcementsError}
                      </p>
                    ) : announcements.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No announcements yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {announcements.slice(0, 4).map((a) => (
                          <div key={a.id} className="text-xs border-t pt-2 first:border-t-0 first:pt-0">
                            <p className="font-medium truncate">{a.title}</p>
                            <p className="text-muted-foreground truncate">{a.body}</p>
                            <p className="text-muted-foreground">
                              {new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              {a.classes ? ` • ${a.classes.grade_level}${a.classes.stream_name ? ` ${a.classes.stream_name}` : ''}` : ' • Whole school'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 8. Teacher comments — wired to /api/v1/parent-dashboard/learner/:id/comments */}
                <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" /> Teacher comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingComments ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : commentsError ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> {commentsError}
                      </p>
                    ) : teacherComments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No comments yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {teacherComments.slice(0, 4).map((c) => (
                          <div key={c.id} className="text-xs border-t pt-2 first:border-t-0 first:pt-0">
                            <p className="truncate">{c.comment}</p>
                            <p className="text-muted-foreground truncate">
                              {c.teachers ? `${c.teachers.first_name} ${c.teachers.last_name}` : 'Teacher'}
                              {c.learning_areas ? ` • ${c.learning_areas.name}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 9. Today's timetable — wired to /api/v1/parent-dashboard/learner/:id/timetable */}
                <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> Today's timetable
                    </CardTitle>
                    <CardDescription>{DAY_NAMES[todayDayOfWeek()]}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingTimetable ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : timetableError ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> {timetableError}
                      </p>
                    ) : todaysPeriods.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No lessons scheduled for today.</p>
                    ) : (
                      <div className="space-y-2">
                        {todaysPeriods.slice(0, 5).map((p) => (
                          <div key={p.id} className="flex items-start justify-between gap-2 text-xs border-t pt-2 first:border-t-0 first:pt-0">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{p.learning_areas?.name || 'Lesson'}</p>
                              <p className="text-muted-foreground truncate">
                                {p.teachers ? `${p.teachers.first_name} ${p.teachers.last_name}` : ''}
                                {p.room ? ` • ${p.room}` : ''}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {formatTime(p.start_time)}–{formatTime(p.end_time)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 10. School events — wired to /api/v1/parent-dashboard/events */}
                <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <PartyPopper className="h-4 w-4 text-primary" /> School events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingEvents ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : eventsError ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> {eventsError}
                      </p>
                    ) : schoolEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>
                    ) : (
                      <div className="space-y-2">
                        {schoolEvents.slice(0, 4).map((e) => (
                          <div key={e.id} className="flex items-start justify-between gap-2 text-xs border-t pt-2 first:border-t-0 first:pt-0">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{e.title}</p>
                              {e.location && <p className="text-muted-foreground truncate">{e.location}</p>}
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {new Date(e.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
                </div>
              )}

              {/* ── Profile tab ── */}
              {activeTab === 'profile' && selectedChild && (
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Child Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingProfile ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </div>
                ) : profileError ? (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {profileError}
                  </p>
                ) : !childProfile ? (
                  <p className="text-sm text-muted-foreground">No profile data available.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {childProfile.photo_url ? (
                          <img src={childProfile.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Student photo</p>
                        <p className="text-sm font-medium">{childProfile.photo_url ? 'On file' : 'Not uploaded'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <ClipboardList className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Admission number</p>
                        <p className="text-sm font-medium">{childProfile.admission_number}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Grade &amp; class</p>
                        <p className="text-sm font-medium">{childProfile.grade_level || 'Not set'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Stream</p>
                        <p className="text-sm font-medium">{childProfile.stream_name || 'Not set'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Cake className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Date of birth</p>
                        <p className="text-sm font-medium">
                          {childProfile.date_of_birth
                            ? new Date(childProfile.date_of_birth).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                            : 'Not set'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Class teacher</p>
                        <p className="text-sm font-medium">{childProfile.class_teacher?.name || 'Not assigned'}</p>
                        {childProfile.class_teacher?.phone && (
                          <p className="text-xs text-muted-foreground">{childProfile.class_teacher.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 sm:col-span-2">
                      <HeartPulse className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Medical information</p>
                        {!childProfile.medical.conditions && !childProfile.medical.allergies && !childProfile.medical.special_needs ? (
                          <p className="text-sm text-muted-foreground">None on file</p>
                        ) : (
                          <div className="text-sm space-y-0.5">
                            {childProfile.medical.conditions && <p><span className="text-muted-foreground">Conditions:</span> {childProfile.medical.conditions}</p>}
                            {childProfile.medical.allergies && <p><span className="text-muted-foreground">Allergies:</span> {childProfile.medical.allergies}</p>}
                            {childProfile.medical.special_needs && <p><span className="text-muted-foreground">Special needs:</span> {childProfile.medical.special_needs}</p>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 sm:col-span-2">
                      <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="w-full">
                        <p className="text-xs text-muted-foreground mb-1">Emergency contacts</p>
                        {childProfile.emergency_contacts.length === 0 ? (
                          <p className="text-sm text-muted-foreground">None on file</p>
                        ) : (
                          <div className="space-y-1.5">
                            {childProfile.emergency_contacts.map((c, i) => (
                              <div key={i} className="flex flex-wrap items-center gap-x-2 text-sm">
                                <span className="font-medium">{c.name || 'Unnamed contact'}</span>
                                {c.relationship && <span className="text-muted-foreground capitalize">({c.relationship})</span>}
                                {c.is_primary && <Badge variant="outline" className="text-xs">Primary</Badge>}
                                {c.phone && <span className="text-muted-foreground">{c.phone}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
              )}

              {/* ── Academics tab — marks, report cards, performance trends ── */}
              {activeTab === 'academics' && selectedChild && (
                <div className="space-y-5">
            <MarksPanel
              fetchResults={(filters) => getLearnerResults(selectedChildId, filters)}
              reloadKey={selectedChildId}
              emptyMessage={`No marks have been recorded for ${selectedChild.first_name} yet.`}
            />
            <ReportCards
              fetchResults={(filters) => getLearnerResults(selectedChildId, filters)}
              reloadKey={selectedChildId}
              child={selectedChild}
              emptyMessage={`No report cards are available for ${selectedChild.first_name} yet.`}
            />
                  <div>
                    <h3 className="text-base font-semibold mb-3">Performance Trends</h3>
                    <PerformanceTrends
                      learnerId={selectedChildId}
                      reloadKey={selectedChildId}
                      emptyMessage={`Not enough exam history yet to show trends for ${selectedChild.first_name}.`}
                    />
                  </div>
                </div>
              )}

              {/* ── Attendance tab ── */}
              {activeTab === 'attendance' && selectedChild && (
            <Attendance
              learnerId={selectedChildId}
              reloadKey={selectedChildId}
              emptyMessage={`No attendance records yet this term for ${selectedChild.first_name}.`}
            />
              )}

              {/* ── Assignments tab ── */}
              {activeTab === 'assignments' && selectedChild && (
            <Assignments
              learnerId={selectedChildId}
              reloadKey={selectedChildId}
              emptyMessage={`No assignments have been posted for ${selectedChild.first_name} yet.`}
            />
              )}

              {/* ── Timetable tab ── */}
              {activeTab === 'timetable' && selectedChild && (
            <Timetable
              learnerId={selectedChildId}
              reloadKey={selectedChildId}
              emptyMessage={`No timetable set up yet for ${selectedChild.first_name}.`}
            />
              )}

              {/* ── Messages tab ── */}
              {activeTab === 'messages' && selectedChild && user?.id && (
            <Messages
              learnerId={selectedChildId}
              currentUserId={user.id}
              reloadKey={selectedChildId}
            />
              )}

              {/* ── Announcements tab — school-wide, not child-specific ── */}
              {activeTab === 'announcements' && (
                <Announcements />
              )}

              {/* ── Calendar tab — school-wide, exams sub-tab is per-child ── */}
              {activeTab === 'calendar' && (
                <SchoolCalendar learnerId={selectedChildId} reloadKey={selectedChildId} />
              )}

              {/* ── Settings tab — account-level, not child-specific ── */}
              {activeTab === 'settings' && (
                <Settings />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ParentPortal;
