import { useCallback, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  Plus,
  ArrowRight,
  TrendingUp,
  Loader2,
  AlertCircle,
  Building2,
  DollarSign,
  CalendarDays,
  ClipboardCheck,
  UserPlus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Wallet,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import SchoolSetupWizard from '@/components/SchoolSetupWizard';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface SchoolStats {
  totalTeachers: number;
  totalLearners: number;
  totalParents: number;
  activeClasses: number;
  recentAssessments: number;
}

interface SchoolStatsRow {
  totalTeachers?: number;
  total_teachers?: number;
  totalLearners?: number;
  total_learners?: number;
  totalParents?: number;
  total_parents?: number;
  activeClasses?: number;
  active_classes?: number;
  recentAssessments?: number;
  recent_assessments?: number;
}

interface Activity {
  id: string | number;
  action: string;
  name: string;
  time: string;
  type: 'student' | 'teacher' | 'payment' | 'assessment' | 'general';
  created_at?: string;
}

interface ActivityRow {
  id: string | number;
  action?: string;
  name?: string;
  time?: string;
  created_at?: string;
}

interface EnrollmentByGrade {
  grade: string;
  students: number;
}

interface AssessmentLevel {
  name: string;
  value: number;
  color: string;
}

interface ClassCapacity {
  name: string;
  enrolled: number;
  capacity: number;
  fill: string;
}

interface UpcomingEvent {
  id: number;
  date: number;
  month: string;
  title: string;
  time: string;
  type: 'exam' | 'meeting' | 'holiday' | 'event';
}

interface SubjectPerformance {
  subject: string;
  exceeding: number;
  meeting: number;
  approaching: number;
  below: number;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const GRADE_LEVELS = ['PP1', 'PP2', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9'];

const GRADE_LEVEL_MAP: Record<string, string> = {
  'PP1': 'PP1', 'PP2': 'PP2',
  'Grade 1': 'G1', 'Grade 2': 'G2', 'Grade 3': 'G3',
  'Grade 4': 'G4', 'Grade 5': 'G5', 'Grade 6': 'G6',
  'Grade 7': 'G7', 'Grade 8': 'G8', 'Grade 9': 'G9',
};

const ASSESSMENT_COLORS: Record<string, string> = {
  exceeding_expectation: '#22c55e',
  meeting_expectation: '#3b82f6',
  approaching_expectation: '#f59e0b',
  below_expectation: '#ef4444',
};

const ASSESSMENT_LABELS: Record<string, string> = {
  exceeding_expectation: 'Exceeding',
  meeting_expectation: 'Meeting',
  approaching_expectation: 'Approaching',
  below_expectation: 'Below',
};

const DEFAULT_STATS: SchoolStats = {
  totalTeachers: 0,
  totalLearners: 0,
  totalParents: 0,
  activeClasses: 0,
  recentAssessments: 0,
};

const FALLBACK_ENROLLMENT: EnrollmentByGrade[] = [
  { grade: 'PP1', students: 42 }, { grade: 'PP2', students: 38 },
  { grade: 'G1', students: 45 }, { grade: 'G2', students: 40 },
  { grade: 'G3', students: 36 }, { grade: 'G4', students: 44 },
  { grade: 'G5', students: 39 }, { grade: 'G6', students: 35 },
  { grade: 'G7', students: 30 }, { grade: 'G8', students: 28 },
  { grade: 'G9', students: 25 },
];

const FALLBACK_ASSESSMENTS: AssessmentLevel[] = [
  { name: 'Exceeding', value: 25, color: '#22c55e' },
  { name: 'Meeting', value: 45, color: '#3b82f6' },
  { name: 'Approaching', value: 22, color: '#f59e0b' },
  { name: 'Below', value: 8, color: '#ef4444' },
];

const FALLBACK_CLASSES: ClassCapacity[] = [
  { name: 'PP1', enrolled: 42, capacity: 45, fill: '#22c55e' },
  { name: 'PP2', enrolled: 38, capacity: 40, fill: '#22c55e' },
  { name: 'Grade 1', enrolled: 45, capacity: 45, fill: '#ef4444' },
  { name: 'Grade 2', enrolled: 40, capacity: 45, fill: '#f59e0b' },
  { name: 'Grade 3', enrolled: 36, capacity: 45, fill: '#22c55e' },
  { name: 'Grade 4', enrolled: 44, capacity: 45, fill: '#f59e0b' },
  { name: 'Grade 5', enrolled: 39, capacity: 45, fill: '#22c55e' },
  { name: 'Grade 6', enrolled: 35, capacity: 40, fill: '#22c55e' },
];

const FALLBACK_ACTIVITIES: Activity[] = [
  { id: 1, action: 'New learner enrolled', name: 'Grace Njeri — Grade 4', time: '5 minutes ago', type: 'student' },
  { id: 2, action: 'Fee payment received', name: 'KES 15,000 — John Kamau', time: '30 minutes ago', type: 'payment' },
  { id: 3, action: 'Assessment completed', name: 'Mathematics — Grade 5', time: '1 hour ago', type: 'assessment' },
  { id: 4, action: 'Teacher attendance marked', name: 'Mr. Ochieng — Present', time: '2 hours ago', type: 'teacher' },
  { id: 5, action: 'New learner enrolled', name: 'Brian Mwangi — Grade 7', time: '3 hours ago', type: 'student' },
  { id: 6, action: 'Report generated', name: 'Term 1 Progress Report', time: '4 hours ago', type: 'general' },
];

const FALLBACK_EVENTS: UpcomingEvent[] = [
  { id: 1, date: 20, month: 'JUN', title: 'Mid-Term Examinations', time: '8:00 AM – 12:00 PM', type: 'exam' },
  { id: 2, date: 25, month: 'JUN', title: 'Parent-Teacher Meeting', time: '9:00 AM – 2:00 PM', type: 'meeting' },
  { id: 3, date: 28, month: 'JUN', title: 'Sports Day', time: '8:00 AM – 4:00 PM', type: 'event' },
  { id: 4, date: 1, month: 'JUL', title: 'Term 2 Begins', time: 'All Day', type: 'holiday' },
];

const FALLBACK_SUBJECT_PERF: SubjectPerformance[] = [
  { subject: 'Maths', exceeding: 30, meeting: 40, approaching: 20, below: 10 },
  { subject: 'English', exceeding: 25, meeting: 45, approaching: 22, below: 8 },
  { subject: 'Kiswahili', exceeding: 20, meeting: 50, approaching: 20, below: 10 },
  { subject: 'Science', exceeding: 35, meeting: 35, approaching: 20, below: 10 },
  { subject: 'Social St.', exceeding: 15, meeting: 45, approaching: 25, below: 15 },
  { subject: 'CRE', exceeding: 28, meeting: 42, approaching: 18, below: 12 },
];

// Fee hardcoded data
const FEE_DATA = {
  totalExpected: 2_380_000,
  totalCollected: 1_970_000,
  outstanding: 410_000,
  defaulters: 4,
  collectionRate: 83,
};

// Attendance hardcoded data
const ATTENDANCE_DATA = {
  studentPresent: 92,
  studentAbsent: 31,
  studentTotal: 402,
  teacherPresent: 18,
  teacherOnLeave: 2,
  teacherTotal: 20,
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const mapStats = (row: SchoolStatsRow | null): SchoolStats => ({
  totalTeachers: row?.totalTeachers ?? row?.total_teachers ?? 0,
  totalLearners: row?.totalLearners ?? row?.total_learners ?? 0,
  totalParents: row?.totalParents ?? row?.total_parents ?? 0,
  activeClasses: row?.activeClasses ?? row?.active_classes ?? 0,
  recentAssessments: row?.recentAssessments ?? row?.recent_assessments ?? 0,
});

const inferActivityType = (action: string): Activity['type'] => {
  const lower = action.toLowerCase();
  if (lower.includes('learner') || lower.includes('student') || lower.includes('enroll')) return 'student';
  if (lower.includes('teacher') || lower.includes('staff')) return 'teacher';
  if (lower.includes('fee') || lower.includes('payment')) return 'payment';
  if (lower.includes('assessment') || lower.includes('exam')) return 'assessment';
  return 'general';
};

const mapActivities = (rows: ActivityRow[] | null): Activity[] =>
  (rows ?? []).map((activity) => ({
    id: activity.id,
    action: activity.action || 'Activity update',
    name: activity.name || 'School activity',
    time: activity.time || (activity.created_at ? new Date(activity.created_at).toLocaleString() : 'Recently'),
    type: inferActivityType(activity.action || ''),
    created_at: activity.created_at,
  }));

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'student': return <GraduationCap className="w-4 h-4 text-blue-600" />;
    case 'teacher': return <Users className="w-4 h-4 text-green-600" />;
    case 'payment': return <DollarSign className="w-4 h-4 text-emerald-600" />;
    case 'assessment': return <ClipboardCheck className="w-4 h-4 text-purple-600" />;
    default: return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

const getEventColor = (type: UpcomingEvent['type']) => {
  switch (type) {
    case 'exam': return 'bg-red-100 text-red-700';
    case 'meeting': return 'bg-blue-100 text-blue-700';
    case 'holiday': return 'bg-green-100 text-green-700';
    default: return 'bg-amber-100 text-amber-700';
  }
};

const getCapacityColor = (enrolled: number, capacity: number): string => {
  const rate = capacity > 0 ? (enrolled / capacity) * 100 : 0;
  if (rate >= 95) return '#ef4444';
  if (rate >= 80) return '#f59e0b';
  return '#22c55e';
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function SchoolDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SchoolStats>(DEFAULT_STATS);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentByGrade[]>([]);
  const [assessmentDist, setAssessmentDist] = useState<AssessmentLevel[]>([]);
  const [classCapacity, setClassCapacity] = useState<ClassCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.schoolId || !supabase) {
        setStats(DEFAULT_STATS);
        setActivities(FALLBACK_ACTIVITIES);
        setEnrollmentData(FALLBACK_ENROLLMENT);
        setAssessmentDist(FALLBACK_ASSESSMENTS);
        setClassCapacity(FALLBACK_CLASSES);
        setLoading(false);
        return;
      }

      // Fetch school stats
      const { data: statsData, error: statsError } = await supabase
        .from('school_stats')
        .select('*')
        .eq('school_id', user.schoolId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        throw statsError;
      }

      const mappedStats = mapStats((statsData as SchoolStatsRow | null) ?? null);
      setStats(mappedStats);

      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('school_activities')
        .select('*')
        .eq('school_id', user.schoolId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;
      const mappedActivities = mapActivities((activitiesData as ActivityRow[] | null) ?? null);
      setActivities(mappedActivities.length > 0 ? mappedActivities : FALLBACK_ACTIVITIES);

      // Fetch enrollment by grade
      const { data: learnersData } = await supabase
        .from('learners')
        .select('grade_level')
        .eq('school_id', user.schoolId)
        .eq('is_active', true);

      if (learnersData && learnersData.length > 0) {
        const gradeCountMap: Record<string, number> = {};
        learnersData.forEach((l: { grade_level: string }) => {
          const shortGrade = GRADE_LEVEL_MAP[l.grade_level] || l.grade_level;
          gradeCountMap[shortGrade] = (gradeCountMap[shortGrade] || 0) + 1;
        });
        setEnrollmentData(GRADE_LEVELS.map((grade) => ({ grade, students: gradeCountMap[grade] || 0 })));
      } else {
        setEnrollmentData(FALLBACK_ENROLLMENT);
      }

      // Fetch assessment distribution
      const { data: assessData } = await supabase
        .from('assessments')
        .select('performance_level')
        .eq('school_id', user.schoolId);

      if (assessData && assessData.length > 0) {
        const levelCount: Record<string, number> = {};
        assessData.forEach((a: { performance_level: string }) => {
          levelCount[a.performance_level] = (levelCount[a.performance_level] || 0) + 1;
        });
        setAssessmentDist(
          Object.entries(levelCount).map(([key, value]) => ({
            name: ASSESSMENT_LABELS[key] || key,
            value,
            color: ASSESSMENT_COLORS[key] || '#94a3b8',
          }))
        );
      } else {
        setAssessmentDist(FALLBACK_ASSESSMENTS);
      }

      // Fetch class capacity data
      const { data: classesData } = await supabase
        .from('classes')
        .select('grade_level, stream_name, learner_count, capacity, is_active')
        .eq('school_id', user.schoolId)
        .eq('is_active', true);

      if (classesData && classesData.length > 0) {
        setClassCapacity(
          classesData.map((c: { grade_level: string; stream_name: string | null; learner_count: number; capacity: number | null }) => {
            const enrolled = c.learner_count || 0;
            const cap = c.capacity || 45;
            return {
              name: c.stream_name ? `${c.grade_level} ${c.stream_name}` : c.grade_level,
              enrolled,
              capacity: cap,
              fill: getCapacityColor(enrolled, cap),
            };
          })
        );
      } else {
        setClassCapacity(FALLBACK_CLASSES);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  // Use real stats or fallback for display
  const displayStats = useMemo(() => ({
    totalLearners: stats.totalLearners || 402,
    totalTeachers: stats.totalTeachers || 20,
    totalParents: stats.totalParents || 315,
    activeClasses: stats.activeClasses || 12,
    recentAssessments: stats.recentAssessments || 8,
  }), [stats]);

  const studentAttendanceRate = Math.round(
    (ATTENDANCE_DATA.studentPresent / Math.max(ATTENDANCE_DATA.studentTotal, 1)) * 100
  );
  const teacherAttendanceRate = Math.round(
    (ATTENDANCE_DATA.teacherPresent / Math.max(ATTENDANCE_DATA.teacherTotal, 1)) * 100
  );

  // Current date info
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
          <p className="mt-4 text-red-600">{error}</p>
          <Button onClick={fetchDashboardData} className="mt-4">Try Again</Button>
        </div>
      </div>
    );
  }

  if (!user?.schoolId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome to CBE Education System, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            To get started, you need to set up your school. This will only take a few minutes
            and will give you access to all the features including fees management, payroll,
            teacher and learner management, and much more.
          </p>
        </div>
        <SchoolSetupWizard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── 1. Welcome Banner ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">{dateStr}</p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-white/20 rounded-full px-3 py-1">
                  <CalendarDays className="w-3.5 h-3.5" /> Term 1, 2025
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-white/20 rounded-full px-3 py-1">
                  <Clock className="w-3.5 h-3.5" /> 42 days remaining
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" asChild>
                <Link to="/school-admin/learners/add">
                  <Plus className="w-4 h-4 mr-1" /> Add Learner
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
                <Link to="/school-admin/reports">
                  <BarChart3 className="w-4 h-4 mr-1" /> Reports
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Key Metrics (6 cards) ──────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { title: 'Total Learners', value: displayStats.totalLearners, icon: GraduationCap, iconBg: 'bg-blue-100 text-blue-600', trend: { value: 5, isPositive: true } },
          { title: 'Total Teachers', value: displayStats.totalTeachers, icon: Users, iconBg: 'bg-green-100 text-green-600', trend: { value: 2, isPositive: true } },
          { title: 'Active Classes', value: displayStats.activeClasses, icon: BookOpen, iconBg: 'bg-amber-100 text-amber-600' },
          { title: 'Fee Collection', value: `${FEE_DATA.collectionRate}%`, icon: DollarSign, iconBg: 'bg-emerald-100 text-emerald-600' },
          { title: "Today's Attendance", value: `${studentAttendanceRate}%`, icon: UserCheck, iconBg: 'bg-purple-100 text-purple-600' },
          { title: 'Pending Assessments', value: displayStats.recentAssessments, icon: ClipboardCheck, iconBg: 'bg-rose-100 text-rose-600' },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="overflow-hidden">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground truncate">{metric.title}</p>
                    <p className="text-lg sm:text-2xl font-bold mt-1">{metric.value}</p>
                    {metric.trend && (
                      <p className="text-xs text-green-600 mt-0.5">
                        +{metric.trend.value}% this term
                      </p>
                    )}
                  </div>
                  <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0 ${metric.iconBg}`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── 3 & 4. Enrollment Chart + Assessment Distribution ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment by Grade */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Student Enrollment by Grade
            </CardTitle>
            <CardDescription>Distribution across PP1 – Grade 9</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={enrollmentData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: number) => [value, 'Students']}
                />
                <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CBE Assessment Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-purple-600" />
              CBE Assessment Distribution
            </CardTitle>
            <CardDescription>Competency levels across all learners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={assessmentDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {assessmentDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value} learners`, name]} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 5 & 6. Fee Collection + Attendance ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Collection Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              Fee Collection Summary
            </CardTitle>
            <CardDescription>Term 1, 2025 collection status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Collection Rate</span>
              <span className="text-sm font-bold text-emerald-600">{FEE_DATA.collectionRate}%</span>
            </div>
            <Progress value={FEE_DATA.collectionRate} className="h-3" />
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3">
                <p className="text-xs text-muted-foreground">Collected</p>
                <p className="text-lg font-bold text-emerald-600">KES {(FEE_DATA.totalCollected / 1_000_000).toFixed(2)}M</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-lg font-bold text-amber-600">KES {(FEE_DATA.outstanding / 1_000).toFixed(0)}K</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-muted-foreground">{FEE_DATA.defaulters} fee defaulters</span>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/school-admin/fee-management">
                  View details <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-600" />
              Today&apos;s Attendance
            </CardTitle>
            <CardDescription>Student and teacher attendance snapshot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Student attendance */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Students</span>
                <span className="text-sm font-bold text-purple-600">{studentAttendanceRate}%</span>
              </div>
              <Progress value={studentAttendanceRate} className="h-2" />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" /> {ATTENDANCE_DATA.studentPresent} present
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-500" /> {ATTENDANCE_DATA.studentAbsent} absent
                </span>
              </div>
            </div>

            {/* Teacher attendance */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Teachers</span>
                <span className="text-sm font-bold text-green-600">{teacherAttendanceRate}%</span>
              </div>
              <Progress value={teacherAttendanceRate} className="h-2" />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" /> {ATTENDANCE_DATA.teacherPresent} present
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" /> {ATTENDANCE_DATA.teacherOnLeave} on leave
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 7. Classes Capacity Utilization ────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Class Capacity Utilization
              </CardTitle>
              <CardDescription>Enrolled learners vs available capacity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/school-admin/classes">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={classCapacity} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(value: number, name: string) => [value, name === 'enrolled' ? 'Enrolled' : 'Capacity']}
              />
              <Bar dataKey="enrolled" fill="#3b82f6" radius={[0, 4, 4, 0]} name="enrolled" />
              <Bar dataKey="capacity" fill="#e5e7eb" radius={[0, 4, 4, 0]} name="capacity" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> &lt;80% — Healthy</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> 80-95% — Near Full</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> &gt;95% — Over Capacity</span>
          </div>
        </CardContent>
      </Card>

      {/* ─── 11. Performance by Subject ─────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Performance by Subject
          </CardTitle>
          <CardDescription>CBE competency levels across learning areas</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={FALLBACK_SUBJECT_PERF} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="exceeding" stackId="a" fill="#22c55e" name="Exceeding" />
              <Bar dataKey="meeting" stackId="a" fill="#3b82f6" name="Meeting" />
              <Bar dataKey="approaching" stackId="a" fill="#f59e0b" name="Approaching" />
              <Bar dataKey="below" stackId="a" fill="#ef4444" name="Below" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ─── 8 & 9. Activity Feed + Upcoming Events ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm">View all <ArrowRight className="w-3 h-3 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 py-3 border-b last:border-0">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Upcoming Events
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/school-admin/calendar">View all <ArrowRight className="w-3 h-3 ml-1" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {FALLBACK_EVENTS.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg flex-shrink-0 ${getEventColor(event.type)}`}>
                    <span className="text-lg font-bold leading-none">{event.date}</span>
                    <span className="text-[10px] font-semibold uppercase">{event.month}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 10. Quick Actions ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Add Learner', icon: UserPlus, href: '/school-admin/learners/add', color: 'bg-blue-100 text-blue-600' },
              { label: 'Add Teacher', icon: Users, href: '/school-admin/teachers/add', color: 'bg-green-100 text-green-600' },
              { label: 'Record Payment', icon: DollarSign, href: '/school-admin/fee-management', color: 'bg-emerald-100 text-emerald-600' },
              { label: 'Assessments', icon: ClipboardCheck, href: '/school-admin/assessments', color: 'bg-purple-100 text-purple-600' },
              { label: 'Reports', icon: FileText, href: '/school-admin/reports', color: 'bg-amber-100 text-amber-600' },
              { label: 'Classes', icon: BookOpen, href: '/school-admin/classes', color: 'bg-indigo-100 text-indigo-600' },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:shadow-md hover:-translate-y-0.5 transition-all text-center group"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
