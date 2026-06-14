import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  GraduationCap, Users, Building2, Shield, CheckCircle2, 
  ArrowRight, Sparkles, Star, Rocket, Globe, 
  Calendar, MessageSquare, BarChart3, Users2, 
  BookOpen, Award, Zap, Target, Eye, EyeOff
} from 'lucide-react';
import PageLoader from '@/components/PageLoader';

export default function GetStartedPage() {
  const navigate = useNavigate();
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolCode: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    contactPhone: '',
    schoolType: 'Primary',
    yearEstablished: '',
    studentCount: '',
    county: '',
    subCounty: '',
    ward: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to the new admin registration page with step components
    navigate('/admin-register');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <PageLoader />
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
        <div className="absolute top-1/3 right-1/3 text-gray-400/20">
          <Shield className="w-12 h-12" />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CBE Education System</h1>
              <p className="text-gray-600 text-sm">Transforming Education Together</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Back to Home
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Benefits */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">Get Started Today</h2>
                  <p className="text-gray-600 text-lg">Join hundreds of schools transforming their education management</p>
                </div>
              </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: GraduationCap, label: 'CBE Compliant', color: 'from-gray-800 to-gray-900' },
                { icon: Users, label: 'Parent Portal', color: 'from-gray-700 to-gray-800' },
                { icon: Shield, label: 'Secure Platform', color: 'from-gray-600 to-gray-700' },
                { icon: BarChart3, label: 'Real Analytics', color: 'from-gray-500 to-gray-600' },
                { icon: Globe, label: 'Cloud Based', color: 'from-gray-400 to-gray-500' },
                { icon: Calendar, label: 'Smart Scheduling', color: 'from-gray-300 to-gray-400' },
                { icon: MessageSquare, label: 'Communication', color: 'from-gray-200 to-gray-300' },
                { icon: Award, label: 'Quality Assured', color: 'from-gray-100 to-gray-200' }
              ].map((benefit, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 hover:bg-white transition-all">
                  <div className={`w-10 h-10 bg-gradient-to-br ${benefit.color} rounded-lg flex items-center justify-center mb-3`}>
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-gray-800 font-semibold text-sm">{benefit.label}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { number: '500+', label: 'Schools', icon: Building2 },
                { number: '50K+', label: 'Students', icon: GraduationCap },
                { number: '99.9%', label: 'Uptime', icon: Shield }
              ].map((stat, index) => (
                <div key={index} className="bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="w-5 h-5 text-gray-600" />
                    <span className="text-2xl font-bold text-gray-900">{stat.number}</span>
                  </div>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-8">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Join Our Platform</h3>
                <p className="text-gray-600">Start your journey with CBE Education System</p>
              </div>

              {/* User Type Selection */}
              <div className="flex gap-4 bg-[#dfe5f0] rounded-xl p-2">
                <button
                  onClick={() => setIsSchoolAdmin(true)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    isSchoolAdmin 
                      ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Building2 className="w-5 h-5" />
                    <span className="text-sm">School Admin</span>
                  </div>
                </button>
                <button
                  onClick={() => setIsSchoolAdmin(false)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    !isSchoolAdmin 
                      ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-5 h-5" />
                    <span className="text-sm">Teacher/Parent</span>
                  </div>
                </button>
              </div>

              {isSchoolAdmin ? (
                /* School Admin Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schoolName" className="text-gray-700">School Name *</Label>
                      <Input
                        id="schoolName"
                        name="schoolName"
                        value={formData.schoolName}
                        onChange={handleChange}
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        placeholder="e.g., Sunshine Academy"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schoolCode" className="text-gray-700">School Code *</Label>
                      <Input
                        id="schoolCode"
                        name="schoolCode"
                        value={formData.schoolCode}
                        onChange={handleChange}
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        placeholder="e.g., 12345"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminName" className="text-gray-700">Admin Name *</Label>
                      <Input
                        id="adminName"
                        name="adminName"
                        value={formData.adminName}
                        onChange={handleChange}
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        placeholder="e.g., John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail" className="text-gray-700">Admin Email *</Label>
                      <Input
                        id="adminEmail"
                        name="adminEmail"
                        type="email"
                        value={formData.adminEmail}
                        onChange={handleChange}
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        placeholder="admin@school.edu"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminPassword" className="text-gray-700">Password *</Label>
                      <div className="relative">
                        <Input
                          id="adminPassword"
                          name="adminPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.adminPassword}
                          onChange={handleChange}
                          required
                          className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 pr-10"
                          placeholder="Create a strong password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 pr-10"
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone" className="text-gray-700">Contact Phone *</Label>
                      <Input
                        id="contactPhone"
                        name="contactPhone"
                        type="tel"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        placeholder="+254 7XX XXX XXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schoolType" className="text-gray-700">School Type *</Label>
                      <select
                        id="schoolType"
                        name="schoolType"
                        value={formData.schoolType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      >
                        <option value="Primary">Primary School</option>
                        <option value="Secondary">Secondary School</option>
                        <option value="Mixed">Mixed School</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="yearEstablished" className="text-gray-700">Year Established</Label>
                      <Input
                        id="yearEstablished"
                        name="yearEstablished"
                        type="number"
                        value={formData.yearEstablished}
                        onChange={handleChange}
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        placeholder="e.g., 2005"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentCount" className="text-gray-700">Student Count</Label>
                      <Input
                        id="studentCount"
                        name="studentCount"
                        type="number"
                        value={formData.studentCount}
                        onChange={handleChange}
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        placeholder="e.g., 500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="county" className="text-gray-700">County</Label>
                      <Input
                        id="county"
                        name="county"
                        value={formData.county}
                        onChange={handleChange}
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        placeholder="e.g., Nairobi"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subCounty" className="text-gray-700">Sub-County</Label>
                      <Input
                        id="subCounty"
                        name="subCounty"
                        value={formData.subCounty}
                        onChange={handleChange}
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        placeholder="e.g., Westlands"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ward" className="text-gray-700">Ward</Label>
                      <Input
                        id="ward"
                        name="ward"
                        value={formData.ward}
                        onChange={handleChange}
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        placeholder="e.g., Parklands"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-gray-600 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>Ministry of Education compliant</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 text-sm">
                      <Shield className="w-5 h-5 text-gray-600" />
                      <span>Secure data protection</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 text-sm">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      <span>24/7 technical support</span>
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Rocket className="w-5 h-5" />
                      <span>Get Started</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </Button>
                </form>
              ) : (
                /* Teacher/Parent Form */
                <div className="text-center space-y-6">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Join as Teacher or Parent</h3>
                    <p className="text-gray-600">Connect with your school's CBE Education System</p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-[#dfe5f0] rounded-lg p-4">
                      <h4 className="text-gray-800 font-semibold mb-2">For Teachers:</h4>
                      <p className="text-gray-600 text-sm">Contact your school administrator to get access to the teacher portal. They will provide you with login credentials and guide you through the setup process.</p>
                    </div>
                    
                    <div className="bg-[#dfe5f0] rounded-lg p-4">
                      <h4 className="text-gray-800 font-semibold mb-2">For Parents:</h4>
                      <p className="text-gray-600 text-sm">Your school will provide you with access to the parent portal. Contact the school administration to get your login details and start monitoring your child's progress.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs text-gray-600">Easy Access</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs text-gray-600">Communication</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs text-gray-600">Resources</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => navigate('/contact')}
                    variant="outline"
                    className="w-full py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Contact Us for Assistance
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-4 py-8 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h4 className="text-gray-800 font-semibold mb-2">Quick Links</h4>
            <div className="space-y-2 text-gray-500 text-sm">
              <div>• Features</div>
              <div>• Pricing</div>
              <div>• Support</div>
            </div>
          </div>
          <div>
            <h4 className="text-gray-800 font-semibold mb-2">Support</h4>
            <div className="space-y-2 text-gray-500 text-sm">
              <div>• Help Center</div>
              <div>• Technical Support</div>
              <div>• Training Resources</div>
            </div>
          </div>
          <div>
            <h4 className="text-gray-800 font-semibold mb-2">Contact</h4>
            <div className="space-y-2 text-gray-500 text-sm">
              <div>• support@cbe.edu</div>
              <div>• +254 700 000 000</div>
              <div>• Mon-Fri, 8AM-5PM</div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500 text-sm">
          © 2026 CBE Education System • All Rights Reserved • Ministry of Education Licensed
        </div>
      </footer>
    </div>
  );
}
