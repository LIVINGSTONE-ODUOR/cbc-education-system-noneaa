import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardCheck,
  AlertCircle,
  Loader2,
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
} from 'recharts';

interface EnrollmentByGrade {
  grade: string;
  students: number;
}

interface AssessmentDist {
  name: string;
  value: number;
  color: string;
}

interface Activity {
  id: string | number;
  action: string;
  details: string;
  time: string;
}

interface DashboardStats {
  totalStudents: number;
  activeStaff: number;
  activeClasses: number;
  pendingAssessments: number;
}

const GRADE_LEVELS = ['PP1', 'PP2', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9'];

const GRADE_LEVEL_MAP: Record<string, string> = {
  'PP1': 'PP1',
  'PP2': 'PP2',
  'Grade 1': 'G1',
  'Grade 2': 'G2',
  'Grade 3': 'G3',
  'Grade 4': 'G4',
  'Grade 5': 'G5',
  'Grade 6': 'G6',
  'Grade 7': 'G7',
  'Grade 8': 'G8',
  'Grade 9': 'G9',
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

const DEFAULT_STATS: DashboardStats = {
  totalStudents: 0,
  activeStaff: 0,
  activeClasses: 0,
  pendingAssessments: 0,
};

const DashboardWidgets = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [enrollmentByGrade, setEnrollmentByGrade] = useState<EnrollmentByGrade[]>([]);
  const [assessmentDistribution, setAssessmentDistribution] = useState<AssessmentDist[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setError('Supabase is not configured. Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
      return;
    }

    if (!user?.schoolId) {
      setLoading(false);
      return;
    }


    try {
      setLoading(true);
      setError(null);

      // Fetch active learners for total count and grade breakdown
      const { data: learnersData, error: learnersError } = await supabase
        .from('learners')
        .select('grade_level')
        .eq('school_id', user.schoolId)
        .eq('is_active', true);

      if (learnersError) throw learnersError;

      // Build enrollment by grade from real data
      const gradeCountMap: Record<string, number> = {};
      (learnersData || []).forEach((l) => {
        const shortGrade = GRADE_LEVEL_MAP[l.grade_level] || l.grade_level;
        gradeCountMap[shortGrade] = (gradeCountMap[shortGrade] || 0) + 1;
      });
      setEnrollmentByGrade(
        GRADE_LEVELS.map((grade) => ({ grade, students: gradeCountMap[grade] || 0 }))
      );

      // Fetch active teachers count
      const { count: teacherCount, error: teacherError } = await supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', user.schoolId)
        .eq('is_active', true);

      if (teacherError) throw teacherError;

      // Fetch aggregated school stats (active_classes, recent_assessments)
      const { data: schoolStats } = await supabase
        .from('school_stats')
        .select('active_classes, recent_assessments')
        .eq('school_id', user.schoolId)
        .maybeSingle();

      setStats({
        totalStudents: learnersData?.length ?? 0,
        activeStaff: teacherCount ?? 0,
        activeClasses: schoolStats?.active_classes ?? 0,
        pendingAssessments: schoolStats?.recent_assessments ?? 0,
      });

      // Fetch assessment distribution (if assessments table exists)
      const { data: assessData } = await supabase
        .from('assessments')
        .select('performance_level')
        .eq('school_id', user.schoolId);

      if (assessData && assessData.length > 0) {
        const levelCount: Record<string, number> = {};
        assessData.forEach((a) => {
          levelCount[a.performance_level] = (levelCount[a.performance_level] || 0) + 1;
        });
        setAssessmentDistribution(
          Object.entries(levelCount).map(([key, value]) => ({
            name: ASSESSMENT_LABELS[key] || key,
            value,
            color: ASSESSMENT_COLORS[key] || '#94a3b8',
          }))
        );
      } else {
        setAssessmentDistribution([]);
      }

      // Fetch recent activities
      const { data: activitiesData } = await supabase
        .from('school_activities')
        .select('id, action, name, time, created_at')
        .eq('school_id', user.schoolId)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentActivities(
        (activitiesData || []).map((a) => ({
          id: a.id,
          action: a.action || 'Activity update',
          details: a.name || 'School activity',
          time:
            a.time ||
            (a.created_at ? new Date(a.created_at).toLocaleString() : 'Recently'),
        }))
      );
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

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
          <Button onClick={fetchDashboardData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-2 sm:p-4 md:p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            subtitle="Active learners"
            icon={GraduationCap}
            iconClassName="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Active Staff"
            value={stats.activeStaff}
            subtitle="Teachers"
            icon={Users}
            iconClassName="bg-green-100 text-green-600"
          />
          <StatCard
            title="Active Classes"
            value={stats.activeClasses}
            subtitle="Current term"
            icon={BookOpen}
            iconClassName="bg-amber-100 text-amber-600"
          />
          <StatCard
            title="Pending Assessments"
            value={stats.pendingAssessments}
            subtitle="Awaiting review"
            icon={ClipboardCheck}
            iconClassName="bg-purple-100 text-purple-600"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Enrollment by Grade */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Enrollment by Grade</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollmentByGrade.some((d) => d.students > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={enrollmentByGrade}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No enrollment data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assessment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CBE Assessment Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {assessmentDistribution.length > 0 ? (
                <>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={assessmentDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {assessmentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-4">
                    {assessmentDistribution.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs sm:text-sm text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No assessment data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity yet. Start by adding teachers and learners to your school.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardWidgets;
