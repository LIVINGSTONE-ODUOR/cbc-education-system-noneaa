import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  User,
  Users,
  Camera,
  Info,
} from 'lucide-react';

interface StudentDetailsProps {
  studentId?: number;
  onBack: () => void;
}

const StudentDetails: React.FC<StudentDetailsProps> = ({ studentId, onBack }) => {
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
    const branchId = localStorage.getItem('selectedBranch');

    const payload = {
      full_name: `${student.firstName} ${student.middleName} ${student.lastName}`.trim(),
      gender: student.gender,
      date_of_birth: student.dateOfBirth,
      admission_number: student.admissionNumber,
      grade_level: student.gradeLevel,
      special_needs: student.specialNeeds,
      guardian_name: `${parent.firstName} ${parent.lastName}`.trim(),
      guardian_phone: parent.phoneNumber,
      guardian_email: parent.email,
      guardian_relationship: parent.relationship,
      guardian_national_id: parent.nationalId,
      guardian_occupation: parent.occupation,
      address: parent.address,
      branch_id: branchId,
    };

    try {
      console.log('Sending payload:', payload);
      const response = await fetch('http://localhost:5000/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setLastSaved(new Date());
        console.log('Student registered:', data);
        alert('Student saved successfully');
      } else {
        console.error('Failed:', data);
        alert('Failed to save student: ' + (data?.error || JSON.stringify(data)));
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Network or server error.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full max-w-5xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <Button onClick={onBack} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {studentId ? 'Edit Student' : 'Add New Student'}
              </h1>
              {lastSaved && (
                <p className="text-xs text-green-600 mt-0.5">
                  Last saved at {lastSaved.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Student Information Card ── */}
        <Card className="shadow-md border border-gray-200 transition-shadow duration-300 hover:shadow-lg animate-fade-in">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
              <User className="w-5 h-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">

            {/* Profile picture upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden transition-all duration-300 hover:border-primary">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-300" />
                )}
              </div>
              <label htmlFor="upload-photo" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                  <Camera className="w-4 h-4" />
                  Upload Profile Picture
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id="upload-photo"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              <p className="text-xs text-muted-foreground">Optional · JPG, PNG up to 5 MB</p>
            </div>

            {/* Two-column fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div className="space-y-1.5">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="e.g. Jane"
                  value={student.firstName}
                  onChange={(e) => handleStudentChange('firstName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="middleName">Middle Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="middleName"
                  placeholder="e.g. Wanjiru"
                  value={student.middleName}
                  onChange={(e) => handleStudentChange('middleName', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="e.g. Doe"
                  value={student.lastName}
                  onChange={(e) => handleStudentChange('lastName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gender">
                  Gender <span className="text-destructive">*</span>
                </Label>
                <Select value={student.gender} onValueChange={(v) => handleStudentChange('gender', v)}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={student.dateOfBirth}
                  onChange={(e) => handleStudentChange('dateOfBirth', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admissionNumber">Admission Number</Label>
                <Input
                  id="admissionNumber"
                  placeholder="e.g. ADM-2024-001"
                  value={student.admissionNumber}
                  onChange={(e) => handleStudentChange('admissionNumber', e.target.value)}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="gradeLevel">Grade / Class</Label>
                <Select value={student.gradeLevel} onValueChange={(v) => handleStudentChange('gradeLevel', v)}>
                  <SelectTrigger id="gradeLevel">
                    <SelectValue placeholder="Select grade or class" />
                  </SelectTrigger>
                  <SelectContent>
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

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="specialNeeds">Special Needs <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea
                  id="specialNeeds"
                  placeholder="Describe any special needs or accommodations required…"
                  value={student.specialNeeds}
                  onChange={(e) => handleStudentChange('specialNeeds', e.target.value)}
                  className="min-h-24 resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Parent / Guardian Information Card ── */}
        <Card className="shadow-md border border-gray-200 transition-shadow duration-300 hover:shadow-lg animate-fade-in">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
              <Users className="w-5 h-5" />
              Parent / Guardian Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">

            {/* Helper description */}
            <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-200 p-4">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700">
                A parent account will be created with these details for portal access.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div className="space-y-1.5">
                <Label htmlFor="parentFirstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="parentFirstName"
                  placeholder="e.g. John"
                  value={parent.firstName}
                  onChange={(e) => handleParentChange('firstName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="parentLastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="parentLastName"
                  placeholder="e.g. Doe"
                  value={parent.lastName}
                  onChange={(e) => handleParentChange('lastName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="parentEmail">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="parentEmail"
                  type="email"
                  placeholder="e.g. john.doe@email.com"
                  value={parent.email}
                  onChange={(e) => handleParentChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="parentPhone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  placeholder="e.g. 0712 345 678"
                  value={parent.phoneNumber}
                  onChange={(e) => handleParentChange('phoneNumber', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="relationship">
                  Relationship to Student <span className="text-destructive">*</span>
                </Label>
                <Select value={parent.relationship} onValueChange={(v) => handleParentChange('relationship', v)}>
                  <SelectTrigger id="relationship">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Father">Father</SelectItem>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Guardian">Guardian</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nationalId">National ID Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="nationalId"
                  placeholder="e.g. 12345678"
                  value={parent.nationalId}
                  onChange={(e) => handleParentChange('nationalId', e.target.value)}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="occupation">Occupation <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="occupation"
                  placeholder="e.g. Teacher, Engineer, Business Owner"
                  value={parent.occupation}
                  onChange={(e) => handleParentChange('occupation', e.target.value)}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="address">Address <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea
                  id="address"
                  placeholder="Street address, city, county…"
                  value={parent.address}
                  onChange={(e) => handleParentChange('address', e.target.value)}
                  className="min-h-24 resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Form Actions ── */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8 animate-fade-in">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Save className="w-4 h-4 mr-2" />
            Save Student
          </Button>
        </div>

      </div>
    </div>
  );
};

export default StudentDetails;