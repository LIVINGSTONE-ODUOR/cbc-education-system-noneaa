import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { KeyRound, Phone as PhoneIcon, Mail, BellRing } from 'lucide-react';
import {
  getProfile,
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
  { key: 'announcements', label: 'School announcements', description: 'Notices, PTA meetings, and events' },
  { key: 'attendance', label: 'Attendance alerts', description: "Your child's absences and late arrivals" },
  { key: 'grades', label: 'Grades & report cards', description: 'New marks and report card availability' },
  { key: 'fees', label: 'Fee reminders', description: 'Upcoming and overdue fee balances' },
];

const Settings: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [phone, setPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  const [email, setEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [savingPrefKey, setSavingPrefKey] = useState<keyof NotificationPreferences | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [data, prefsData] = await Promise.all([
          getProfile(),
          getNotificationPreferences().catch(() => DEFAULT_PREFS),
        ]);
        setProfile(data);
        setPhone(data.phoneNumber || '');
        setEmail(data.alternativeEmail || '');
        setPrefs({ ...DEFAULT_PREFS, ...prefsData });
      } catch {
        // getProfile already toasts the error
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSavePhone = async () => {
    setSavingPhone(true);
    try {
      await updateContactInfo({ phone });
    } catch {
      // updateContactInfo already toasts the error
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSaveEmail = async () => {
    setSavingEmail(true);
    try {
      await updateContactInfo({ alternativeEmail: email });
    } catch {
      // updateContactInfo already toasts the error
    } finally {
      setSavingEmail(false);
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

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
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
    <div className="space-y-6" id="settings-section">
      {/* Update phone number */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PhoneIcon className="h-5 w-5 text-primary" /> Update Phone Number
          </CardTitle>
          <CardDescription>The number the school uses to reach you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0712 345 678" />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleSavePhone} disabled={savingPhone}>
            {savingPhone ? 'Saving...' : 'Save Phone Number'}
          </Button>
        </CardFooter>
      </Card>

      {/* Update email */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Update Email
          </CardTitle>
          <CardDescription>Used for school communication in addition to your login email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Login Email</Label>
            <Input value={profile?.email || ''} disabled />
            <p className="text-xs text-muted-foreground">
              This is your login email. Contact the school admin to change it.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleSaveEmail} disabled={savingEmail}>
            {savingEmail ? 'Saving...' : 'Save Email'}
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
    </div>
  );
};

export default Settings;
