import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Calendar,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Megaphone,
  Bell,
  Users,
  BookOpen,
  Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMyDashboard, type MyDashboard } from '@/lib/api/teacherApi';
import { DashboardSkeleton } from './skeletons';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const formatExamDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

interface DashboardHomeProps {
  onGoToClasses: () => void;
  onGoToSchedule: () => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onGoToClasses, onGoToSchedule }) => {
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<MyDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyDashboard();
        setDashboard(res.data);
      } catch (error) {
        toast({
          title: 'Could not load your dashboard',
          description: getErrorMessage(error, 'Please refresh and try again.'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!dashboard) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        Dashboard unavailable. Please refresh.
      </p>
    );
  }

  const { classes_count, students_count, todays_lessons, attendance, upcoming_exams } = dashboard;

  const attendanceOk = attendance.classes_pending === 0;

  const stats = [
    { label: 'My Classes', value: classes_count, icon: BookOpen, ring: 'from-blue-500/15 to-blue-500/5', iconColor: 'text-blue-600' },
    { label: 'Students', value: students_count, icon: Users, ring: 'from-violet-500/15 to-violet-500/5', iconColor: 'text-violet-600' },
    { label: 'Lessons Today', value: todays_lessons.length, icon: Clock, ring: 'from-cyan-500/15 to-cyan-500/5', iconColor: 'text-cyan-600' },
    {
      label: 'Pending Attendance',
      value: attendance.classes_pending,
      icon: ClipboardCheck,
      ring: attendanceOk ? 'from-emerald-500/15 to-emerald-500/5' : 'from-amber-500/15 to-amber-500/5',
      iconColor: attendanceOk ? 'text-emerald-600' : 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Quick statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, ring, iconColor }) => (
          <Card
            key={label}
            className="border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <CardContent className="p-4 text-center">
              <div className={`w-9 h-9 mx-auto rounded-xl bg-gradient-to-br ${ring} flex items-center justify-center mb-2`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
              <div className="text-xl font-bold tracking-tight">{value}</div>
              <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's lessons */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5 text-cyan-600" />
              </span>
              Today's Lessons
            </CardTitle>
            <CardDescription className="text-xs">
              {todays_lessons.length === 0 ? 'Nothing scheduled today' : `${todays_lessons.length} lesson(s) today`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todays_lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No lessons scheduled for today.</p>
            ) : (
              <div className="space-y-1.5">
                {todays_lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between text-sm border-l-2 border-cyan-500/60 bg-muted/40 rounded-md p-2 transition-colors duration-200 hover:bg-muted"
                  >
                    <div>
                      <div className="font-medium">
                        {lesson.class ? `Grade ${lesson.class.grade_level}${lesson.class.stream_name || ''}` : '—'}
                        {' · '}{lesson.learning_area?.name || '—'}
                      </div>
                      <div className="text-muted-foreground text-xs">{lesson.room ? `Room ${lesson.room}` : 'No room set'}</div>
                    </div>
                    <div className="text-muted-foreground text-xs whitespace-nowrap">
                      {lesson.start_time} - {lesson.end_time}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="ml-auto transition-transform duration-200 hover:scale-105" onClick={onGoToSchedule}>
              View Full Schedule
            </Button>
          </CardFooter>
        </Card>

        {/* Attendance to mark */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${attendanceOk ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                <ClipboardCheck className={`h-3.5 w-3.5 ${attendanceOk ? 'text-emerald-600' : 'text-amber-600'}`} />
              </span>
              Attendance
            </CardTitle>
            <CardDescription className="text-xs">Teachers do this every morning.</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceOk ? (
              <p className="text-sm text-emerald-600 font-medium py-4 text-center">
                All your classes are marked for today. Nice work!
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {attendance.classes_pending} of your class{attendance.classes_pending === 1 ? '' : 'es'} still need
                {attendance.classes_pending === 1 ? 's' : ''} attendance marked today
                {attendance.students_pending > 0 ? ` (${attendance.students_pending} students).` : '.'}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button size="sm" className="ml-auto transition-transform duration-200 hover:scale-105" onClick={onGoToClasses}>
              Go Mark Attendance
            </Button>
          </CardFooter>
        </Card>

        {/* Upcoming exams */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <GraduationCap className="h-3.5 w-3.5 text-violet-600" />
              </span>
              Upcoming Exams
            </CardTitle>
            <CardDescription className="text-xs">For your classes and school-wide exams</CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming_exams.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming exams scheduled.</p>
            ) : (
              <div className="space-y-1.5">
                {upcoming_exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between text-sm border-l-2 border-violet-500/60 bg-muted/40 rounded-md p-2 transition-colors duration-200 hover:bg-muted"
                  >
                    <div>
                      <div className="font-medium">{exam.exam_name}</div>
                      <div className="text-muted-foreground text-xs">
                        {exam.exam_type}
                        {exam.class ? ` · Grade ${exam.class.grade_level}${exam.class.stream_name || ''}` : ' · Whole school'}
                      </div>
                    </div>
                    <div className="text-muted-foreground text-xs whitespace-nowrap">{formatExamDate(exam.start_date)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Not-yet-available modules, shown honestly rather than faked */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
              </span>
              Assignments &amp; Announcements
            </CardTitle>
            <CardDescription className="text-xs">Coming soon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-md p-2">
              <FileText className="h-4 w-4 shrink-0" /> Assignments waiting for grading — not set up for your school yet.
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-md p-2">
              <Megaphone className="h-4 w-4 shrink-0" /> Recent announcements — not set up for your school yet.
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-md p-2">
              <Bell className="h-4 w-4 shrink-0" /> Notifications from the principal — not set up for your school yet.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
