import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getProfile,
  updatePersonalInfo,
  updateContactInfo,
  updateEmergencyContact,
  changePassword,
  uploadAvatar,
  removeAvatar,
} from '@/lib/api/profileApi';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  User,
  Lock,
  Bell,
  Eye,
  Shield,
  Camera,
  Save,
  Smartphone,
  Trash2,
  Download,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Mail,
  EyeOff,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────

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

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const SETTINGS_TABS: SettingsTab[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    description: 'Personal information and avatar',
  },
  {
    id: 'account',
    label: 'Account',
    icon: Lock,
    description: 'Email and password settings',
  },
  {
    id: 'security',
    label: 'Security & Privacy',
    icon: Shield,
    description: '2FA and login security',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'How you receive alerts',
  },
];

// ─────────────────────────���───────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate password strength
 */
const passwordStrength = (
  pwd: string
): { label: string; color: string; width: string } => {
  if (!pwd) return { label: '', color: '', width: '0%' };
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasDigit = /\d/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const score = [pwd.length >= 8, hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean)
    .length;

  if (score <= 2)
    return { label: 'Weak', color: 'bg-destructive', width: '33%' };
  if (score <= 3)
    return { label: 'Fair', color: 'bg-yellow-500', width: '55%' };
  if (score === 4) return { label: 'Good', color: 'bg-blue-500', width: '75%' };
  return { label: 'Strong', color: 'bg-green-500', width: '100%' };
};

// ─────────────────────────────────────────────────────────────────
// SIDEBAR NAVIGATION COMPONENT
// ─────────────────────────────────────────────────────────────────

interface SidebarNavProps {
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

function SidebarNav({ tabs, activeTab, onTabChange }: SidebarNavProps) {
  return (
    <div className="space-y-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
              'hover:bg-slate-100 dark:hover:bg-slate-800',
              isActive
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium border-l-2 border-blue-500'
                : 'text-slate-600 dark:text-slate-400'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className={cn('w-4 h-4', isActive && 'text-blue-600 dark:text-blue-400')} />
              <div className="text-left">
                <p className="font-medium">{tab.label}</p>
                <p className="text-xs opacity-70">{tab.description}</p>
              </div>
            </div>
            {isActive && (
              <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TAB CONTENT COMPONENTS
// ─────────────────────────────────────────────────────────────────

interface ProfileTabProps {
  personalInfo: PersonalInfo;
  avatarPreview: string | null;
  isSaving: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onPersonalInfoChange: (info: PersonalInfo) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemoveAvatar: () => Promise<void>;
  onSave: () => Promise<void>;
  getInitials: () => string;
}

function ProfileTab({
  personalInfo,
  avatarPreview,
  isSaving,
  fileInputRef,
  onPersonalInfoChange,
  onAvatarChange,
  onRemoveAvatar,
  onSave,
  getInitials,
}: ProfileTabProps) {
  return (
    <div className="space-y-6">
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
            <Avatar className="h-24 w-24 ring-2 ring-border">
              <AvatarImage src={avatarPreview ?? undefined} />
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
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  Change Photo
                </Button>
                {avatarPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemoveAvatar}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
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
              onChange={onAvatarChange}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your name, bio, and basic details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={personalInfo.firstName}
                onChange={(e) =>
                  onPersonalInfoChange({
                    ...personalInfo,
                    firstName: e.target.value,
                  })
                }
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                value={personalInfo.lastName}
                onChange={(e) =>
                  onPersonalInfoChange({
                    ...personalInfo,
                    lastName: e.target.value,
                  })
                }
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={personalInfo.displayName}
                onChange={(e) =>
                  onPersonalInfoChange({
                    ...personalInfo,
                    displayName: e.target.value,
                  })
                }
                placeholder="How your name appears to others"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title / Designation</Label>
              <Select
                value={personalInfo.title}
                onValueChange={(v) =>
                  onPersonalInfoChange({ ...personalInfo, title: v })
                }
                disabled={isSaving}
              >
                <SelectTrigger id="title">
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="School Administrator">
                    School Administrator
                  </SelectItem>
                  <SelectItem value="Deputy Headteacher">
                    Deputy Headteacher
                  </SelectItem>
                  <SelectItem value="Headteacher">Headteacher</SelectItem>
                  <SelectItem value="Principal">Principal</SelectItem>
                  <SelectItem value="Director">Director</SelectItem>
                  <SelectItem value="Coordinator">Coordinator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={personalInfo.dateOfBirth}
                onChange={(e) =>
                  onPersonalInfoChange({
                    ...personalInfo,
                    dateOfBirth: e.target.value,
                  })
                }
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={personalInfo.gender}
                onValueChange={(v) =>
                  onPersonalInfoChange({ ...personalInfo, gender: v })
                }
                disabled={isSaving}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="prefer_not_to_say">
                    Prefer not to say
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={personalInfo.nationality}
                onChange={(e) =>
                  onPersonalInfoChange({
                    ...personalInfo,
                    nationality: e.target.value,
                  })
                }
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio / About Me</Label>
            <Textarea
              id="bio"
              value={personalInfo.bio}
              onChange={(e) =>
                onPersonalInfoChange({ ...personalInfo, bio: e.target.value })
              }
              placeholder="Write a short bio about yourself (max 300 characters)"
              maxLength={300}
              rows={3}
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground text-right">
              {personalInfo.bio.length}/300
            </p>
          </div>

          <Button
            onClick={onSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save Personal Information
          </Button>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Phone number, alternative email, and address.
          </CardDescription>
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
                  onPersonalInfoChange({
                    ...personalInfo,
                    phone: e.target.value,
                  })
                }
                placeholder="+254 700 000 000"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altEmail">Alternative Email</Label>
              <Input
                id="altEmail"
                type="email"
                value={personalInfo.alternativeEmail}
                onChange={(e) =>
                  onPersonalInfoChange({
                    ...personalInfo,
                    alternativeEmail: e.target.value,
                  })
                }
                placeholder="alternative@email.com"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Physical Address</Label>
            <Textarea
              id="address"
              value={personalInfo.address}
              onChange={(e) =>
                onPersonalInfoChange({
                  ...personalInfo,
                  address: e.target.value,
                })
              }
              placeholder="Street, City, County"
              rows={2}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
          <CardDescription>
            Person to contact in case of emergency. This information is only
            visible to school management.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyName">Full Name</Label>
              <Input
                id="emergencyName"
                value={personalInfo.emergencyContactName}
                onChange={(e) =>
                  onPersonalInfoChange({
                    ...personalInfo,
                    emergencyContactName: e.target.value,
                  })
                }
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Phone Number</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                value={personalInfo.emergencyContactPhone}
                onChange={(e) =>
                  onPersonalInfoChange({
                    ...personalInfo,
                    emergencyContactPhone: e.target.value,
                  })
                }
                placeholder="+254 700 000 000"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyRelation">Relationship</Label>
              <Select
                value={personalInfo.emergencyContactRelation}
                onValueChange={(v) =>
                  onPersonalInfoChange({
                    ...personalInfo,
                    emergencyContactRelation: v,
                  })
                }
                disabled={isSaving}
              >
                <SelectTrigger id="emergencyRelation">
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

          <Button
            onClick={onSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save All Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface AccountTabProps {
  user: any;
  changePasswordForm: ChangePasswordForm;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  isSaving: boolean;
  pwdStrength: any;
  onPasswordFormChange: (form: ChangePasswordForm) => void;
  onShowPasswordToggle: (field: string) => void;
  onChangePassword: () => Promise<void>;
}

function AccountTab({
  user,
  changePasswordForm,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  isSaving,
  pwdStrength,
  onPasswordFormChange,
  onShowPasswordToggle,
  onChangePassword,
}: AccountTabProps) {
  return (
    <div className="space-y-6">
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
                <Input
                  value={user?.email ?? ''}
                  readOnly
                  className="bg-muted"
                />
                <Badge variant="outline" className="whitespace-nowrap gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
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
                value={(user?.role ?? '')
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c: string) => c.toUpperCase())}
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
            Use a strong password with at least 8 characters, including
            uppercase letters, numbers, and symbols.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">
              Current Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={changePasswordForm.currentPassword}
                onChange={(e) =>
                  onPasswordFormChange({
                    ...changePasswordForm,
                    currentPassword: e.target.value,
                  })
                }
                autoComplete="current-password"
                disabled={isSaving}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => onShowPasswordToggle('current')}
                disabled={isSaving}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">
              New Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={changePasswordForm.newPassword}
                onChange={(e) =>
                  onPasswordFormChange({
                    ...changePasswordForm,
                    newPassword: e.target.value,
                  })
                }
                autoComplete="new-password"
                disabled={isSaving}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => onShowPasswordToggle('new')}
                disabled={isSaving}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {changePasswordForm.newPassword && (
              <div className="space-y-1">
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
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
            <Label htmlFor="confirmPassword">
              Confirm New Password{' '}
              <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={changePasswordForm.confirmPassword}
                onChange={(e) =>
                  onPasswordFormChange({
                    ...changePasswordForm,
                    confirmPassword: e.target.value,
                  })
                }
                autoComplete="new-password"
                disabled={isSaving}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => onShowPasswordToggle('confirm')}
                disabled={isSaving}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {changePasswordForm.confirmPassword &&
              changePasswordForm.newPassword !==
                changePasswordForm.confirmPassword && (
                <p className="text-xs text-destructive">
                  Passwords do not match.
                </p>
              )}
          </div>

          <Button
            onClick={onChangePassword}
            disabled={
              isSaving ||
              !changePasswordForm.currentPassword ||
              !changePasswordForm.newPassword ||
              !changePasswordForm.confirmPassword
            }
            className="gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <KeyRound className="h-4 w-4" />
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
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
            <Button
              variant="outline"
              size="sm"
              disabled={isSaving}
              className="gap-2 flex-shrink-0"
            >
              <Download className="h-4 w-4" />
              Request Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SecurityTabProps {
  securitySettings: any;
  isSaving: boolean;
  onSecuritySettingsChange: (settings: any) => void;
  onSave: () => void;
}

function SecurityTab({
  securitySettings,
  isSaving,
  onSecuritySettingsChange,
  onSave,
}: SecurityTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account.
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
            <Badge
              variant={
                securitySettings.twoFactorEnabled ? 'default' : 'secondary'
              }
            >
              {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          {securitySettings.twoFactorEnabled && (
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Two-factor authentication is enabled. Your account is more
                secure.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login Security</CardTitle>
          <CardDescription>
            Control how you are alerted about sign-in activity.
          </CardDescription>
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
                onSecuritySettingsChange({
                  ...securitySettings,
                  loginAlerts: v,
                })
              }
              disabled={isSaving}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Session Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Auto sign-out after inactivity period.
              </p>
            </div>
            <Select
              value={securitySettings.sessionTimeout}
              onValueChange={(v) =>
                onSecuritySettingsChange({
                  ...securitySettings,
                  sessionTimeout: v,
                })
              }
              disabled={isSaving}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={onSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save Security Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function ProfileSettings() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─────────────────────────────────────────────────────────────���───
  // STATE
  // ─────────────────────────────────────────────────────────────────

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    displayName: '',
    title: '',
    bio: '',
    dateOfBirth: '',
    gender: '',
    nationality: 'Kenyan',
    phone: '',
    alternativeEmail: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });

  const [changePasswordForm, setChangePasswordForm] = useState<ChangePasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: '30',
  });

  // ─────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await getProfile();

      setPersonalInfo({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        displayName: profile.personalInfo?.displayName || '',
        title: profile.personalInfo?.title || '',
        bio: profile.personalInfo?.bio || '',
        dateOfBirth: profile.personalInfo?.dateOfBirth || '',
        gender: profile.personalInfo?.gender || '',
        nationality: profile.personalInfo?.nationality || 'Kenyan',
        phone: profile.personalInfo?.phone || '',
        alternativeEmail: profile.personalInfo?.alternativeEmail || '',
        address: profile.personalInfo?.address || '',
        emergencyContactName: profile.personalInfo?.emergencyContactName || '',
        emergencyContactPhone: profile.personalInfo?.emergencyContactPhone || '',
        emergencyContactRelation:
          profile.personalInfo?.emergencyContactRelation || '',
      });

      if (profile.avatarUrl) {
        setAvatarPreview(profile.avatarUrl);
      }

      setSecuritySettings((prev) => ({
        ...prev,
        twoFactorEnabled: profile.twoFactorEnabled || false,
      }));
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile data', {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Profile picture must be smaller than 5 MB.', {
          icon: <AlertCircle className="h-4 w-4" />,
        });
        return;
      }

      try {
        setIsSaving(true);
        const result = await uploadAvatar(file);
        setAvatarPreview(result.avatarUrl);
        toast.success('✓ Profile picture updated successfully', {
          icon: <CheckCircle2 className="h-4 w-4" />,
        });
      } catch (error) {
        console.error('Avatar upload failed:', error);
        toast.error('Failed to upload profile picture', {
          icon: <AlertCircle className="h-4 w-4" />,
        });
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const handleRemoveAvatar = useCallback(async () => {
    try {
      setIsSaving(true);
      await removeAvatar();
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('✓ Profile picture removed successfully', {
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
    } catch (error) {
      console.error('Avatar removal failed:', error);
      toast.error('Failed to remove profile picture', {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleSavePersonalInfo = useCallback(async () => {
    if (!personalInfo.firstName.trim() || !personalInfo.lastName.trim()) {
      toast.error('First name and last name are required', {
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }

    try {
      setIsSaving(true);

      await updatePersonalInfo({
        firstName: personalInfo.firstName.trim(),
        lastName: personalInfo.lastName.trim(),
        displayName: personalInfo.displayName,
        title: personalInfo.title,
        bio: personalInfo.bio,
        dateOfBirth: personalInfo.dateOfBirth || undefined,
        gender: personalInfo.gender || undefined,
        nationality: personalInfo.nationality,
      });

      await updateContactInfo({
        phone: personalInfo.phone || undefined,
        alternativeEmail: personalInfo.alternativeEmail || undefined,
        address: personalInfo.address || undefined,
      });

      await updateEmergencyContact({
        emergencyContactName: personalInfo.emergencyContactName || undefined,
        emergencyContactPhone: personalInfo.emergencyContactPhone || undefined,
        emergencyContactRelation:
          personalInfo.emergencyContactRelation || undefined,
      });

      toast.success('✓ Profile saved successfully', {
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
    } catch (error: any) {
      console.error('Profile update failed:', error);
      toast.error(error.message || 'Failed to save profile', {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setIsSaving(false);
    }
  }, [personalInfo]);

  const handleChangePassword = useCallback(async () => {
    if (!changePasswordForm.currentPassword) {
      toast.error('Please enter your current password', {
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }
    if (changePasswordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters', {
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }
    if (
      changePasswordForm.newPassword !== changePasswordForm.confirmPassword
    ) {
      toast.error('New passwords do not match', {
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }
    if (
      changePasswordForm.currentPassword === changePasswordForm.newPassword
    ) {
      toast.error('New password must be different from current password', {
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }

    try {
      setIsSaving(true);
      await changePassword({
        currentPassword: changePasswordForm.currentPassword,
        newPassword: changePasswordForm.newPassword,
      });

      setChangePasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast.success('✓ Password changed successfully', {
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
    } catch (error: any) {
      console.error('Password change failed:', error);
      toast.error(error.message || 'Failed to change password', {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setIsSaving(false);
    }
  }, [changePasswordForm]);

  const handleShowPasswordToggle = useCallback((field: string) => {
    if (field === 'current') setShowCurrentPassword((v) => !v);
    else if (field === 'new') setShowNewPassword((v) => !v);
    else if (field === 'confirm') setShowConfirmPassword((v) => !v);
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ─────────────────────────────────────────────────────────────────

  const getInitials = useCallback(() => {
    const f = personalInfo.firstName?.[0] ?? '';
    const l = personalInfo.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || 'U';
  }, [personalInfo.firstName, personalInfo.lastName]);

  const pwdStrength = useMemo(
    () => passwordStrength(changePasswordForm.newPassword),
    [changePasswordForm.newPassword]
  );

  // ─────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading profile settings...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information, security, and preferences
        </p>
      </div>

      {/* Settings Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-4">
              <SidebarNav
                tabs={SETTINGS_TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          {activeTab === 'profile' && (
            <ProfileTab
              personalInfo={personalInfo}
              avatarPreview={avatarPreview}
              isSaving={isSaving}
              fileInputRef={fileInputRef}
              onPersonalInfoChange={setPersonalInfo}
              onAvatarChange={handleAvatarChange}
              onRemoveAvatar={handleRemoveAvatar}
              onSave={handleSavePersonalInfo}
              getInitials={getInitials}
            />
          )}

          {activeTab === 'account' && (
            <AccountTab
              user={user}
              changePasswordForm={changePasswordForm}
              showCurrentPassword={showCurrentPassword}
              showNewPassword={showNewPassword}
              showConfirmPassword={showConfirmPassword}
              isSaving={isSaving}
              pwdStrength={pwdStrength}
              onPasswordFormChange={setChangePasswordForm}
              onShowPasswordToggle={handleShowPasswordToggle}
              onChangePassword={handleChangePassword}
            />
          )}

          {activeTab === 'security' && (
            <SecurityTab
              securitySettings={securitySettings}
              isSaving={isSaving}
              onSecuritySettingsChange={setSecuritySettings}
              onSave={() => toast.info('Security settings saved')}
            />
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Notification preferences coming in Phase 2
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Check back soon for detailed notification settings.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
