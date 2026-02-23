import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ThemeColors, MenuSection } from '@/types/dashboard';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ClipboardList,
  Calendar,
  Clock,
  BookOpen,
  FileText,
  Award,
  CalendarDays,
  Layers,
  TrendingUp,
  DollarSign,
  Settings,
  Wallet,
  BarChart3,
  Shield,
} from 'lucide-react';

interface BreadcrumbProps {
  pathname: string;
  theme: ThemeColors;
}

// Define menu sections locally for breadcrumb lookup
const menuSections: MenuSection[] = [
  {
    title: "ACADEMIC",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/school-admin/dashboard" },
      { id: "students", label: "Students", icon: GraduationCap, href: "/school-admin/learners", submenu: [
        { id: "all-students", label: "All Students", href: "/school-admin/learners/all" },
        { id: "add-student", label: "Add Student", href: "/school-admin/learners/add" },
        { id: "student-classes", label: "Student Classes", href: "/school-admin/learners/classes" },
      ], badge: 2 },
      { id: "teachers", label: "Teachers", icon: Users, href: "/school-admin/teachers", submenu: [
        { id: "all-teachers", label: "All Teachers", href: "/school-admin/teachers/all" },
        { id: "add-teacher", label: "Add Teacher", href: "/school-admin/teachers/add" },
        { id: "departments", label: "Departments", href: "/school-admin/teachers/departments" },
      ]},
      { id: "assignments", label: "Staff Management", icon: ClipboardList, href: "/school-admin/staff-manage", badge: 1 },
      { id: "parents", label: "Parents", icon: Users, href: "/school-admin/parents" },
    ]
  },
  {
    title: "ATTENDANCE & PERFORMANCE",
    items: [
      { id: "student-att", label: "Student Attendance", icon: Calendar, href: "/school-admin/attendance/students", submenu: [
        { id: "daily-attendance", label: "Daily Attendance", href: "/school-admin/attendance/students/daily" },
        { id: "attendance-reports", label: "Reports", href: "/school-admin/attendance/students/reports" },
      ]},
      { id: "teacher-att", label: "Teacher Attendance", icon: Clock, href: "/school-admin/attendance/teachers" },
      { id: "exams", label: "Exams Management", icon: BookOpen, href: "/school-admin/exams", submenu: [
        { id: "exam-schedule", label: "Schedule", href: "/school-admin/exams/schedule" },
        { id: "exam-setup", label: "Setup", href: "/school-admin/exams/setup" },
      ]},
      { id: "results", label: "Final Results", icon: FileText, href: "/school-admin/results" },
      { id: "conduct", label: "Conduct Students", icon: Award, href: "/school-admin/conduct" },
    ]
  },
  {
    title: "ADMINISTRATION",
    items: [
      { id: "curriculum", label: "Curriculum", icon: BookOpen, href: "/school-admin/curriculum" },
      { id: "terms", label: "Term Management", icon: CalendarDays, href: "/school-admin/terms", submenu: [
        { id: "term-setup", label: "Setup Terms", href: "/school-admin/terms/setup" },
        { id: "term-calendar", label: "Calendar", href: "/school-admin/terms/calendar" },
      ]},
      { id: "exam-groups", label: "Exam Groups", icon: ClipboardList, href: "/school-admin/exam-groups" },
      { id: "classes", label: "Classes & Subjects", icon: Layers, href: "/school-admin/classes", submenu: [
        { id: "classes-list", label: "Classes", href: "/school-admin/classes/list" },
        { id: "subjects", label: "Subjects", href: "/school-admin/classes/subjects" },
      ]},
      { id: "promotions", label: "Promotions & Graduations", icon: TrendingUp, href: "/school-admin/promotions" },
    ]
  },
  {
    title: "FINANCE & HR",
    items: [
      { id: "fees", label: "Fees", icon: DollarSign, href: "/school-admin/fees", submenu: [
        { id: "fee-setup", label: "Fee Setup", href: "/school-admin/fees/setup" },
        { id: "fee-collection", label: "Collection", href: "/school-admin/fees/collection" },
        { id: "fee-reports", label: "Reports", href: "/school-admin/fees/reports" },
      ]},
      { id: "monthly", label: "Monthly Setup", icon: Settings, href: "/school-admin/monthly" },
      { id: "salary", label: "Salary", icon: Wallet, href: "/school-admin/salary", submenu: [
        { id: "salary-setup", label: "Setup", href: "/school-admin/salary/setup" },
        { id: "payroll", label: "Payroll", href: "/school-admin/salary/payroll" },
      ]},
    ]
  },
  {
    title: "REPORTS & SETTINGS",
    items: [
      { id: "reports", label: "Reports", icon: BarChart3, href: "/school-admin/reports", submenu: [
        { id: "attendance-reports", label: "Attendance Reports", href: "/school-admin/reports/attendance" },
        { id: "performance-reports", label: "Performance Reports", href: "/school-admin/reports/performance" },
      ]},
      { id: "users", label: "Users", icon: Shield, href: "/school-admin/users" },
      { id: "settings", label: "Settings", icon: Settings, href: "/school-admin/settings", submenu: [
        { id: "general-settings", label: "General", href: "/school-admin/settings/general" },
        { id: "security", label: "Security", href: "/school-admin/settings/security" },
      ]},
    ]
  }
];

export default function Breadcrumb({ pathname, theme }: BreadcrumbProps) {
  const segments = pathname.split('/').filter(Boolean);
  
  const breadcrumbs = useMemo(() => {
    const crumbs = [{ label: 'Dashboard', href: '/school-admin/dashboard' }];
    
    let path = '';
    segments.forEach((segment) => {
      path += `/${segment}`;
      const menuItem = menuSections
        .flatMap(s => s.items)
        .find(item => item.href === path);
      
      if (menuItem) {
        crumbs.push({ label: menuItem.label, href: path });
      }
    });
    
    return crumbs;
  }, [segments]);

  return (
    <nav className={cn("flex items-center gap-1 text-sm", theme.header.text)} aria-label="Breadcrumb">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-1">
          <Link
            to={crumb.href}
            className="hover:opacity-70 transition-opacity"
          >
            {crumb.label}
          </Link>
          {index < breadcrumbs.length - 1 && (
            <span className="opacity-50">/</span>
          )}
        </div>
      ))}
    </nav>
  );
}
