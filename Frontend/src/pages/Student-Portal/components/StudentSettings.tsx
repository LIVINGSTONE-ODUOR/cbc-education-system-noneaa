import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { KeyRound, UserRound, BellRing, SunMoon, Languages } from 'lucide-react';
import {
  getProfile,
  updatePersonalInfo,
  updateContactInfo,
  changePassword,
  getNotificationPreferences,
  updateNotificationPreferences,
  type Profile,
  type NotificationPreferences,
} from '@/lib/api/profileApi';

const DEFAULT_PREFS: NotificationPreferences = {
  email: true,
  sms: true,
  announcements: true,
  attendance: true,
  grades: true,
  fees: true,
};

const PREF_ROWS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: 'email', label: 'Email notifications', description: 'Receive updates by email' },
  { key: 'sms', label: 'SMS notifications', description: 'Receive updates by text message' },
  { key: 'announcements', label: 'School announcements', description: 'Notices and school-wide events' },
  { key: 'attendance', label: 'Attendance alerts', description: 'Your own absences and late arrivals' },
  { key: 'grades', label: 'Grades & report cards', description: 'New marks and report card availability' },
  { key: 'fees', label: 'Fee reminders', description: 'Upcoming and overdue fee balances' },
];

const THEME_KEY = 'theme-mode';
const LANGUAGE_KEY = 'app-language';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'sw', label: 'Kiswahili' },
];

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const StudentSettings: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Notification preferences
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [savingPrefKey, setSavingPrefKey] = useState<keyof NotificationPreferences | null>(null);

  // Appearance
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Language
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem(LANGUAGE_KEY) || 'en';
  });

  useEffect(() => {
    (async () => {
      try {
        const [data, prefsData] = await Promise.all([
          getProfile(),
          getNotificationPreferences().catch(() => DEFAULT_PREFS),
        ]);
        setProfile(data);
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setBio(data.bio || '');
        setPhone(data.phoneNumber || '');
        setAddress(data.address || '');
        setPrefs({ ...DEFAULT_PREFS, ...prefsData });
      } catch {
        // getProfile already toasts the error
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Keep the document in sync with the saved theme on mount, in case another
  // part of the app (or a fresh page load) hasn't applied it yet.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await Promise.all([
        updatePersonalInfo({ firstName, lastName, bio }),
        updateContactInfo({ phone, address }),
      ]);
    } catch {
      // updatePersonalInfo/updateContactInfo already toast the error
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      // changePassword already toasts the error
    } finally {
      setSavingPassword(false);
    }
  };

  const handleTogglePref = async (key: keyof NotificationPreferences, checked: boolean) => {
    const previous = prefs;
    setPrefs((p) => ({ ...p, [key]: checked }));
    setSavingPrefKey(key);
    try {
      const updated = await updateNotificationPreferences({ [key]: checked });
      setPrefs({ ...DEFAULT_PREFS, ...updated });
    } catch {
      setPrefs(previous); // updateNotificationPreferences already toasts the error
    } finally {
      setSavingPrefKey(null);
    }
  };

  const handleToggleTheme = (checked: boolean) => {
    setIsDarkMode(checked);
    localStorage.setItem(THEME_KEY, checked ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', checked);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    localStorage.setItem(LANGUAGE_KEY, value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" id="student-settings-section">
      {/* Update profile details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserRound className="h-5 w-5 text-primary" /> Update Profile Details
          </CardTitle>
          <CardDescription>Keep your personal details up to date.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="first-name">First Name</Label>
              <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="last-name">Last Name</Label>
              <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Login Email</Label>
            <Input value={profile?.email || ''} disabled />
            <p className="text-xs text-muted-foreground">
              This is your login email. Contact the school admin to change it.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0712 345 678" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Nairobi, Kenya" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bio">About Me</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short line about yourself" rows={3} />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save Profile Details'}
          </Button>
        </CardFooter>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" /> Change Password
          </CardTitle>
          <CardDescription>Choose a new password with at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            onClick={handleChangePassword}
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
          >
            {savingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </CardFooter>
      </Card>

      {/* Notification preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" /> Notification Preferences
          </CardTitle>
          <CardDescription>Choose how and what the school notifies you about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PREF_ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.description}</p>
              </div>
              <Switch
                checked={prefs[row.key]}
                disabled={savingPrefKey === row.key}
                onCheckedChange={(checked) => handleTogglePref(row.key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dark / light mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <SunMoon className="h-5 w-5 text-primary" /> Dark / Light Mode
          </CardTitle>
          <CardDescription>Switch how the portal looks on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">
                {isDarkMode ? 'Currently on' : 'Currently off'} — applies across the student portal.
              </p>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={handleToggleTheme} />
          </div>
        </CardContent>
      </Card>

      {/* Language settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" /> Language Settings
          </CardTitle>
          <CardDescription>Choose your preferred display language.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-w-xs">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground pt-1">
              Your preference is saved on this device.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentSettings;
