import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserRound, KeyRound, Phone as PhoneIcon, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getProfile,
  updateContactInfo,
  changePassword,
  uploadAvatar,
  type Profile,
} from '@/lib/api/profileApi';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const Settings: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [phone, setPhone] = useState('');
  const [altEmail, setAltEmail] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        setPhone(data.phoneNumber || '');
        setAltEmail(data.alternativeEmail || '');
      } catch {
        // getProfile already toasts the error
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      await updateContactInfo({ phone, alternativeEmail: altEmail });
    } catch {
      // updateContactInfo already toasts the error
    } finally {
      setSavingContact(false);
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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { avatarUrl } = await uploadAvatar(file);
      setProfile((prev) => (prev ? { ...prev, avatarUrl } : prev));
    } catch {
      // uploadAvatar already toasts the error
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <Skeleton className="w-24 h-24 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-32 rounded-md" />
              <Skeleton className="h-3 w-40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-9 w-28 rounded-md ml-auto" />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Skeleton className="h-9 w-36 rounded-md ml-auto" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile picture */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserRound className="h-5 w-5" /> Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-secondary/20 bg-muted flex items-center justify-center shrink-0">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.firstName} className="w-full h-full object-cover" />
            ) : (
              <UserRound className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          <div>
            <Label htmlFor="avatar-upload" className="cursor-pointer">
              <Button asChild variant="outline" disabled={uploadingPhoto}>
                <span>{uploadingPhoto ? 'Uploading...' : 'Change Photo'}</span>
              </Button>
            </Label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={uploadingPhoto}
            />
            <p className="text-xs text-muted-foreground mt-2">JPG or PNG, up to a few MB.</p>
          </div>
        </CardContent>
      </Card>

      {/* Phone & Email */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PhoneIcon className="h-5 w-5" /> Contact Details
          </CardTitle>
          <CardDescription>Update your phone number and secondary email address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Login Email</Label>
            <Input value={profile?.email || ''} disabled />
            <p className="text-xs text-muted-foreground">
              This is your login email. Contact your school admin to change it.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0712 345 678" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="alt-email" className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> Alternative Email
            </Label>
            <Input id="alt-email" type="email" value={altEmail} onChange={(e) => setAltEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleSaveContact} disabled={savingContact}>
            {savingContact ? 'Saving...' : 'Save Contact Details'}
          </Button>
        </CardFooter>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Password
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
    </div>
  );
};

export default Settings;
