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
} from 'lucide-react';

// Types
import { DashboardLayoutProps, Notification } from '@/types/dashboard';

// Config
import { lightTheme, darkTheme } from '@/config/theme';
import { menuSections, getTotalBadges } from '@/config/menuData';

// Components
import Breadcrumb from './Breadcrumb';
import NotificationDropdown from './NotificationDropdown';
import UserMenuDropdown from './UserMenuDropdown';

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
          'border-r border-gray-200 dark:border-gray-800',
          collapsed ? 'w-20' : 'w-64',
          theme.sidebar.bg,
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header Section */}
        <div
          className={cn(
            'flex-shrink-0 border-b border-gray-200 dark:border-gray-800',
            'flex items-center justify-between gap-3',
            collapsed ? 'px-3 py-5' : 'px-5 py-6'
          )}
        >
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-shadow">
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
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">CBE</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Education</p>
              </div>
            </Link>
          )}

          {collapsed && (
            <Link to="/dashboard" className="w-full flex justify-center hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                <Home className="w-5 h-5 text-white" />
              </div>
            </Link>
          )}

          {/* Collapse Toggle - Desktop only */}
          <button
            className={cn(
              'hidden lg:flex p-2 rounded-lg transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            onClick={() => onCollapsedChange(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Close Button - Mobile only */}
          <button
            className={cn('lg:hidden p-2 rounded-lg transition-colors', 'hover:bg-gray-100 dark:hover:bg-gray-800')}
            onClick={() => onSidebarOpenChange(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {menuSections.map((section) => (
            <div key={section.title} className="space-y-2">
              {!collapsed && (
                <div className="px-3 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
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
                                  'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                                  'border-r-2 border-blue-600 shadow-sm'
                                )
                              : cn(
                                  'text-gray-700 dark:text-gray-300',
                                  'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                                )
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-blue-600 dark:text-blue-400')} />
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
                                  'w-4 h-4 transition-transform duration-200 text-gray-400',
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
                                  'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                                  'border-r-2 border-blue-600 shadow-sm'
                                )
                              : cn(
                                  'text-gray-700 dark:text-gray-300',
                                  'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                                )
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-blue-600 dark:text-blue-400')} />
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
                        <div className="mt-1 ml-4 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-3 py-1">
                          {item.submenu?.map((subitem) => {
                            const isSubActive = location.pathname === subitem.href;
                            return (
                              <Link
                                key={subitem.id}
                                to={subitem.href}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-all duration-200',
                                  isSubActive
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
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
        <div className={cn('flex-shrink-0 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50')}>
          {!collapsed ? (
            <>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.role || 'User'}</p>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200',
                    'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  )}
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 p-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
              <button
                onClick={onLogout}
                className={cn(
                  'p-2 rounded-lg transition-all duration-200',
                  'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
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
        'flex-shrink-0 h-16 border-b border-gray-200 dark:border-gray-800',
        'flex items-center px-4 md:px-6 sticky top-0 z-40 w-full',
        'bg-white dark:bg-gray-950 transition-colors duration-300'
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
        <button
          className={cn(
            'p-2 rounded-lg transition-colors hidden md:flex items-center justify-center',
            'hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
          aria-label="Help"
          title="Help"
        >
          <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

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
            <Moon className="w-5 h-5 text-slate-600" />
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

    const updateActivity = async () => {
      const now = Date.now();
      if (now - lastActivityUpdate < 240000) return;
      lastActivityUpdate = now;

      try {
        const token = localStorage.getItem('cbe_access_token');
        if (token) {
          await fetch('/api/users/me/update-activity', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        }
      } catch (error) {
        console.error('Activity update failed:', error);
      }
    };

    const interval = setInterval(updateActivity, 240000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', updateActivity);
    updateActivity();

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', updateActivity);
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
    <div className={cn('flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-300')}>
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
