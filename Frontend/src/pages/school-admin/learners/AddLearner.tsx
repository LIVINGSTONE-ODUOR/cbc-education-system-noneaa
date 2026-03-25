import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { AuthService } from '@/lib/auth';
import {
  ArrowLeft,
  Save,
  User,
  Users,
  Camera,
  Info,
  GraduationCap,
  CheckCircle2,
  Upload,
  Sparkles,
} from 'lucide-react';

interface StudentDetailsProps {
  studentId?: number;
  onBack?: () => void;
}

const StudentDetails: React.FC<StudentDetailsProps> = ({ studentId, onBack }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPhotoHovered, setIsPhotoHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/school-admin/learners');
    }
  };

  // Student state
  const [student, setStudent] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    admissionNumber: '',
    gradeLevel: '',
    specialNeeds: '',
  });

  // Parent/Guardian state
  const [parent, setParent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    relationship: '',
    nationalId: '',
    occupation: '',
    address: '',
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (studentId) {
      setStudent({
        firstName: 'PETER',
        middleName: '',
        lastName: 'VALERO',
        gender: 'male',
        dateOfBirth: '2019-09-16',
        admissionNumber: 'ADM001',
        gradeLevel: 'Grade 1',
        specialNeeds: '',
      });
      setParent({
        firstName: 'John',
        lastName: 'Valero',
        email: 'parent@example.com',
        phoneNumber: '0795387869',
        relationship: 'Father',
        nationalId: '',
        occupation: '',
        address: '123 Main Street, Nairobi',
      });
    }
  }, [studentId]);

  const handleStudentChange = (field: string, value: string) => {
    setStudent(prev => ({ ...prev, [field]: value }));
  };

  const handleParentChange = (field: string, value: string) => {
    setParent(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    const payload = {
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      gradeLevel: student.gradeLevel,
      specialNeeds: student.specialNeeds,
      parentEmail: parent.email,
      parentFirstName: parent.firstName,
      parentLastName: parent.lastName,
      parentPhoneNumber: parent.phoneNumber,
      parentNationalId: parent.nationalId,
      parentOccupation: parent.occupation,
      parentRelationship: parent.relationship,
    };

    try {
      await AuthService.registerLearner(payload);
      setLastSaved(new Date());
      toast.success('Student saved successfully');
      navigate('/school-admin/learners');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save student. Please try again.';
      console.error('Save error:', error);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 w-full">
      <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── Premium Header ── */}
        <div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-6 shadow-xl animate-fade-in"
          style={{ animationDelay: '0ms' }}
        >
          {/* Decorative background circles */}
          <div className="pointer-events-none absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-10 -left-6 w-36 h-36 rounded-full bg-white/5" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleBack}
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/15 transition-all duration-200 rounded-xl border border-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="w-5 h-5 text-white/80" />
                  <Badge className="bg-white/20 text-white border-0 text-xs font-medium hover:bg-white/30">
                    {studentId ? 'Editing Record' : 'New Enrollment'}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {studentId ? 'Edit Student' : 'Add New Student'}
                </h1>
                <p className="text-white/60 text-sm mt-0.5">
                  {studentId
                    ? 'Update student and guardian information'
                    : 'Fill in the details below to enroll a new learner'}
                </p>
              </div>
            </div>

            {lastSaved && (
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 border border-white/20 self-start sm:self-auto">
                <CheckCircle2 className="w-4 h-4 text-green-300 shrink-0" />
                <span className="text-xs text-white/80 whitespace-nowrap">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          {/* Progress steps */}
          <div className="relative mt-5 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white text-primary text-xs font-bold flex items-center justify-center shadow-md">1</div>
              <span className="text-white/90 text-sm font-medium hidden sm:block">Student Info</span>
            </div>
            <div className="flex-1 h-px bg-white/25 mx-1" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/25 text-white text-xs font-bold flex items-center justify-center border border-white/30">2</div>
              <span className="text-white/60 text-sm hidden sm:block">Guardian Info</span>
            </div>
          </div>
        </div>

        {/* ── Student Information Card ── */}
        <div
          className="animate-fade-in"
          style={{ animationDelay: '80ms' }}
        >
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            {/* Colored top accent bar */}
            <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-blue-500" />

            {/* Card Header */}
            <div className="flex items-start gap-4 px-6 pt-6 pb-5 border-b border-slate-100">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Student Information</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Personal details and academic placement for the learner
                </p>
              </div>
            </div>

            <CardContent className="px-6 pt-6 pb-8 space-y-7">

              {/* Profile picture upload */}
              <div className="flex flex-col items-center gap-4">
                <div
                  className="relative w-28 h-28 rounded-full cursor-pointer group"
                  onMouseEnter={() => setIsPhotoHovered(true)}
                  onMouseLeave={() => setIsPhotoHovered(false)}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {/* Avatar circle */}
                  <div className={`w-full h-full rounded-full overflow-hidden border-4 transition-all duration-300 shadow-md ${isPhotoHovered ? 'border-primary shadow-primary/20 shadow-lg scale-105' : 'border-white'}`}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                        <User className="w-10 h-10 text-primary/40" />
                      </div>
                    )}
                  </div>

                  {/* Hover overlay */}
                  <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-all duration-300 ${isPhotoHovered ? 'bg-primary/60 opacity-100' : 'opacity-0'}`}>
                    <div className="flex flex-col items-center gap-1">
                      <Camera className="w-5 h-5 text-white" />
                      <span className="text-white text-[10px] font-medium">Change</span>
                    </div>
                  </div>

                  {/* Upload badge */}
                  <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow-md transition-transform duration-300 ${isPhotoHovered ? 'scale-110' : 'scale-100'}`}>
                    <Upload className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  id="upload-photo"
                  className="hidden"
                  onChange={handleImageChange}
                />

                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Profile Photo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Optional · JPG, PNG up to 5 MB</p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-slate-200" />

              {/* Two-column fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="e.g. Jane"
                    value={student.firstName}
                    onChange={(e) => handleStudentChange('firstName', e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName" className="text-sm font-medium">
                    Middle Name{' '}
                    <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="middleName"
                    placeholder="e.g. Wanjiru"
                    value={student.middleName}
                    onChange={(e) => handleStudentChange('middleName', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="e.g. Doe"
                    value={student.lastName}
                    onChange={(e) => handleStudentChange('lastName', e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium">
                    Gender <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Select value={student.gender} onValueChange={(v) => handleStudentChange('gender', v)}>
                    <SelectTrigger id="gender" className="h-11 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={student.dateOfBirth}
                    onChange={(e) => handleStudentChange('dateOfBirth', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admissionNumber" className="text-sm font-medium">Admission Number</Label>
                  <Input
                    id="admissionNumber"
                    placeholder="e.g. ADM-2024-001"
                    value={student.admissionNumber}
                    onChange={(e) => handleStudentChange('admissionNumber', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="gradeLevel" className="text-sm font-medium">Grade / Class</Label>
                  <Select value={student.gradeLevel} onValueChange={(v) => handleStudentChange('gradeLevel', v)}>
                    <SelectTrigger id="gradeLevel" className="h-11 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Select grade or class" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Play Group">Play Group</SelectItem>
                      <SelectItem value="PP1">Pre-Primary 1 (PP1)</SelectItem>
                      <SelectItem value="PP2">Pre-Primary 2 (PP2)</SelectItem>
                      <SelectItem value="Grade 1">Grade 1</SelectItem>
                      <SelectItem value="Grade 2">Grade 2</SelectItem>
                      <SelectItem value="Grade 3">Grade 3</SelectItem>
                      <SelectItem value="Grade 4">Grade 4</SelectItem>
                      <SelectItem value="Grade 5">Grade 5</SelectItem>
                      <SelectItem value="Grade 6">Grade 6</SelectItem>
                      <SelectItem value="Grade 7">Grade 7</SelectItem>
                      <SelectItem value="Grade 8">Grade 8</SelectItem>
                      <SelectItem value="Grade 9">Grade 9</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="specialNeeds" className="text-sm font-medium">
                    Special Needs{' '}
                    <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="specialNeeds"
                    placeholder="Describe any special needs or accommodations required…"
                    value={student.specialNeeds}
                    onChange={(e) => handleStudentChange('specialNeeds', e.target.value)}
                    className="min-h-24 resize-none rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Parent / Guardian Information Card ── */}
        <div
          className="animate-fade-in"
          style={{ animationDelay: '160ms' }}
        >
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            {/* Colored top accent bar */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-primary" />

            {/* Card Header */}
            <div className="flex items-start gap-4 px-6 pt-6 pb-5 border-b border-slate-100">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Parent / Guardian Information</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Contact details for the student's parent or legal guardian
                </p>
              </div>
            </div>

            <CardContent className="px-6 pt-6 pb-8 space-y-6">

              {/* Helper description */}
              <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700 leading-relaxed">
                  A parent account will be created with these details for portal access. Login credentials will be sent to the provided email address.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div className="space-y-2">
                  <Label htmlFor="parentFirstName" className="text-sm font-medium">
                    First Name <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id="parentFirstName"
                    placeholder="e.g. John"
                    value={parent.firstName}
                    onChange={(e) => handleParentChange('firstName', e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentLastName" className="text-sm font-medium">
                    Last Name <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id="parentLastName"
                    placeholder="e.g. Doe"
                    value={parent.lastName}
                    onChange={(e) => handleParentChange('lastName', e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentEmail" className="text-sm font-medium">
                    Email Address <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    placeholder="e.g. john.doe@email.com"
                    value={parent.email}
                    onChange={(e) => handleParentChange('email', e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentPhone" className="text-sm font-medium">
                    Phone Number <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id="parentPhone"
                    type="tel"
                    placeholder="e.g. 0712 345 678"
                    value={parent.phoneNumber}
                    onChange={(e) => handleParentChange('phoneNumber', e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship" className="text-sm font-medium">
                    Relationship to Student <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Select value={parent.relationship} onValueChange={(v) => handleParentChange('relationship', v)}>
                    <SelectTrigger id="relationship" className="h-11 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Father">Father</SelectItem>
                      <SelectItem value="Mother">Mother</SelectItem>
                      <SelectItem value="Guardian">Guardian</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationalId" className="text-sm font-medium">
                    National ID Number{' '}
                    <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="nationalId"
                    placeholder="e.g. 12345678"
                    value={parent.nationalId}
                    onChange={(e) => handleParentChange('nationalId', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="occupation" className="text-sm font-medium">
                    Occupation{' '}
                    <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="occupation"
                    placeholder="e.g. Teacher, Engineer, Business Owner"
                    value={parent.occupation}
                    onChange={(e) => handleParentChange('occupation', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Address{' '}
                    <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Street address, city, county…"
                    value={parent.address}
                    onChange={(e) => handleParentChange('address', e.target.value)}
                    className="min-h-24 resize-none rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Form Actions ── */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-8 animate-fade-in"
          style={{ animationDelay: '240ms' }}
        >
          <p className="text-sm text-muted-foreground order-last sm:order-first">
            <span className="text-destructive">*</span> Required fields
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="flex-1 sm:flex-none h-11 rounded-xl border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 font-medium"
            >
              {isSaving ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Student
                </>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDetails;