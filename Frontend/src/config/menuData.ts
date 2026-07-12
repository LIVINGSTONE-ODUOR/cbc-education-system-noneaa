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
  ListChecks,
  PlusCircle,
  School,
  BookMarked,
  Receipt,
  Banknote,
  UserCircle,
  Headset,
  LucideIcon,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────

/**
 * Submenu item for nested navigation
 */
export interface SubmenuItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  description?: string;
}

/**
 * Main menu item with optional submenu
 */
export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  submenu?: SubmenuItem[];
  description?: string;
}

/**
 * Menu section grouping related items
 */
export interface MenuSection {
  title: string;
  description?: string;
  items: MenuItem[];
}

/**
 * Navigation structure
 */
export type NavigationMenu = MenuSection[];

// ─────────────────────────────────────────────────────────────────
// MENU DATA
// ─────────────────────────────────────────────────────────────────

export const menuSections: NavigationMenu = [
  {
    title: 'ACADEMICS',
    description: 'Manage academic content, students, and teachers',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/school-admin/dashboard',
        description: 'Overview of school statistics and activity',
      },
      {
        id: 'students',
        label: 'Student Management',
        icon: GraduationCap,
        href: '/school-admin/learners',
        description: 'Manage student records and enrollment',
        submenu: [
          {
            id: 'student-list',
            label: 'Learners List',
            href: '/school-admin/learners',
            icon: PlusCircle,
            description: 'View all registered students',
          },
          {
            id: 'student-classes',
            label: 'Student Classes',
            href: '/school-admin/learners/classes',
            icon: School,
            description: 'Manage student class assignments',
          },
        ],
      },
      {
        id: 'teachers',
        label: 'Teachers',
        icon: Users,
        href: '/school-admin/teachers',
        description: 'Manage teaching staff',
        submenu: [
          {
            id: 'all-teachers',
            label: 'All Teachers',
            href: '/school-admin/teacher-list',
            icon: ListChecks,
            description: 'View all teachers',
          },
          {
            id: 'departments',
            label: 'Departments',
            href: '/school-admin/teachers/departments',
            icon: Layers,
            description: 'Organize teachers by department',
          },
        ],
      },
      {
        id: 'staff',
        label: 'Staff Management',
        icon: ClipboardList,
        href: '/school-admin/staff-manage',
        description: 'Manage non-teaching staff',
      },
      {
        id: 'parents',
        label: 'Parents',
        icon: Users,
        href: '/school-admin/parents',
        description: 'Manage parent accounts and contacts',
      },
    ],
  },

  {
    title: 'ATTENDANCE & PERFORMANCE',
    description: 'Track attendance and manage academic performance',
    items: [
      {
        id: 'student-attendance',
        label: 'Student Attendance',
        icon: Calendar,
        href: '/school-admin/attendance/students',
        description: 'Track and manage student attendance',
        submenu: [
          {
            id: 'daily-attendance',
            label: 'Daily Attendance',
            href: '/school-admin/attendance/students/daily',
            icon: CalendarDays,
            description: 'Record daily attendance',
          },
          {
            id: 'attendance-reports',
            label: 'Attendance Reports',
            href: '/school-admin/attendance/students/reports',
            icon: FileText,
            description: 'View attendance analytics',
          },
        ],
      },
      {
        id: 'teacher-attendance',
        label: 'Teacher Attendance',
        icon: Clock,
        href: '/school-admin/attendance/teachers',
        description: 'Track teacher attendance and punctuality',
      },
      {
        id: 'exams',
        label: 'Exams Management',
        icon: BookOpen,
        href: '/school-admin/exams',
        description: 'Create and manage examinations',
        submenu: [
          {
            id: 'exam-schedule',
            label: 'Schedule',
            href: '/school-admin/exams/schedule',
            icon: CalendarDays,
            description: 'Create exam timetable',
          },
          {
            id: 'exam-setup',
            label: 'Setup',
            href: '/school-admin/exams/setup',
            icon: Settings,
            description: 'Configure exam settings',
          },
        ],
      },
      {
        id: 'marks-entry',
        label: 'Marks Entry',
        icon: ClipboardList,
        href: '/school-admin/marks-entry',
        description: 'Enter, edit, and delete learner exam marks',
      },
      {
        id: 'results',
        label: 'Final Results',
        icon: FileText,
        href: '/school-admin/results',
        description: 'Publish and manage exam results',
      },
      {
        id: 'conduct',
        label: 'Student Conduct',
        icon: Award,
        href: '/school-admin/conduct',
        description: 'Track student behavior and conduct',
      },
    ],
  },

  {
    title: 'ADMINISTRATION',
    description: 'Configure school operations and structure',
    items: [
      {
        id: 'curriculum',
        label: 'Curriculum',
        icon: BookMarked,
        href: '/school-admin/curriculum',
        description: 'Manage curriculum and subjects',
      },
      {
        id: 'calendar',
        label: 'Term Management',
        icon: CalendarDays,
        href: '/school-admin/calendar',
        description: 'Manage academic terms and holidays',
      },
      {
        id: 'exam-groups',
        label: 'Exam Groups',
        icon: ClipboardList,
        href: '/school-admin/exam-groups',
        description: 'Organize exams into groups',
      },
      {
        id: 'classes',
        label: 'Classes',
        icon: Layers,
        href: '/school-admin/classes',
        description: 'Manage school classes and sections',
      },
      {
        id: 'promotions',
        label: 'Promotions & Graduations',
        icon: TrendingUp,
        href: '/school-admin/promotions',
        description: 'Manage student promotions and graduations',
      },
    ],
  },

  {
    title: 'FINANCE & HR',
    description: 'Manage financial operations and human resources',
    items: [
      {
        id: 'fees',
        label: 'Fees',
        icon: DollarSign,
        href: '/school-admin/fee-management',
        description: 'Manage student fee structure and collection',
        submenu: [
          {
            id: 'fee-tracking',
            label: 'Fee Tracking',
            href: '/school-admin/fee-management',
            icon: Receipt,
            description: 'Monitor fee payments and defaults',
          },
          {
            id: 'fee-structure',
            label: 'Fee Structure',
            href: '/school-admin/fees/collection',
            icon: Banknote,
            description: 'Configure fee categories and amounts',
          },
          {
            id: 'fee-reports',
            label: 'Fee Reports',
            href: '/school-admin/fees/reports',
            icon: FileText,
            description: 'Generate financial reports',
          },
        ],
      },
      {
        id: 'monthly-setup',
        label: 'Monthly Setup',
        icon: Settings,
        href: '/school-admin/monthly',
        description: 'Configure monthly billing and settings',
      },
      {
        id: 'salary',
        label: 'Salary',
        icon: Wallet,
        href: '/school-admin/salary',
        description: 'Manage staff salary and payroll',
        submenu: [
          {
            id: 'salary-setup',
            label: 'Setup',
            href: '/school-admin/salary/setup',
            icon: Settings,
            description: 'Configure salary templates',
          },
          {
            id: 'payroll',
            label: 'Payroll',
            href: '/school-admin/salary/payroll',
            icon: Banknote,
            description: 'Process salary payments',
          },
        ],
      },
    ],
  },

  {
    title: 'REPORTS & SETTINGS',
    description: 'View reports and manage system configuration',
    items: [
      {
        id: 'reports',
        label: 'Reports',
        icon: BarChart3,
        href: '/school-admin/reports',
        description: 'Generate school reports and analytics',
        submenu: [
          {
            id: 'attendance-reports',
            label: 'Attendance Reports',
            href: '/school-admin/reports/attendance',
            icon: Calendar,
            description: 'View attendance trends',
          },
          {
            id: 'performance-reports',
            label: 'Performance Reports',
            href: '/school-admin/reports/performance',
            icon: TrendingUp,
            description: 'Analyze student performance',
          },
        ],
      },
      {
        id: 'users',
        label: 'Users',
        icon: Shield,
        href: '/school-admin/users',
        description: 'Manage system users and permissions',
      },
      {
        id: 'live-chat',
        label: 'Live Chat',
        icon: Headset,
        href: '/school-admin/live-chat',
        description: 'Respond to visitors escalated from the AI assistant',
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        href: '/school-admin/settings/profile',
        description: 'Configure school profile and preferences',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Get total badge count across all menu items
 * @returns Total badge count
 */
export const getTotalBadges = (): number => {
  return menuSections.reduce((total, section) => {
    const sectionBadges = section.items.reduce((sum, item) => {
      const itemBadge = item.badge || 0;
      const submenuBadges = (item.submenu || []).reduce((subSum, subitem) => subSum + (subitem.badge || 0), 0);
      return sum + itemBadge + submenuBadges;
    }, 0);
    return total + sectionBadges;
  }, 0);
};

/**
 * Get a specific menu item by ID
 * @param itemId - The menu item ID to find
 * @returns Menu item or undefined
 */
export const getMenuItemById = (itemId: string): MenuItem | undefined => {
  for (const section of menuSections) {
    const item = section.items.find((item) => item.id === itemId);
    if (item) return item;
  }
  return undefined;
};

/**
 * Get a specific submenu item by ID
 * @param submenuId - The submenu item ID to find
 * @returns Submenu item or undefined
 */
export const getSubmenuItemById = (submenuId: string): SubmenuItem | undefined => {
  for (const section of menuSections) {
    for (const item of section.items) {
      if (item.submenu) {
        const submenuItem = item.submenu.find((sub) => sub.id === submenuId);
        if (submenuItem) return submenuItem;
      }
    }
  }
  return undefined;
};

/**
 * Get menu item by href
 * @param href - The route href
 * @returns Menu item or undefined
 */
export const getMenuItemByHref = (href: string): MenuItem | undefined => {
  for (const section of menuSections) {
    const item = section.items.find((item) => item.href === href);
    if (item) return item;
  }
  return undefined;
};

/**
 * Get all menu items (flattened)
 * @returns Array of all menu items
 */
export const getAllMenuItems = (): MenuItem[] => {
  return menuSections.flatMap((section) => section.items);
};

/**
 * Get all submenu items (flattened)
 * @returns Array of all submenu items
 */
export const getAllSubmenuItems = (): SubmenuItem[] => {
  return menuSections.flatMap((section) =>
    section.items.flatMap((item) => item.submenu || [])
  );
};

/**
 * Check if a route is active
 * @param currentPath - Current route path
 * @param itemHref - Menu item href
 * @returns Boolean indicating if item is active
 */
export const isMenuItemActive = (currentPath: string, itemHref: string): boolean => {
  return currentPath === itemHref || currentPath.startsWith(`${itemHref}/`);
};

/**
 * Get breadcrumb path for a menu item
 * @param itemId - Menu item ID
 * @returns Array of breadcrumb items
 */
export interface BreadcrumbItem {
  label: string;
  href: string;
}

export const getBreadcrumbPath = (itemId: string): BreadcrumbItem[] => {
  for (const section of menuSections) {
    const item = section.items.find((item) => item.id === itemId);
    if (item) {
      return [{ label: section.title, href: '#' }, { label: item.label, href: item.href }];
    }

    for (const item of section.items) {
      if (item.submenu) {
        const submenuItem = item.submenu.find((sub) => sub.id === itemId);
        if (submenuItem) {
          return [
            { label: section.title, href: '#' },
            { label: item.label, href: item.href },
            { label: submenuItem.label, href: submenuItem.href },
          ];
        }
      }
    }
  }
  return [];
};

/**
 * Get menu statistics
 * @returns Object with menu statistics
 */
export interface MenuStats {
  totalSections: number;
  totalItems: number;
  totalSubmenuItems: number;
  itemsWithBadges: number;
}

export const getMenuStats = (): MenuStats => {
  const allItems = getAllMenuItems();
  const allSubmenu = getAllSubmenuItems();
  const itemsWithBadges = allItems.filter((item) => item.badge).length +
    allSubmenu.filter((item) => item.badge).length;

  return {
    totalSections: menuSections.length,
    totalItems: allItems.length,
    totalSubmenuItems: allSubmenu.length,
    itemsWithBadges,
  };
};
