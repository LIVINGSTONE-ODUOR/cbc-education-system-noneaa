import { useEffect, useState } from 'react';
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

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    if (saved) return saved === 'dark';
    return false;
  });

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? saved === 'true' : false;
  });

  const theme = isDarkMode ? darkTheme : lightTheme;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const notifications: Notification[] = [
    { id: 1, message: 'New student enrollment from Class 10A', time: '5 minutes ago' },
    { id: 2, message: 'Fee payment received: $5,000', time: '2 hours ago' },
    { id: 3, message: 'Teacher attendance incomplete', time: '1 hour ago' },
  ];

  const totalBadges = getTotalBadges();

  useEffect(() => {
    localStorage.setItem('theme-mode', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed.toString());
  }, [collapsed]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMenuItem = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const isMenuItemActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className={cn('min-h-screen flex', theme.main.bg)}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col transform transition-all duration-300 border-r',
          collapsed ? 'w-16' : 'w-64',
          theme.sidebar.bg,
          theme.sidebar.border,
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header with toggle */}
        <div
          className={cn(
            'flex-shrink-0 border-b flex items-center justify-between',
            collapsed ? 'px-3 py-4' : 'px-6 py-6',
            theme.sidebar.logoSection,
            theme.sidebar.border
          )}
        >
          {!collapsed && (
            <Link to="/school-admin/dashboard" className="flex items-center gap-2">
              <img src="/Noneea-logo.jpg" alt="Noneea" className="w-10 h-10 object-cover rounded-full flex-shrink-0" />
              <span className={cn('font-bold text-lg', theme.sidebar.text)}>
                Edu Stack
              </span>
            </Link>
          )}
          
          {collapsed && (
            <div className="w-full flex justify-center">
              <img src="/Noneea-logo.jpg" alt="Noneea" className="w-10 h-10 object-cover rounded-full flex-shrink-0" />
            </div>
          )}

          <button
            className={cn(
              'p-1 h-8 w-8 rounded-lg transition-colors hidden lg:flex items-center justify-center',
              theme.sidebar.hoverBg
            )}
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            className={cn('lg:hidden transition-colors', theme.sidebar.hoverBg)}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuSections.map((section) => (
            <div key={section.title} className="mb-6">
              {!collapsed && (
                <div
                  className={cn(
                    'px-4 text-xs font-semibold uppercase tracking-wider mb-2',
                    theme.sidebar.textSecondary
                  )}
                >
                  {section.title}
                </div>
              )}

              <div className="space-y-1 px-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isMenuItemActive(item.href);
                  const isExpanded = expandedItems[item.id];
                  const hasSubmenu = Boolean(item.submenu?.length);

                  return (
                    <div key={item.id}>
                      {hasSubmenu ? (
                        <button
                          onClick={() => toggleMenuItem(item.id)}
                          className={cn(
                            'w-full flex items-center justify-between rounded-lg text-sm transition-colors h-10',
                            collapsed ? 'px-2' : 'px-3',
                            isActive
                              ? cn(theme.sidebar.activeBg, theme.sidebar.text, 'font-medium border-r-2 border-blue-700')
                              : cn(
                                  theme.sidebar.text,
                                  'opacity-70',
                                  theme.sidebar.hoverBg,
                                  'hover:opacity-100'
                                )
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-5 h-5')} />
                            {!collapsed && <span>{item.label}</span>}
                          </div>
                          
                          {!collapsed && (
                            <div className="flex items-center gap-2">
                              {item.badge && (
                                <span
                                  className={cn(
                                    'flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold',
                                    theme.badge
                                  )}
                                >
                                  {item.badge}
                                </span>
                              )}
                              <ChevronDown
                                className={cn(
                                  'w-4 h-4 transition-transform duration-200 flex-shrink-0',
                                  isExpanded ? 'rotate-180' : 'rotate-0'
                                )}
                              />
                            </div>
                          )}
                          
                          {collapsed && item.badge && (
                            <span
                              className={cn(
                                'absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] font-bold',
                                theme.badge
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      ) : (
                        <Link
                          to={item.href}
                          className={cn(
                            'flex items-center justify-between rounded-lg text-sm transition-colors h-10 relative',
                            collapsed ? 'px-2' : 'px-3',
                            isActive
                              ? cn(theme.sidebar.activeBg, theme.sidebar.text, 'font-medium border-r-2 border-blue-700')
                              : cn(
                                  theme.sidebar.text,
                                  'opacity-70',
                                  theme.sidebar.hoverBg,
                                  'hover:opacity-100'
                                )
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-5 h-5')} />
                            {!collapsed && <span>{item.label}</span>}
                          </div>
                          
                          {!collapsed && item.badge && (
                            <span
                              className={cn(
                                'flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold flex-shrink-0',
                                theme.badge
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                          
                          {collapsed && item.badge && (
                            <span
                              className={cn(
                                'absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] font-bold',
                                theme.badge
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )}

                      {hasSubmenu && isExpanded && !collapsed && (
                        <div className={cn('mt-1 ml-4 space-y-1 border-l pl-3', theme.sidebar.border)}>
                          {item.submenu?.map((subitem) => {
                            const isSubActive = location.pathname === subitem.href;
                            return (
                              <Link
                                key={subitem.id}
                                to={subitem.href}
                                className={cn(
                                  'flex items-center gap-3 px-4 py-2 text-xs rounded-lg transition-colors',
                                  isSubActive
                                    ? cn(theme.sidebar.activeBg, theme.sidebar.text)
                                    : cn(
                                        theme.sidebar.text,
                                        'opacity-60',
                                        theme.sidebar.hoverBg,
                                        'hover:opacity-100'
                                      )
                                )}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                                <span>{subitem.label}</span>
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

        {/* User section */}
        <div className={cn('flex-shrink-0 p-2 border-t', theme.sidebar.border)}>
          {!collapsed ? (
            <>
              <div
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer mb-3',
                  theme.sidebar.hoverBg
                )}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', theme.sidebar.text)}>
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className={cn('text-xs truncate', theme.sidebar.textSecondary)}>{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors',
                  'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                )}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                )}
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div 
        className={cn(
          'flex-1 flex flex-col min-w-0 w-full',
          collapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        <header
          className={cn(
            'flex-shrink-0 h-16 border-b flex items-center px-4 lg:px-8 sticky top-0 z-40',
            theme.header.bg,
            theme.header.border
          )}
        >
          <div className="flex items-center gap-4 flex-1">
            <button
              className={cn('lg:hidden p-2 rounded-lg transition-colors', theme.header.buttonHover)}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:block">
              <Breadcrumb pathname={location.pathname} theme={theme} />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button
              className={cn('p-2 rounded-lg transition-colors hidden md:flex', theme.header.buttonHover)}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              className={cn('p-2 rounded-lg transition-colors hidden md:flex', theme.header.buttonHover)}
              aria-label="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <button
              onClick={toggleTheme}
              className={cn('p-2 rounded-lg transition-colors', theme.header.buttonHover)}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-blue-600" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className={cn('relative p-2 rounded-lg transition-colors', theme.header.buttonHover)}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {totalBadges > 0 && (
                  <span
                    className={cn(
                      'absolute top-1 right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold',
                      theme.badge
                    )}
                  >
                    {totalBadges > 9 ? '9+' : totalBadges}
                  </span>
                )}
              </button>
              <NotificationDropdown
                isOpen={notificationOpen}
                onClose={() => setNotificationOpen(false)}
                notifications={notifications}
                totalBadges={totalBadges}
                theme={theme}
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={cn('flex items-center gap-2 p-1 rounded-lg transition-colors', theme.header.buttonHover)}
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </span>
                </div>
              </button>
              <UserMenuDropdown
                isOpen={userMenuOpen}
                onClose={() => setUserMenuOpen(false)}
                user={user}
                onLogout={handleLogout}
                theme={theme}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="animate-fade-in">
            <div className={theme.main.text}>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
