/**
 * Dashboard Types - Enterprise-grade dashboard type definitions
 */

export interface DashboardUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: UserRole;
  schoolId: string;
  schoolName?: string;
  schoolLogo?: string;
}

export type UserRole = 'super_admin' | 'school_admin' | 'principal' | 'teacher' | 'student' | 'parent' | 'accountant' | 'librarian' | 'receptionist' | 'transport_manager';

export interface EnterpriseKPI {
  id: string;
  title: string;
  value: number;
  unit?: string;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period: 'day' | 'week' | 'month';
  };
  color: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'cyan';
  comparison?: {
    label: string;
    percentage: number;
  };
  actionUrl?: string;
}

export interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  action: string;
  actor: {
    name: string;
    avatar?: string;
    role: UserRole;
  };
  subject: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  status: 'success' | 'pending' | 'failed';
}

export type ActivityType = 
  | 'student_registered'
  | 'teacher_added'
  | 'attendance_submitted'
  | 'fees_paid'
  | 'results_published'
  | 'parent_login'
  | 'timetable_updated'
  | 'announcement_posted'
  | 'exam_created'
  | 'assignment_created';

export interface DashboardEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: EventType;
  location?: string;
  attendees?: string[];
  reminder?: boolean;
}

export type EventType = 'exam' | 'holiday' | 'meeting' | 'pta' | 'sports' | 'assignment' | 'birthday' | 'fee_deadline' | 'leave';

export interface AnalyticsData {
  date: string;
  value: number;
  [key: string]: string | number;
}

export interface ChartData {
  name: string;
  data: AnalyticsData[];
}

export interface FinancialOverview {
  todayRevenue: number;
  monthlyRevenue: number;
  outstandingFees: number;
  expectedIncome: number;
  expenses: number;
  collectionRate: number;
  profitLoss: number;
}

export interface StudentInsight {
  id: string;
  name: string;
  avatar?: string;
  type: 'low_attendance' | 'unpaid_fees' | 'high_performer' | 'recent_enrollment' | 'birthday' | 'needs_attention';
  details: string;
  actionUrl?: string;
}

export interface SchoolHealthScore {
  attendance: number;
  academicPerformance: number;
  financialHealth: number;
  admissions: number;
  teacherProductivity: number;
  parentEngagement: number;
  overall: number;
}

export interface SystemHealth {
  database: 'healthy' | 'warning' | 'critical';
  api: 'healthy' | 'warning' | 'critical';
  authentication: 'healthy' | 'warning' | 'critical';
  storage: 'healthy' | 'warning' | 'critical';
  email: 'healthy' | 'warning' | 'critical';
  sms: 'healthy' | 'warning' | 'critical';
  payment: 'healthy' | 'warning' | 'critical';
  backup: 'healthy' | 'warning' | 'critical';
  lastChecked: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  avatar?: string;
}

export type NotificationCategory = 'academic' | 'finance' | 'admissions' | 'attendance' | 'messages' | 'security' | 'system';

export interface DashboardLayout {
  userId: string;
  widgets: WidgetConfig[];
  theme: 'light' | 'dark';
  savedAt: Date;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: number;
  visible: boolean;
  size: 'small' | 'medium' | 'large';
}

export type WidgetType = 'kpis' | 'analytics' | 'activities' | 'calendar' | 'finances' | 'students' | 'teachers' | 'upcoming_events' | 'ai_insights' | 'system_health' | 'notifications';

export interface AIInsight {
  id: string;
  insight: string;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
  actionUrl?: string;
  icon: string;
}
