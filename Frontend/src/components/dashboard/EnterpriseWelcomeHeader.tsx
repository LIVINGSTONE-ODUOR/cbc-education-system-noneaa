import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Clock, Calendar } from 'lucide-react';

interface GreetingConfig {
  emoji: string;
  greeting: string;
  timeRange: { start: number; end: number };
}

const GREETING_CONFIGS: GreetingConfig[] = [
  { emoji: '🌙', greeting: 'Good Night', timeRange: { start: 0, end: 5 } },
  { emoji: '🌅', greeting: 'Good Morning', timeRange: { start: 5, end: 12 } },
  { emoji: '☀️', greeting: 'Good Afternoon', timeRange: { start: 12, end: 17 } },
  { emoji: '🌇', greeting: 'Good Evening', timeRange: { start: 17, end: 21 } },
  { emoji: '🌙', greeting: 'Good Night', timeRange: { start: 21, end: 24 } },
];

const getGreetingConfig = (): GreetingConfig => {
  const hour = new Date().getHours();
  return GREETING_CONFIGS.find(
    (config) => hour >= config.timeRange.start && hour < config.timeRange.end
  ) || GREETING_CONFIGS[1];
};

const EnterpriseWelcomeHeader: React.FC = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState<GreetingConfig>(getGreetingConfig());
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('');

  useEffect(() => {
    // Update greeting every minute
    const greetingInterval = setInterval(() => {
      setGreeting(getGreetingConfig());
    }, 60000);

    // Update time every second
    const timeInterval = setInterval(() => {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const formattedTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentDateTime(`${formattedDate} • ${formattedTime}`);
    }, 1000);

    // Calculate current academic year
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    // Academic year typically starts in September (month 8)
    const academicYearStart = month >= 8 ? year : year - 1;
    setAcademicYear(`${academicYearStart}/${academicYearStart + 1}`);

    // Set initial date/time
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setCurrentDateTime(`${formattedDate} • ${formattedTime}`);

    return () => {
      clearInterval(greetingInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const motivationalMessages = [
    "Welcome back to your school. Here's what's happening today.",
    "Let's make today another productive day for your institution.",
    "Everything is running smoothly. Time to make an impact.",
    "Your school awaits. Let's accomplish great things today.",
    "Dashboard ready. Your leadership starts here.",
  ];

  const motivationalMessage =
    motivationalMessages[
      Math.floor(Math.random() * motivationalMessages.length)
    ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 shadow-lg">
      {/* Glassmorphism Background Elements */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-32 -bottom-32 h-64 w-64 rounded-full bg-indigo-300/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Top Section: Logo, School Info, Current Time */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* School Logo or Avatar */}
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              {user?.schoolLogo ? (
                <img
                  src={user.schoolLogo}
                  alt={user?.schoolName || 'School'}
                  className="h-14 w-14 rounded-lg object-cover"
                />
              ) : (
                <Building2 className="h-8 w-8 text-white" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white/90">
                {user?.schoolName || 'Your School'}
              </h2>
              <p className="text-sm text-white/70">Academic Year {academicYear}</p>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-white/70 capitalize">
                {user?.role?.replace('_', ' ') || 'Administrator'}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm overflow-hidden border border-white/30">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.firstName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-600 text-white font-semibold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Greeting Section */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-4xl">{greeting.emoji}</span>
            <h1 className="text-4xl font-bold text-white">
              {greeting.greeting}, <span className="text-blue-100">{user?.firstName}!</span>
            </h1>
          </div>
          <p className="text-base text-white/80">{motivationalMessage}</p>
        </div>

        {/* Date & Time Section */}
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Calendar className="h-4 w-4 text-white/70" />
            <span className="text-white/80">{currentDateTime}</span>
          </div>

          {/* Optional: Quick Stats Pills */}
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Clock className="h-4 w-4 text-white/70" />
            <span className="text-white/80">All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseWelcomeHeader;
