import React, { useState, useMemo, useCallback, memo } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  UserCheck,
  AlertCircle,
  Calendar,
  Download,
  Filter,
  Search,
  Clock,
  Target,
  Award,
  ChevronRight,
  Eye,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  GraduationCap,
  BookOpen,
  PieChart,
  Activity,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock4,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  Minus,
} from "lucide-react";

// Types
interface BasePerson {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
}

interface Staff extends BasePerson {
  role: string;
  department: "teaching" | "administration" | "support" | "management";
  employeeId: string;
  joiningDate: string;
  qualifications: string[];
  subjects?: string[];
  classTeacher?: string;
}

interface NonStaff extends BasePerson {
  type: "visitor" | "contractor" | "vendor" | "parent" | "other";
  organization?: string;
  purpose?: string;
  validUntil?: string;
  accessLevel: "limited" | "full" | "restricted";
}

interface AttendanceRecord {
  id: string;
  personId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: "present" | "absent" | "late" | "half-day" | "on-leave" | "holiday";
  duration?: number;
  notes?: string;
  markedBy: string;
}

interface PerformanceMetric {
  id: string;
  personId: string;
  period: "daily" | "weekly" | "monthly" | "term" | "yearly";
  startDate: string;
  endDate: string;
  
  // CBC Specific Metrics
  cbcMetrics: {
    lessonDelivery: number; // 0-100
    learnerEngagement: number;
    competencyAssessment: number;
    projectsGuided: number;
    remedialClasses: number;
    parentEngagement: number;
    peerCoaching: number;
    professionalDevelopment: number;
  };
  
  // Non-Staff Metrics
  nonStaffMetrics?: {
    tasksCompleted: number;
    tasksAssigned: number;
    qualityScore: number;
    timeliness: number;
    feedbackScore: number;
  };
  
  overallScore: number;
  trend: "up" | "down" | "stable";
  strengths: string[];
  improvements: string[];
}

interface GradeLevel {
  grade: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  streams: string[];
  learnerCount: number;
  classTeachers: string[];
}

// Props
interface PerformanceDashboardProps {
  staffList?: Staff[];
  nonStaffList?: NonStaff[];
  attendanceData?: AttendanceRecord[];
  performanceData?: PerformanceMetric[];
  gradeLevels?: GradeLevel[];
  schoolId: string;
  term: string;
  year: number;
}

// Constants
const DEPARTMENTS = [
  { id: "teaching", label: "Teaching Staff", icon: BookOpen, color: "#3B82F6" },
  { id: "administration", label: "Administration", icon: Users, color: "#8B5CF6" },
  { id: "support", label: "Support Staff", icon: Clock, color: "#EC4899" },
  { id: "management", label: "Management", icon: TrendingUp, color: "#F59E0B" },
] as const;

const NON_STAFF_TYPES = [
  { id: "visitor", label: "Visitors", color: "#10B981" },
  { id: "contractor", label: "Contractors", color: "#6366F1" },
  { id: "vendor", label: "Vendors", color: "#F43F5E" },
  { id: "parent", label: "Parents", color: "#8B5CF6" },
] as const;

const ATTENDANCE_STATUS = {
  present: { label: "Present", color: "#10B981", bg: "#D1FAE5", icon: CheckCircle2 },
  absent: { label: "Absent", color: "#EF4444", bg: "#FEE2E2", icon: XCircle },
  late: { label: "Late", color: "#F59E0B", bg: "#FEF3C7", icon: Clock4 },
  "half-day": { label: "Half Day", color: "#8B5CF6", bg: "#EDE9FE", icon: Minus },
  "on-leave": { label: "On Leave", color: "#6B7280", bg: "#F3F4F6", icon: Calendar },
  holiday: { label: "Holiday", color: "#9CA3AF", bg: "#F9FAFB", icon: Sparkles },
} as const;

// Performance optimized dashboard component
export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  staffList = mockStaff,
  nonStaffList = mockNonStaff,
  attendanceData = mockAttendance,
  performanceData = mockPerformance,
  gradeLevels = mockGrades,
  schoolId,
  term,
  year,
}) => {
  const [activeTab, setActiveTab] = useState<"staff" | "non-staff" | "overview">("overview");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "term">("term");
  const [selectedGrade, setSelectedGrade] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Memoized calculations for performance
  const stats = useMemo(() => {
    const totalStaff = staffList.length;
    const totalNonStaff = nonStaffList.length;
    
    const presentToday = attendanceData.filter(a => 
      a.date === new Date().toISOString().split('T')[0] && 
      a.status === 'present'
    ).length;
    
    const avgAttendance = Math.round(
      attendanceData.reduce((acc, curr) => {
        const duration = curr.duration || 0;
        return acc + (duration > 0 ? 1 : 0);
      }, 0) / (attendanceData.length || 1) * 100
    );
    
    const avgPerformance = Math.round(
      performanceData.reduce((acc, curr) => acc + curr.overallScore, 0) / 
      (performanceData.length || 1)
    );
    
    const performanceTrend = performanceData.filter(p => p.trend === 'up').length >
      performanceData.filter(p => p.trend === 'down').length ? 'up' : 'down';
    
    return {
      totalStaff,
      totalNonStaff,
      presentToday,
      avgAttendance,
      avgPerformance,
      performanceTrend,
      activeUsers: totalStaff + totalNonStaff,
    };
  }, [staffList, nonStaffList, attendanceData, performanceData]);

  // Memoized filtered data
  const filteredStaff = useMemo(() => {
    return staffList.filter(staff => 
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [staffList, searchQuery]);

  const filteredNonStaff = useMemo(() => {
    return nonStaffList.filter(nonStaff =>
      nonStaff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nonStaff.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nonStaff.organization?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [nonStaffList, searchQuery]);

  // Handlers
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Export logic here
      console.log("Exporting data...");
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with gradient */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Performance & Attendance Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  CBC Grade 1-9 · Term {term} · {year} · School ID: {schoolId}
                </p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export Report
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Active Users"
              value={stats.activeUsers}
              change="+12"
              icon={Users}
              color="blue"
              trend="up"
            />
            <StatCard
              title="Present Today"
              value={stats.presentToday}
              change={`${Math.round((stats.presentToday / stats.activeUsers) * 100)}%`}
              icon={UserCheck}
              color="green"
              trend="up"
            />
            <StatCard
              title="Avg Attendance"
              value={`${stats.avgAttendance}%`}
              change="+2.5%"
              icon={Calendar}
              color="purple"
              trend="up"
            />
            <StatCard
              title="Avg Performance"
              value={`${stats.avgPerformance}%`}
              change={stats.performanceTrend === 'up' ? '+5.2%' : '-2.1%'}
              icon={Target}
              color="orange"
              trend={stats.performanceTrend}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs & Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              {[
                { id: "overview", label: "Overview", icon: PieChart },
                { id: "staff", label: "Staff", icon: Users },
                { id: "non-staff", label: "Non-Staff", icon: UserPlus },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all
                      ${activeTab === tab.id
                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Grade Filter */}
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Grades</option>
                {gradeLevels.map(grade => (
                  <option key={grade.grade} value={grade.grade}>
                    Grade {grade.grade} ({grade.learnerCount} learners)
                  </option>
                ))}
              </select>

              {/* Date Range Filter */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="term">This Term</option>
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <OverviewSection
              staff={staffList}
              nonStaff={nonStaffList}
              attendance={attendanceData}
              performance={performanceData}
              grades={gradeLevels}
            />
          )}

          {activeTab === "staff" && (
            <StaffSection
              staff={filteredStaff}
              performance={performanceData}
              attendance={attendanceData}
            />
          )}

          {activeTab === "non-staff" && (
            <NonStaffSection
              nonStaff={filteredNonStaff}
              performance={performanceData}
              attendance={attendanceData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Optimized Stat Card Component
const StatCard = memo(({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color,
  trend 
}: { 
  title: string;
  value: string | number;
  change: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange';
  trend: 'up' | 'down' | 'stable';
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  };

  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    stable: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-sm font-medium ${trendColors[trend]}`}>
          {change}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    </div>
  );
});

StatCard.displayName = 'StatCard';

// Overview Section Component
const OverviewSection: React.FC<{
  staff: Staff[];
  nonStaff: NonStaff[];
  attendance: AttendanceRecord[];
  performance: PerformanceMetric[];
  grades: GradeLevel[];
}> = ({ staff, nonStaff, attendance, performance, grades }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* CBC Performance Metrics */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            CBC Performance Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries({
              'Lesson Delivery': 92,
              'Learner Engagement': 88,
              'Competency Assessment': 85,
              'Projects Guided': 78,
              'Parent Engagement': 82,
              'Professional Dev': 90,
            }).map(([key, value]) => (
              <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{key}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{value}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Level Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Grade Level Performance
          </h3>
          <div className="space-y-4">
            {grades.map(grade => (
              <div key={grade.grade} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Grade {grade.grade}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    {grade.streams.length} streams · {grade.learnerCount} learners
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {Math.floor(Math.random() * 15 + 80)}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Avg Score
                    </div>
                  </div>
                  <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Summary & Alerts */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Today's Attendance
          </h3>
          <div className="space-y-3">
            {Object.entries(ATTENDANCE_STATUS).map(([key, { label, color, bg, icon: Icon }]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2`} style={{ backgroundColor: color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {Math.floor(Math.random() * 20)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total Present</span>
              <span className="font-bold text-gray-900 dark:text-white">78/98</span>
            </div>
            <div className="mt-2 w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '79.6%' }} />
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
            Alerts & Notifications
          </h3>
          <div className="space-y-3">
            {[
              { type: 'warning', message: '3 staff members below 80% attendance', time: '2h ago' },
              { type: 'info', message: 'Grade 5 parent-teacher meeting tomorrow', time: '5h ago' },
              { type: 'success', message: 'Performance reports ready for review', time: '1d ago' },
            ].map((alert, idx) => (
              <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-start">
                  <div className={`w-2 h-2 rounded-full mt-1.5 mr-2 ${
                    alert.type === 'warning' ? 'bg-orange-500' :
                    alert.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{alert.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Staff Section Component
const StaffSection: React.FC<{
  staff: Staff[];
  performance: PerformanceMetric[];
  attendance: AttendanceRecord[];
}> = ({ staff, performance, attendance }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Staff Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Attendance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Performance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {staff.map((member) => (
              <StaffRow key={member.id} staff={member} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Staff Row Component
const StaffRow = memo(({ staff }: { staff: Staff }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <tr 
      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {staff.avatar ? (
              <img className="h-10 w-10 rounded-full" src={staff.avatar} alt="" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {staff.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {staff.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {staff.role} · {staff.employeeId}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {staff.department}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">95%</span>
          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: '95%' }} />
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">92%</span>
          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '92%' }} />
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Present
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <button className={`text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          View Details
        </button>
      </td>
    </tr>
  );
});

StaffRow.displayName = 'StaffRow';

// Non-Staff Section Component
const NonStaffSection: React.FC<{
  nonStaff: NonStaff[];
  performance: PerformanceMetric[];
  attendance: AttendanceRecord[];
}> = ({ nonStaff, performance, attendance }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Person
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Organization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Access Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Valid Until
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {nonStaff.map((person) => (
              <NonStaffRow key={person.id} person={person} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Non-Staff Row Component
const NonStaffRow = memo(({ person }: { person: NonStaff }) => {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {person.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {person.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {person.email}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          {person.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {person.organization || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          person.accessLevel === 'full' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
          person.accessLevel === 'limited' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {person.accessLevel}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {person.validUntil || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Active
        </span>
      </td>
    </tr>
  );
});

NonStaffRow.displayName = 'NonStaffRow';

// Mock Data
const mockStaff: Staff[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.j@school.com",
    role: "Mathematics Teacher",
    department: "teaching",
    employeeId: "TCH001",
    joiningDate: "2022-01-15",
    qualifications: ["B.Ed Mathematics", "PGDE"],
    subjects: ["Mathematics", "Additional Mathematics"],
    classTeacher: "Grade 7A",
  },
  // Add more mock staff as needed
];

const mockNonStaff: NonStaff[] = [
  {
    id: "ns1",
    name: "John Doe",
    email: "john.d@vendor.com",
    type: "vendor",
    organization: "School Supplies Ltd",
    purpose: "Supply Delivery",
    validUntil: "2024-12-31",
    accessLevel: "limited",
  },
  // Add more mock non-staff as needed
];

const mockAttendance: AttendanceRecord[] = [
  {
    id: "a1",
    personId: "1",
    date: new Date().toISOString().split('T')[0],
    checkIn: "08:15",
    status: "present",
    duration: 8,
    markedBy: "system",
  },
  // Add more mock attendance as needed
];

const mockPerformance: PerformanceMetric[] = [
  {
    id: "p1",
    personId: "1",
    period: "term",
    startDate: "2024-01-01",
    endDate: "2024-04-01",
    cbcMetrics: {
      lessonDelivery: 95,
      learnerEngagement: 92,
      competencyAssessment: 90,
      projectsGuided: 85,
      remedialClasses: 80,
      parentEngagement: 88,
      peerCoaching: 75,
      professionalDevelopment: 90,
    },
    overallScore: 92,
    trend: "up",
    strengths: ["Lesson delivery", "Student engagement"],
    improvements: ["Peer coaching", "Project guidance"],
  },
  // Add more mock performance as needed
];

const mockGrades: GradeLevel[] = [
  {
    grade: 1,
    streams: ["A", "B", "C"],
    learnerCount: 90,
    classTeachers: ["Teacher A", "Teacher B", "Teacher C"],
  },
  {
    grade: 2,
    streams: ["A", "B"],
    learnerCount: 60,
    classTeachers: ["Teacher D", "Teacher E"],
  },
  {
    grade: 3,
    streams: ["A", "B", "C"],
    learnerCount: 85,
    classTeachers: ["Teacher F", "Teacher G", "Teacher H"],
  },
  {
    grade: 4,
    streams: ["A", "B"],
    learnerCount: 55,
    classTeachers: ["Teacher I", "Teacher J"],
  },
  {
    grade: 5,
    streams: ["A", "B", "C"],
    learnerCount: 88,
    classTeachers: ["Teacher K", "Teacher L", "Teacher M"],
  },
  {
    grade: 6,
    streams: ["A", "B"],
    learnerCount: 62,
    classTeachers: ["Teacher N", "Teacher O"],
  },
  {
    grade: 7,
    streams: ["A", "B", "C"],
    learnerCount: 92,
    classTeachers: ["Teacher P", "Teacher Q", "Teacher R"],
  },
  {
    grade: 8,
    streams: ["A", "B"],
    learnerCount: 58,
    classTeachers: ["Teacher S", "Teacher T"],
  },
  {
    grade: 9,
    streams: ["A", "B", "C"],
    learnerCount: 95,
    classTeachers: ["Teacher U", "Teacher V", "Teacher W"],
  },
];

export default PerformanceDashboard;