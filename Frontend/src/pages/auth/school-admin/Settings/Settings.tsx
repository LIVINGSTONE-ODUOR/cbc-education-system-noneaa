import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SchoolSignatoryCard } from './SchoolSignatoryCard';
import {
  Settings,
  Building,
  Calendar,
  Bell,
  Shield,
  Users,
  Mail,
  Save,
  Upload,
  Eye,
  EyeOff,
  PenLine
} from 'lucide-react';

export default function SettingsPage() {
  const [schoolData, setSchoolData] = useState({
    name: 'Example Primary School',
    code: 'EPS001',
    level: 'primary',
    county: 'Nairobi',
    subCounty: 'Westlands',
    address: '123 Education Street, Nairobi',
    phone: '+254 700 123 456',
    email: 'info@exampleprimary.edu',
    website: 'https://exampleprimary.edu',
    motto: 'Excellence in Education',
    established: '2005'
  });

  const [academicYear, setAcademicYear] = useState({
    current: '2024-2025',
    startDate: '2024-01-08',
    endDate: '2024-11-22',
    terms: [
      { name: 'Term 1', start: '2024-01-08', end: '2024-04-05' },
      { name: 'Term 2', start: '2024-05-06', end: '2024-08-02' },
      { name: 'Term 3', start: '2024-09-02', end: '2024-11-22' }
    ]
  });

  const [notifications, setNotifications] = useState({
    emailReports: true,
    assessmentReminders: true,
    parentUpdates: false,
    systemAlerts: true,
    weeklyDigest: true
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordExpiry: '90',
    loginAttempts: '5',
    ipWhitelist: false
  });

  const handleSave = (section: string) => {
    console.log(`Saving ${section} settings...`);
    // Mock save functionality
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your school's platform settings
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          <Settings className="w-4 h-4 mr-1" />
          System Configuration
        </Badge>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="school" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="school">School Profile</TabsTrigger>
          <TabsTrigger value="academic">Academic Year</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="signatory">Signatory</TabsTrigger>
        </TabsList>

        {/* School Profile Tab */}
        <TabsContent value="school" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                School Information
              </CardTitle>
              <CardDescription>
                Basic information about your school
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="school-name">School Name</Label>
                  <Input
                    id="school-name"
                    value={schoolData.name}
                    onChange={(e) => setSchoolData({...schoolData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school-code">School Code</Label>
                  <Input
                    id="school-code"
                    value={schoolData.code}
                    onChange={(e) => setSchoolData({...schoolData, code: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school-level">School Level</Label>
                  <Select value={schoolData.level} onValueChange={(value) => setSchoolData({...schoolData, level: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ecde">ECDE</SelectItem>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="established">Year Established</Label>
                  <Input
                    id="established"
                    value={schoolData.established}
                    onChange={(e) => setSchoolData({...schoolData, established: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="county">County</Label>
                  <Input
                    id="county"
                    value={schoolData.county}
                    onChange={(e) => setSchoolData({...schoolData, county: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sub-county">Sub-County</Label>
                  <Input
                    id="sub-county"
                    value={schoolData.subCounty}
                    onChange={(e) => setSchoolData({...schoolData, subCounty: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={schoolData.address}
                  onChange={(e) => setSchoolData({...schoolData, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={schoolData.phone}
                    onChange={(e) => setSchoolData({...schoolData, phone: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={schoolData.email}
                    onChange={(e) => setSchoolData({...schoolData, email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={schoolData.website}
                    onChange={(e) => setSchoolData({...schoolData, website: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motto">School Motto</Label>
                  <Input
                    id="motto"
                    value={schoolData.motto}
                    onChange={(e) => setSchoolData({...schoolData, motto: e.target.value})}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">School Logo</h4>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                    <Building className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Recommended: 200x200px, PNG or JPG
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('school')}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Year Tab */}
        <TabsContent value="academic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Academic Year Configuration
              </CardTitle>
              <CardDescription>
                Set up the current academic year and term dates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="academic-year">Academic Year</Label>
                  <Input
                    id="academic-year"
                    value={academicYear.current}
                    onChange={(e) => setAcademicYear({...academicYear, current: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={academicYear.startDate}
                    onChange={(e) => setAcademicYear({...academicYear, startDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={academicYear.endDate}
                    onChange={(e) => setAcademicYear({...academicYear, endDate: e.target.value})}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Academic Terms</h4>
                {academicYear.terms.map((term, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label>Term Name</Label>
                      <Input value={term.name} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={term.start} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" value={term.end} readOnly />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('academic')}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Academic Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly assessment reports via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailReports}
                    onCheckedChange={(checked) => setNotifications({...notifications, emailReports: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Assessment Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about upcoming assessments and deadlines
                    </p>
                  </div>
                  <Switch
                    checked={notifications.assessmentReminders}
                    onCheckedChange={(checked) => setNotifications({...notifications, assessmentReminders: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Parent Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Send automatic updates to parents about student progress
                    </p>
                  </div>
                  <Switch
                    checked={notifications.parentUpdates}
                    onCheckedChange={(checked) => setNotifications({...notifications, parentUpdates: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">System Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about system maintenance and updates
                    </p>
                  </div>
                  <Switch
                    checked={notifications.systemAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, systemAlerts: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Get a weekly summary of school activities and performance
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyDigest}
                    onCheckedChange={(checked) => setNotifications({...notifications, weeklyDigest: checked})}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('notifications')}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Select value={security.sessionTimeout} onValueChange={(value) => setSecurity({...security, sessionTimeout: value})}>
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="password-expiry">Password Expiry (days)</Label>
                  <Select value={security.passwordExpiry} onValueChange={(value) => setSecurity({...security, passwordExpiry: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="0">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-attempts">Max Login Attempts</Label>
                  <Select value={security.loginAttempts} onValueChange={(value) => setSecurity({...security, loginAttempts: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                      <SelectItem value="10">10 attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all admin accounts
                    </p>
                  </div>
                  <Switch
                    checked={security.twoFactorAuth}
                    onCheckedChange={(checked) => setSecurity({...security, twoFactorAuth: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">IP Whitelist</Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict access to specific IP addresses
                    </p>
                  </div>
                  <Switch
                    checked={security.ipWhitelist}
                    onCheckedChange={(checked) => setSecurity({...security, ipWhitelist: checked})}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Password Policy</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Minimum 8 characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>At least one uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>At least one lowercase letter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>At least one number</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>At least one special character</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>No common passwords</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('security')}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signatory Tab */}
        <TabsContent value="signatory" className="space-y-6">
          <SchoolSignatoryCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
