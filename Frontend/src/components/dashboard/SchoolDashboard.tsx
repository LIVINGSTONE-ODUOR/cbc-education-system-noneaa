import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import StatCard from '@/components/dashboard/StatCard';
import SchoolSetupWizard from '@/components/SchoolSetupWizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap, Users, BookOpen, ClipboardCheck, AlertCircle,
  RefreshCw, School, UserCheck, CalendarDays, Building2,
  Plus, Activity, Target,
  UserPlus, Award, Bell, ChevronRight, Zap, BarChart3,
  Sparkles, TrendingUp, Layers, PieChart as PieChartIcon, LineChart as LineChartIcon
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, Legend, LineChart, Line,
} from 'recharts';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface SchoolStats {
  school_id: string;
  total_learners: number;
  active_learners: number;
  total_teachers: number;
  active_teachers: number;
  total_classes: number;
  average_score: number;
  attendance_rate: number;
  active_term_name: string | null;
  active_academic_year_name?: string;
  school_name?: string;
  school_code?: string;
}

interface ActivityItem {
  id: string;
  school_id: string;
  user_id: string;
  activity_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  first_name?: string;
  last_name?: string;
}

interface GradeDistribution {
  grade_code: string;
  count: number;
  percentage: number;
}

interface ClassPerformance {
  class_id: string;
  grade_level: string;
  stream_name: string | null;
  class_name: string;
  average_score: number;
  learner_count: number;
}

interface AttendanceTrendPoint {
  attendance_date: string;
  present_count: number;
  absent_count: number;
  late_count: number;
  total_count: number;
  attendance_rate: number;
}

interface EnrollmentByGrade {
  grade_level: string;
  students: number;
}

interface GenderDistribution {
  gender: string;
  count: number;
}

interface SubjectPerformance {
  learning_area_id: string;
  subject_name: string;
  average_percentage: number;
  learner_count: number;
}

interface TermTrend {
  academic_term_id: number;
  term_name: string | null;
  start_date: string | null;
  average_score: number;
  learner_count: number;
}

interface LearnerPerformance {
  learner_id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_id: string;
  class_name: string;
  academic_term_id: string;
  average_score: number;
  overall_grade: string;
  class_rank: number;
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const GRADE_COLORS: Record<string, string> = {
  EE: '#10B981', AE: '#3B82F6', ME: '#F59E0B', BE: '#EF4444',
};

const GENDER_COLORS: Record<string, string> = {
  male: '#3B82F6', female: '#EC4899',
};

const GENDER_LABELS: Record<string, string> = {
  male: 'Male', female: 'Female',
};

const GRADE_BG: Record<string, string> = {
  EE: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  AE: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  ME: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  BE: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
};

const ACTIVITY_ICONS: Record<string, { bg: string; icon: typeof Bell }> = {
  learner_added: { bg: 'bg-blue-100 text-blue-600', icon: Users },
  assessment_saved: { bg: 'bg-green-100 text-green-600', icon: ClipboardCheck },
  report_finalized: { bg: 'bg-purple-100 text-purple-600', icon: Award },
  teacher_added: { bg: 'bg-amber-100 text-amber-600', icon: UserCheck },
  attendance_taken: { bg: 'bg-teal-100 text-teal-600', icon: CalendarDays },
  default: { bg: 'bg-slate-100 text-slate-600', icon: Bell },
};

// ═══════════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════════

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

async function apiFetch<T = unknown>(endpoint: string): Promise<T> {
  const token = localStorage.getItem('cbe_access_token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  // Handle 401 — token expired or invalid, redirect to login
  if (res.status === 401) {
    localStorage.removeItem('cbe_access_token');
    localStorage.removeItem('cbe_refresh_token');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Request failed');
  return data.data as T;
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
};

const getActivityConfig = (type: string) => {
  return ACTIVITY_ICONS[type] || ACTIVITY_ICONS.default;
};

const getTimeAgo = (dateStr: string) => {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const formatShortDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const SchoolDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistribution[]>([]);
  const [topPerformers, setTopPerformers] = useState<LearnerPerformance[]>([]);
  const [bubbleLearners, setBubbleLearners] = useState<LearnerPerformance[]>([]);
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendPoint[]>([]);
  const [enrollmentByGrade, setEnrollmentByGrade] = useState<EnrollmentByGrade[]>([]);
  const [genderDistribution, setGenderDistribution] = useState<GenderDistribution[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [termTrend, setTermTrend] = useState<TermTrend[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [greeting, setGreeting] = useState(getGreeting());

  // Keep greeting current
  useEffect(() => {
    const interval = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const schoolId = user.schoolId;

      // Fetch all dashboard data in parallel
      const [statsData, activitiesData, gradeDistData, topData, bottomData, classPerfData, attendanceTrendData, enrollmentData, genderData, subjectPerfData, termTrendData] = await Promise.all([
        apiFetch<SchoolStats>(`/api/v1/dashboard/stats?school_id=${schoolId}`),
        apiFetch<ActivityItem[]>(`/api/v1/dashboard/activities?school_id=${schoolId}&limit=8`).catch(() => []),
        apiFetch<GradeDistribution[]>(`/api/v1/dashboard/analytics/grade-distribution?school_id=${schoolId}`).catch(() => []),
        apiFetch<LearnerPerformance[]>(`/api/v1/dashboard/learner-performance?school_id=${schoolId}&sort=top&limit=3`).catch(() => []),
        apiFetch<LearnerPerformance[]>(`/api/v1/dashboard/learner-performance?school_id=${schoolId}&sort=bottom&limit=3`).catch(() => []),
        apiFetch<ClassPerformance[]>(`/api/v1/dashboard/analytics/class-performance?school_id=${schoolId}`).catch(() => []),
        apiFetch<AttendanceTrendPoint[]>(`/api/v1/dashboard/analytics/attendance-trend?school_id=${schoolId}&days=14`).catch(() => []),
        apiFetch<EnrollmentByGrade[]>(`/api/v1/dashboard/analytics/enrollment-by-grade?school_id=${schoolId}`).catch(() => []),
        apiFetch<GenderDistribution[]>(`/api/v1/dashboard/analytics/gender-distribution?school_id=${schoolId}`).catch(() => []),
        apiFetch<SubjectPerformance[]>(`/api/v1/dashboard/analytics/subject-performance?school_id=${schoolId}`).catch(() => []),
        apiFetch<TermTrend[]>(`/api/v1/dashboard/analytics/term-trend?school_id=${schoolId}`).catch(() => []),
      ]);

      setStats(statsData);
      setActivities(activitiesData);
      setGradeDistribution(gradeDistData);
      setTopPerformers(topData);
      setBubbleLearners(bottomData);
      setClassPerformance(classPerfData);
      setAttendanceTrend(attendanceTrendData);
      setEnrollmentByGrade(enrollmentData);
      setGenderDistribution(genderData);
      setSubjectPerformance(subjectPerfData);
      setTermTrend(termTrendData);
      setLastUpdated(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.schoolId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showRefreshToast = () => {
    toast({
      title: 'Dashboard Updated',
      description: `Data refreshed at ${new Date().toLocaleTimeString()}`,
      duration: 3000,
    });
  };

  const handleRefresh = async () => {
    await fetchData(true);
    showRefreshToast();
  };

  // ── Loading State ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">Loading Dashboard</p>
            <p className="text-sm text-muted-foreground animate-pulse">Fetching your school data...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold">Unable to Load Dashboard</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ── No School Setup State (show wizard) ──────────────────────────
  if (!user?.schoolId) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            Welcome to CBE Education System, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            To get started, you need to set up your school. This will only take a few minutes
            and will give you access to all the features including fees management, payroll,
            teacher and learner management, and much more.
          </p>
        </div>
        <SchoolSetupWizard />
      </div>
    );
  }

  // ── Empty State ──────────────────────────────────────────────────
  // Guard against non-array activities (empty API object `{}`), null/undefined stats
  const noActivities = !Array.isArray(activities) || activities.length === 0;
  const hasNoData = !stats || (
    (stats.total_learners == null || stats.total_learners === 0) &&
    (stats.total_teachers == null || stats.total_teachers === 0) &&
    (stats.total_classes == null || stats.total_classes === 0) &&
    noActivities
  );

  if (hasNoData) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{greeting}, {user?.firstName || 'Admin'}!</h1>
            <p className="text-sm text-muted-foreground">Welcome to the CBC Education System dashboard</p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Welcome to Your Dashboard!</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Your dashboard will come to life as you add learners, teachers, and assessments. Here's how to get started:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl">
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link to="/school-admin/learners/add">
                  <UserPlus className="w-6 h-6" />
                  <span className="text-xs font-normal">Add Learners</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link to="/school-admin/teachers?add=1">
                  <Users className="w-6 h-6" />
                  <span className="text-xs font-normal">Add Teachers</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link to="/school-admin/classes">
                  <School className="w-6 h-6" />
                  <span className="text-xs font-normal">Create Classes</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main Dashboard ───────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {greeting}, {user?.firstName || 'Admin'}!
            </h1>
            {stats?.active_term_name && (
              <Badge variant="secondary" className="text-xs">
                {stats.active_term_name}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Here's your school overview at a glance
            {lastUpdated && <span className="ml-2 text-xs">· Updated {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link to="/school-admin/learners/add">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Learner
            </Link>
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard
            title="Total Learners"
            value={stats?.total_learners ?? 0}
            subtitle={stats?.active_learners ? `${stats.active_learners} active` : 'Enrolled students'}
            icon={GraduationCap}
            iconClassName="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20"
            className="border-l-4 border-l-blue-500"
          />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard
            title="Teachers"
            value={stats?.total_teachers ?? 0}
            subtitle={stats?.active_teachers ? `${stats.active_teachers} active` : 'Teaching staff'}
            icon={Users}
            iconClassName="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20"
            className="border-l-4 border-l-emerald-500"
          />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard
            title="Classes"
            value={stats?.total_classes ?? 0}
            subtitle="Active classes"
            icon={BookOpen}
            iconClassName="bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20"
            className="border-l-4 border-l-amber-500"
          />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard
            title="Avg Score"
            value={stats?.average_score ? `${Number(stats.average_score).toFixed(1)}%` : 'N/A'}
            subtitle="School-wide average"
            icon={Target}
            iconClassName="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/20"
            className="border-l-4 border-l-purple-500"
          />
        </motion.div>
      </motion.div>

      {/* Secondary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
      >
        {stats?.attendance_rate != null && stats.attendance_rate > 0 && (
          <StatCard
            title="Attendance Rate"
            value={`${Number(stats.attendance_rate).toFixed(1)}%`}
            subtitle="Average attendance"
            icon={CalendarDays}
            iconClassName="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20"
          />
        )}
      </motion.div>

      {/* Charts + Activities Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Grade Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Grade Distribution
                </CardTitle>
                {gradeDistribution.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {gradeDistribution.reduce((s, d) => s + d.count, 0)} assessments
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {gradeDistribution.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={gradeDistribution}
                        cx="50%" cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="grade_code"
                      >
                        {gradeDistribution.map((entry) => (
                          <Cell
                            key={entry.grade_code}
                            fill={GRADE_COLORS[entry.grade_code] || '#6B7280'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '13px',
                        }}
                        formatter={(value: number, name: string) => [`${value} learners`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col justify-center gap-2">
                    {gradeDistribution.map((d) => (
                      <div key={d.grade_code} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GRADE_COLORS[d.grade_code] || '#6B7280' }} />
                          <span className="text-sm font-medium">{d.grade_code}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{d.count}</span>
                          <span className="text-xs font-medium text-muted-foreground w-10 text-right">{d.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[240px] text-muted-foreground">
                  <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No assessment data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Recent Activity
                </CardTitle>
                {activities.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{activities.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activities.length > 0 ? (
                <div className="divide-y max-h-[320px] overflow-y-auto">
                  {activities.map((act) => {
                    const cfg = getActivityConfig(act.activity_type);
                    const IconComp = cfg.icon;
                    return (
                      <div key={act.id} className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium capitalize truncate">
                            {act.activity_type?.replace(/_/g, ' ') || 'Activity'}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{act.description}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                          {getTimeAgo(act.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Activity className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No activity yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Class Performance Comparison + Enrollment by Grade */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Class Performance Comparison */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-500" />
                  Class Performance Comparison
                </CardTitle>
                {classPerformance.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {classPerformance.length} classes
                  </Badge>
                )}
              </div>
              <CardDescription>Average score by class this term</CardDescription>
            </CardHeader>
            <CardContent>
              {classPerformance.some((c) => c.learner_count > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={classPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="class_name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-40}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                      formatter={(value: number, name: string, props) => [
                        `${Number(value).toFixed(1)}% avg · ${props.payload.learner_count} learners`,
                        'Performance',
                      ]}
                    />
                    <Bar dataKey="average_score" radius={[6, 6, 0, 0]}>
                      {classPerformance.map((entry) => (
                        <Cell
                          key={entry.class_id}
                          fill={entry.average_score >= 75 ? '#10B981' : entry.average_score >= 50 ? '#3B82F6' : entry.average_score >= 25 ? '#F59E0B' : '#EF4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
                  <Layers className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No finalized report cards yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Enrollment by Grade */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <School className="w-5 h-5 text-blue-500" />
                Enrollment by Grade
              </CardTitle>
              <CardDescription>Active learners per grade level</CardDescription>
            </CardHeader>
            <CardContent>
              {enrollmentByGrade.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={enrollmentByGrade} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <YAxis dataKey="grade_level" type="category" tick={{ fontSize: 12 }} width={64} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                      formatter={(value: number) => [`${value} learners`, 'Enrolled']}
                    />
                    <Bar dataKey="students" fill="#3B82F6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
                  <School className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No enrollment data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Attendance Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-500" />
                Attendance Trend
              </CardTitle>
              <CardDescription className="text-xs">Last 14 days</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {attendanceTrend.some((d) => d.total_count > 0) ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="attendance_date" tickFormatter={formatShortDate} tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    labelFormatter={(label) => formatShortDate(String(label))}
                    formatter={(value: number, name: string, props) => [
                      `${value}% (${props.payload.present_count}/${props.payload.total_count} present)`,
                      'Attendance',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="attendance_rate"
                    stroke="#06B6D4"
                    strokeWidth={2.5}
                    fill="url(#attendanceFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[240px] text-muted-foreground">
                <TrendingUp className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No attendance records in the last 14 days</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Subject-wise Performance + Gender Distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subject-wise Performance */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-500" />
                Subject-wise Performance
              </CardTitle>
              <CardDescription>Average score by learning area, all terms</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectPerformance.some((s) => s.learner_count > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={subjectPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="subject_name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                      formatter={(value: number, name: string, props) => [
                        `${Number(value).toFixed(1)}% avg · ${props.payload.learner_count} learners`,
                        'Score',
                      ]}
                    />
                    <Bar dataKey="average_percentage" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
                  <BookOpen className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No subject assessments recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Gender Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-pink-500" />
                Gender Distribution
              </CardTitle>
              <CardDescription>Active learners</CardDescription>
            </CardHeader>
            <CardContent>
              {genderDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={genderDistribution}
                        cx="50%" cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="gender"
                      >
                        {genderDistribution.map((entry) => (
                          <Cell key={entry.gender} fill={GENDER_COLORS[entry.gender] || '#6B7280'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '13px',
                        }}
                        formatter={(value: number, name: string) => [`${value} learners`, GENDER_LABELS[name] || name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {genderDistribution.map((d) => (
                      <div key={d.gender} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GENDER_COLORS[d.gender] || '#6B7280' }} />
                        <span className="text-xs text-muted-foreground">
                          {GENDER_LABELS[d.gender] || d.gender} ({d.count})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[240px] text-muted-foreground">
                  <PieChartIcon className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No learner data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Term-over-Term Performance Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-emerald-500" />
              Term-over-Term Performance
            </CardTitle>
            <CardDescription>School-wide average score across finalized terms</CardDescription>
          </CardHeader>
          <CardContent>
            {termTrend.filter((t) => t.learner_count > 0).length > 1 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={termTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="term_name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value: number, name: string, props) => [
                      `${Number(value).toFixed(1)}% avg · ${props.payload.learner_count} learners`,
                      'Score',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="average_score"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10B981' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[240px] text-muted-foreground">
                <LineChartIcon className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Need at least two finalized terms to show a trend</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Top & Bubble Performers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-500" />
                  Top Performers
                </CardTitle>
                {topPerformers.length > 0 && (
                  <Link to="/school-admin/grading/analytics" className="text-xs text-primary hover:underline flex items-center gap-1">
                    View all <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {topPerformers.length > 0 ? (
                <div className="space-y-3">
                  {topPerformers.map((learner, i) => (
                    <div key={learner.learner_id} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{learner.first_name} {learner.last_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{learner.class_name} · #{learner.class_rank} in class</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-emerald-600">{Number(learner.average_score).toFixed(1)}%</p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 ${GRADE_BG[learner.overall_grade] || ''}`}>
                          {learner.overall_grade}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Award className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No performance data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Needs Attention / Bubble Learners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-500" />
                  Needs Attention
                </CardTitle>
                {bubbleLearners.length > 0 && (
                  <Link to="/school-admin/grading/analytics" className="text-xs text-primary hover:underline flex items-center gap-1">
                    View all <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {bubbleLearners.length > 0 ? (
                <div className="space-y-3">
                  {bubbleLearners.map((learner, i) => (
                    <div key={learner.learner_id} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-amber-500/20">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{learner.first_name} {learner.last_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{learner.class_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-amber-600">{Number(learner.average_score).toFixed(1)}%</p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 ${GRADE_BG[learner.overall_grade] || ''}`}>
                          {learner.overall_grade}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : topPerformers.length > 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Target className="w-8 h-8 mb-2 opacity-30 text-emerald-500" />
                  <p className="text-sm font-medium text-emerald-600">All learners are performing well!</p>
                  <p className="text-xs text-muted-foreground">No learners need immediate attention</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Target className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No performance data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Frequently used tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <Link to="/school-admin/learners/add"><UserPlus className="w-4 h-4 mr-2 shrink-0" /> Add Learner</Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <Link to="/school-admin/teachers?add=1"><Users className="w-4 h-4 mr-2 shrink-0" /> Add Teacher</Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <Link to="/school-admin/marks-entry"><ClipboardCheck className="w-4 h-4 mr-2 shrink-0" /> Enter Marks</Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <Link to="/school-admin/reports"><BarChart3 className="w-4 h-4 mr-2 shrink-0" /> View Reports</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SchoolDashboard;
