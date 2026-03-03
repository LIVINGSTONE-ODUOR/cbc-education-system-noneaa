import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, EyeOff, Lock, Mail, ArrowRight, Shield, Loader2, 
  AlertCircle, Key, User
} from 'lucide-react';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: 'superadminlevi@noneaa.co.ke',
    password: 'hashedbossie'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(formData.email, formData.password);
      toast({
        title: 'Welcome Back',
        description: 'Successfully signed in to your admin account.',
      });
      navigate('/admin-login');
    } catch (error: unknown) {
      toast({
        title: 'Sign In Failed',
        description: getErrorMessage(error, 'Invalid email or password. Please try again.'),
        variant: 'destructive',
      });
    }
  };

  const handleDemoLogin = () => {
    setFormData({
      email: 'superadminlevi@noneaa.co.ke',
      password: 'hashedbossie'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '700ms'}}></div>
        <div className="absolute top-1/2 right-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '300ms'}}></div>
      </div>

      {/* Floating Decorative Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-16 left-10 text-blue-400/20 animate-float">
          <Shield className="w-14 h-14" />
        </div>
        <div className="absolute bottom-16 right-10 text-cyan-400/20 animate-float-slow" style={{animationDelay: '500ms'}}>
          <Key className="w-12 h-12" />
        </div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl shadow-black/30 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40 transition-all duration-300 hover:scale-110 hover:rotate-3 hover:shadow-blue-400/60">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">CBC Education Admin</h1>
            <p className="text-slate-300 text-sm">Secure Administrator Portal</p>
          </div>

          {/* Demo Credentials */}
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Key className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-blue-300 uppercase">Demo Credentials</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 rounded p-2">
                <span className="text-slate-400">Email:</span>
                <span className="text-white ml-1">superadminlevi@noneaa.co.ke</span>
              </div>
              <div className="bg-white/5 rounded p-2">
                <span className="text-slate-400">Password:</span>
                <span className="text-white ml-1">hashedbossie</span>
              </div>
            </div>
            <button
              onClick={handleDemoLogin}
              className="mt-2 text-xs text-blue-300 hover:text-blue-200 underline font-medium transition-colors duration-200"
            >
              Fill Demo Credentials
            </button>
          </div>

          {/* Form */}
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
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/15 transition-all duration-300"
                placeholder="superadminlevi@noneaa.co.ke"
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
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/15 transition-all duration-300"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none animate-glow-pulse"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>
          </form>

          {/* Error Message */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">
              For demo purposes, use the credentials above. In production, this would connect to your school's authentication system.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/20 text-center">
            <p className="text-xs text-slate-400">
              © 2024 CBC Education System • Secure Access Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
