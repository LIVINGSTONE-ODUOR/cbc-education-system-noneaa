import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, EyeOff, Lock, Mail, ArrowRight, Shield, Loader2, 
  GraduationCap, Users, Building2, Sparkles, ArrowLeft
} from 'lucide-react';

type LoginUserType = 'admin' | 'teacher' | 'parent';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [userType, setUserType] = useState<LoginUserType>('admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await login(formData.email, formData.password);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      toast({
        title: 'Welcome Back',
        description: `Successfully signed in.`,
      });
      
      // Use user selection since login doesn't return user object directly
      const userRole = userType;
      
      switch (userRole) {
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
      toast({
        title: 'Sign In Failed',
        description: getErrorMessage(error, 'Invalid email or password. Please try again.'),
        variant: 'destructive',
      });
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden p-4">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '700ms'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '300ms'}}></div>
      </div>

      {/* Floating Decorative Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 text-blue-400/25 animate-float">
          <GraduationCap className="w-16 h-16" />
        </div>
        <div className="absolute top-40 right-12 text-indigo-400/25 animate-float-slow" style={{animationDelay: '300ms'}}>
          <Users className="w-12 h-12" />
        </div>
        <div className="absolute bottom-24 left-20 text-cyan-400/25 animate-float-slower" style={{animationDelay: '700ms'}}>
          <Building2 className="w-14 h-14" />
        </div>
        <div className="absolute bottom-40 right-24 text-blue-300/20 animate-float" style={{animationDelay: '500ms'}}>
          <Sparkles className="w-10 h-10" />
        </div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-4xl animate-fade-in">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl shadow-black/30 p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-8">

            {/* Branding Section */}
            <div className="space-y-8 animate-slide-in-left">
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40 transition-all duration-300 hover:scale-110 hover:rotate-3 hover:shadow-blue-400/60">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">CBC Education System</h1>
                <p className="text-blue-200 text-lg">Secure Access Portal</p>
              </div>

              {/* User Type Selection */}
              <div className="space-y-4">
                <p className="text-xs text-blue-300 uppercase font-semibold tracking-widest">Select Your Role</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'admin', label: 'Administrator', icon: Building2, color: 'from-blue-500 to-blue-700' },
                    { type: 'teacher', label: 'Teacher', icon: GraduationCap, color: 'from-indigo-500 to-indigo-700' },
                    { type: 'parent', label: 'Parent', icon: Users, color: 'from-cyan-500 to-cyan-700' }
                  ].map((role: { type: LoginUserType; label: string; icon: typeof Building2; color: string }) => (
                    <button
                      key={role.type}
                      onClick={() => setUserType(role.type)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                        userType === role.type
                          ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/30'
                          : 'border-white/20 bg-white/5 hover:border-blue-400/50 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-8 h-8 bg-gradient-to-br ${role.color} rounded-lg flex items-center justify-center mx-auto mb-2 shadow-md transition-transform duration-300 ${userType === role.type ? 'scale-110' : ''}`}>
                        <role.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className={`text-xs font-medium transition-colors duration-300 ${userType === role.type ? 'text-blue-200' : 'text-white/70'}`}>{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <p className="text-xs text-blue-300 uppercase font-semibold tracking-widest">Features</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { icon: Sparkles, label: 'Real-time Data' },
                    { icon: Shield, label: 'Secure Access' },
                    { icon: Users, label: 'Role-based' },
                    { icon: GraduationCap, label: 'CBC Compliant' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-blue-200 transition-transform duration-200 hover:translate-x-1">
                      <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Login Form */}
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-white mb-3 transition-all duration-200 hover:-translate-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </button>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-blue-200">Sign in to your {userType} account</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <Mail className="w-4 h-4 text-blue-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-4 bg-white/10 border border-white/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/15 transition-all duration-300 text-sm"
                    placeholder="your@email.com"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <Lock className="w-4 h-4 text-blue-400" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-4 bg-white/10 border border-white/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/15 transition-all duration-300 text-sm"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none animate-glow-pulse"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="animate-spin w-5 h-5" />
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <span>Sign In</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="text-center">
                <div className="border-t border-white/20 pt-4">
                  <p className="text-xs text-slate-400">
                    © 2026 CBC Education System • Secure Access Only
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
