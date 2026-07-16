import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  ChevronDown,
  Bell,
  Search,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Settings,
  Home,
  Mail,
  Phone,
} from 'lucide-react';

// Types
import { DashboardLayoutProps, Notification } from '@/types/dashboard';

// Config
import { lightTheme, darkTheme } from '@/config/theme';
import { getTotalBadges, getMenuForRole } from '@/config/menuData';

// Components
import Breadcrumb from './Breadcrumb';
import NotificationDropdown from './NotificationDropdown';
import UserMenuDropdown from './UserMenuDropdown';
import { updateActivity } from '@/lib/api/profileApi';

/* ─────────────────────────────────────────────────────────────────── */
/* SIDEBAR COMPONENT                                                    */
/* ─────────────────────────────────────────────────────────────────── */

interface SidebarProps {
  collapsed: boolean;
  sidebarOpen: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onSidebarOpenChange: (open: boolean) => void;
  theme: typeof lightTheme;
  user: any;
  onLogout: () => void;
  expandedItems: Record<string, boolean>;
  onExpandItem: (itemId: string) => void;
  location: any;
}

const Sidebar = ({
  collapsed,
  sidebarOpen,
  onCollapsedChange,
  onSidebarOpenChange,
  theme,
  user,
  onLogout,
  expandedItems,
  onExpandItem,
  location,
}: SidebarProps) => {
  const isMenuItemActive = useCallback((href: string) => {
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  }, [location.pathname]);

  const visibleMenuSections = useMemo(() => getMenuForRole(user?.role), [user?.role]);

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => onSidebarOpenChange(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out',
          'bg-[#152C21] border-r border-[#2A4A3A]',
          collapsed ? 'w-20' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header Section */}
        <div
          className={cn(
            'flex-shrink-0 border-b border-[#2A4A3A]',
            'flex items-center justify-between gap-3',
            collapsed ? 'px-3 py-5' : 'px-5 py-6'
          )}
        >
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow ring-1 ring-amber-300/40">
                <img 
                  src="/Noneea-logo.jpg" 
                  alt="CBE" 
                  className="w-8 h-8 object-cover rounded-md" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-white truncate">
                  {user?.schoolName || 'CBE'}
                </p>
                <p className="text-xs text-emerald-200/60 truncate">Education</p>
              </div>
            </Link>
          )}

          {collapsed && (
            <Link to="/dashboard" className="w-full flex justify-center hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 ring-1 ring-amber-300/40">
                <Home className="w-5 h-5 text-white" />
              </div>
            </Link>
          )}

          {/* Collapse Toggle - Desktop only */}
          <button
            className={cn(
              'hidden lg:flex p-2 rounded-lg transition-colors',
              'hover:bg-white/10'
            )}
            onClick={() => onCollapsedChange(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-emerald-200/70" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-emerald-200/70" />
            )}
          </button>

          {/* Close Button - Mobile only */}
          <button
            className={cn('lg:hidden p-2 rounded-lg transition-colors', 'hover:bg-white/10')}
            onClick={() => onSidebarOpenChange(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-emerald-200/70" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6 scrollbar-thin scrollbar-thumb-[#2A4A3A]">
          {visibleMenuSections.map((section) => (
            <div key={section.title} className="space-y-2">
              {!collapsed && (
                <div className="px-3 text-xs font-semibold uppercase tracking-widest text-amber-300/80">
                  {section.title}
                </div>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isMenuItemActive(item.href);
                  const isExpanded = expandedItems[item.id];
                  const hasSubmenu = Boolean(item.submenu?.length);

                  return (
                    <div key={item.id}>
                      {hasSubmenu ? (
                        <button
                          onClick={() => onExpandItem(item.id)}
                          className={cn(
                            'w-full flex items-center justify-between rounded-lg transition-all duration-200',
                            'h-10 text-sm font-medium',
                            collapsed ? 'px-2' : 'px-3',
                            isActive
                              ? cn(
                                  'bg-gradient-to-r from-amber-500/20 to-transparent text-amber-300',
                                  'border-r-2 border-amber-400 shadow-sm'
                                )
                              : cn(
                                  'text-emerald-100/80',
                                  'hover:bg-white/5 hover:text-white'
                                )
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-amber-300')} />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                          </div>

                          {!collapsed && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {item.badge && (
                                <span className={cn('w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center', theme.badge)}>
                                  {item.badge}
                                </span>
                              )}
                              <ChevronDown
                                className={cn(
                                  'w-4 h-4 transition-transform duration-200 text-emerald-200/50',
                                  isExpanded && 'rotate-180'
                                )}
                              />
                            </div>
                          )}

                          {collapsed && item.badge && (
                            <span className={cn('absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center', theme.badge)}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      ) : (
                        <Link
                          to={item.href}
                          className={cn(
                            'flex items-center justify-between rounded-lg transition-all duration-200',
                            'h-10 text-sm font-medium relative',
                            collapsed ? 'px-2' : 'px-3',
                            isActive
                              ? cn(
                                  'bg-gradient-to-r from-amber-500/20 to-transparent text-amber-300',
                                  'border-r-2 border-amber-400 shadow-sm'
                                )
                              : cn(
                                  'text-emerald-100/80',
                                  'hover:bg-white/5 hover:text-white'
                                )
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-amber-300')} />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                          </div>

                          {!collapsed && item.badge && (
                            <span className={cn('w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0', theme.badge)}>
                              {item.badge}
                            </span>
                          )}

                          {collapsed && item.badge && (
                            <span className={cn('absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center', theme.badge)}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )}

                      {/* Submenu */}
                      {hasSubmenu && isExpanded && !collapsed && (
                        <div className="mt-1 ml-4 space-y-1 border-l border-[#2A4A3A] pl-3 py-1">
                          {item.submenu?.map((subitem) => {
                            const isSubActive = location.pathname === subitem.href;
                            return (
                              <Link
                                key={subitem.id}
                                to={subitem.href}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-all duration-200',
                                  isSubActive
                                    ? 'bg-amber-500/10 text-amber-300 font-medium'
                                    : 'text-emerald-100/60 hover:bg-white/5 hover:text-emerald-50'
                                )}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                                <span className="truncate">{subitem.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className={cn('flex-shrink-0 border-t border-[#2A4A3A] bg-[#122519]')}>
          {!collapsed ? (
            <>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 ring-1 ring-amber-300/40">
                    <span className="text-sm font-bold text-white">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-emerald-200/60 truncate">{user?.role || 'User'}</p>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200',
                    'text-rose-300 hover:bg-rose-500/10 hover:text-rose-200'
                  )}
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 p-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 ring-1 ring-amber-300/40">
                <span className="text-sm font-bold text-white">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
              <button
                onClick={onLogout}
                className={cn(
                  'p-2 rounded-lg transition-all duration-200',
                  'text-rose-300 hover:bg-rose-500/10 hover:text-rose-200'
                )}
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

/* ─────────────────────────────────────────────────────────────────── */
/* HEADER COMPONENT                                                     */
/* ─────────────────────────────────────────────────────────────────── */

interface HeaderProps {
  collapsed: boolean;
  onSidebarOpen: () => void;
  onThemeToggle: () => void;
  isDarkMode: boolean;
  notificationOpen: boolean;
  onNotificationToggle: () => void;
  userMenuOpen: boolean;
  onUserMenuToggle: () => void;
  theme: typeof lightTheme;
  user: any;
  onLogout: () => void;
  totalBadges: number;
  notifications: Notification[];
  location: any;
}

const Header = ({
  collapsed,
  onSidebarOpen,
  onThemeToggle,
  isDarkMode,
  notificationOpen,
  onNotificationToggle,
  userMenuOpen,
  onUserMenuToggle,
  theme,
  user,
  onLogout,
  totalBadges,
  notifications,
  location,
}: HeaderProps) => {
  return (
    <header
      className={cn(
        'flex-shrink-0 h-16 border-b border-gray-200 dark:border-border',
        'flex items-center px-4 md:px-6 sticky top-0 z-40 w-full',
        'bg-white dark:bg-background transition-colors duration-300'
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Mobile Menu Button */}
        <button
          className={cn('lg:hidden p-2 rounded-lg transition-colors', 'hover:bg-gray-100 dark:hover:bg-gray-800')}
          onClick={onSidebarOpen}
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Breadcrumb */}
        <div className="hidden sm:flex min-w-0 flex-1">
          <Breadcrumb pathname={location.pathname} theme={theme} />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-4">
        {/* Search - Hidden on mobile */}
        <button
          className={cn(
            'p-2 rounded-lg transition-colors hidden md:flex items-center justify-center',
            'hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
          aria-label="Search"
          title="Search"
        >
          <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Help - Hidden on mobile */}
        <div className="relative hidden md:block group">
          <button
            className={cn(
              'p-2 rounded-lg transition-colors flex items-center justify-center',
              'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            aria-label="Help"
            title="Help"
          >
            <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="absolute right-0 top-full mt-1 w-80 rounded-xl shadow-xl border border-gray-200 dark:border-border bg-white dark:bg-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Need Help?</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Welcome to Noneaa! Use the sidebar to navigate between modules such as Student Management, 
                Teachers, Attendance, and more. If you experience any issues or need assistance, 
                please don't hesitate to reach out to our support team.
              </p>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <a
                  href="mailto:support@noneaa.com"
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  support@noneaa.com
                </a>
                <a
                  href="tel:+254111276271"
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Phone className="w-4 h-4" />
                  +254 111 276 271
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onThemeToggle}
          className={cn(
            'p-2 rounded-lg transition-colors flex items-center justify-center',
            'hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Light mode' : 'Dark mode'}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-amber-500" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Notifications */}
        <div className="relative flex-shrink-0">
          <button
            onClick={onNotificationToggle}
            className={cn(
              'relative p-2 rounded-lg transition-colors flex items-center justify-center',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              notificationOpen && 'bg-gray-100 dark:bg-gray-800'
            )}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {totalBadges > 0 && (
              <span
                className={cn(
                  'absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold',
                  'animate-pulse',
                  theme.badge
                )}
              >
                {totalBadges > 9 ? '9+' : totalBadges}
              </span>
            )}
          </button>
          <NotificationDropdown
            isOpen={notificationOpen}
            onClose={() => onNotificationToggle()}
            notifications={notifications}
            totalBadges={totalBadges}
            theme={theme}
          />
        </div>

        {/* User Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={onUserMenuToggle}
            className={cn(
              'flex items-center gap-2 p-1.5 rounded-lg transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              userMenuOpen && 'bg-gray-100 dark:bg-gray-800'
            )}
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-gray-600 dark:text-gray-400 hidden sm:block transition-transform', userMenuOpen && 'rotate-180')} />
          </button>
          <UserMenuDropdown
            isOpen={userMenuOpen}
            onClose={() => onUserMenuToggle()}
            user={user}
            onLogout={onLogout}
            theme={theme}
          />
        </div>
      </div>
    </header>
  );
};

/* ─────────────────────────────────────────────────────────────────── */
/* MAIN DASHBOARD LAYOUT COMPONENT                                      */
/* ─────────────────────────────────────────────────────────────────── */

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  /* ─ Theme Management ─ */
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const theme = isDarkMode ? darkTheme : lightTheme;

  /* ─ Sidebar State ─ */
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? saved === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed.toString());
  }, [collapsed]);

  /* ─ UI State ─ */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  /* ─ Notifications ─ */
  const notifications: Notification[] = useMemo(
    () => [
      { id: 1, message: 'New student enrollment from Class 10A', time: '5 minutes ago' },
      { id: 2, message: 'Fee payment received: $5,000', time: '2 hours ago' },
      { id: 3, message: 'Teacher attendance incomplete', time: '1 hour ago' },
    ],
    []
  );

  const totalBadges = getTotalBadges();

  /* ─ Activity Tracker ─ */
  useEffect(() => {
    let lastActivityUpdate = 0;

    const sendActivityPing = async () => {
      const now = Date.now();
      if (now - lastActivityUpdate < 240000) return;
      lastActivityUpdate = now;

      try {
        // Use centralized refresh-capable implementation to avoid 401 retry loops.
        await updateActivity();
      } catch (error) {
        console.error('Activity update failed:', error);
      }
    };

    const interval = setInterval(sendActivityPing, 240000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendActivityPing();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', sendActivityPing);
    sendActivityPing();

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', sendActivityPing);
    };
  }, []);

  /* ─ Event Handlers ─ */
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const toggleMenuItem = useCallback((itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }, []);

  const toggleNotification = useCallback(() => {
    setNotificationOpen((prev) => !prev);
    setUserMenuOpen(false);
  }, []);

  const toggleUserMenu = useCallback(() => {
    setUserMenuOpen((prev) => !prev);
    setNotificationOpen(false);
  }, []);

  return (
    <div className={cn('flex h-screen bg-muted/40 dark:bg-background overflow-hidden transition-colors duration-300')}>
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        sidebarOpen={sidebarOpen}
        onCollapsedChange={setCollapsed}
        onSidebarOpenChange={setSidebarOpen}
        theme={theme}
        user={user}
        onLogout={handleLogout}
        expandedItems={expandedItems}
        onExpandItem={toggleMenuItem}
        location={location}
      />

      {/* Main Content */}
      <div
        className={cn(
          'flex flex-col flex-1 min-w-0 w-full transition-all duration-300 ease-in-out',
          'ml-0',
          collapsed ? 'lg:ml-20' : 'lg:ml-64',
        )}
      >
        {/* Header */}
        <Header
          collapsed={collapsed}
          onSidebarOpen={() => setSidebarOpen(true)}
          onThemeToggle={toggleTheme}
          isDarkMode={isDarkMode}
          notificationOpen={notificationOpen}
          onNotificationToggle={toggleNotification}
          userMenuOpen={userMenuOpen}
          onUserMenuToggle={toggleUserMenu}
          theme={theme}
          user={user}
          onLogout={handleLogout}
          totalBadges={totalBadges}
          notifications={notifications}
          location={location}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full min-w-0">
          <div className="animate-fade-in min-h-full">
            <div className={cn('w-full h-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8', theme.main.text)}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
