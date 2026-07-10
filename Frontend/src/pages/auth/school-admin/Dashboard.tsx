import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SchoolSetupWizard from '@/components/SchoolSetupWizard';
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  School,
  UserCheck,
  CalendarDays,
  Building2,
  Plus,
  TrendingUp,
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
  type?: 'enrollment' | 'assessment' | 'staff' | 'general';
}

interface DashboardStats {
  totalStudents: number;
  activeStaff: number;
  activeClasses: number;
  pendingAssessments: number;
  totalParents?: number;
  attendanceRate?: number;
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
  advanced: '#8b5cf6',
  proficient: '#3b82f6',
  basic: '#f59e0b',
  below_basic: '#ef4444',
};

const ASSESSMENT_LABELS: Record<string, string> = {
  exceeding_expectation: 'Exceeding',
  meeting_expectation: 'Meeting',
  approaching_expectation: 'Approaching',
  below_expectation: 'Below',
  advanced: 'Advanced',
  proficient: 'Proficient',
  basic: 'Basic',
  below_basic: 'Below Basic',
};

const DEFAULT_STATS: DashboardStats = {
  totalStudents: 0,
  activeStaff: 0,
  activeClasses: 0,
  pendingAssessments: 0,
  totalParents: 0,
  attendanceRate: 0,
};

// Returns "Good Morning" / "Good Afternoon" / "Good Evening" / "Good Night"
// based on the visitor's local device time.
const getTimeBasedGreeting = (date: Date = new Date()): string => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
};

const DashboardWidgets = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [enrollmentByGrade, setEnrollmentByGrade] = useState<EnrollmentByGrade[]>([]);
  const [assessmentDistribution, setAssessmentDistribution] = useState<AssessmentDist[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [greeting, setGreeting] = useState<string>(getTimeBasedGreeting());

  // Keep the greeting current if the dashboard is left open across a
  // morning/afternoon/evening boundary (checks once a minute).
  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getTimeBasedGreeting());
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    if (!supabase) {
      setLoading(false);
      setError('Supabase is not configured. Missing environment variables.');
      return;
    }

    if (!user?.schoolId) {
      // No school set up yet — this is handled by the setup wizard render below,
      // not treated as an error state.
      setLoading(false);
      setError(null);
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // 1. Fetch enrollment data with better error handling
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("learner_enrollments")
        .select(`
          learner_id,
          class_id,
          classes!inner (
            id,
            grade_level,
            stream_name
          )
        `)
        .eq("school_id", user.schoolId)
        .eq("status", "enrolled");

      if (enrollmentsError) {
        console.error('Enrollments fetch error:', enrollmentsError);
        // If RLS error, try fallback query
        if (enrollmentsError.code === '42501') {
          // Try without the join if RLS is causing issues
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("learner_enrollments")
            .select("learner_id, class_id")
            .eq("school_id", user.schoolId)
            .eq("status", "enrolled");

          if (fallbackError) throw fallbackError;
          
          // If we have fallback data, fetch classes separately
          if (fallbackData && fallbackData.length > 0) {
            const classIds = [...new Set(fallbackData.map(e => e.class_id).filter(Boolean))];
            let classMap: Record<string, any> = {};
            
            if (classIds.length > 0) {
              const { data: classesData } = await supabase
                .from("classes")
                .select("id, grade_level, stream_name")
                .in("id", classIds);
              
              if (classesData) {
                classMap = classesData.reduce((acc: Record<string, any>, cls) => {
                  acc[cls.id] = cls;
                  return acc;
                }, {});
              }
            }

            // Reconstruct the data structure
            const reconstructedData = fallbackData.map((enrollment: any) => ({
              ...enrollment,
              classes: classMap[enrollment.class_id] || null
            }));

            processEnrollmentData(reconstructedData);
          } else {
            setEnrollmentByGrade(GRADE_LEVELS.map(grade => ({ grade, students: 0 })));
          }
        } else {
          throw enrollmentsError;
        }
      } else {
        processEnrollmentData(enrollmentsData || []);
      }

      // 2. Fetch active teachers count
      const { count: teacherCount, error: teacherError } = await supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', user.schoolId)
        .eq('is_active', true);

      if (teacherError) {
        console.error('Teacher count error:', teacherError);
      }

      // 3. Fetch school stats with fallback
      let schoolStats: any = { active_classes: 0, recent_assessments: 0 };
      try {
        const { data: statsData } = await supabase
          .from('school_stats')
          .select('active_classes, recent_assessments, total_parents, attendance_rate')
          .eq('school_id', user.schoolId)
          .maybeSingle();
        
        if (statsData) {
          schoolStats = statsData;
        }
      } catch (statsError) {
        console.error('School stats fetch error:', statsError);
        // Use default values if school_stats doesn't exist
        const { count: classCount } = await supabase
          .from('classes')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', user.schoolId)
          .eq('is_active', true);
        
        schoolStats.active_classes = classCount || 0;
      }

      // Update stats
      setStats(prev => ({
        ...prev,
        totalStudents: countUniqueLearners(enrollmentsData || []),
        activeStaff: teacherCount ?? 0,
        activeClasses: schoolStats.active_classes ?? 0,
        pendingAssessments: schoolStats.recent_assessments ?? 0,
        totalParents: schoolStats.total_parents ?? 0,
        attendanceRate: schoolStats.attendance_rate ?? 0,
      }));

      // 4. Fetch assessment distribution
      try {
        const { data: assessData } = await supabase
          .from('assessments')
          .select('performance_level')
          .eq('school_id', user.schoolId)
          .limit(1000); // Add limit to prevent large queries

        if (assessData && assessData.length > 0) {
          const levelCount: Record<string, number> = {};
          assessData.forEach((a) => {
            const level = a.performance_level || 'not_assessed';
            levelCount[level] = (levelCount[level] || 0) + 1;
          });
          setAssessmentDistribution(
            Object.entries(levelCount)
              .filter(([key]) => key !== 'not_assessed')
              .map(([key, value]) => ({
                name: ASSESSMENT_LABELS[key] || key.replace(/_/g, ' '),
                value,
                color: ASSESSMENT_COLORS[key] || '#94a3b8',
              }))
          );
        } else {
          setAssessmentDistribution([]);
        }
      } catch (assessmentError) {
        console.error('Assessment fetch error:', assessmentError);
        setAssessmentDistribution([]);
      }

      // 5. Fetch recent activities with fallback
      try {
        const { data: activitiesData } = await supabase
          .from('school_activities')
          .select('id, action, description, created_at, metadata')
          .eq('school_id', user.schoolId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (activitiesData && activitiesData.length > 0) {
          setRecentActivities(
            activitiesData.map((a) => ({
              id: a.id,
              action: a.action || 'Activity',
              details: a.description || a.metadata?.details || 'School activity',
              time: a.created_at ? new Date(a.created_at).toLocaleString() : 'Recently',
              type: a.metadata?.type || 'general',
            }))
          );
        } else {
          // Fallback: show recent enrollments as activities
          const { data: recentEnrollments } = await supabase
            .from('learner_enrollments')
            .select('created_at, learner_id')
            .eq('school_id', user.schoolId)
            .order('created_at', { ascending: false })
            .limit(5);

          if (recentEnrollments && recentEnrollments.length > 0) {
            setRecentActivities(
              recentEnrollments.map((e) => ({
                id: e.learner_id,
                action: 'New Enrollment',
                details: `Student enrolled in school`,
                time: e.created_at ? new Date(e.created_at).toLocaleString() : 'Recently',
                type: 'enrollment',
              }))
            );
          } else {
            setRecentActivities([]);
          }
        }
      } catch (activityError) {
        console.error('Activities fetch error:', activityError);
        setRecentActivities([]);
      }

      setLastUpdated(new Date());

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load dashboard data. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('42P17')) {
          errorMessage = 'Database configuration issue detected. Please contact system administrator. (Error: RLS policy recursion)';
        } else if (err.message.includes('permission denied')) {
          errorMessage = 'You do not have sufficient permissions to view this data. Please contact your school administrator.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.schoolId]);

  // Helper function to process enrollment data
  const processEnrollmentData = (data: any[]) => {
    const gradeCountMap: Record<string, number> = {};
    let learnerCount = 0;

    data.forEach((row: any) => {
      const grade = row.classes?.grade_level;
      if (grade) {
        const shortGrade = GRADE_LEVEL_MAP[grade] || grade;
        gradeCountMap[shortGrade] = (gradeCountMap[shortGrade] || 0) + 1;
        learnerCount++;
      }
    });

    // If no grades were found, try to get from classes table directly
    if (learnerCount === 0 && data.length > 0) {
      // Try alternative approach - get unique class_ids and query classes
      const classIds = [...new Set(data.map(e => e.class_id).filter(Boolean))];
      if (classIds.length > 0) {
        supabase
          .from("classes")
          .select("id, grade_level")
          .in("id", classIds)
          .then(({ data: classData }) => {
            if (classData) {
              const classMap = classData.reduce((acc, cls) => {
                acc[cls.id] = cls;
                return acc;
              }, {} as Record<string, any>);
              
              data.forEach((row: any) => {
                const cls = classMap[row.class_id];
                if (cls) {
                  const grade = cls.grade_level;
                  const shortGrade = GRADE_LEVEL_MAP[grade] || grade;
                  gradeCountMap[shortGrade] = (gradeCountMap[shortGrade] || 0) + 1;
                }
              });
            }
          });
      }
    }

    setEnrollmentByGrade(
      GRADE_LEVELS.map((grade) => ({
        grade,
        students: gradeCountMap[grade] || 0,
      }))
    );
  };

  // Helper function to count unique learners
  const countUniqueLearners = (data: any[]) => {
    const uniqueIds = new Set(data.map((item) => item.learner_id));
    return uniqueIds.size;
  };

  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Unable to Load Dashboard</h3>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <div className="mt-6 space-y-2">
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            {error.includes('RLS') && (
              <p className="text-xs text-muted-foreground mt-2">
                Please contact your system administrator to resolve database permissions.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No school associated with this account yet — walk them through setup
  // instead of showing an error state.
  if (!user?.schoolId) {
    return (
      <div className="p-2 sm:p-4 md:p-6 space-y-6">
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
    <div className="min-h-screen bg-background">
      <div className="p-2 sm:p-4 md:p-6 space-y-6">
        {/* Header with welcome message, refresh, and quick add */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {greeting}{user?.firstName ? `, ${user.firstName}` : ''}!
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here's what's happening at your school today.
            </p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/school-admin/learners/add">
                <Plus className="w-4 h-4 mr-2" />
                Add Learner
              </Link>
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            subtitle="Active learners"
            icon={GraduationCap}
            iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <StatCard
            title="Active Staff"
            value={stats.activeStaff}
            subtitle="Teachers"
            icon={Users}
            iconClassName="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          />
          <StatCard
            title="Active Classes"
            value={stats.activeClasses}
            subtitle="Current term"
            icon={BookOpen}
            iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          />
          <StatCard
            title="Pending Assessments"
            value={stats.pendingAssessments}
            subtitle="Awaiting review"
            icon={ClipboardCheck}
            iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          />
        </div>

        {/* Additional Stats (optional) */}
        {(stats.totalParents ?? 0) > 0 || (stats.attendanceRate ?? 0) > 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {stats.totalParents && stats.totalParents > 0 && (
              <StatCard
                title="Total Parents"
                value={stats.totalParents}
                subtitle="Registered parents/guardians"
                icon={UserCheck}
                iconClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
              />
            )}
            {stats.attendanceRate && stats.attendanceRate > 0 && (
              <StatCard
                title="Attendance Rate"
                value={`${Math.round(stats.attendanceRate * 100)}%`}
                subtitle="Average attendance"
                icon={CalendarDays}
                iconClassName="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
              />
            )}
          </div>
        ) : null}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/school-admin/teachers?add=1">
                <Plus className="w-4 h-4 mr-2" />
                Add New Teacher
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/school-admin/learners/add">
                <Plus className="w-4 h-4 mr-2" />
                Enroll New Learner
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/school-admin/reports">
                <TrendingUp className="w-4 h-4 mr-2" />
                Generate Reports
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Enrollment by Grade */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <School className="w-5 h-5" />
                Student Enrollment by Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrollmentByGrade.some((d) => d.students > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={enrollmentByGrade} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="grade" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="students" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <School className="w-12 h-12 mb-2 opacity-20" />
                  <p>No enrollment data available</p>
                  <p className="text-sm">Start by enrolling students in classes</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assessment Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Assessment Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {assessmentDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={assessmentDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => 
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {assessmentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {assessmentDistribution.map((item) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.name} ({item.value})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <ClipboardCheck className="w-12 h-12 mb-2 opacity-20" />
                  <p>No assessment data available</p>
                  <p className="text-sm">Assessments will appear here once recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{activity.action}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {activity.details}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
                  <CalendarDays className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No recent activity yet</p>
                <p className="text-sm text-muted-foreground">
                  Activities will appear here as you interact with the system
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardWidgets;
