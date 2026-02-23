import React from 'react';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  GraduationCap,
  Users,
  ClipboardCheck,
  Wallet,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Calendar
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
  LineChart,
  Line,
} from 'recharts';
import { Badge } from '@/components/ui/badge';

// Mock data for charts
const enrollmentByGrade = [
  { grade: 'PP1', students: 45 },
  { grade: 'PP2', students: 52 },
  { grade: 'G1', students: 48 },
  { grade: 'G2', students: 55 },
  { grade: 'G3', students: 50 },
  { grade: 'G4', students: 47 },
  { grade: 'G5', students: 42 },
  { grade: 'G6', students: 38 },
  { grade: 'G7', students: 35 },
  { grade: 'G8', students: 30 },
  { grade: 'G9', students: 25 },
];

const assessmentDistribution = [
  { name: 'Exceeding', value: 25, color: '#22c55e' },
  { name: 'Meeting', value: 45, color: '#3b82f6' },
  { name: 'Approaching', value: 22, color: '#f59e0b' },
  { name: 'Below', value: 8, color: '#ef4444' },
];

const attendanceTrend = [
  { week: 'W1', attendance: 92 },
  { week: 'W2', attendance: 95 },
  { week: 'W3', attendance: 88 },
  { week: 'W4', attendance: 94 },
  { week: 'W5', attendance: 91 },
  { week: 'W6', attendance: 96 },
  { week: 'W7', attendance: 93 },
  { week: 'W8', attendance: 97 },
];

const feeCollection = [
  { month: 'Jan', collected: 450000, pending: 120000 },
  { month: 'Feb', collected: 520000, pending: 80000 },
  { month: 'Mar', collected: 380000, pending: 150000 },
  { month: 'Apr', collected: 620000, pending: 60000 },
];

const recentActivities = [
  { id: 1, action: 'New student enrolled', details: 'Jane Wanjiku - Grade 4', time: '10 minutes ago', type: 'enrollment' },
  { id: 2, action: 'Fee payment received', details: 'KES 25,000 - John Kamau', time: '25 minutes ago', type: 'payment' },
  { id: 3, action: 'Assessment submitted', details: 'Mathematics - Grade 6', time: '1 hour ago', type: 'assessment' },
  { id: 4, action: 'Staff leave approved', details: 'Mary Njeri - 3 days', time: '2 hours ago', type: 'leave' },
  { id: 5, action: 'New teacher assigned', details: 'Peter Ochieng - Science G7', time: '3 hours ago', type: 'assignment' },
];

const pendingTasks = [
  { id: 1, task: 'Review Term 2 assessments', dueDate: 'Today', priority: 'high' },
  { id: 2, task: 'Approve fee waiver requests (5)', dueDate: 'Tomorrow', priority: 'medium' },
  { id: 3, task: 'Update academic calendar', dueDate: 'This week', priority: 'low' },
  { id: 4, task: 'Staff performance reviews', dueDate: 'Next week', priority: 'medium' },
];

const DashboardWidgets = () => {
  return (
    <div className="min-h-screen">
      
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value="467"
            subtitle="PP1 - Grade 9"
            icon={GraduationCap}
            trend={{ value: 5.2, isPositive: true }}
            iconClassName="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Active Staff"
            value="32"
            subtitle="Teachers & Support"
            icon={Users}
            trend={{ value: 2.1, isPositive: true }}
            iconClassName="bg-green-100 text-green-600"
          />
          <StatCard
            title="Today's Attendance"
            value="94%"
            subtitle="438 present"
            icon={ClipboardCheck}
            trend={{ value: 1.5, isPositive: true }}
            iconClassName="bg-amber-100 text-amber-600"
          />
          <StatCard
            title="Fee Collection"
            value="KES 1.97M"
            subtitle="Term 1 2025"
            icon={Wallet}
            trend={{ value: 12.3, isPositive: true }}
            iconClassName="bg-purple-100 text-purple-600"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Assessments"
            value="23"
            subtitle="Awaiting review"
            icon={BookOpen}
            iconClassName="bg-orange-100 text-orange-600"
          />
          <StatCard
            title="Fee Balance"
            value="KES 410K"
            subtitle="Outstanding this term"
            icon={AlertCircle}
            iconClassName="bg-red-100 text-red-600"
          />
          <StatCard
            title="Upcoming Events"
            value="5"
            subtitle="This month"
            icon={Calendar}
            iconClassName="bg-indigo-100 text-indigo-600"
          />
          <StatCard
            title="Avg. Performance"
            value="Meeting"
            subtitle="CBC competency level"
            icon={TrendingUp}
            iconClassName="bg-teal-100 text-teal-600"
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={enrollmentByGrade}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Assessment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CBC Assessment Distribution</CardTitle>
            </CardHeader>
            <CardContent>
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
              <div className="flex justify-center gap-4 mt-4">
                {assessmentDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Attendance Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="attendance" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Fee Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fee Collection Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={feeCollection}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `KES ${(Number(value) / 1000).toFixed(0)}K`} />
                  <Bar dataKey="collected" fill="#22c55e" name="Collected" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Activity and Tasks Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{task.task}</p>
                      <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                    </div>
                    <Badge 
                      variant={
                        task.priority === 'high' ? 'destructive' : 
                        task.priority === 'medium' ? 'default' : 'secondary'
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardWidgets;
