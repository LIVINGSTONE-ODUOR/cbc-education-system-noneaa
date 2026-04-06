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
  UserCog,
  ListChecks,
  PlusCircle,
  School,
  BookMarked,
  Receipt,
  Banknote,
  ChevronRight,
  UserCircle,
} from 'lucide-react';
import { MenuSection } from '@/types/dashboard';

export const menuSections: MenuSection[] = [
  {
    title: "ACADEMICS",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/school-admin/dashboard",
      },
      {
        id: "students",
        label: "Students",
        icon: GraduationCap,
        href: "/school-admin/learners",
        badge: 2,
        submenu: [
          {
            id: "manage-students",
            label: "Student List",
            href: "/school-admin/learners/list",
            icon: UserCog,
          },
          {
            id: "add-student",
            label: "Add Student",
            href: "/school-admin/learners/add",
            icon: PlusCircle,
          },
          {
            id: "student-classes",
            label: "Student Classes",
            href: "/school-admin/learners/classes",
            icon: School,
          },
        ],
      },
      {
        id: "teachers",
        label: "Teachers",
        icon: Users,
        href: "/school-admin/teachers",
        submenu: [
          {
            id: "all-teachers",
            label: "All Teachers",
            href: "/school-admin/teacher-list",
            icon: ListChecks,
          },
          {
            id: "departments",
            label: "Departments",
            href: "/school-admin/teachers/departments",
            icon: Layers,
          },
        ],
      },
      {
        id: "assignments",
        label: "Staff Management",
        icon: ClipboardList,
        href: "/school-admin/staff-manage",
      },
      {
        id: "parents",
        label: "Parents",
        icon: Users,
        href: "/school-admin/parents",
      },
    ],
  },

  {
    title: "ATTENDANCE & PERFORMANCE",
    items: [
      {
        id: "student-att",
        label: "Student Attendance",
        icon: Calendar,
        href: "/school-admin/attendance/students",
        submenu: [
          {
            id: "daily-attendance",
            label: "Daily Attendance",
            href: "/school-admin/attendance/students/daily",
            icon: CalendarDays,
          },
          {
            id: "attendance-reports",
            label: "Reports",
            href: "/school-admin/attendance/students/reports",
            icon: FileText,
          },
        ],
      },
      {
        id: "teacher-att",
        label: "Teacher Attendance",
        icon: Clock,
        href: "/school-admin/attendance/teachers",
      },
      {
        id: "exams",
        label: "Exams Management",
        icon: BookOpen,
        href: "/school-admin/exams",
        submenu: [
          {
            id: "exam-schedule",
            label: "Schedule",
            href: "/school-admin/exams/schedule",
            icon: CalendarDays,
          },
          {
            id: "exam-setup",
            label: "Setup",
            href: "/school-admin/exams/setup",
            icon: Settings,
          },
        ],
      },
      {
        id: "results",
        label: "Final Results",
        icon: FileText,
        href: "/school-admin/results",
      },
      {
        id: "conduct",
        label: "Conduct Students",
        icon: Award,
        href: "/school-admin/conduct",
      },
    ],
  },

  {
    title: "ADMINISTRATION",
    items: [
      {
        id: "curriculum",
        label: "Curriculum",
        icon: BookMarked,
        href: "/school-admin/curriculum",
      },
      {
        id: "terms",
        label: "Term Management",
        icon: CalendarDays,
        href: "/school-admin/calendar",
      },
      {
        id: "exam-groups",
        label: "Exam Groups",
        icon: ClipboardList,
        href: "/school-admin/exam-groups",
      },
      {
        id: "classes",
        label: "Classes ",
        icon: Layers,
        href: "/school-admin/classes",
       
      },
      {
        id: "promotions",
        label: "Promotions & Graduations",
        icon: TrendingUp,
        href: "/school-admin/promotions",
      },
    ],
  },

  {
    title: "FINANCE & HR",
    items: [
      {
        id: "fees",
        label: "Fees",
        icon: DollarSign,
        href: "/school-admin/fee-management",
        submenu: [
          {
            id: "fee-records",
            label: "Fee Tracking",
            href: "/school-admin/fee-management",
            icon: Receipt,
          },
          {
            id: "fee-structure",
            label: "Fee-Struucture",
            href: "/school-admin/fees/collection",
            icon: Banknote,
          },
          {
            id: "fee-reports",
            label: "Reports",
            href: "/school-admin/fees/reports",
            icon: FileText,
          },
        ],
      },
      {
        id: "monthly",
        label: "Monthly Setup",
        icon: Settings,
        href: "/school-admin/monthly",
      },
      {
        id: "salary",
        label: "Salary",
        icon: Wallet,
        href: "/school-admin/salary",
        submenu: [
          {
            id: "salary-setup",
            label: "Setup",
            href: "/school-admin/salary/setup",
            icon: Settings,
          },
          {
            id: "payroll",
            label: "Payroll",
            href: "/school-admin/salary/payroll",
            icon: Banknote,
          },
        ],
      },
    ],
  },

  {
    title: "REPORTS & SETTINGS",
    items: [
      {
        id: "reports",
        label: "Reports",
        icon: BarChart3,
        href: "/school-admin/reports",
        submenu: [
          {
            id: "attendance-reports",
            label: "Attendance Reports",
            href: "/school-admin/reports/attendance",
            icon: Calendar,
          },
          {
            id: "performance-reports",
            label: "Performance Reports",
            href: "/school-admin/reports/performance",
            icon: TrendingUp,
          },
        ],
      },
      {
        id: "users",
        label: "Users",
        icon: Shield,
        href: "/school-admin/users",
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
         href: "/school-admin/settings/profile",
      },
    ],
  },
];

// Helper: total badge count
export const getTotalBadges = (): number => {
  return menuSections
    .flatMap((s) => s.items)
    .reduce((sum, item) => sum + (item.badge || 0), 0);
};