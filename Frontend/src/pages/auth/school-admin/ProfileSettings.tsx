import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/sonner';
import {
  User,
  Lock,
  Bell,
  Eye,
  Palette,
  Accessibility,
  Camera,
  Save,
  Shield,
  Smartphone,
  LogOut,
  Trash2,
  Download,
  Globe,
  Clock,
  Type,
  Contrast,
  Volume2,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Mail,
  MessageSquare,
  MonitorSmartphone,
  UserCircle,
  EyeOff,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonalInfo {
  firstName: string;
  lastName: string;
  displayName: string;
  title: string;
  bio: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  phone: string;
  alternativeEmail: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
}

interface AccountSettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  trustedDevicesOnly: boolean;
  sessionTimeout: string;
  showActiveSessions: boolean;
}

interface NotificationSettings {
  emailNewEnrollment: boolean;
  emailFeePayments: boolean;
  emailExamResults: boolean;
  emailTeacherUpdates: boolean;
  emailSystemAlerts: boolean;
  emailWeeklyDigest: boolean;
  emailMonthlyReport: boolean;
  smsNewEnrollment: boolean;
  smsFeePayments: boolean;
  smsUrgentAlerts: boolean;
  inAppMessages: boolean;
  inAppAssessmentReminders: boolean;
  inAppAttendanceAlerts: boolean;
  inAppSystemUpdates: boolean;
  pushMobileNotifications: boolean;
  pushDesktopNotifications: boolean;
  digestFrequency: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

interface PrivacySettings {
  profileVisibility: string;
  showEmail: boolean;
  showPhone: boolean;
  showLastSeen: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: string;
  dataAnalytics: boolean;
  activityTracking: boolean;
  searchableByEmail: boolean;
  searchableByName: boolean;
}

interface AppearanceSettings {
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  displayDensity: string;
  sidebarPosition: string;
}

interface AccessibilitySettings {
  fontSize: string;
  highContrast: boolean;
  reduceMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  underlineLinks: boolean;
  captionsEnabled: boolean;
}

// ─── Mock Active Sessions ─────────────────────────────────────────────────────

const mockSessions = [
  {
    id: '1',
    device: 'Chrome on Windows 11',
    location: 'Nairobi, Kenya',
    lastActive: 'Active now',
    current: true,
    icon: 'desktop',
  },
  {
    id: '2',
    device: 'Safari on iPhone 14',
    location: 'Nairobi, Kenya',
    lastActive: '2 hours ago',
    current: false,
    icon: 'mobile',
  },
  {
    id: '3',
    device: 'Firefox on macOS',
    location: 'Mombasa, Kenya',
    lastActive: 'Yesterday at 3:45 PM',
    current: false,
    icon: 'desktop',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileSettings() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatarUrl ?? null
  );
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sessions, setSessions] = useState(mockSessions);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    displayName: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
    title: 'School Administrator',
    bio: '',
    dateOfBirth: '',
    gender: '',
    nationality: 'Kenyan',
    phone: user?.phoneNumber ?? '',
    alternativeEmail: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });

  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginAlerts: true,
    trustedDevicesOnly: false,
    sessionTimeout: '30',
    showActiveSessions: true,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNewEnrollment: true,
    emailFeePayments: true,
    emailExamResults: true,
    emailTeacherUpdates: false,
    emailSystemAlerts: true,
    emailWeeklyDigest: true,
    emailMonthlyReport: true,
    smsNewEnrollment: false,
    smsFeePayments: true,
    smsUrgentAlerts: true,
    inAppMessages: true,
    inAppAssessmentReminders: true,
    inAppAttendanceAlerts: true,
    inAppSystemUpdates: true,
    pushMobileNotifications: false,
    pushDesktopNotifications: true,
    digestFrequency: 'weekly',
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'school',
    showEmail: false,
    showPhone: false,
    showLastSeen: true,
    showOnlineStatus: true,
    allowDirectMessages: 'school',
    dataAnalytics: true,
    activityTracking: false,
    searchableByEmail: true,
    searchableByName: true,
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: localStorage.getItem('theme-mode') ?? 'light',
    language: 'en',
    timezone: 'Africa/Nairobi',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    displayDensity: 'comfortable',
    sidebarPosition: 'left',
  });

  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    fontSize: 'medium',
    highContrast: false,
    reduceMotion: false,
    screenReaderOptimized: false,
    keyboardNavigation: true,
    focusIndicators: true,
    underlineLinks: false,
    captionsEnabled: false,
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile picture must be smaller than 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSavePersonalInfo = () => {
    toast.success('Personal information saved successfully.');
  };

  const handleChangePassword = () => {
    if (!accountSettings.currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (accountSettings.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (accountSettings.newPassword !== accountSettings.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    toast.success('Password changed successfully.');
    setAccountSettings({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleSaveSecurity = () => {
    toast.success('Security settings saved.');
  };

  const handleRevokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id || s.current));
    toast.success('Session revoked successfully.');
  };

  const handleRevokeAllOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.current));
    toast.success('All other sessions have been revoked.');
  };

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved.');
  };

  const handleSavePrivacy = () => {
    toast.success('Privacy settings saved.');
  };

  const handleSaveAppearance = () => {
    if (appearanceSettings.theme === 'dark' || appearanceSettings.theme === 'light') {
      localStorage.setItem('theme-mode', appearanceSettings.theme);
    } else {
      localStorage.removeItem('theme-mode');
    }
    toast.success('Appearance settings saved. Reload to apply theme changes.');
  };

  const handleSaveAccessibility = () => {
    toast.success('Accessibility settings saved.');
  };

  const handleDownloadData = () => {
    toast.info('Your data export has been requested. You will receive an email when it is ready.');
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const getInitials = () => {
    const f = personalInfo.firstName?.[0] ?? '';
    const l = personalInfo.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || 'U';
  };

  const passwordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (!pwd) return { label: '', color: '', width: '0%' };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const score = [pwd.length >= 8, hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
    if (score <= 2) return { label: 'Weak', color: 'bg-destructive', width: '33%' };
    if (score <= 3) return { label: 'Fair', color: 'bg-yellow-500', width: '55%' };
    if (score === 4) return { label: 'Good', color: 'bg-blue-500', width: '75%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const pwdStrength = passwordStrength(accountSettings.newPassword);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information, security, and preferences
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          <UserCircle className="w-4 h-4 mr-1" />
          {user?.role?.replace('_', ' ') ?? 'User'}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-lg">
          <TabsTrigger value="profile" className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-1.5">
            <Lock className="w-4 h-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1.5">
            <Palette className="w-4 h-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-1.5">
            <Accessibility className="w-4 h-4" />
            <span>Accessibility</span>
          </TabsTrigger>
        </TabsList>

        {/* ── PROFILE TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-6">
          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Your photo is visible to other users in the school system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="w-24 h-24 ring-2 ring-border">
                  <AvatarImage src={avatarPreview ?? undefined} alt="Profile" />
                  <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                    {avatarPreview && (
                      <Button variant="ghost" size="sm" onClick={handleRemoveAvatar}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, or GIF. Max size 5 MB. Recommended: 400×400 px.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your name, bio, and basic details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={personalInfo.firstName}
                    onChange={(e) =>
                      setPersonalInfo((p) => ({ ...p, firstName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={personalInfo.lastName}
                    onChange={(e) =>
                      setPersonalInfo((p) => ({ ...p, lastName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={personalInfo.displayName}
                    onChange={(e) =>
                      setPersonalInfo((p) => ({ ...p, displayName: e.target.value }))
                    }
                    placeholder="How your name appears to others"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title / Designation</Label>
                  <Select
                    value={personalInfo.title}
                    onValueChange={(v) => setPersonalInfo((p) => ({ ...p, title: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="School Administrator">School Administrator</SelectItem>
                      <SelectItem value="Deputy Headteacher">Deputy Headteacher</SelectItem>
                      <SelectItem value="Headteacher">Headteacher</SelectItem>
                      <SelectItem value="Principal">Principal</SelectItem>
                      <SelectItem value="Director">Director</SelectItem>
                      <SelectItem value="Coordinator">Coordinator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={personalInfo.dateOfBirth}
                    onChange={(e) =>
                      setPersonalInfo((p) => ({ ...p, dateOfBirth: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={personalInfo.gender}
                    onValueChange={(v) => setPersonalInfo((p) => ({ ...p, gender: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={personalInfo.nationality}
                    onChange={(e) =>
                      setPersonalInfo((p) => ({ ...p, nationality: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio / About Me</Label>
                <Textarea
                  id="bio"
                  value={personalInfo.bio}
                  onChange={(e) => setPersonalInfo((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="Write a short bio about yourself (max 300 characters)"
                  maxLength={300}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {personalInfo.bio.length}/300
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Phone number, alternative email, and address.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) =>
                      setPersonalInfo((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+254 700 000 000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="altEmail">Alternative Email</Label>
                  <Input
                    id="altEmail"
                    type="email"
                    value={personalInfo.alternativeEmail}
                    onChange={(e) =>
                      setPersonalInfo((p) => ({ ...p, alternativeEmail: e.target.value }))
                    }
                    placeholder="alternative@email.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Physical Address</Label>
                <Textarea
                  id="address"
                  value={personalInfo.address}
                  onChange={(e) =>
                    setPersonalInfo((p) => ({ ...p, address: e.target.value }))
                  }
                  placeholder="Street, City, County"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>
                Person to contact in case of an emergency. This information is only visible to
                school management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Full Name</Label>
                  <Input
                    id="emergencyName"
                    value={personalInfo.emergencyContactName}
                    onChange={(e) =>
                      setPersonalInfo((p) => ({ ...p, emergencyContactName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Phone Number</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={personalInfo.emergencyContactPhone}
                    onChange={(e) =>
                      setPersonalInfo((p) => ({ ...p, emergencyContactPhone: e.target.value }))
                    }
                    placeholder="+254 700 000 000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyRelation">Relationship</Label>
                  <Select
                    value={personalInfo.emergencyContactRelation}
                    onValueChange={(v) =>
                      setPersonalInfo((p) => ({ ...p, emergencyContactRelation: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="colleague">Colleague</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSavePersonalInfo}>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </Button>
          </div>
        </TabsContent>

        {/* ── ACCOUNT TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="account" className="space-y-6">
          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Your login email and account role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Input value={user?.email ?? ''} readOnly className="bg-muted" />
                    <Badge variant="outline" className="whitespace-nowrap">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                      Verified
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Contact your system administrator to change your email.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Account Role</Label>
                  <Input
                    value={(user?.role ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    readOnly
                    className="bg-muted capitalize"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Use a strong password with at least 8 characters, including uppercase letters,
                numbers, and symbols.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={accountSettings.currentPassword}
                    onChange={(e) =>
                      setAccountSettings((a) => ({ ...a, currentPassword: e.target.value }))
                    }
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={accountSettings.newPassword}
                    onChange={(e) =>
                      setAccountSettings((a) => ({ ...a, newPassword: e.target.value }))
                    }
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {accountSettings.newPassword && (
                  <div className="space-y-1">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${pwdStrength.color}`}
                        style={{ width: pwdStrength.width }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password strength:{' '}
                      <span className="font-medium">{pwdStrength.label}</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={accountSettings.confirmPassword}
                    onChange={(e) =>
                      setAccountSettings((a) => ({ ...a, confirmPassword: e.target.value }))
                    }
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {accountSettings.confirmPassword &&
                  accountSettings.newPassword !== accountSettings.confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match.</p>
                  )}
              </div>
              <Button onClick={handleChangePassword}>
                <KeyRound className="w-4 h-4 mr-2" />
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                These actions are irreversible. Please proceed with caution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                <div>
                  <p className="font-medium text-sm">Download My Data</p>
                  <p className="text-xs text-muted-foreground">
                    Request a copy of all your personal data stored in this system.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadData}>
                  <Download className="w-4 h-4 mr-2" />
                  Request Export
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                <div>
                  <p className="font-medium text-sm">Deactivate Account</p>
                  <p className="text-xs text-muted-foreground">
                    Temporarily deactivate your account. Contact your super admin to reactivate.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    toast.warning(
                      'Account deactivation requires approval from a super administrator.'
                    )
                  }
                >
                  Deactivate
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SECURITY TAB ────────────────────────────────────────────────── */}
        <TabsContent value="security" className="space-y-6">
          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account. When enabled, you will need to
                enter a code from your authenticator app each time you sign in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    {securitySettings.twoFactorEnabled
                      ? '2FA is currently active on your account.'
                      : 'Protect your account with an authenticator app.'}
                  </p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(v) =>
                    setSecuritySettings((s) => ({ ...s, twoFactorEnabled: v }))
                  }
                />
              </div>
              {securitySettings.twoFactorEnabled && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Two-factor authentication is enabled. Your account is more secure.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Login Security */}
          <Card>
            <CardHeader>
              <CardTitle>Login Security</CardTitle>
              <CardDescription>Control how and when you are alerted about sign-in activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Login Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive an email when someone signs in to your account.
                  </p>
                </div>
                <Switch
                  checked={securitySettings.loginAlerts}
                  onCheckedChange={(v) =>
                    setSecuritySettings((s) => ({ ...s, loginAlerts: v }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Trusted Devices Only</Label>
                  <p className="text-sm text-muted-foreground">
                    Require verification when signing in from a new device.
                  </p>
                </div>
                <Switch
                  checked={securitySettings.trustedDevicesOnly}
                  onCheckedChange={(v) =>
                    setSecuritySettings((s) => ({ ...s, trustedDevicesOnly: v }))
                  }
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Auto Sign-Out After Inactivity</Label>
                <Select
                  value={securitySettings.sessionTimeout}
                  onValueChange={(v) =>
                    setSecuritySettings((s) => ({ ...s, sessionTimeout: v }))
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveSecurity}>
                <Save className="w-4 h-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>
                    These are the devices currently signed in to your account.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevokeAllOtherSessions}
                  disabled={sessions.filter((s) => !s.current).length === 0}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out Others
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    session.current ? 'border-primary/40 bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {session.icon === 'mobile' ? (
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <MonitorSmartphone className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {session.device}
                        {session.current && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            This device
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.location} · {session.lastActive}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── NOTIFICATIONS TAB ───────────────────────────────────────────── */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Choose which emails you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  { key: 'emailNewEnrollment', label: 'New Student Enrollments', desc: 'When a new learner is registered.' },
                  { key: 'emailFeePayments', label: 'Fee Payments', desc: 'When a fee payment is received or overdue.' },
                  { key: 'emailExamResults', label: 'Exam Results Published', desc: 'When assessment results are released.' },
                  { key: 'emailTeacherUpdates', label: 'Teacher Activity Updates', desc: 'When teachers add or update lesson plans.' },
                  { key: 'emailSystemAlerts', label: 'System Alerts', desc: 'Critical system notifications and downtime alerts.' },
                  { key: 'emailWeeklyDigest', label: 'Weekly Summary Digest', desc: 'A weekly overview of school activity.' },
                  { key: 'emailMonthlyReport', label: 'Monthly Report', desc: 'A comprehensive monthly performance report.' },
                ] as const
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{label}</Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={notificationSettings[key]}
                    onCheckedChange={(v) =>
                      setNotificationSettings((n) => ({ ...n, [key]: v }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* SMS Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                SMS Notifications
              </CardTitle>
              <CardDescription>
                Text message alerts for important events. Standard rates may apply.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  { key: 'smsNewEnrollment', label: 'New Enrollments', desc: 'SMS alert for new learner registration.' },
                  { key: 'smsFeePayments', label: 'Fee Payment Confirmations', desc: 'SMS receipt when fees are paid.' },
                  { key: 'smsUrgentAlerts', label: 'Urgent System Alerts', desc: 'Critical alerts that need immediate attention.' },
                ] as const
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{label}</Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={notificationSettings[key]}
                    onCheckedChange={(v) =>
                      setNotificationSettings((n) => ({ ...n, [key]: v }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* In-App Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                In-App Notifications
              </CardTitle>
              <CardDescription>Notifications shown inside the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  { key: 'inAppMessages', label: 'Direct Messages', desc: 'When you receive a message from another user.' },
                  { key: 'inAppAssessmentReminders', label: 'Assessment Reminders', desc: 'Reminders for upcoming assessments or deadlines.' },
                  { key: 'inAppAttendanceAlerts', label: 'Attendance Alerts', desc: 'Alerts for absent or late students and staff.' },
                  { key: 'inAppSystemUpdates', label: 'System Updates', desc: 'Platform updates and new feature announcements.' },
                ] as const
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{label}</Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={notificationSettings[key]}
                    onCheckedChange={(v) =>
                      setNotificationSettings((n) => ({ ...n, [key]: v }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Push & Digest Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Push & Digest Settings</CardTitle>
              <CardDescription>Browser/mobile push and summary frequency.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Desktop Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Browser push when using the platform.</p>
                </div>
                <Switch
                  checked={notificationSettings.pushDesktopNotifications}
                  onCheckedChange={(v) =>
                    setNotificationSettings((n) => ({ ...n, pushDesktopNotifications: v }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mobile Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Push alerts on the mobile app.</p>
                </div>
                <Switch
                  checked={notificationSettings.pushMobileNotifications}
                  onCheckedChange={(v) =>
                    setNotificationSettings((n) => ({ ...n, pushMobileNotifications: v }))
                  }
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Digest Email Frequency</Label>
                <Select
                  value={notificationSettings.digestFrequency}
                  onValueChange={(v) =>
                    setNotificationSettings((n) => ({ ...n, digestFrequency: v }))
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Quiet Hours</Label>
                  <p className="text-sm text-muted-foreground">
                    Silence non-urgent notifications during selected hours.
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.quietHoursEnabled}
                  onCheckedChange={(v) =>
                    setNotificationSettings((n) => ({ ...n, quietHoursEnabled: v }))
                  }
                />
              </div>
              {notificationSettings.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
                  <div className="space-y-2">
                    <Label htmlFor="quietStart">Start Time</Label>
                    <Input
                      id="quietStart"
                      type="time"
                      value={notificationSettings.quietHoursStart}
                      onChange={(e) =>
                        setNotificationSettings((n) => ({ ...n, quietHoursStart: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quietEnd">End Time</Label>
                    <Input
                      id="quietEnd"
                      type="time"
                      value={notificationSettings.quietHoursEnd}
                      onChange={(e) =>
                        setNotificationSettings((n) => ({ ...n, quietHoursEnd: e.target.value }))
                      }
                    />
                  </div>
                </div>
              )}
              <Button onClick={handleSaveNotifications}>
                <Save className="w-4 h-4 mr-2" />
                Save Notification Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PRIVACY TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="privacy" className="space-y-6">
          {/* Profile Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Visibility</CardTitle>
              <CardDescription>Control who can see your profile information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Who can view my profile?</Label>
                <Select
                  value={privacySettings.profileVisibility}
                  onValueChange={(v) =>
                    setPrivacySettings((p) => ({ ...p, profileVisibility: v }))
                  }
                >
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone in the system</SelectItem>
                    <SelectItem value="school">My school only</SelectItem>
                    <SelectItem value="admins">Admins only</SelectItem>
                    <SelectItem value="none">No one</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                {(
                  [
                    { key: 'showEmail', label: 'Show Email Address', desc: 'Display your email on your public profile.' },
                    { key: 'showPhone', label: 'Show Phone Number', desc: 'Display your phone number on your profile.' },
                    { key: 'showLastSeen', label: 'Show Last Seen', desc: 'Let others see when you were last active.' },
                    { key: 'showOnlineStatus', label: 'Show Online Status', desc: 'Display a green dot when you are online.' },
                  ] as const
                ).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{label}</Label>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={privacySettings[key]}
                      onCheckedChange={(v) =>
                        setPrivacySettings((p) => ({ ...p, [key]: v }))
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Communication */}
          <Card>
            <CardHeader>
              <CardTitle>Communication Preferences</CardTitle>
              <CardDescription>Control who can send you messages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Who can send me direct messages?</Label>
                <Select
                  value={privacySettings.allowDirectMessages}
                  onValueChange={(v) =>
                    setPrivacySettings((p) => ({ ...p, allowDirectMessages: v }))
                  }
                >
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone in the system</SelectItem>
                    <SelectItem value="school">My school only</SelectItem>
                    <SelectItem value="admins">Admins only</SelectItem>
                    <SelectItem value="none">No one</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Discoverability */}
          <Card>
            <CardHeader>
              <CardTitle>Discoverability</CardTitle>
              <CardDescription>Control how others can find your profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  { key: 'searchableByEmail', label: 'Searchable by Email', desc: 'Others can find you by searching your email address.' },
                  { key: 'searchableByName', label: 'Searchable by Name', desc: 'Others can find you by searching your name.' },
                ] as const
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{label}</Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={privacySettings[key]}
                    onCheckedChange={(v) =>
                      setPrivacySettings((p) => ({ ...p, [key]: v }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Data & Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Data & Analytics</CardTitle>
              <CardDescription>
                Manage how your usage data is collected and used to improve the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  { key: 'dataAnalytics', label: 'Usage Analytics', desc: 'Allow anonymised data to help improve the platform.' },
                  { key: 'activityTracking', label: 'Activity Tracking', desc: 'Track your activity for personalised insights and reports.' },
                ] as const
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{label}</Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={privacySettings[key]}
                    onCheckedChange={(v) =>
                      setPrivacySettings((p) => ({ ...p, [key]: v }))
                    }
                  />
                </div>
              ))}
              <Button onClick={handleSavePrivacy}>
                <Save className="w-4 h-4 mr-2" />
                Save Privacy Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── APPEARANCE TAB ──────────────────────────────────────────────── */}
        <TabsContent value="appearance" className="space-y-6">
          {/* Theme */}
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Choose how the platform looks to you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAppearanceSettings((a) => ({ ...a, theme: t }))}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      appearanceSettings.theme === t
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        t === 'dark'
                          ? 'bg-gray-900 text-white'
                          : t === 'light'
                          ? 'bg-white border border-gray-200 text-gray-900'
                          : 'bg-gradient-to-br from-white to-gray-900'
                      }`}
                    >
                      <Palette className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Localisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Language & Region
              </CardTitle>
              <CardDescription>Set your preferred language, timezone, and formats.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={appearanceSettings.language}
                    onValueChange={(v) => setAppearanceSettings((a) => ({ ...a, language: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="sw">Swahili (Kiswahili)</SelectItem>
                      <SelectItem value="fr">French (Français)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Timezone
                  </Label>
                  <Select
                    value={appearanceSettings.timezone}
                    onValueChange={(v) => setAppearanceSettings((a) => ({ ...a, timezone: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT +3:00)</SelectItem>
                      <SelectItem value="Africa/Lagos">Africa/Lagos (WAT +1:00)</SelectItem>
                      <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST +2:00)</SelectItem>
                      <SelectItem value="UTC">UTC (±0:00)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select
                    value={appearanceSettings.dateFormat}
                    onValueChange={(v) => setAppearanceSettings((a) => ({ ...a, dateFormat: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (e.g. 29/03/2026)</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (e.g. 03/29/2026)</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-03-29)</SelectItem>
                      <SelectItem value="D MMM YYYY">D MMM YYYY (e.g. 29 Mar 2026)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <Select
                    value={appearanceSettings.timeFormat}
                    onValueChange={(v) => setAppearanceSettings((a) => ({ ...a, timeFormat: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (e.g. 2:30 PM)</SelectItem>
                      <SelectItem value="24h">24-hour (e.g. 14:30)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Layout */}
          <Card>
            <CardHeader>
              <CardTitle>Layout & Density</CardTitle>
              <CardDescription>Adjust how content is displayed on screen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Display Density</Label>
                  <Select
                    value={appearanceSettings.displayDensity}
                    onValueChange={(v) =>
                      setAppearanceSettings((a) => ({ ...a, displayDensity: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="comfortable">Comfortable (Default)</SelectItem>
                      <SelectItem value="spacious">Spacious</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sidebar Position</Label>
                  <Select
                    value={appearanceSettings.sidebarPosition}
                    onValueChange={(v) =>
                      setAppearanceSettings((a) => ({ ...a, sidebarPosition: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left (Default)</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveAppearance}>
                <Save className="w-4 h-4 mr-2" />
                Save Appearance Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ACCESSIBILITY TAB ───────────────────────────────────────────── */}
        <TabsContent value="accessibility" className="space-y-6">
          {/* Text & Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Text & Display
              </CardTitle>
              <CardDescription>Adjust text and visual display settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Font / Text Size</Label>
                <Select
                  value={accessibilitySettings.fontSize}
                  onValueChange={(v) =>
                    setAccessibilitySettings((a) => ({ ...a, fontSize: v }))
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (90%)</SelectItem>
                    <SelectItem value="medium">Medium — Default (100%)</SelectItem>
                    <SelectItem value="large">Large (110%)</SelectItem>
                    <SelectItem value="x-large">Extra Large (120%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-1">
                    <Contrast className="w-4 h-4" />
                    High Contrast Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Increase colour contrast for better readability.
                  </p>
                </div>
                <Switch
                  checked={accessibilitySettings.highContrast}
                  onCheckedChange={(v) =>
                    setAccessibilitySettings((a) => ({ ...a, highContrast: v }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Underline Links</Label>
                  <p className="text-sm text-muted-foreground">
                    Always underline hyperlinks for easier identification.
                  </p>
                </div>
                <Switch
                  checked={accessibilitySettings.underlineLinks}
                  onCheckedChange={(v) =>
                    setAccessibilitySettings((a) => ({ ...a, underlineLinks: v }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Motion & Animation */}
          <Card>
            <CardHeader>
              <CardTitle>Motion & Animation</CardTitle>
              <CardDescription>
                Reduce or disable animations for a more comfortable experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reduce Motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimise animations and transitions across the platform.
                  </p>
                </div>
                <Switch
                  checked={accessibilitySettings.reduceMotion}
                  onCheckedChange={(v) =>
                    setAccessibilitySettings((a) => ({ ...a, reduceMotion: v }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Navigation & Interaction */}
          <Card>
            <CardHeader>
              <CardTitle>Navigation & Interaction</CardTitle>
              <CardDescription>Make the platform easier to navigate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {(
                [
                  { key: 'keyboardNavigation', label: 'Enhanced Keyboard Navigation', desc: 'Optimise tab order and keyboard shortcuts.' },
                  { key: 'focusIndicators', label: 'Visible Focus Indicators', desc: 'Show a clear outline around the focused element.' },
                  { key: 'screenReaderOptimized', label: 'Screen Reader Optimised', desc: 'Add extra ARIA labels and descriptions for screen readers.' },
                  { key: 'captionsEnabled', label: 'Enable Captions / Subtitles', desc: 'Show captions on any video content in the platform.' },
                ] as const
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-1">
                      {key === 'screenReaderOptimized' && <Volume2 className="w-4 h-4" />}
                      {label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={accessibilitySettings[key]}
                    onCheckedChange={(v) =>
                      setAccessibilitySettings((a) => ({ ...a, [key]: v }))
                    }
                  />
                </div>
              ))}
              <Button onClick={handleSaveAccessibility}>
                <Save className="w-4 h-4 mr-2" />
                Save Accessibility Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
