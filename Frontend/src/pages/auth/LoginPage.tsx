import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ArrowLeft, Building2, Shield, GraduationCap, Users, Check, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import PageLoader from '@/components/PageLoader';
import { cn } from '@/lib/utils';

type LoginUserType = 'admin' | 'super_admin' | 'teacher' | 'parent';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const roles = [
  { type: 'admin' as const, label: 'Administrator', icon: Building2, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  { type: 'teacher' as const, label: 'Teacher', icon: GraduationCap, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  { type: 'student' as const, label: 'Student', icon: Shield, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  { type: 'parent' as const, label: 'Parent', icon: Users, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
];

const MAX_CLIENT_ATTEMPTS = 3;
const DEFAULT_LOCKOUT_MINS = 3;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [userType, setUserType] = useState<LoginUserType>('admin');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [lockoutDurationMins, setLockoutDurationMins] = useState<number | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    if (!lockedUntil) {
      setCountdown(0);
      setLockoutDurationMins(null);
      setFailedAttempts(0);
      return;
    }

    const calcSecs = () => Math.max(0, Math.ceil((lockedUntil.getTime() - Date.now()) / 1000));
    setCountdown(calcSecs());

    const interval = setInterval(() => {
      const secs = calcSecs();
      setCountdown(secs);
      if (secs <= 0) {
        setLockedUntil(null);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countdown > 0) return;
    setSubmitError(null);

    const newFieldErrors: { email?: string; password?: string } = {};
    if (!formData.email.trim()) {
      newFieldErrors.email = 'Email address is required.';
    }
    if (!formData.password) {
      newFieldErrors.password = 'Password is required.';
    }
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }
    setFieldErrors({});

    try {
      console.log('[LoginPage] Attempting login for:', formData.email, 'as', userType);
      await login(formData.email, formData.password, userType);
      setLoginSuccess(true);
      setFailedAttempts(0);
      setTimeout(() => {
        switch (userType) {
          case 'super_admin':
          case 'admin':
            navigate('/school-admin/dashboard');
            break;
          case 'teacher':
            navigate('/teacher/portal');
            break;
          case 'parent':
            navigate('/parent/portal');
            break;
          default:
            navigate('/school-admin/dashboard');
        }
      }, 2000);
    } catch (error: unknown) {
      if (error instanceof Error && (error as Error & { lockedUntil?: string }).lockedUntil) {
        const lockUntilDate = new Date((error as Error & { lockedUntil: string }).lockedUntil);
        const secsRemaining = Math.max(0, (lockUntilDate.getTime() - Date.now()) / 1000);
        setLockoutDurationMins(Math.ceil(secsRemaining / 60));
        setLockedUntil(lockUntilDate);
        setFailedAttempts(0);
        setSubmitError(null);
      } else {
        const newFailed = failedAttempts + 1;
        setFailedAttempts(newFailed);

        if (newFailed === MAX_CLIENT_ATTEMPTS) {
          const lockUntil = new Date(Date.now() + DEFAULT_LOCKOUT_MINS * 60 * 1000);
          setLockoutDurationMins(DEFAULT_LOCKOUT_MINS);
          setLockedUntil(lockUntil);
          setSubmitError(null);
        } else {
          const errorMsg = getErrorMessage(error, 'Invalid email or password. Please try again.');
          setSubmitError(errorMsg);
        }
      }
    }
  };

  const selectedRole = roles.find(r => r.type === userType) ?? roles[0];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <PageLoader />

      {/* Background — dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -top-20 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-emerald-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '3s' }} />
      </div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzMuMzEzIDAgNi0yLjY4NyA2LTZzLTIuNjg3LTYtNi02LTYgMi42ODctNiA2IDIuNjg3IDYgNiA2em0wIDJjLTQuNDE4IDAtOC0zLjU4Mi04LThzMy41ODItOCA4LTggOCAzLjU4MiA4IDgtMy41ODIgOC04IDh6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-4xl mx-4">
        <div className="bg-white/[0.97] backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 overflow-hidden border border-white/20">

          {/* Login Success Overlay */}
          {loginSuccess && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl bg-white/95 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4 text-center px-6">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 animate-bounce">
                  <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Welcome Back!</h2>
                <p className="text-slate-500 text-sm tracking-widest animate-pulse">Redirecting to your dashboard...</p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row min-h-[560px]">

            {/* LEFT — Role Selector */}
            <div className="md:w-[45%] bg-gradient-to-br from-slate-50 to-blue-50/50 p-8 flex flex-col border-r border-slate-100">
              {/* Logo + Branding */}
              <div className="text-center mb-8">
                <div className="relative inline-block">
                  <img src="/Noneea-logo.jpg" alt="NONEAA" className="h-20 w-20 object-cover rounded-2xl mx-auto mb-3 shadow-lg ring-4 ring-white" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 border-2 border-white flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900">NONEAA</h2>
                <p className="text-xs text-slate-500 mt-0.5">Competency-Based Education Platform</p>
              </div>

              {/* Role selector */}
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Select Your Role</p>
                <div className="space-y-2.5">
                  {roles.map((role, index) => {
                    const Icon = role.icon;
                    const isSelected = userType === role.type;
                    return (
                      <button
                        key={role.type}
                        type="button"
                        onClick={() => setUserType(role.type)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group',
                          isSelected
                            ? `${role.bg} ${role.border} border-2 shadow-sm`
                            : 'bg-white border-2 border-transparent hover:border-slate-200 hover:shadow-sm'
                        )}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                          isSelected
                            ? `bg-gradient-to-r ${role.color} shadow-md`
                            : 'bg-slate-100 group-hover:bg-slate-200'
                        )}>
                          <Icon className={cn('w-5 h-5', isSelected ? 'text-white' : 'text-slate-500')} />
                        </div>
                        <span className={cn(
                          'font-semibold text-sm',
                          isSelected ? role.text : 'text-slate-700'
                        )}>
                          {role.label}
                        </span>
                        {isSelected && (
                          <div className={cn('ml-auto w-6 h-6 rounded-full flex items-center justify-center', `bg-gradient-to-r ${role.color}`)}>
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center mt-6">© 2026 NONEAA Education System</p>
            </div>

            {/* RIGHT — Form */}
            <div className="md:w-[55%] p-8 md:p-10 flex flex-col justify-center">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-2 h-2 rounded-full bg-gradient-to-r', selectedRole.color)} />
                  <span className={cn('text-xs font-semibold uppercase tracking-wider', selectedRole.text)}>
                    {selectedRole.label} Login
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
                <p className="text-slate-500 mt-1 text-sm">Sign in to access your dashboard</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Lockout countdown banner */}
                {countdown > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col items-center gap-2 text-center">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-semibold">Account Temporarily Locked</span>
                    </div>
                    <p className="text-xs text-amber-600 leading-relaxed">
                      Too many failed login attempts.
                      {lockoutDurationMins != null && (
                        <> Please wait{' '}
                          <span className="font-semibold">
                            {lockoutDurationMins} {lockoutDurationMins === 1 ? 'minute' : 'minutes'}
                          </span>
                          {' '}before trying again.
                        </>
                      )}
                    </p>
                    <div className="text-4xl font-mono font-bold text-amber-700 tabular-nums leading-none py-1">
                      {formatCountdown(countdown)}
                    </div>
                    <p className="text-xs text-amber-500">
                      {Math.floor(countdown / 60) > 0
                        ? 'minutes and seconds remaining'
                        : 'seconds remaining'}
                    </p>
                  </div>
                )}

                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3.5 rounded-xl flex items-center gap-2">
                    <span className="text-red-400">⚠</span>
                    {submitError}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    className={cn(
                      'w-full px-4 py-3 border-2 rounded-xl text-sm bg-slate-50 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                      fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    )}
                    placeholder="your.email@school.ac.ke"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <span>⚠</span> {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                      }}
                      className={cn(
                        'w-full px-4 py-3 pr-12 border-2 rounded-xl text-sm bg-slate-50 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                        fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'
                      )}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <span>⚠</span> {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="remember" className="text-sm text-slate-500">Remember me</label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || countdown > 0}
                  className={cn(
                    'w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg',
                    countdown > 0
                      ? 'bg-slate-400 cursor-not-allowed'
                      : `bg-gradient-to-r ${selectedRole.color} hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]`,
                    (isLoading) && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  {isLoading ? (
                    <>
                      <span>Please wait...</span>
                    </>
                  ) : countdown > 0 ? (
                    <>
                      <Clock className="w-5 h-5" />
                      <span>Try again in {formatCountdown(countdown)}</span>
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              {/* Bottom links */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors font-medium"
                  >
                    Forgot password?
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
