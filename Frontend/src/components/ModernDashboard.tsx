import { useState } from 'react';
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
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Menu section interface
interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

// Demo menu data
const menuSections: MenuSection[] = [
  {
    title: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: Home, href: "#dashboard" },
      { id: "analytics", label: "Analytics", icon: BarChart3, href: "#analytics" },
    ]
  },
  {
    title: "Management",
    items: [
      { id: "students", label: "Students", icon: GraduationCap, href: "#students" },
      { id: "teachers", label: "Teachers", icon: Users, href: "#teachers" },
      { id: "classes", label: "Classes", icon: Layers, href: "#classes" },
    ]
  },
  {
    title: "Academic",
    items: [
      { id: "curriculum", label: "Curriculum", icon: BookOpen, href: "#curriculum" },
      { id: "attendance", label: "Attendance", icon: Calendar, href: "#attendance" },
      { id: "exams", label: "Exams", icon: FileText, href: "#exams" },
      { id: "results", label: "Results", icon: TrendingUp, href: "#results" },
    ]
  },
  {
    title: "Finance",
    items: [
      { id: "fees", label: "Fees", icon: DollarSign, href: "#fees" },
      { id: "salary", label: "Salary", icon: WalletIcon, href: "#salary" },
    ]
  },
  {
    title: "System",
    items: [
      { id: "settings", label: "Settings", icon: Settings, href: "#settings" },
    ]
  }
];

// Custom Wallet icon component
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
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
    </svg>
  );
}

// Demo content sections
const demoSections = [
  { id: 'dashboard', title: 'Dashboard Overview', content: 'Welcome to your dashboard. Here you can see an overview of all your school activities.' },
  { id: 'analytics', title: 'Analytics', content: 'View detailed analytics and reports about student performance and school metrics.' },
  { id: 'students', title: 'Student Management', content: 'Manage all student records, profiles, and academic information.' },
  { id: 'teachers', title: 'Teacher Management', content: 'Manage teacher profiles, assignments, and performance records.' },
  { id: 'classes', title: 'Class Management', content: 'Organize classes, subjects, and scheduling.' },
  { id: 'curriculum', title: 'Curriculum', content: 'Design and manage curriculum content and learning materials.' },
  { id: 'attendance', title: 'Attendance Tracking', content: 'Track and manage student and teacher attendance.' },
  { id: 'exams', title: 'Exams Management', content: 'Schedule and manage examinations.' },
  { id: 'results', title: 'Results', content: 'View and manage student examination results.' },
  { id: 'fees', title: 'Fees Management', content: 'Manage student fees, payments, and financial records.' },
  { id: 'salary', title: 'Salary Management', content: 'Manage teacher and staff salary payments.' },
  { id: 'settings', title: 'Settings', content: 'Configure system settings and preferences.' },
];

// Stat card component
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ title, value, change, isPositive, icon: Icon }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value}</p>
          <p className={cn(
            "text-sm font-medium mt-2 flex items-center gap-1",
            isPositive ? "text-emerald-600" : "text-rose-600"
          )}>
            {isPositive ? "↑" : "↓"} {change}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// Section Panel Component with enhanced sliding animation (moves up and down as if scrolling)
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
          transition={{ 
            duration: 0.5, 
            ease: [0.4, 0, 0.2, 1],
            opacity: { duration: 0.3 },
            y: { duration: 0.5, ease: "easeOut" },
            scale: { duration: 0.5 }
          }}
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

export default function ModernDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    menuSections.reduce((acc, section) => ({ ...acc, [section.title]: true }), {})
  );

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleNavigation = (href: string) => {
    const sectionId = href.replace('#', '');
    setActiveSection(sectionId);
  };

  // Get active section data
  const activeSectionData = demoSections.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: sidebarOpen ? 0 : -280,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-50 w-[280px] bg-gradient-to-b from-[#1E40AF] via-[#1E3A8A] to-[#0F172A] flex flex-col shadow-2xl lg:translate-x-0 lg:static"
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-4 h-20 border-b border-white/10 bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A]">
          {/* Blue Rounded Square Hamburger Menu Button - Prominent in Sidebar */}
          <motion.button 
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-shadow"
          >
            <Menu className="w-6 h-6 text-white" />
          </motion.button>
          
          <img src="/Noneea-logo.jpg" alt="Noneaa" className="h-10 w-auto object-contain" />
          <button 
            className="ml-auto lg:hidden text-white/70 hover:text-white transition-colors p-2"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className="mb-4">
              {/* Section Header */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: sectionIndex * 0.05 }}
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold uppercase tracking-wider text-blue-300 hover:text-white transition-colors"
              >
                <span>{section.title}</span>
                <motion.div
                  animate={{ rotate: expandedSections[section.title] ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3 h-3" />
                </motion.div>
              </motion.button>
              
              {/* Menu Items - Collapsible with animation */}
              <AnimatePresence>
                {expandedSections[section.title] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1 mt-2">
                      {section.items.map((item, itemIndex) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        
                        return (
                          <motion.button
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (sectionIndex * 0.05) + (itemIndex * 0.03) }}
                            onClick={() => handleNavigation(item.href)}
                            className={cn(
                              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative text-left",
                              isActive 
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25" 
                                : "text-blue-200 hover:text-white hover:bg-white/10"
                            )}
                          >
                            {/* Active indicator */}
                            {isActive && (
                              <motion.div 
                                layoutId="activeIndicator"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-white rounded-r-full" 
                              />
                            )}
                            
                            <Icon className={cn(
                              "w-[18px] h-[18px] flex-shrink-0",
                              isActive ? "text-white" : "text-blue-300 group-hover:text-white"
                            )} />
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

        {/* User Profile Section */}
        <div className="p-4 border-t border-white/10 bg-gradient-to-r from-[#1E40AF]/50 to-[#1E3A8A]/50">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-white">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">John Doe</p>
              <p className="text-xs text-blue-300 truncate">Administrator</p>
            </div>
            <ChevronDown className="w-4 h-4 text-blue-300" />
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with the blue rounded square hamburger button */}
        <header className="h-20 border-b bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center px-4 lg:px-8 sticky top-0 z-30">
          {/* Blue Rounded Square Hamburger Menu Button */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="lg:hidden w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25 mr-4"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6 text-white" />
          </motion.button>

          {/* Search Bar */}
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

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </motion.button>

            {/* Settings */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </motion.button>
          </div>
        </header>

        {/* Page content with sliding panels */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Students" 
                value="1,234" 
                change="+12%" 
                isPositive={true}
                icon={Users}
              />
              <StatCard 
                title="Teachers" 
                value="56" 
                change="+5%" 
                isPositive={true}
                icon={GraduationCap}
              />
              <StatCard 
                title="Classes" 
                value="24" 
                change="+2%" 
                isPositive={true}
                icon={Layers}
              />
              <StatCard 
                title="Attendance" 
                value="94.2%" 
                change="-1.3%" 
                isPositive={false}
                icon={Clock}
              />
            </div>

            {/* Sliding Panel Animation Section */}
            <div className="space-y-4">
              {/* Section Navigation Tabs */}
              <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                {demoSections.slice(0, 6).map((section) => (
                  <motion.button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                      activeSection === section.id
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {section.title}
                  </motion.button>
                ))}
              </div>

              {/* Animated Content Panels */}
              <AnimatePresence mode="wait">
                {demoSections.slice(0, 6).map((section) => (
                  activeSection === section.id && (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.98 }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <SectionPanel isActive={true} title={section.title}>
                        <div className="space-y-4">
                          <p className="text-slate-600 dark:text-slate-300">{section.content}</p>
                          
                          {/* Demo content cards */}
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

                          {/* Action Buttons */}
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
                    </motion.div>
                  )
                ))}
              </AnimatePresence>
            </div>

            {/* Additional Cards Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700"
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        i === 1 ? 'bg-blue-100 dark:bg-blue-900/30' :
                        i === 2 ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                        i === 3 ? 'bg-amber-100 dark:bg-amber-900/30' :
                        'bg-purple-100 dark:bg-purple-900/30'
                      }`}>
                        {i === 1 && <Users className="w-5 h-5 text-blue-600" />}
                        {i === 2 && <GraduationCap className="w-5 h-5 text-emerald-600" />}
                        {i === 3 && <FileText className="w-5 h-5 text-amber-600" />}
                        {i === 4 && <ClipboardList className="w-5 h-5 text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {i === 1 ? 'New student enrolled' :
                           i === 2 ? 'Teacher assignment updated' :
                           i === 3 ? 'Exam results published' :
                           'Attendance marked for Grade 1'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">2 hours ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Upcoming Events Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700"
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Upcoming Events</h3>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{15 + i}</span>
                        <span className="text-xs text-blue-600 dark:text-blue-400">MAR</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {i === 1 ? 'Parent-Teacher Meeting' :
                           i === 2 ? 'Science Fair' :
                           i === 3 ? 'Mid-Term Examinations' :
                           'Sports Day'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">9:00 AM - 2:00 PM</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
