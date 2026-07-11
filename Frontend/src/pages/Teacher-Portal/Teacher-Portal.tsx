import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Calendar, User, ChevronDown, ChevronUp, Users, UserRound, ClipboardCheck, MessageSquare, Megaphone, Settings as SettingsIcon, UsersRound, BarChart3, FileText, LogOut, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ClassSelectSkeleton, StudentRowsSkeleton, DetailRowsSkeleton } from './components/skeletons';
import MarkAttendance from './components/MarkAttendance';
import DashboardHome from './components/DashboardHome';
import Gradebook from './components/Gradebook';
import Assignments from './components/Assignments';
import Timetable from './components/Timetable';
import LessonPlanner from './components/LessonPlanner';
import StudentProfileDialog from './components/StudentProfileDialog';
import Attendance from './components/Attendance';
import StudentProfiles from './components/StudentProfiles';
import StudentPerformance from './components/StudentPerformance';
import Messages from './components/Messages';
import Announcements from './components/Announcements';
import ReportsTab from './components/Reports';
import SettingsTab from './components/Settings';
import {
  getMyProfile,
  getMyClasses,
  getMyClassStudents,
  type MyTeacherProfile,
  type MyClassAssignment,
  type MyClassStudent,
} from '@/lib/api/teacherApi';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

interface ClassOption {
  id: string;
  name: string;
  students: number;
}

const formatClassName = (cls: MyClassAssignment['class']) => {
  if (!cls) return 'Unknown Class';
  return `Grade ${cls.grade_level}${cls.stream_name ? cls.stream_name : ''}`;
};

const getPerformanceIndicator = (performance: number | null): { label: string; className: string } => {
  if (performance === null) return { label: 'No data', className: 'bg-muted text-muted-foreground' };
  if (performance >= 80) return { label: 'Excellent', className: 'bg-green-100 text-green-700' };
  if (performance >= 70) return { label: 'Good', className: 'bg-blue-100 text-blue-700' };
  if (performance >= 50) return { label: 'Average', className: 'bg-amber-100 text-amber-700' };
  return { label: 'Needs Improvement', className: 'bg-red-100 text-red-700' };
};

// Based on the teacher's own device clock, so it always matches their
// local time regardless of which timezone the school or server is in.
const getGreeting = (hour: number) => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const TeacherPortal = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Drives the "Good morning/afternoon/evening" greeting below. Re-checked
  // every minute so it flips over live if the portal is left open, without
  // re-rendering the whole page every second.
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const id = setInterval(() => setCurrentHour(new Date().getHours()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Real teacher profile (sidebar) — fetched from GET /api/v1/teachers/me
  const [profile, setProfile] = useState<MyTeacherProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Real classes the teacher is assigned to — GET /api/v1/teachers/me/classes
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>("");

  // Real roster + performance + attendance for the selected class
  const [students, setStudents] = useState<MyClassStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Full Student Profile dialog — medical info, discipline, academic
  // history, and comments/teacher notes for one learner at a time.
  const [profileLearnerId, setProfileLearnerId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Attendance marking dialog — only ever opened for a class from the
  // `classes` list above, which is already scoped server-side to classes
  // this teacher is assigned to (GET /api/v1/teachers/me/classes).
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyProfile();
        setProfile(res.data);
      } catch (error) {
        toast({
          title: 'Could not load your profile',
          description: getErrorMessage(error, 'Please refresh and try again.'),
          variant: 'destructive',
        });
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [toast]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyClasses();
        const seen = new Map<string, ClassOption>();
        (res.data.assignments || []).forEach((a) => {
          if (!a.class) return;
          if (!seen.has(a.class.id)) {
            seen.set(a.class.id, {
              id: a.class.id,
              name: formatClassName(a.class),
              students: a.class.learner_count,
            });
          }
        });
        const list = Array.from(seen.values());
        setClasses(list);
        if (list.length > 0) setSelectedClass(list[0].id);
      } catch (error) {
        toast({
          title: 'Could not load your classes',
          description: getErrorMessage(error, 'Please refresh and try again.'),
          variant: 'destructive',
        });
      } finally {
        setClassesLoading(false);
      }
    })();
  }, [toast]);

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }
    setStudentsLoading(true);
    setExpandedStudent(null);
    (async () => {
      try {
        const res = await getMyClassStudents(selectedClass);
        setStudents(res.data.students || []);
      } catch (error) {
        toast({
          title: 'Could not load students',
          description: getErrorMessage(error, 'Please refresh and try again.'),
          variant: 'destructive',
        });
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    })();
  }, [selectedClass, toast]);

  const toggleStudentDetails = (studentId: string) => {
    setExpandedStudent((prev) => (prev === studentId ? null : studentId));
  };

  const selectedClassInfo = classes.find((c) => c.id === selectedClass);

  const handleAddAssessment = (student: MyClassStudent) => {
    const [first_name, ...rest] = student.name.trim().split(' ');
    navigate('/teacher/marks-entry', {
      state: {
        prefillLearner: {
          id: student.learner_id,
          first_name: first_name || student.name,
          last_name: rest.join(' '),
          admission_number: student.admission_number,
          class_id: selectedClass,
          classes: selectedClassInfo ? { grade_level: selectedClassInfo.name, stream_name: null } : null,
        },
      },
    });
  };


  const navItems: { value: string; label: string; icon: React.ElementType }[] = [
    { value: 'dashboard', label: 'Dashboard', icon: Calendar },
    { value: 'classes', label: 'My Classes', icon: Users },
    { value: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { value: 'gradebook', label: 'Gradebook', icon: BarChart3 },
    { value: 'assignments', label: 'Assignments', icon: BookOpen },
    { value: 'planner', label: 'Lesson Planner', icon: BookOpen },
    { value: 'schedule', label: 'Timetable', icon: Calendar },
    { value: 'student-profiles', label: 'Student Profiles', icon: UsersRound },
    { value: 'student-performance', label: 'Student Performance', icon: BarChart3 },
    { value: 'resources', label: 'Resources', icon: BookOpen },
    { value: 'messages', label: 'Messages', icon: MessageSquare },
    { value: 'reports', label: 'Reports', icon: FileText },
    { value: 'announcements', label: 'Announcements', icon: Megaphone },
    { value: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
      <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background container mx-auto px-4 py-6">
        {!profileLoading && profile && (
          <div className="mb-5 animate-fade-in-down">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {getGreeting(currentHour)}, <span className="text-primary">{profile.full_name.split(' ')[0]}</span>
            </h1>
            {profile.school_name && (
              <p className="text-muted-foreground text-sm">{profile.school_name}</p>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
          {/* Sidebar */}
          <div className="col-span-1 md:sticky md:top-4 space-y-4 animate-slide-in-left">
            <Card className="overflow-hidden border-0 shadow-md">
              {profileLoading ? (
                <>
                  <div className="bg-muted/60 px-4 pt-5 pb-6 flex flex-col items-center gap-2">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <CardContent className="p-3">
                    <DetailRowsSkeleton />
                  </CardContent>
                </>
              ) : profile ? (
                <>
                  <div className="bg-gradient-to-br from-primary to-primary/70 px-4 pt-5 pb-6 text-center relative">
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-white/70 bg-white/10 flex items-center justify-center shadow-lg">
                      {profile.photo ? (
                        <img src={profile.photo} alt={profile.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <UserRound className="w-8 h-8 text-white/90" />
                      )}
                    </div>
                    <h2 className="text-sm font-semibold mt-2.5 text-white">{profile.full_name}</h2>
                    <p className="text-white/80 text-xs">{profile.designation || 'Teacher'}</p>
                    {profile.employee_number && (
                      <div className="inline-block bg-white/15 text-white text-[11px] px-2.5 py-0.5 rounded-full mt-1.5 backdrop-blur-sm">
                        ID: {profile.employee_number}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 text-xs space-y-1.5">
                    <div className="flex justify-between py-1 border-b border-border/60">
                      <span className="text-muted-foreground">School</span>
                      <span className="font-medium text-right truncate max-w-[60%]">{profile.school_name || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/60">
                      <span className="text-muted-foreground">Experience</span>
                      <span className="font-medium">{profile.experience || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/60">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium truncate max-w-[60%]">{profile.email}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{profile.phone || '—'}</span>
                    </div>
                  </CardContent>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Profile unavailable.</p>
              )}
            </Card>

            {/* Navigation */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-2">
                <nav className="flex flex-col gap-0.5">
                  {navItems.map(({ value, label, icon: Icon }) => {
                    const isActive = activeTab === value;
                    return (
                      <button
                        key={value}
                        onClick={() => setActiveTab(value)}
                        className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-all duration-200 ease-out
                          ${isActive
                            ? 'bg-primary text-primary-foreground shadow-sm font-semibold translate-x-0.5'
                            : 'text-foreground/80 hover:bg-muted hover:translate-x-0.5'}`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110 text-primary'}`} />
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Home / Logout */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-2 space-y-1">
                <button
                  onClick={handleGoHome}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left text-foreground/80 transition-all duration-200 ease-out hover:bg-muted hover:translate-x-0.5"
                >
                  <Home className="h-4 w-4 shrink-0 text-primary" />
                  <span>Back to Website</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left text-destructive transition-all duration-200 ease-out hover:bg-destructive/10 hover:translate-x-0.5"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Log Out</span>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="col-span-1 md:col-span-3 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div key={activeTab} className="animate-fade-in-up">

              {/* Dashboard / Home Tab */}
              <TabsContent value="dashboard" className="space-y-6">
                <DashboardHome
                  onGoToClasses={() => setActiveTab('classes')}
                  onGoToSchedule={() => setActiveTab('schedule')}
                />
              </TabsContent>


              {/* Classes Tab */}
              <TabsContent value="classes" className="space-y-6">
                {/* Class Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>My Classes</CardTitle>
                    <CardDescription>Select a class to view student details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {classesLoading ? (
                      <ClassSelectSkeleton />
                    ) : classes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        You haven't been assigned to any classes yet. Contact your school admin.
                      </p>
                    ) : (
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="w-full md:w-[300px]">
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map(classItem => (
                            <SelectItem key={classItem.id} value={classItem.id}>
                              {classItem.name} ({classItem.students} students)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </CardContent>
                </Card>

                {/* Student List */}
                {selectedClass && (
                  <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div>
                        <CardTitle>{selectedClassInfo?.name || 'Class'} Students</CardTitle>
                        <CardDescription>
                          {studentsLoading ? 'Loading...' : `${students.length} students enrolled in this class`}
                        </CardDescription>
                      </div>
                      <Button onClick={() => setAttendanceDialogOpen(true)} disabled={students.length === 0}>
                        <ClipboardCheck className="mr-2 h-4 w-4" /> Mark Attendance
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {studentsLoading ? (
                        <StudentRowsSkeleton count={5} />
                      ) : students.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                          No students are enrolled in this class yet.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {students.map((student) => (
                            <div key={student.learner_id} className="border rounded-md overflow-hidden">
                              {/* Student summary row */}
                              <div
                                className="p-4 flex justify-between items-center hover:bg-muted/50 cursor-pointer"
                                onClick={() => toggleStudentDetails(student.learner_id)}
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                    {student.photo ? (
                                      <img
                                        src={student.photo}
                                        alt={student.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <UserRound className="w-6 h-6 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{student.name}</h4>
                                    <p className="text-sm text-muted-foreground">ID: {student.admission_number}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {student.parent_contact
                                        ? `Parent: ${student.parent_contact.name || 'Unnamed'}${student.parent_contact.phone ? ` · ${student.parent_contact.phone}` : ''}`
                                        : 'No parent contact on file'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-6">
                                  <div className="text-center">
                                    <div className="text-sm text-muted-foreground">Current Average</div>
                                    <div className={`font-bold ${
                                      student.performance === null ? 'text-muted-foreground' :
                                      student.performance >= 90 ? 'text-green-600' :
                                      student.performance >= 80 ? 'text-blue-600' :
                                      student.performance >= 70 ? 'text-amber-600' : 'text-red-600'
                                    }`}>
                                      {student.performance !== null ? `${student.performance}%` : 'No data'}
                                    </div>
                                    <span className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${getPerformanceIndicator(student.performance).className}`}>
                                      {getPerformanceIndicator(student.performance).label}
                                    </span>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-sm text-muted-foreground">Attendance</div>
                                    <div className="font-bold text-primary">
                                      {student.attendance !== null ? `${student.attendance}%` : 'No data'}
                                    </div>
                                  </div>
                                  <div className="text-center hidden md:block">
                                    <div className="text-sm text-muted-foreground">Exams Recorded</div>
                                    <div className="font-bold">{student.exams_recorded}</div>
                                  </div>
                                  <Button variant="ghost" size="sm">
                                    {expandedStudent === student.learner_id ?
                                      <ChevronUp className="h-4 w-4" /> :
                                      <ChevronDown className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>

                              {/* Always-visible per-student actions */}
                              <div
                                className="px-4 pb-4 flex flex-wrap gap-2 justify-end"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button variant="outline" size="sm" onClick={() => toggleStudentDetails(student.learner_id)}>
                                  View Student
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setProfileLearnerId(student.learner_id);
                                    setProfileDialogOpen(true);
                                  }}
                                >
                                  Full Profile
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleAddAssessment(student)}>
                                  Enter Marks
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!student.parent_contact?.email}
                                  title={student.parent_contact?.email ? undefined : 'No parent email on file'}
                                  onClick={() => {
                                    if (student.parent_contact?.email) {
                                      window.location.href = `mailto:${student.parent_contact.email}`;
                                    }
                                  }}
                                >
                                  Send Message
                                </Button>
                              </div>

                              {/* Expanded student details */}
                              {expandedStudent === student.learner_id && (
                                <div className="p-4 bg-muted/20 border-t">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <h5 className="font-semibold mb-2">Performance Analysis</h5>
                                      <div className="space-y-2">
                                        <div>
                                          <div className="flex justify-between text-sm">
                                            <span>Strengths:</span>
                                            <span className="text-green-600">{student.strengths}</span>
                                          </div>
                                        </div>
                                        <div>
                                          <div className="flex justify-between text-sm">
                                            <span>Areas for Improvement:</span>
                                            <span className="text-amber-600">{student.areas_for_improvement}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <h5 className="font-semibold mb-2">Recent Assessment Scores</h5>
                                      {student.recent_scores.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No exam results recorded yet.</p>
                                      ) : (
                                        <div className="flex justify-between space-x-2">
                                          {student.recent_scores.map((score, index) => (
                                            <div key={index} className="flex-1 text-center">
                                              <div className={`text-sm font-bold ${
                                                score >= 90 ? 'text-green-600' :
                                                score >= 80 ? 'text-blue-600' :
                                                score >= 70 ? 'text-amber-600' : 'text-red-600'
                                              }`}>
                                                {score}%
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {index === student.recent_scores.length - 1 ? 'Latest' : `Test ${index + 1}`}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="justify-between">
                      <Button variant="outline">Download Class List</Button>
                      <Button>Generate Class Report</Button>
                    </CardFooter>
                  </Card>
                )}
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-6">
                <Attendance
                  classes={classes}
                  classesLoading={classesLoading}
                  selectedClass={selectedClass}
                  onSelectClass={setSelectedClass}
                  studentCount={students.length}
                  onMarkAttendance={() => setAttendanceDialogOpen(true)}
                />
              </TabsContent>

              {/* Student Profiles Tab */}
              <TabsContent value="student-profiles" className="space-y-6">
                <StudentProfiles
                  classes={classes}
                  classesLoading={classesLoading}
                  selectedClass={selectedClass}
                  onSelectClass={setSelectedClass}
                  students={students}
                  studentsLoading={studentsLoading}
                  onViewProfile={(learnerId) => {
                    setProfileLearnerId(learnerId);
                    setProfileDialogOpen(true);
                  }}
                />
              </TabsContent>

              {/* Student Performance Tab */}
              <TabsContent value="student-performance" className="space-y-6">
                <StudentPerformance
                  classes={classes}
                  classesLoading={classesLoading}
                  selectedClass={selectedClass}
                  onSelectClass={setSelectedClass}
                  students={students}
                  studentsLoading={studentsLoading}
                />
              </TabsContent>

              {/* Gradebook Tab */}
              <TabsContent value="gradebook" className="space-y-6">
                <Gradebook />
              </TabsContent>

              {/* Assignments Tab */}
              <TabsContent value="assignments" className="space-y-6">
                <Assignments />
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-6">
                <Timetable />
              </TabsContent>

              {/* Lesson Planner Tab */}
              <TabsContent value="planner" className="space-y-6">
                <LessonPlanner />
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <div>
                      <CardTitle>Teaching Resources</CardTitle>
                      <CardDescription>Access and manage your teaching materials</CardDescription>
                    </div>
                    <Button className="mt-4 sm:mt-0" disabled title="Not available yet">Upload New Resource</Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Input placeholder="Search resources..." disabled />
                      <p className="text-sm text-muted-foreground text-center py-10">
                        A shared resource library isn't set up for your school yet. Once your admin enables it,
                        materials you upload will appear here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="space-y-6">
                <Messages />
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="space-y-6">
                <ReportsTab
                  classes={classes}
                  selectedClass={selectedClass}
                  selectedClassName={selectedClassInfo?.name || ''}
                  students={students}
                  onGoToClasses={() => setActiveTab('classes')}
                />
              </TabsContent>

              {/* Announcements Tab */}
              <TabsContent value="announcements" className="space-y-6">
                <Announcements />
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <SettingsTab />
              </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        {selectedClass && (
          <MarkAttendance
            classId={selectedClass}
            className={selectedClassInfo?.name || 'Class'}
            open={attendanceDialogOpen}
            onOpenChange={setAttendanceDialogOpen}
          />
        )}

        <StudentProfileDialog
          learnerId={profileLearnerId}
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
        />
      </div>

  );
};

export default TeacherPortal;
