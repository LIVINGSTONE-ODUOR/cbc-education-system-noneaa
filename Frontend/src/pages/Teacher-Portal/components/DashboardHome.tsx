import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Calendar,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Loader2,
  Megaphone,
  Bell,
  Users,
  BookOpen,
  Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMyDashboard, type MyDashboard } from '@/lib/api/teacherApi';

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
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        Dashboard unavailable. Please refresh.
      </p>
    );
  }

  const { classes_count, students_count, todays_lessons, attendance, upcoming_exams } = dashboard;

  return (
    <div className="space-y-6">
      {/* Quick statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-5 w-5 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">{classes_count}</div>
            <div className="text-xs text-muted-foreground">My Classes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-5 w-5 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">{students_count}</div>
            <div className="text-xs text-muted-foreground">Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-5 w-5 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">{todays_lessons.length}</div>
            <div className="text-xs text-muted-foreground">Lessons Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <ClipboardCheck className={`h-5 w-5 mx-auto mb-2 ${attendance.classes_pending > 0 ? 'text-amber-500' : 'text-green-600'}`} />
            <div className="text-2xl font-bold">{attendance.classes_pending}</div>
            <div className="text-xs text-muted-foreground">Classes Pending Attendance</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's lessons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Today's Lessons
            </CardTitle>
            <CardDescription>
              {todays_lessons.length === 0 ? 'Nothing scheduled today' : `${todays_lessons.length} lesson(s) today`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todays_lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No lessons scheduled for today.</p>
            ) : (
              <div className="space-y-2">
                {todays_lessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between text-sm border rounded-md p-2">
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
            <Button variant="outline" size="sm" className="ml-auto" onClick={onGoToSchedule}>
              View Full Schedule
            </Button>
          </CardFooter>
        </Card>

        {/* Attendance to mark */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" /> Attendance
            </CardTitle>
            <CardDescription>Teachers do this every morning.</CardDescription>
          </CardHeader>
          <CardContent>
            {attendance.classes_pending === 0 ? (
              <p className="text-sm text-green-600 py-4 text-center">
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
            <Button size="sm" className="ml-auto" onClick={onGoToClasses}>
              Go Mark Attendance
            </Button>
          </CardFooter>
        </Card>

        {/* Upcoming exams */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" /> Upcoming Exams
            </CardTitle>
            <CardDescription>For your classes and school-wide exams</CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming_exams.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming exams scheduled.</p>
            ) : (
              <div className="space-y-2">
                {upcoming_exams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between text-sm border rounded-md p-2">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" /> Assignments &amp; Announcements
            </CardTitle>
            <CardDescription>Coming soon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" /> Assignments waiting for grading — not set up for your school yet.
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Megaphone className="h-4 w-4" /> Recent announcements — not set up for your school yet.
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-4 w-4" /> Notifications from the principal — not set up for your school yet.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
