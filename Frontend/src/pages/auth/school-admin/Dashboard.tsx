import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SchoolSetupWizard from '@/components/SchoolSetupWizard';

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
  created_at?: string;
}

interface ActivityRow {
  id: string | number;
  action?: string;
  name?: string;
  time?: string;
  created_at?: string;
}

const DEFAULT_STATS: SchoolStats = {
  totalTeachers: 0,
  totalLearners: 0,
  totalParents: 0,
  activeClasses: 0,
  recentAssessments: 0,
};

const mapStats = (row: SchoolStatsRow | null): SchoolStats => ({
  totalTeachers: row?.totalTeachers ?? row?.total_teachers ?? 0,
  totalLearners: row?.totalLearners ?? row?.total_learners ?? 0,
  totalParents: row?.totalParents ?? row?.total_parents ?? 0,
  activeClasses: row?.activeClasses ?? row?.active_classes ?? 0,
  recentAssessments: row?.recentAssessments ?? row?.recent_assessments ?? 0,
});

const mapActivities = (rows: ActivityRow[] | null): Activity[] =>
  (rows ?? []).map((activity) => ({
    id: activity.id,
    action: activity.action || 'Activity update',
    name: activity.name || 'School activity',
    time:
      activity.time ||
      (activity.created_at
        ? new Date(activity.created_at).toLocaleString()
        : 'Recently'),
    created_at: activity.created_at,
  }));

export default function SchoolDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SchoolStats>(DEFAULT_STATS);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // If user doesn't have schoolId, show demo data or empty state
      if (!user?.schoolId) {
        // Set default stats for users without school association
        setStats(DEFAULT_STATS);
        setActivities([]);
        setLoading(false);
        return;
      }

      const { data: statsData, error: statsError } = await supabase
        .from('school_stats')
        .select('*')
        .eq('school_id', user.schoolId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        throw statsError;
      }

      const { data: activitiesData, error: activitiesError } = await supabase
        .from('school_activities')
        .select('*')
        .eq('school_id', user.schoolId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesError) {
        throw activitiesError;
      }

      setStats(mapStats((statsData as SchoolStatsRow | null) ?? null));
      setActivities(mapActivities((activitiesData as ActivityRow[] | null) ?? null));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data. Please try again.');
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

  // If user doesn't have schoolId, show setup wizard
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening at your school today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/school-admin/learners/add">
              <Plus className="w-4 h-4 mr-2" />
              Add Learner
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Teachers"
          value={stats.totalTeachers}
          icon={<Users className="w-5 h-5 text-primary" />}
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Total Learners"
          value={stats.totalLearners}
          icon={<GraduationCap className="w-5 h-5 text-primary" />}
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Parents Registered"
          value={stats.totalParents}
          icon={<UserCheck className="w-5 h-5 text-primary" />}
          description={`${stats.totalLearners > 0 ? Math.round((stats.totalParents / stats.totalLearners) * 100) : 0}% of learners`}
        />
        <StatCard
          title="Active Classes"
          value={stats.activeClasses}
          icon={<BookOpen className="w-5 h-5 text-primary" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/school-admin/teachers/add">
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

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest updates from your school</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.name}</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Overview</CardTitle>
          <CardDescription>Assessment completion rates by grade level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'].map((grade) => (
              <div key={grade} className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">{grade}</p>
                <p className="text-2xl font-bold text-foreground mt-1">0%</p>
                <p className="text-xs text-muted-foreground mt-1">completed</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
