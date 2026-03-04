import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, ArrowLeft, Building2, Shield, GraduationCap, Users, Check } from 'lucide-react';
import loginBg from '@/assets/hero-bg.png';

type LoginUserType = 'admin' | 'super_admin' | 'teacher' | 'parent';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const roles = [
  { type: 'admin' as const, label: 'Administrator', icon: Building2 },
  { type: 'super_admin' as const, label: 'Super Admin', icon: Shield },
  { type: 'teacher' as const, label: 'Teacher', icon: GraduationCap },
  { type: 'parent' as const, label: 'Parent', icon: Users },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [userType, setUserType] = useState<LoginUserType>('admin');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      console.log('[LoginPage] Attempting login for:', formData.email, 'as', userType);
      await login(formData.email, formData.password, userType);
      toast({ title: 'Welcome Back', description: 'Successfully signed in.' });
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
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error, 'Invalid email or password. Please try again.');
      setSubmitError(errorMsg);
      toast({ title: 'Sign In Failed', description: errorMsg, variant: 'destructive' });
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) { navigate(-1); return; }
    navigate('/');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px]" />

      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-1/2 w-80 h-80 bg-primary/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-4xl mx-4 animate-fade-in-up">
        <div className="glass-card rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex flex-col md:flex-row">

            {/* LEFT – Roles */}
            <div className="md:w-[45%] bg-primary/[0.04] p-8 flex flex-col animate-slide-in-left">
              {/* Logo */}
              <div className="text-center mb-8">
                <img src="/Noneea-logo.jpg" alt="Noneea" className="h-24 w-24 object-cover rounded-full mx-auto mb-3 shadow-lg" />
                <h2 className="text-lg font-semibold text-foreground">Education System</h2>
              </div>

              {/* Role selector */}
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-4">Select Your Role</p>
                <div className="space-y-3">
                  {roles.map((role, index) => {
                    const Icon = role.icon;
                    const isSelected = userType === role.type;
                    return (
                      <button
                        key={role.type}
                        type="button"
                        onClick={() => setUserType(role.type)}
                        className={`role-btn animate-fade-in-down ${isSelected ? 'role-btn-selected' : ''}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {role.label}
                        </span>
                        {isSelected && (
                          <Check className="w-5 h-5 text-primary ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-6">© 2026 CBE Education System</p>
            </div>

            {/* RIGHT – Form */}
            <div className="%] p-8 md:p-10md:w-[55 flex flex-col justify-center animate-slide-in-right">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Sign in</h1>
                <p className="text-muted-foreground mt-1">to access your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {submitError && (
                  <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-lg animate-shake">
                    {submitError}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="login-input"
                    placeholder="super_admin@gmail.com"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="login-input pr-12"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" className="rounded border-border text-primary focus:ring-ring" />
                  <label htmlFor="remember" className="text-sm text-muted-foreground">Remember me</label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold 
                    hover:opacity-90 active:scale-[0.98] transition-all duration-200 
                    disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              {/* Bottom section with Forgot password and Back button */}
              <div className="mt-6 pt-6 border-t border-border/30">
                <div className="flex flex-col gap-4">
                  <button 
                    type="button" 
                    className="text-sm text-primary hover:underline transition-colors text-left w-fit"
                  >
                    Forgot password?
                  </button>
                  
                  {/* Back Button with glassmorphism background - aligned left */}
                  <div className="relative group w-fit">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-white/20 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm group-hover:shadow-md transition-shadow duration-300" />
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F3F6FA] border border-gray-200/50 text-gray-700 font-medium text-sm hover:bg-[#E8ECF2] hover:shadow-md transition-all duration-200"
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
    </div>
  );
}
