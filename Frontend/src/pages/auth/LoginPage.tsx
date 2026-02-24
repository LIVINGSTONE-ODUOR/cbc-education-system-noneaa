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
  const { login, isLoading } = useAuth();
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
      await login(formData.email, formData.password);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      toast({
        title: 'Welcome Back',
        description: `Successfully signed in as ${userType}.`,
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

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Subtle Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200/50 to-gray-300/50"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gray-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 text-gray-400/20">
          <GraduationCap className="w-16 h-16" />
        </div>
        <div className="absolute top-40 right-10 text-gray-400/20">
          <Users className="w-12 h-12" />
        </div>
        <div className="absolute bottom-20 left-20 text-gray-400/20">
          <Building2 className="w-14 h-14" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative w-full max-w-4xl mx-4">
        {/* Left Side - Branding */}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Branding Section */}
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">CBC Education System</h1>
                <p className="text-gray-600 text-lg">Secure Access Portal</p>
              </div>

              {/* User Type Selection */}
              <div className="space-y-4">
                <p className="text-sm text-gray-500 uppercase font-semibold tracking-wide">Select Your Role</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'admin', label: 'Administrator', icon: Building2, color: 'from-gray-800 to-gray-900' },
                    { type: 'teacher', label: 'Teacher', icon: GraduationCap, color: 'from-gray-700 to-gray-800' },
                    { type: 'parent', label: 'Parent', icon: Users, color: 'from-gray-600 to-gray-700' }
                  ].map((role: { type: LoginUserType; label: string; icon: typeof Building2; color: string }) => (
                    <button
                      key={role.type}
                      onClick={() => setUserType(role.type)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        userType === role.type 
                          ? 'border-gray-300 bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 bg-gradient-to-br ${role.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                        <role.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <p className="text-sm text-gray-500 uppercase font-semibold tracking-wide">Features</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Sparkles className="w-4 h-4 text-gray-500" />
                    <span>Real-time Data</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <span>Secure Access</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>Role-based</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <GraduationCap className="w-4 h-4 text-gray-500" />
                    <span>CBC Compliant</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-600">Sign in to your {userType} account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                    <Mail className="w-5 h-5" />
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-4 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all text-sm"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                    <Lock className="w-5 h-5" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-4 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all text-sm"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
              <div className="text-center space-y-4">
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500">
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
