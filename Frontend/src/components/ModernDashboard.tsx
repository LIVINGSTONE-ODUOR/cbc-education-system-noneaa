import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Calendar,
  DollarSign,
  FileText,
  Layers,
  TrendingUp,
  Clock,
  ClipboardList,
  LogOut,
  User,
  HelpCircle,
  Moon,
  Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

interface DemoSection {
  id: string;
  title: string;
  content: string;
}

interface ActivityItem {
  id: number;
  title: string;
  time: string;
  type: 'student' | 'teacher' | 'exam' | 'task';
}

interface EventItem {
  id: number;
  date: number;
  month: string;
  title: string;
  time: string;
}

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, href: '#dashboard' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '#analytics' },
    ],
  },
  {
    title: 'Management',
    items: [
      { id: 'students', label: 'Students', icon: GraduationCap, href: '#students' },
      { id: 'teachers', label: 'Teachers', icon: Users, href: '#teachers' },
      { id: 'classes', label: 'Classes', icon: Layers, href: '#classes' },
    ],
  },
  {
    title: 'Academic',
    items: [
      { id: 'curriculum', label: 'Curriculum', icon: BookOpen, href: '#curriculum' },
      { id: 'attendance', label: 'Attendance', icon: Calendar, href: '#attendance' },
      { id: 'exams', label: 'Exams', icon: FileText, href: '#exams' },
      { id: 'results', label: 'Results', icon: TrendingUp, href: '#results' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { id: 'fees', label: 'Fees', icon: DollarSign, href: '#fees' },
      { id: 'salary', label: 'Salary', icon: Clock, href: '#salary' },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings, href: '#settings' },
    ],
  },
];

const DEMO_SECTIONS: DemoSection[] = [
  { id: 'dashboard', title: 'Dashboard Overview', content: 'Welcome to your dashboard. Here you can see an overview of all school activities.' },
  { id: 'analytics', title: 'Analytics', content: 'View detailed analytics and reports about student performance.' },
  { id: 'students', title: 'Student Management', content: 'Manage all student records, profiles, and academic information.' },
  { id: 'teachers', title: 'Teacher Management', content: 'Manage teacher profiles, assignments, and performance records.' },
  { id: 'classes', title: 'Class Management', content: 'Organize classes, subjects, and scheduling.' },
  { id: 'curriculum', title: 'Curriculum', content: 'Design and manage curriculum content and learning materials.' },
];

const ACTIVITY_ITEMS: ActivityItem[] = [
  { id: 1, title: 'New student enrolled', time: '2 hours ago', type: 'student' },
  { id: 2, title: 'Teacher assignment updated', time: '3 hours ago', type: 'teacher' },
  { id: 3, title: 'Exam results published', time: '4 hours ago', type: 'exam' },
  { id: 4, title: 'Attendance marked for Grade 1', time: '5 hours ago', type: 'task' },
];

const EVENT_ITEMS: EventItem[] = [
  { id: 1, date: 15, month: 'MAR', title: 'Parent-Teacher Meeting', time: '9:00 AM - 2:00 PM' },
  { id: 2, date: 16, month: 'MAR', title: 'Science Fair', time: '10:00 AM - 3:00 PM' },
  { id: 3, date: 17, month: 'MAR', title: 'Mid-Term Examinations', time: '8:00 AM - 12:00 PM' },
  { id: 4, date: 18, month: 'MAR', title: 'Sports Day', time: '9:00 AM - 4:00 PM' },
];

// ─────────────────────────────────────────────────────────────────
// ANIMATION VARIANTS
// ────────────��────────────────────────────────────────────────────

const sidebarVariants = {
  open: { x: 0, opacity: 1 },
  closed: { x: -280, opacity: 0 },
};

const overlayVariants = {
  open: { opacity: 1 },
  closed: { opacity: 0 },
};

const menuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03 },
  }),
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1 },
  }),
};

// ─────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────

/**
 * Custom Wallet Icon Component
 */
function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ title, value, change, isPositive, icon: Icon }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 transition-shadow hover:shadow-xl hover:shadow-slate-200/75 dark:hover:shadow-slate-900/75"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value}</p>
          <p
            className={cn(
              'text-sm font-medium mt-2 flex items-center gap-1',
              isPositive ? 'text-emerald-600' : 'text-rose-600'
            )}
          >
            {isPositive ? '↑' : '↓'} {change}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Section Panel Component
 */
interface SectionPanelProps {
  isActive: boolean;
  title: string;
  children: React.ReactNode;
}

function SectionPanel({ isActive, title, children }: SectionPanelProps) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{title}</h2>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Sidebar Navigation Component
 */
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  expandedSections: Record<string, boolean>;
  onToggleSection: (title: string) => void;
  onNavigate: (sectionId: string) => void;
}

function Sidebar({
  isOpen,
  onClose,
  activeSection,
  expandedSections,
  onToggleSection,
  onNavigate,
}: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      variants={sidebarVariants}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 left-0 z-50 w-[280px] bg-gradient-to-b from-[#1E40AF] via-[#1E3A8A] to-[#0F172A] flex flex-col shadow-2xl lg:translate-x-0 lg:static"
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-4 h-20 border-b border-white/10 bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A]">
        <img src="/Noneea-logo.jpg" alt="CBE" className="h-12 w-12 object-cover rounded-full flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-white truncate">CBE System</p>
        </div>
        <button
          className="lg:hidden text-white/70 hover:text-white transition-colors p-2"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-4">
        {MENU_SECTIONS.map((section, sectionIndex) => (
          <div key={section.title}>
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: sectionIndex * 0.05 }}
              onClick={() => onToggleSection(section.title)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold uppercase tracking-wider text-blue-300 hover:text-white transition-colors"
            >
              <span>{section.title}</span>
              <motion.div animate={{ rotate: expandedSections[section.title] ? 0 : -90 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-3 h-3" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {expandedSections[section.title] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 mt-2">
                    {section.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;

                      return (
                        <motion.button
                          key={item.id}
                          custom={itemIndex}
                          variants={menuItemVariants}
                          initial="hidden"
                          animate="visible"
                          onClick={() => {
                            onNavigate(item.id);
                            onClose();
                          }}
                          className={cn(
                            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative text-left',
                            isActive
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                              : 'text-blue-200 hover:text-white hover:bg-white/10'
                          )}
                        >
                          {isActive && (
                            <motion.div layoutId="activeIndicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-white rounded-r-full" />
                          )}
                          <Icon className={cn('w-[18px] h-[18px] flex-shrink-0', isActive ? 'text-white' : 'text-blue-300')} />
                          <span className="truncate">{item.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-r from-[#1E40AF]/50 to-[#1E3A8A]/50">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-sm font-bold text-white">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Admin</p>
            <p className="text-xs text-blue-300 truncate">Administrator</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

/**
 * Header Component
 */
interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenSidebar: () => void;
}

function Header({ isDarkMode, onToggleTheme, onOpenSidebar }: HeaderProps) {
  return (
    <header className="h-20 border-b bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center px-4 lg:px-8 sticky top-0 z-30">
      <button
        className="lg:hidden w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25 mr-4"
        onClick={onOpenSidebar}
        aria-label="Open sidebar"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 border-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleTheme}
          className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-blue-600" />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </motion.button>
      </div>
    </header>
  );
}

/**
 * Activity Card Component
 */
function ActivityCard() {
  const getActivityIcon = (type: string) => {
    const icons = {
      student: Users,
      teacher: GraduationCap,
      exam: FileText,
      task: ClipboardList,
    };
    return icons[type as keyof typeof icons] || Users;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      student: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
      teacher: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
      exam: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
      task: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    };
    return colors[type as keyof typeof colors] || colors.student;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700"
    >
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {ACTIVITY_ITEMS.map((item) => {
          const ActivityIcon = getActivityIcon(item.type);
          const colorClass = getActivityColor(item.type);

          return (
            <motion.div
              key={item.id}
              whileHover={{ backgroundColor: 'rgb(148 163 184 / 0.1)' }}
              className="flex items-center gap-4 p-3 rounded-xl transition-colors"
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colorClass)}>
                <ActivityIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/**
 * Upcoming Events Card Component
 */
function EventsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700"
    >
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Upcoming Events</h3>
      <div className="space-y-4">
        {EVENT_ITEMS.map((event) => (
          <motion.div
            key={event.id}
            whileHover={{ backgroundColor: 'rgb(148 163 184 / 0.1)' }}
            className="flex items-center gap-4 p-3 rounded-xl transition-colors"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{event.date}</span>
              <span className="text-xs text-blue-600 dark:text-blue-400">{event.month}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{event.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{event.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function ModernDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    MENU_SECTIONS.reduce((acc, section) => ({ ...acc, [section.title]: true }), {})
  );

  const toggleSection = useCallback((title: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  }, []);

  const handleNavigation = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const activeSectionData = useMemo(
    () => DEMO_SECTIONS.find((s) => s.id === activeSection),
    [activeSection]
  );

  return (
    <div className={cn('min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800', isDarkMode && 'dark')}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSection={activeSection}
        expandedSections={expandedSections}
        onToggleSection={toggleSection}
        onNavigate={handleNavigation}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header isDarkMode={isDarkMode} onToggleTheme={toggleTheme} onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Students" value="1,234" change="+12%" isPositive icon={Users} />
              <StatCard title="Teachers" value="56" change="+5%" isPositive icon={GraduationCap} />
              <StatCard title="Classes" value="24" change="+2%" isPositive icon={Layers} />
              <StatCard title="Attendance" value="94.2%" change="-1.3%" isPositive={false} icon={Clock} />
            </div>

            {/* Section Tabs & Content */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                {DEMO_SECTIONS.slice(0, 6).map((section) => (
                  <motion.button
                    key={section.id}
                    onClick={() => handleNavigation(section.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                      activeSection === section.id
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    {section.title}
                  </motion.button>
                ))}
              </div>

              {/* Animated Content */}
              <AnimatePresence mode="wait">
                {activeSectionData && (
                  <SectionPanel isActive title={activeSectionData.title}>
                    <div className="space-y-4">
                      <p className="text-slate-600 dark:text-slate-300">{activeSectionData.content}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-xl">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Quick Stats</h4>
                          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                            <div className="flex justify-between">
                              <span>Total Records</span>
                              <span className="font-medium">1,234</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Active This Month</span>
                              <span className="font-medium">1,156</span>
                            </div>
                            <div className="flex justify-between">
                              <span>New Entries</span>
                              <span className="font-medium text-emerald-600">+78</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-700 dark:to-slate-600 rounded-xl">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Recent Activity</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span>New student enrolled</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>Teacher assigned to class</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                              <div className="w-2 h-2 rounded-full bg-amber-500" />
                              <span>Results updated</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                        >
                          View Details
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                        >
                          Export Data
                        </motion.button>
                      </div>
                    </div>
                  </SectionPanel>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActivityCard />
              <EventsCard />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}