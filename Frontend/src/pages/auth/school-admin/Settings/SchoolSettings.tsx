import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSchoolById, updateSchool as updateSchoolApi } from '@/lib/api/schoolsApi';
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
import { toast } from 'sonner';
import {
  Building,
  Palette,
  BookOpen,
  Layers,
  Calendar,
  BarChart3,
  DollarSign,
  MessageSquare,
  Shield,
  Settings,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SchoolSignatoryCard } from './SchoolSignatoryCard';

// ─────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────

interface SchoolProfile {
  name: string;
  code: string;
  level: 'ecde' | 'primary' | 'secondary';
  county: string;
  subCounty: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  motto: string;
  established: string;
}

interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  schoolName: string;
}

interface AcademicSettings {
  currentYear: string;
  startDate: string;
  endDate: string;
  termsPerYear: number;
  gradingScale: 'a_f' | 'numeric' | 'percentages';
}

interface AcademicStructure {
  numberOfClasses: number;
  classLevels: string[];
  streams: number;
  maxStudentsPerClass: number;
}

interface AttendanceSettings {
  trackingMethod: 'daily' | 'hourly' | 'both';
  presentThreshold: number;
  absentThreshold: number;
  autoReportGeneration: boolean;
}

interface ExaminationSettings {
  numberOfExams: number;
  passingScore: number;
  gradesMethod: 'terminal' | 'continuous' | 'combined';
}

interface FinanceSettings {
  currency: string;
  academicYearStart: string;
  invoicePrefix: string;
  enablePaymentGateway: boolean;
}

interface CommunicationSettings {
  smsNotifications: boolean;
  emailNotifications: boolean;
  parentPortalAccess: boolean;
  announcementsToParents: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  ipWhitelist: boolean;
  passwordExpiry: number;
  sessionTimeout: number;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  accentColor?: string;
}

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const SCHOOL_SETTINGS_TABS: SettingsTab[] = [
  {
    id: 'school-profile',
    label: 'School Profile',
    icon: Building,
    description: 'Basic school information',
    accentColor: 'text-slate-600 dark:text-slate-400',
  },
  {
    id: 'branding',
    label: 'Branding & Appearance',
    icon: Palette,
    description: 'Colors and visual identity',
    accentColor: 'text-purple-600',
  },
  {
    id: 'academic-settings',
    label: 'Academic Settings',
    icon: BookOpen,
    description: 'Calendar and grading system',
    accentColor: 'text-orange-600',
  },
  {
    id: 'academic-structure',
    label: 'Academic Structure',
    icon: Layers,
    description: 'Classes and streams setup',
    accentColor: 'text-blue-600',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: Calendar,
    description: 'Attendance tracking settings',
    accentColor: 'text-green-600',
  },
  {
    id: 'examination',
    label: 'Examination & Grading',
    icon: BarChart3,
    description: 'Exam configuration',
    accentColor: 'text-indigo-600',
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    description: 'Fees and payments',
    accentColor: 'text-emerald-600',
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    description: 'Notifications and alerts',
    accentColor: 'text-cyan-600',
  },
  {
    id: 'security',
    label: 'Security & Privacy',
    icon: Shield,
    description: 'System security settings',
    accentColor: 'text-red-600',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Settings,
    description: 'Third-party integrations',
    accentColor: 'text-gray-400',
    badge: 'SOON',
  },
];

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
        const isDisabled = tab.badge === 'SOON';

        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            disabled={isDisabled}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
              isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer',
              isActive && !isDisabled
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium border-l-2 border-blue-500'
                : 'text-slate-600 dark:text-slate-400'
            )}
          >
            <div className="flex items-center gap-3 flex-1">
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isActive && !isDisabled && 'text-blue-600 dark:text-blue-400',
                  tab.accentColor && !isActive && tab.accentColor
                )}
              />
              <div className="text-left flex-1">
                <p className="font-medium text-sm">{tab.label}</p>
                <p className="text-xs opacity-60">{tab.description}</p>
              </div>
            </div>
            {isActive && !isDisabled && (
              <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            )}
            {tab.badge && (
              <Badge variant="secondary" className="ml-2 text-xs flex-shrink-0">
                {tab.badge}
              </Badge>
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

interface SchoolProfileTabProps {
  schoolProfile: SchoolProfile;
  isSaving: boolean;
  isLoading: boolean;
  onSchoolProfileChange: (profile: SchoolProfile) => void;
  onSave: () => Promise<void>;
}

function SchoolProfileTab({
  schoolProfile,
  isSaving,
  isLoading,
  onSchoolProfileChange,
  onSave,
}: SchoolProfileTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            School Information
          </CardTitle>
          <CardDescription>
            Core information about your educational institution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="school-name">School Name *</Label>
              <Input
                id="school-name"
                value={schoolProfile.name}
                onChange={(e) =>
                  onSchoolProfileChange({
                    ...schoolProfile,
                    name: e.target.value,
                  })
                }
                disabled={isSaving || isLoading}
                placeholder="e.g., Example Primary School"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school-code">School Code *</Label>
              <Input
                id="school-code"
                value={schoolProfile.code}
                disabled
                placeholder="e.g., EPS001"
              />
              <p className="text-xs text-muted-foreground">Contact your super admin to change this.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="school-level">School Level *</Label>
              <Select value={schoolProfile.level} disabled>
                <SelectTrigger id="school-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecde">ECDE</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Contact your super admin to change this.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="established">Year Established</Label>
              <Input
                id="established"
                type="number"
                value={schoolProfile.established}
                disabled
                placeholder="e.g., 2005"
              />
              <p className="text-xs text-muted-foreground">Contact your super admin to change this.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="county">County *</Label>
              <Input
                id="county"
                value={schoolProfile.county}
                disabled
                placeholder="e.g., Nairobi"
              />
              <p className="text-xs text-muted-foreground">Contact your super admin to change this.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-county">Sub-County</Label>
              <Input
                id="sub-county"
                value={schoolProfile.subCounty}
                disabled
                placeholder="e.g., Westlands"
              />
              <p className="text-xs text-muted-foreground">Contact your super admin to change this.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Physical Address</Label>
            <Textarea
              id="address"
              value={schoolProfile.address}
              onChange={(e) =>
                onSchoolProfileChange({
                  ...schoolProfile,
                  address: e.target.value,
                })
              }
              disabled={isSaving || isLoading}
              placeholder="Street, Building, City"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={schoolProfile.phone}
                onChange={(e) =>
                  onSchoolProfileChange({
                    ...schoolProfile,
                    phone: e.target.value,
                  })
                }
                disabled={isSaving || isLoading}
                placeholder="+254 700 000 000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={schoolProfile.email}
                onChange={(e) =>
                  onSchoolProfileChange({
                    ...schoolProfile,
                    email: e.target.value,
                  })
                }
                disabled={isSaving || isLoading}
                placeholder="info@school.edu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={schoolProfile.website}
                onChange={(e) =>
                  onSchoolProfileChange({
                    ...schoolProfile,
                    website: e.target.value,
                  })
                }
                disabled={isSaving || isLoading}
                placeholder="https://school.edu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motto">School Motto</Label>
              <Input
                id="motto"
                value={schoolProfile.motto}
                onChange={(e) =>
                  onSchoolProfileChange({
                    ...schoolProfile,
                    motto: e.target.value,
                  })
                }
                disabled={isSaving || isLoading}
                placeholder="e.g., Excellence in Education"
              />
            </div>
          </div>

          <Button onClick={onSave} disabled={isSaving || isLoading} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save School Profile
          </Button>
        </CardContent>
      </Card>

      <SchoolSignatoryCard />
    </div>
  );
}

interface BrandingTabProps {
  branding: BrandingSettings;
  isSaving: boolean;
  onBrandingChange: (branding: BrandingSettings) => void;
  onSave: () => Promise<void>;
}

function BrandingTab({
  branding,
  isSaving,
  onBrandingChange,
  onSave,
}: BrandingTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Branding & Appearance
          </CardTitle>
          <CardDescription>Customize your school's visual identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) =>
                    onBrandingChange({
                      ...branding,
                      primaryColor: e.target.value,
                    })
                  }
                  disabled={isSaving}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) =>
                    onBrandingChange({
                      ...branding,
                      primaryColor: e.target.value,
                    })
                  }
                  disabled={isSaving}
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) =>
                    onBrandingChange({
                      ...branding,
                      secondaryColor: e.target.value,
                    })
                  }
                  disabled={isSaving}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={branding.secondaryColor}
                  onChange={(e) =>
                    onBrandingChange({
                      ...branding,
                      secondaryColor: e.target.value,
                    })
                  }
                  disabled={isSaving}
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Logo & Favicon</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                  {branding.logoUrl ? (
                    <img
                      src={branding.logoUrl}
                      alt="School Logo"
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    <Building className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <Button variant="outline" size="sm" disabled={isSaving}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG or JPG. 200×200 px
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                  {branding.faviconUrl ? (
                    <img
                      src={branding.faviconUrl}
                      alt="Favicon"
                      className="w-8 h-8"
                    />
                  ) : (
                    <Settings className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <Button variant="outline" size="sm" disabled={isSaving}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Favicon
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG or ICO. 32×32 px
                </p>
              </div>
            </div>
          </div>

          <Button onClick={onSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save Branding Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface AcademicSettingsTabProps {
  academicSettings: AcademicSettings;
  isSaving: boolean;
  onAcademicSettingsChange: (settings: AcademicSettings) => void;
  onSave: () => Promise<void>;
}

function AcademicSettingsTab({
  academicSettings,
  isSaving,
  onAcademicSettingsChange,
  onSave,
}: AcademicSettingsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Academic Calendar & Grading
          </CardTitle>
          <CardDescription>Configure academic year and grading system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current-year">Current Academic Year *</Label>
              <Input
                id="current-year"
                value={academicSettings.currentYear}
                onChange={(e) =>
                  onAcademicSettingsChange({
                    ...academicSettings,
                    currentYear: e.target.value,
                  })
                }
                disabled={isSaving}
                placeholder="e.g., 2024-2025"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Academic Year Start Date *</Label>
              <Input
                id="start-date"
                type="date"
                value={academicSettings.startDate}
                onChange={(e) =>
                  onAcademicSettingsChange({
                    ...academicSettings,
                    startDate: e.target.value,
                  })
                }
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Academic Year End Date *</Label>
              <Input
                id="end-date"
                type="date"
                value={academicSettings.endDate}
                onChange={(e) =>
                  onAcademicSettingsChange({
                    ...academicSettings,
                    endDate: e.target.value,
                  })
                }
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="terms">Number of Terms Per Year *</Label>
              <Select
                value={academicSettings.termsPerYear.toString()}
                onValueChange={(value) =>
                  onAcademicSettingsChange({
                    ...academicSettings,
                    termsPerYear: parseInt(value),
                  })
                }
                disabled={isSaving}
              >
                <SelectTrigger id="terms">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Terms</SelectItem>
                  <SelectItem value="3">3 Terms</SelectItem>
                  <SelectItem value="4">4 Terms</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grading-scale">Grading Scale *</Label>
              <Select
                value={academicSettings.gradingScale}
                onValueChange={(value: any) =>
                  onAcademicSettingsChange({
                    ...academicSettings,
                    gradingScale: value,
                  })
                }
                disabled={isSaving}
              >
                <SelectTrigger id="grading-scale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_f">A-F Scale</SelectItem>
                  <SelectItem value="numeric">Numeric (0-100)</SelectItem>
                  <SelectItem value="percentages">Percentages</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={onSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save Academic Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface AcademicStructureTabProps {
  academicStructure: AcademicStructure;
  isSaving: boolean;
  onAcademicStructureChange: (structure: AcademicStructure) => void;
  onSave: () => Promise<void>;
}

function AcademicStructureTab({
  academicStructure,
  isSaving,
  onAcademicStructureChange,
  onSave,
}: AcademicStructureTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Academic Structure
          </CardTitle>
          <CardDescription>Configure classes and academic organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="num-classes">Number of Classes *</Label>
              <Input
                id="num-classes"
                type="number"
                value={academicStructure.numberOfClasses}
                onChange={(e) =>
                  onAcademicStructureChange({
                    ...academicStructure,
                    numberOfClasses: parseInt(e.target.value),
                  })
                }
                disabled={isSaving}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="streams">Streams Per Class *</Label>
              <Input
                id="streams"
                type="number"
                value={academicStructure.streams}
                onChange={(e) =>
                  onAcademicStructureChange({
                    ...academicStructure,
                    streams: parseInt(e.target.value),
                  })
                }
                disabled={isSaving}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-students">Max Students Per Class *</Label>
              <Input
                id="max-students"
                type="number"
                value={academicStructure.maxStudentsPerClass}
                onChange={(e) =>
                  onAcademicStructureChange({
                    ...academicStructure,
                    maxStudentsPerClass: parseInt(e.target.value),
                  })
                }
                disabled={isSaving}
                min="1"
              />
            </div>
          </div>

          <Button onClick={onSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save Academic Structure
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface AttendanceTabProps {
  attendance: AttendanceSettings;
  isSaving: boolean;
  onAttendanceChange: (settings: AttendanceSettings) => void;
  onSave: () => Promise<void>;
}

function AttendanceTab({
  attendance,
  isSaving,
  onAttendanceChange,
  onSave,
}: AttendanceTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Attendance Settings
          </CardTitle>
          <CardDescription>Configure attendance tracking parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tracking">Tracking Method *</Label>
            <Select
              value={attendance.trackingMethod}
              onValueChange={(value: any) =>
                onAttendanceChange({ ...attendance, trackingMethod: value })
              }
              disabled={isSaving}
            >
              <SelectTrigger id="tracking">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="both">Both Daily & Hourly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="present-threshold">Present Threshold (%) *</Label>
              <Input
                id="present-threshold"
                type="number"
                value={attendance.presentThreshold}
                onChange={(e) =>
                  onAttendanceChange({
                    ...attendance,
                    presentThreshold: parseInt(e.target.value),
                  })
                }
                disabled={isSaving}
                min="0"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="absent-threshold">Absent Threshold (%) *</Label>
              <Input
                id="absent-threshold"
                type="number"
                value={attendance.absentThreshold}
                onChange={(e) =>
                  onAttendanceChange({
                    ...attendance,
                    absentThreshold: parseInt(e.target.value),
                  })
                }
                disabled={isSaving}
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Generate Reports</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate attendance reports
              </p>
            </div>
            <Switch
              checked={attendance.autoReportGeneration}
              onCheckedChange={(checked) =>
                onAttendanceChange({
                  ...attendance,
                  autoReportGeneration: checked,
                })
              }
              disabled={isSaving}
            />
          </div>

          <Button onClick={onSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save Attendance Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface ExaminationTabProps {
  examination: ExaminationSettings;
  isSaving: boolean;
  onExaminationChange: (settings: ExaminationSettings) => void;
  onSave: () => Promise<void>;
}

function ExaminationTab({
  examination,
  isSaving,
  onExaminationChange,
  onSave,
}: ExaminationTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Examination & Grading
          </CardTitle>
          <CardDescription>Configure exam and grading parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="num-exams">Number of Exams Per Year *</Label>
              <Input
                id="num-exams"
                type="number"
                value={examination.numberOfExams}
                onChange={(e) =>
                  onExaminationChange({
                    ...examination,
                    numberOfExams: parseInt(e.target.value),
                  })
                }
                disabled={isSaving}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passing-score">Passing Score (%) *</Label>
              <Input
                id="passing-score"
                type="number"
                value={examination.passingScore}
                onChange={(e) =>
                  onExaminationChange({
                    ...examination,
                    passingScore: parseInt(e.target.value),
                  })
                }
                disabled={isSaving}
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grades-method">Grading Method *</Label>
            <Select
              value={examination.gradesMethod}
              onValueChange={(value: any) =>
                onExaminationChange({
                  ...examination,
                  gradesMethod: value,
                })
              }
              disabled={isSaving}
            >
              <SelectTrigger id="grades-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terminal">Terminal (Exams Only)</SelectItem>
                <SelectItem value="continuous">
                  Continuous Assessment
                </SelectItem>
                <SelectItem value="combined">Combined (Both)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={onSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save Examination Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface FinanceTabProps {
  finance: FinanceSettings;
  isSaving: boolean;
  onFinanceChange: (settings: FinanceSettings) => void;
  onSave: () => Promise<void>;
}

function FinanceTab({
  finance,
  isSaving,
  onFinanceChange,
  onSave,
}: FinanceTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Finance Settings
          </CardTitle>
          <CardDescription>Configure financial and payment settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={finance.currency}
                onValueChange={(value) =>
                  onFinanceChange({ ...finance, currency: value })
                }
                disabled={isSaving}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice-prefix">Invoice Prefix *</Label>
              <Input
                id="invoice-prefix"
                value={finance.invoicePrefix}
                onChange={(e) =>
                  onFinanceChange({
                    ...finance,
                    invoicePrefix: e.target.value,
                  })
                }
                disabled={isSaving}
                placeholder="e.g., INV"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year-start">Academic Year Start (Month) *</Label>
              <Select
                value={finance.academicYearStart}
                onValueChange={(value) =>
                  onFinanceChange({
                    ...finance,
                    academicYearStart: value,
                  })
                }
                disabled={isSaving}
              >
                <SelectTrigger id="year-start">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01">January</SelectItem>
                  <SelectItem value="02">February</SelectItem>
                  <SelectItem value="03">March</SelectItem>
                  <SelectItem value="04">April</SelectItem>
                  <SelectItem value="05">May</SelectItem>
                  <SelectItem value="06">June</SelectItem>
                  <SelectItem value="07">July</SelectItem>
                  <SelectItem value="08">August</SelectItem>
                  <SelectItem value="09">September</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Payment Gateway</Label>
              <p className="text-sm text-muted-foreground">
                Allow online payments through M-Pesa, Stripe, etc.
              </p>
            </div>
            <Switch
              checked={finance.enablePaymentGateway}
              onCheckedChange={(checked) =>
                onFinanceChange({
                  ...finance,
                  enablePaymentGateway: checked,
                })
              }
              disabled={isSaving}
            />
          </div>

          <Button onClick={onSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save Finance Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface CommunicationTabProps {
  communication: CommunicationSettings;
  isSaving: boolean;
  onCommunicationChange: (settings: CommunicationSettings) => void;
  onSave: () => Promise<void>;
}

function CommunicationTab({
  communication,
  isSaving,
  onCommunicationChange,
  onSave,
}: CommunicationTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Communication Settings
          </CardTitle>
          <CardDescription>Configure notifications and messaging</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send SMS alerts to students and parents
                </p>
              </div>
              <Switch
                checked={communication.smsNotifications}
                onCheckedChange={(checked) =>
                  onCommunicationChange({
                    ...communication,
                    smsNotifications: checked,
                  })
                }
                disabled={isSaving}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications to all users
                </p>
              </div>
              <Switch
                checked={communication.emailNotifications}
                onCheckedChange={(checked) =>
                  onCommunicationChange({
                    ...communication,
                    emailNotifications: checked,
                  })
                }
                disabled={isSaving}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Parent Portal Access</Label>
                <p className="text-sm text-muted-foreground">
                  Allow parents to access student information
                </p>
              </div>
              <Switch
                checked={communication.parentPortalAccess}
                onCheckedChange={(checked) =>
                  onCommunicationChange({
                    ...communication,
                    parentPortalAccess: checked,
                  })
                }
                disabled={isSaving}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Announcements to Parents</Label>
                <p className="text-sm text-muted-foreground">
                  Send school announcements to parent portals
                </p>
              </div>
              <Switch
                checked={communication.announcementsToParents}
                onCheckedChange={(checked) =>
                  onCommunicationChange({
                    ...communication,
                    announcementsToParents: checked,
                  })
                }
                disabled={isSaving}
              />
            </div>
          </div>

          <Button onClick={onSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save Communication Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface SecurityTabProps {
  security: SecuritySettings;
  isSaving: boolean;
  onSecurityChange: (settings: SecuritySettings) => void;
  onSave: () => Promise<void>;
}

function SecurityTab({
  security,
  isSaving,
  onSecurityChange,
  onSave,
}: SecurityTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>Configure system security parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication (2FA)</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all admin accounts
                </p>
              </div>
              <Switch
                checked={security.twoFactorAuth}
                onCheckedChange={(checked) =>
                  onSecurityChange({
                    ...security,
                    twoFactorAuth: checked,
                  })
                }
                disabled={isSaving}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>IP Whitelist</Label>
                <p className="text-sm text-muted-foreground">
                  Restrict access to specific IP addresses
                </p>
              </div>
              <Switch
                checked={security.ipWhitelist}
                onCheckedChange={(checked) =>
                  onSecurityChange({
                    ...security,
                    ipWhitelist: checked,
                  })
                }
                disabled={isSaving}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password-expiry">Password Expiry (Days)</Label>
                <Input
                  id="password-expiry"
                  type="number"
                  value={security.passwordExpiry}
                  onChange={(e) =>
                    onSecurityChange({
                      ...security,
                      passwordExpiry: parseInt(e.target.value),
                    })
                  }
                  disabled={isSaving}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (Minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={security.sessionTimeout}
                  onChange={(e) =>
                    onSecurityChange({
                      ...security,
                      sessionTimeout: parseInt(e.target.value),
                    })
                  }
                  disabled={isSaving}
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backup-frequency">Backup Frequency *</Label>
              <Select
                value={security.backupFrequency}
                onValueChange={(value: any) =>
                  onSecurityChange({
                    ...security,
                    backupFrequency: value,
                  })
                }
                disabled={isSaving}
              >
                <SelectTrigger id="backup-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={onSave} disabled={isSaving} className="gap-2">
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
// ───────────────────────────────────────────��─────────────────────

export default function SchoolSettingsPage() {
  const { user } = useAuth();



  // ─────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('school-profile');

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>({
    name: '',
    code: '',
    level: 'primary',
    county: '',
    subCounty: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    motto: '',
    established: '',
  });

  const [branding, setBranding] = useState<BrandingSettings>({
    primaryColor: '#2563eb',
    secondaryColor: '#7c3aed',
    logoUrl: '',
    faviconUrl: '',
    schoolName: 'Example Primary School',
  });

  const [academicSettings, setAcademicSettings] = useState<AcademicSettings>({
    currentYear: '2024-2025',
    startDate: '2024-01-08',
    endDate: '2024-11-22',
    termsPerYear: 3,
    gradingScale: 'a_f',
  });

  const [academicStructure, setAcademicStructure] = useState<AcademicStructure>({
    numberOfClasses: 8,
    classLevels: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'],
    streams: 2,
    maxStudentsPerClass: 50,
  });

  const [attendance, setAttendance] = useState<AttendanceSettings>({
    trackingMethod: 'daily',
    presentThreshold: 80,
    absentThreshold: 20,
    autoReportGeneration: true,
  });

  const [examination, setExamination] = useState<ExaminationSettings>({
    numberOfExams: 3,
    passingScore: 50,
    gradesMethod: 'combined',
  });

  const [finance, setFinance] = useState<FinanceSettings>({
    currency: 'KES',
    academicYearStart: '01',
    invoicePrefix: 'INV',
    enablePaymentGateway: true,
  });

  const [communication, setCommunication] = useState<CommunicationSettings>({
    smsNotifications: true,
    emailNotifications: true,
    parentPortalAccess: true,
    announcementsToParents: true,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorAuth: false,
    ipWhitelist: false,
    passwordExpiry: 90,
    sessionTimeout: 30,
    backupFrequency: 'daily',
  });

  // ─────────────────────────────────────────────────────────────────
  // LOAD REAL DATA
  // ─────────────────────────────────────────────────────────────────
  // Only the School Profile tab is wired to the backend so far — it's the
  // only one with a real endpoint (GET/PUT /api/v1/schools/:id). Branding,
  // Academic, Finance, Communication, and Security below still use local
  // state only until those get their own backend support.
  useEffect(() => {
    if (!user?.schoolId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const res = await getSchoolById(user.schoolId as string);
        const school = res.data;
        if (!school || cancelled) return;
        const validLevels: SchoolProfile['level'][] = ['ecde', 'primary', 'secondary'];
        setSchoolProfile({
          name: school.name || '',
          code: school.code || '',
          level: validLevels.includes(school.level as SchoolProfile['level'])
            ? (school.level as SchoolProfile['level'])
            : 'primary',
          county: school.county || '',
          subCounty: school.sub_county || '',
          address: school.physical_address || '',
          phone: school.phone_number || school.phone || '',
          email: school.email || '',
          website: school.website || '',
          motto: school.motto || '',
          established: school.year_established ? String(school.year_established) : '',
        });
      } catch (error) {
        console.error('Error loading school profile:', error);
        toast.error('Failed to load school profile', {
          icon: <AlertCircle className="h-4 w-4" />,
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.schoolId]);

  // ─────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────

  const handleSave = useCallback(
    async (section: string) => {
      if (section === 'School Profile') {
        if (!user?.schoolId) {
          toast.error('No school found for this account', {
            icon: <AlertCircle className="h-4 w-4" />,
          });
          return;
        }
        try {
          setIsSaving(true);
          // Only fields school.controller.js -> updateSchool actually
          // allows a school_admin to change. name/level/county/sub-county/
          // code/established stay super_admin-only there, which is also
          // why those inputs are disabled below for this role.
          await updateSchoolApi(user.schoolId, {
            name: schoolProfile.name,
            physical_address: schoolProfile.address,
            phone_number: schoolProfile.phone,
            email: schoolProfile.email,
            website: schoolProfile.website,
            motto: schoolProfile.motto,
          });
          toast.success(`✓ ${section} saved successfully`, {
            icon: <CheckCircle2 className="h-4 w-4" />,
          });
        } catch (error) {
          console.error(`Error saving ${section}:`, error);
          toast.error(error instanceof Error ? error.message : `Failed to save ${section}`, {
            icon: <AlertCircle className="h-4 w-4" />,
          });
        } finally {
          setIsSaving(false);
        }
        return;
      }

      try {
        setIsSaving(true);
        // Simulate API call — no backend endpoint for this section yet.
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast.success(`✓ ${section} saved successfully`, {
          icon: <CheckCircle2 className="h-4 w-4" />,
        });
      } catch (error) {
        console.error(`Error saving ${section}:`, error);
        toast.error(`Failed to save ${section}`, {
          icon: <AlertCircle className="h-4 w-4" />,
        });
      } finally {
        setIsSaving(false);
      }
    },
    [user?.schoolId, schoolProfile]
  );

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading school settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">School Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your school's profile, configuration, and system preferences
        </p>
      </div>

      {/* Settings Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-4">
              <SidebarNav
                tabs={SCHOOL_SETTINGS_TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          {activeTab === 'school-profile' && (
            <SchoolProfileTab
              schoolProfile={schoolProfile}
              isSaving={isSaving}
              isLoading={isLoading}
              onSchoolProfileChange={setSchoolProfile}
              onSave={() => handleSave('School Profile')}
            />
          )}

          {activeTab === 'branding' && (
            <BrandingTab
              branding={branding}
              isSaving={isSaving}
              onBrandingChange={setBranding}
              onSave={() => handleSave('Branding Settings')}
            />
          )}

          {activeTab === 'academic-settings' && (
            <AcademicSettingsTab
              academicSettings={academicSettings}
              isSaving={isSaving}
              onAcademicSettingsChange={setAcademicSettings}
              onSave={() => handleSave('Academic Settings')}
            />
          )}

          {activeTab === 'academic-structure' && (
            <AcademicStructureTab
              academicStructure={academicStructure}
              isSaving={isSaving}
              onAcademicStructureChange={setAcademicStructure}
              onSave={() => handleSave('Academic Structure')}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceTab
              attendance={attendance}
              isSaving={isSaving}
              onAttendanceChange={setAttendance}
              onSave={() => handleSave('Attendance Settings')}
            />
          )}

          {activeTab === 'examination' && (
            <ExaminationTab
              examination={examination}
              isSaving={isSaving}
              onExaminationChange={setExamination}
              onSave={() => handleSave('Examination Settings')}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceTab
              finance={finance}
              isSaving={isSaving}
              onFinanceChange={setFinance}
              onSave={() => handleSave('Finance Settings')}
            />
          )}

          {activeTab === 'communication' && (
            <CommunicationTab
              communication={communication}
              isSaving={isSaving}
              onCommunicationChange={setCommunication}
              onSave={() => handleSave('Communication Settings')}
            />
          )}

          {activeTab === 'security' && (
            <SecurityTab
              security={security}
              isSaving={isSaving}
              onSecurityChange={setSecurity}
              onSave={() => handleSave('Security Settings')}
            />
          )}

          {activeTab === 'integrations' && (
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                  Third-party integrations coming soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Badge variant="secondary" className="mb-3">
                    COMING SOON
                  </Badge>
                  <p className="text-muted-foreground">
                    Integration with third-party services will be available in the next release
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
