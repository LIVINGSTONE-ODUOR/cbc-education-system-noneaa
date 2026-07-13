'use client';

import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Loader2,
  ChevronUp,
  ChevronDown,
  BookOpen,
  User,
  FileText,
  BarChart3,
  Heart,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Users,
  Copy,
  Lock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Gender } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { getClasses } from '@/lib/api/classApi';

// ✅ INTERFACES
interface CreateLearnerPayload {
  admission_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  birth_certificate_number?: string;
  nemis_number?: string;
  nationality?: string;
  special_needs?: string;
  medical_conditions?: string;
  allergies?: string;
  profile_photo?: string;
  previous_school?: string;
  admission_date?: string;
  academic_year?: string;
  parent_info?: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    national_id?: string;
    occupation?: string;
    relationship: string;
  };
}

interface Class {
  id: string;
  grade_level: string;
  stream_name: string | null;
  is_active: boolean;
}

interface LearnerDetailsResponse {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: string;
  birth_certificate_number?: string;
  nemis_number?: string;
  nationality?: string;
  special_needs?: string;
  medical_conditions?: string;
  allergies?: string;
  profile_photo?: string;
  previous_school?: string;
  admission_date?: string;
  academic_year?: string;
  grade_level: string;
  stream_name?: string;
  learner_parents?: Array<{
    parents: {
      users: {
        first_name: string;
        last_name: string;
        phone_number: string;
        email?: string;
        national_id?: string;
        occupation?: string;
        relationship?: string;
      };
    };
  }>;
}

// ✅ UTILITY FUNCTIONS
const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as { message: string }).message;
  }
  return fallback;
};

type TabValue = 'student' | 'academic' | 'guardian' | 'health' | 'documents' | 'notes';

// ✅ PROGRESS TRACKER SECTION CONFIG — colors/icons for the sidebar nav
const SECTIONS: Array<{
  value: TabValue;
  label: string;
  icon: typeof User;
  iconBg: string;
  iconColor: string;
  barColor: string;
}> = [
  { value: 'student', label: 'Student Info', icon: User, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', barColor: 'bg-blue-500' },
  { value: 'academic', label: 'Academic', icon: BookOpen, iconBg: 'bg-green-100', iconColor: 'text-green-600', barColor: 'bg-green-500' },
  { value: 'guardian', label: 'Guardian', icon: Users, iconBg: 'bg-rose-100', iconColor: 'text-rose-500', barColor: 'bg-rose-400' },
  { value: 'health', label: 'Health', icon: Heart, iconBg: 'bg-teal-100', iconColor: 'text-teal-600', barColor: 'bg-teal-400' },
  { value: 'documents', label: 'Documents', icon: FileText, iconBg: 'bg-sky-100', iconColor: 'text-sky-600', barColor: 'bg-sky-400' },
  { value: 'notes', label: 'Notes', icon: BarChart3, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', barColor: 'bg-amber-400' },
];

// ✅ MAIN COMPONENT
export default function AddLearnerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  // Get the edit ID from query params
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  // ✅ STATE MANAGEMENT
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExistingData, setIsLoadingExistingData] = useState(isEditMode);
  const [activeTab, setActiveTab] = useState<TabValue>('student');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    student: true,
    academic: false,
    guardian: false,
    health: false,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classesLoading, setClassesLoading] = useState(true);

  const [learnerData, setLearnerData] = useState({
    admissionNumber: '',
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    profilePhoto: null as File | null,
    birthCertificateNumber: '',
    nemisNumber: '',
    nationality: 'Kenyan',
    specialNeeds: '',
    medicalConditions: '',
    allergies: '',
    previousSchool: '',
    academicYear: new Date().getFullYear().toString(),
    admissionDate: new Date().toISOString().split('T')[0],
    term: 'Term 1',
    gradeLevel: '',
    streamName: '',
  });

  const [parentData, setParentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    nationalId: '',
    occupation: '',
    relationship: '',
  });

  const [documentsData, setDocumentsData] = useState({
    notes: '',
  });

  // ✅ EFFECT: Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setClassesLoading(true);
        const response = await getClasses({ is_active: 'true' });
        setClasses(response.data?.classes || []);
      } catch (error) {
        console.error('Failed to load classes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load classes. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setClassesLoading(false);
      }
    };
    fetchClasses();
  }, [toast]);

  // ✅ EFFECT: Fetch existing learner data if in edit mode
  useEffect(() => {
    if (!isEditMode || !editId) return;

    const fetchLearnerDetails = async () => {
      try {
        setIsLoadingExistingData(true);
        const response = await fetch(`/api/v1/learners/${editId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('cbe_access_token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch learner details');
        }

        const result = await response.json();
        const data: LearnerDetailsResponse = result.data;

        // Populate learner data with all fields including new ones
        setLearnerData({
          admissionNumber: data.admission_number || '',
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          middleName: data.middle_name || '',
          dateOfBirth: data.date_of_birth || '',
          gender: data.gender || '',
          profilePhoto: null,
          birthCertificateNumber: data.birth_certificate_number || '',
          nemisNumber: data.nemis_number || '',
          nationality: data.nationality || 'Kenyan',
          specialNeeds: data.special_needs || '',
          medicalConditions: data.medical_conditions || '',
          allergies: data.allergies || '',
          previousSchool: data.previous_school || '',
          academicYear: data.academic_year || new Date().getFullYear().toString(),
          admissionDate: data.admission_date || new Date().toISOString().split('T')[0],
          term: 'Term 1',
          gradeLevel: data.grade_level || '',
          streamName: data.stream_name || '',
        });

        // Find and set the class ID
        const matchingClass = classes.find(
          (c) =>
            c.grade_level === data.grade_level &&
            (c.stream_name === data.stream_name || (!c.stream_name && !data.stream_name))
        );
        if (matchingClass) {
          setSelectedClassId(matchingClass.id);
        }

        // Populate parent data if available
        if (data.learner_parents?.[0]?.parents?.users) {
          const parentInfo = data.learner_parents[0].parents.users;
          setParentData({
            firstName: parentInfo.first_name || '',
            lastName: parentInfo.last_name || '',
            email: (parentInfo as any).email || '',
            phoneNumber: parentInfo.phone_number || '',
            nationalId: parentInfo.national_id || '',
            occupation: parentInfo.occupation || '',
            relationship: parentInfo.relationship || '',
          });
        }

        toast({
          title: 'Success',
          description: 'Learner details loaded successfully',
          duration: 2000,
        });
      } catch (error) {
        console.error('Error fetching learner details:', error);
        toast({
          title: 'Error',
          description: getErrorMessage(error, 'Failed to load learner details'),
          variant: 'destructive',
        });
        setTimeout(() => navigate('/school-admin/learners'), 2000);
      } finally {
        setIsLoadingExistingData(false);
      }
    };

    fetchLearnerDetails();
  }, [isEditMode, editId, classes, toast, navigate]);

  // ✅ HANDLERS
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setLearnerData((prev) => ({
        ...prev,
        profilePhoto: e.target.files![0],
      }));
    }
  };

  const uploadPhoto = async (file: File, admissionNumber: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', `${admissionNumber}-${Date.now()}`);
      formData.append('school_id', user?.schoolId || '');

      const response = await fetch(`/api/v1/learners/upload-photo`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('cbe_access_token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Photo upload failed:', errorData);
        return null;
      }

      const data = await response.json();
      return data.photoUrl || data.url || null;
    } catch (error) {
      console.warn('Photo upload error:', error);
      return null;
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Learner validation
    if (!learnerData.admissionNumber.trim()) {
      errors.admissionNumber = 'Admission number is required';
    }
    if (!learnerData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!learnerData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!learnerData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    if (!learnerData.gender) {
      errors.gender = 'Gender is required';
    }
    if (!selectedClassId) {
      errors.gradeLevel = 'Class selection is required';
    }

    // Parent validation
    if (!parentData.firstName.trim()) {
      errors.parentFirstName = 'Parent first name is required';
    }
    if (!parentData.lastName.trim()) {
      errors.parentLastName = 'Parent last name is required';
    }
    if (!parentData.email.trim()) {
      errors.parentEmail = 'Parent email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentData.email)) {
      errors.parentEmail = 'Please enter a valid email address';
    }
    if (!parentData.phoneNumber.trim()) {
      errors.parentPhone = 'Parent phone number is required';
    }
    if (!parentData.relationship) {
      errors.parentRelationship = 'Relationship is required';
    }
    if (!parentData.nationalId.trim()) {
      errors.parentNationalId = 'National ID is required to create the parent portal account';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstErrorKey = Object.keys(validationErrors)[0];
      let errorMessage = 'Please fill in all required fields:';

      Object.entries(validationErrors).forEach(([key, value]) => {
        errorMessage += `\n• ${value}`;
      });

      toast({
        title: 'Validation Error',
        description: errorMessage,
        variant: 'destructive',
      });

      if (firstErrorKey?.includes('parent')) {
        setActiveTab('guardian');
      } else if (firstErrorKey?.includes('grade') || firstErrorKey?.includes('academic')) {
        setActiveTab('academic');
      } else {
        setActiveTab('student');
      }

      return;
    }

    setIsLoading(true);

    try {
      let photoUrl = null;
      if (learnerData.profilePhoto) {
        console.log('Attempting to upload photo...');
        photoUrl = await uploadPhoto(learnerData.profilePhoto, learnerData.admissionNumber);
        if (!photoUrl) {
          console.warn('Photo upload was skipped, continuing without photo');
        }
      }

      // ✅ COMPLETE PAYLOAD WITH ALL FIELDS
      const payload: CreateLearnerPayload = {
        admission_number: learnerData.admissionNumber,
        first_name: learnerData.firstName,
        last_name: learnerData.lastName,
        middle_name: learnerData.middleName || undefined,
        date_of_birth: learnerData.dateOfBirth,
        gender: learnerData.gender,
        birth_certificate_number: learnerData.birthCertificateNumber || undefined,
        nemis_number: learnerData.nemisNumber || undefined,
        nationality: learnerData.nationality || undefined,
        special_needs: learnerData.specialNeeds || undefined,
        medical_conditions: learnerData.medicalConditions || undefined,
        allergies: learnerData.allergies || undefined,
        profile_photo: photoUrl || undefined,
        previous_school: learnerData.previousSchool || undefined,
        admission_date: learnerData.admissionDate || undefined,
        academic_year: learnerData.academicYear || undefined,

        // Ensure backend creates/updates learner enrollment so class counts match.
        class_id: selectedClassId,

        parent_info: {
          first_name: parentData.firstName,
          last_name: parentData.lastName,
          email: parentData.email,
          phone_number: parentData.phoneNumber,
          national_id: parentData.nationalId || undefined,
          occupation: parentData.occupation || undefined,
          relationship: parentData.relationship,
        },
      };


      console.log(`${isEditMode ? 'Updating' : 'Creating'} learner with payload:`, payload);

      const endpoint = isEditMode ? `/api/v1/learners/${editId}` : `/api/v1/learners`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('cbe_access_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Learner ${isEditMode ? 'update' : 'creation'} API Error Response:`, errorData);
        throw new Error(
          errorData.message || `API Error: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log(`Learner ${isEditMode ? 'updated' : 'created'} successfully:`, result);

      const learnerId = result.data?.id || editId;
      // The backend already creates the class enrollment atomically inside
      // registerLearner/updateLearner when class_id is included in the payload
      // (see Backend controller "Option A"). Calling a separate enroll endpoint
      // here was redundant, guaranteed to conflict with that just-created row,
      // and was slowing down/derailing every successful submission.
      const enrollmentSuccess = !isEditMode && Boolean(result.data?.enrollment);
      const parentCreated = Boolean(result.data?.parent);
      const backendWarnings: string[] = (result.warnings || []).map((w: any) => w.message || w).filter(Boolean);

      if (!isEditMode && selectedClassId && !enrollmentSuccess) {
        console.warn('Learner created but no enrollment came back from the server:', result);
        toast({
          title: 'Partial Success',
          description: `Student ${learnerData.firstName} ${learnerData.lastName} was created successfully, but enrollment in the class failed. You can enroll them manually later.`,
          variant: 'default',
        });
      }

      // Surface anything the backend flagged (e.g. the parent portal account
      // could not be created) — previously these were silently discarded and
      // the UI would still claim "Parent account created" below regardless.
      if (backendWarnings.length > 0) {
        console.warn('Learner registration warnings:', backendWarnings);
        toast({
          title: 'Please review',
          description: backendWarnings.join(' '),
          variant: 'destructive',
        });
      }

      if (isEditMode) {
        toast({
          title: 'Success',
          description: `${learnerData.firstName} ${learnerData.lastName}'s details have been updated successfully.`,
        });
      } else if (enrollmentSuccess) {
        toast({
          title: 'Success',
          description: parentCreated
            ? `${learnerData.firstName} ${learnerData.lastName} has been created and enrolled in ${learnerData.gradeLevel}${learnerData.streamName ? ` ${learnerData.streamName}` : ''}. Parent account created for ${parentData.firstName} ${parentData.lastName}.`
            : `${learnerData.firstName} ${learnerData.lastName} has been created and enrolled in ${learnerData.gradeLevel}${learnerData.streamName ? ` ${learnerData.streamName}` : ''}.`,
        });
      } else {
        toast({
          title: 'Success',
          description: `${learnerData.firstName} ${learnerData.lastName} has been created successfully with all details saved.`,
        });
      }

      setTimeout(() => {
        navigate('/school-admin/learners');
      }, 1500);
    } catch (error: unknown) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} learner:`, error);
      toast({
        title: `${isEditMode ? 'Update' : 'Creation'} Failed`,
        description: getErrorMessage(
          error,
          `Failed to ${isEditMode ? 'update' : 'create'} learner. Please try again.`
        ),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);

    const selectedClass = classes.find((cls) => cls.id === classId);
    if (selectedClass) {
      setLearnerData((prev) => ({
        ...prev,
        gradeLevel: selectedClass.grade_level,
        streamName: selectedClass.stream_name || '',
      }));
    }

    if (validationErrors.gradeLevel) {
      setValidationErrors((prev) => ({
        ...prev,
        gradeLevel: '',
      }));
    }
  };

  const handleLearnerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLearnerData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleParentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParentData((prev) => ({
      ...prev,
      [name]: value,
    }));
    const errorKey = `parent${name.charAt(0).toUpperCase() + name.slice(1)}`;
    if (validationErrors[errorKey]) {
      setValidationErrors((prev) => ({
        ...prev,
        [errorKey]: '',
      }));
    }
  };

  // ✅ LOADING STATE
  if (isLoadingExistingData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100">Loading learner details...</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Please wait while we fetch the information...</p>
        </div>
      </div>
    );
  }

  // ✅ PROGRESS: rough completion % per section, for the sidebar tracker
  const pct = (filled: number, total: number) => (total === 0 ? 0 : Math.round((filled / total) * 100));
  const countFilled = (values: Array<string | null | undefined | File>) =>
    values.filter((v) => (v instanceof File ? true : !!v && String(v).trim() !== '')).length;

  const sectionCompletion: Record<TabValue, number> = {
    student: pct(
      countFilled([
        learnerData.admissionNumber,
        learnerData.firstName,
        learnerData.lastName,
        learnerData.middleName,
        learnerData.dateOfBirth,
        learnerData.gender,
        learnerData.profilePhoto,
      ]),
      7
    ),
    academic: pct(countFilled([selectedClassId, learnerData.academicYear, learnerData.admissionDate]), 3),
    guardian: pct(
      countFilled([
        parentData.firstName,
        parentData.lastName,
        parentData.email,
        parentData.phoneNumber,
        parentData.relationship,
        parentData.nationalId,
      ]),
      6
    ),
    health: pct(countFilled([learnerData.specialNeeds, learnerData.medicalConditions, learnerData.allergies]), 3),
    documents: 0,
    notes: pct(countFilled([documentsData.notes]), 1),
  };

  // ✅ RENDER
  return (
    <div className="w-full space-y-6 p-4 md:p-6 bg-[#EAEFF9] dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          asChild
          className="mt-0.5 border-slate-200 hover:bg-slate-100 dark:bg-slate-700"
        >
          <Link to="/school-admin/learners">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
            {isEditMode ? 'Edit Student Details' : 'New Admission Application'}
          </h1>
          <p className="text-slate-600 mt-2">
            {isEditMode
              ? 'Update the student information below.'
              : 'Complete the form to submit a new student application.'}
          </p>
        </div>
      </div>

      {/* Form: sidebar progress tracker + main content + right rail */}
      <form onSubmit={handleSubmit} noValidate className="w-full">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabValue)}
          className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_300px] gap-6 items-start"
        >
          {/* Progress Tracker sidebar */}
          <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 p-3 lg:sticky lg:top-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 px-2 pb-2">
              Progress Tracker
            </p>
            <nav className="space-y-1">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const percent = sectionCompletion[section.value];
                return (
                  <button
                    key={section.value}
                    type="button"
                    onClick={() => setActiveTab(section.value)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      activeTab === section.value
                        ? 'bg-slate-100 dark:bg-slate-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <span className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', section.iconBg)}>
                      <Icon className={cn('w-4 h-4', section.iconColor)} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {section.label}
                        </span>
                        <span className="text-xs text-slate-400">{percent}%</span>
                      </span>
                      <span className="mt-1.5 block h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <span
                          className={cn('block h-full rounded-full transition-all', section.barColor)}
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </Card>

          {/* Main content */}
          <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-0">
              {/* Student Tab */}
              <TabsContent value="student" className="p-6 space-y-6 m-0 bg-white dark:bg-slate-900">
                <Card className="border-2 border-slate-200 bg-slate-50 dark:bg-slate-800">
                  <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={() => toggleSection('student')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                            Student Profile Card
                          </CardTitle>
                          <CardDescription>Student's personal details.</CardDescription>
                        </div>
                      </div>
                      <div className="text-slate-400 group-hover:text-slate-600 dark:text-slate-400">
                        {expandedSections['student'] ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {expandedSections['student'] && (
                    <CardContent className="pt-6 space-y-6 bg-white dark:bg-slate-900">
                      {/* Photo Upload */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="shrink-0 w-full sm:w-28 h-28 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 mx-auto sm:mx-0 overflow-hidden">
                          {learnerData.profilePhoto ? (
                            <div className="relative w-full h-full">
                              <img
                                src={URL.createObjectURL(learnerData.profilePhoto)}
                                alt="Profile"
                                className="w-full h-full rounded-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setLearnerData((prev) => ({ ...prev, profilePhoto: null }))
                                }
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <User className="w-12 h-12 text-slate-300" />
                          )}
                        </div>

                        <div className="flex-1 rounded-lg p-5 bg-blue-50 dark:bg-blue-950/30 flex flex-col items-center justify-center text-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Photo Upload</p>
                          <Label
                            htmlFor="profilePhoto"
                            className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 cursor-pointer transition-colors"
                          >
                            {learnerData.profilePhoto ? 'Change' : 'Upload'}
                          </Label>
                          <Input
                            id="profilePhoto"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <p className="text-xs text-slate-500">JPG, PNG up to 5MB (Optional)</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 pt-4 pb-1">
                          Personal Details
                        </h4>
                      </div>

                      {/* Name Fields */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="font-semibold text-slate-900 dark:text-slate-100">
                            First Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            placeholder="John"
                            value={learnerData.firstName}
                            onChange={handleLearnerChange}
                            required
                            className={cn(
                              'h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10',
                              validationErrors.firstName && 'border-red-500'
                            )}
                          />
                          {validationErrors.firstName && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {validationErrors.firstName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="middleName" className="font-semibold text-slate-900 dark:text-slate-100">
                            Middle Name
                          </Label>
                          <Input
                            id="middleName"
                            name="middleName"
                            placeholder="Michael"
                            value={learnerData.middleName}
                            onChange={handleLearnerChange}
                            className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="font-semibold text-slate-900 dark:text-slate-100">
                            Last Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            placeholder="Doe"
                            value={learnerData.lastName}
                            onChange={handleLearnerChange}
                            required
                            className={cn(
                              'h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10',
                              validationErrors.lastName && 'border-red-500'
                            )}
                          />
                          {validationErrors.lastName && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {validationErrors.lastName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Date of Birth & Gender */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth" className="font-semibold text-slate-900 dark:text-slate-100">
                            Date of Birth <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            value={learnerData.dateOfBirth}
                            onChange={handleLearnerChange}
                            required
                            className={cn(
                              'h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10',
                              validationErrors.dateOfBirth && 'border-red-500'
                            )}
                          />
                          {validationErrors.dateOfBirth && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {validationErrors.dateOfBirth}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="font-semibold text-slate-900 dark:text-slate-100">
                            Gender <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={learnerData.gender}
                            onValueChange={(value) =>
                              setLearnerData((prev) => ({
                                ...prev,
                                gender: value,
                              }))
                            }
                          >
                            <SelectTrigger
                              className={cn(
                                'h-11 border-slate-200 focus:border-blue-500',
                                validationErrors.gender && 'border-red-500'
                              )}
                            >
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={Gender.MALE}>Male</SelectItem>
                              <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                            </SelectContent>
                          </Select>
                          {validationErrors.gender && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {validationErrors.gender}
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Lock className="w-3 h-3" />
                        Birth certificate, NEMIS number and nationality are set in the panel on the right.
                      </p>
                    </CardContent>
                  )}
                </Card>
              </TabsContent>

              {/* Academic Tab */}
              <TabsContent value="academic" className="p-6 space-y-6 m-0 bg-white dark:bg-slate-900">
                <Card className="border-2 border-slate-200 bg-slate-50 dark:bg-slate-800">
                  <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={() => toggleSection('academic')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                            Academic Information
                          </CardTitle>
                          <CardDescription>Academic placement details.</CardDescription>
                        </div>
                      </div>
                      <div className="text-slate-400 group-hover:text-slate-600 dark:text-slate-400">
                        {expandedSections['academic'] ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {expandedSections['academic'] && (
                    <CardContent className="pt-6 space-y-6 bg-white dark:bg-slate-900">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-semibold text-slate-900 dark:text-slate-100">
                            Grade/Class Applying For <span className="text-red-500">*</span>
                          </Label>
                          <Select value={selectedClassId} onValueChange={handleClassChange}>
                            <SelectTrigger
                              className={cn(
                                'h-11 border-slate-200 focus:border-blue-500',
                                validationErrors.gradeLevel && 'border-red-500'
                              )}
                              disabled={classesLoading}
                            >
                              <SelectValue placeholder={classesLoading ? 'Loading classes...' : 'Select class'} />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.filter((c) => c.is_active).map((cls) => {
                                const display = cls.stream_name
                                  ? `${cls.grade_level} ${cls.stream_name}`
                                  : cls.grade_level;
                                return (
                                  <SelectItem key={cls.id} value={cls.id}>
                                    {display}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          {validationErrors.gradeLevel && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {validationErrors.gradeLevel}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="academicYear" className="font-semibold text-slate-900 dark:text-slate-100">
                            Academic Year <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="academicYear"
                            name="academicYear"
                            placeholder="2025-26"
                            value={learnerData.academicYear}
                            onChange={handleLearnerChange}
                            required
                            className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-semibold text-slate-900 dark:text-slate-100">Term</Label>
                          <Select
                            value={learnerData.term}
                            onValueChange={(value) =>
                              setLearnerData((prev) => ({
                                ...prev,
                                term: value,
                              }))
                            }
                          >
                            <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Term 1">Term 1</SelectItem>
                              <SelectItem value="Term 2">Term 2</SelectItem>
                              <SelectItem value="Term 3">Term 3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="admissionDate" className="font-semibold text-slate-900 dark:text-slate-100">
                            Admission Date
                          </Label>
                          <Input
                            id="admissionDate"
                            name="admissionDate"
                            type="date"
                            value={learnerData.admissionDate}
                            onChange={handleLearnerChange}
                            className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="previousSchool" className="font-semibold text-slate-900 dark:text-slate-100">
                          Previous School
                        </Label>
                        <Input
                          id="previousSchool"
                          name="previousSchool"
                          placeholder="Name of previous school attended"
                          value={learnerData.previousSchool}
                          onChange={handleLearnerChange}
                          className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="streamName" className="font-semibold text-slate-900 dark:text-slate-100">
                          Stream/Section
                        </Label>
                        <Input
                          id="streamName"
                          name="streamName"
                          placeholder="East, West, etc."
                          value={learnerData.streamName}
                          onChange={handleLearnerChange}
                          className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
                          disabled
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Auto-populated from selected class</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </TabsContent>

              {/* Guardian Tab */}
              <TabsContent value="guardian" className="p-6 space-y-6 m-0 bg-white dark:bg-slate-900">
                <Card className="border-2 border-slate-200 bg-slate-50 dark:bg-slate-800">
                  <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={() => toggleSection('guardian')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                            Parent/Guardian Information
                          </CardTitle>
                          <CardDescription>Parent or guardian information.</CardDescription>
                        </div>
                      </div>
                      <div className="text-slate-400 group-hover:text-slate-600 dark:text-slate-400">
                        {expandedSections['guardian'] ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {expandedSections['guardian'] && (
                    <CardContent className="pt-6 space-y-6 bg-white dark:bg-slate-900">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="parentFirstName" className="font-semibold text-slate-900 dark:text-slate-100">
                            First Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="parentFirstName"
                            name="firstName"
                            placeholder="Jane"
                            value={parentData.firstName}
                            onChange={handleParentChange}
                            required
                            className={cn(
                              'h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10',
                              validationErrors.parentFirstName && 'border-red-500'
                            )}
                          />
                          {validationErrors.parentFirstName && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {validationErrors.parentFirstName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parentLastName" className="font-semibold text-slate-900 dark:text-slate-100">
                            Last Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="parentLastName"
                            name="lastName"
                            placeholder="Doe"
                            value={parentData.lastName}
                            onChange={handleParentChange}
                            required
                            className={cn(
                              'h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10',
                              validationErrors.parentLastName && 'border-red-500'
                            )}
                          />
                          {validationErrors.parentLastName && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {validationErrors.parentLastName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="parentEmail" className="font-semibold text-slate-900 dark:text-slate-100">
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="parentEmail"
                          name="email"
                          type="email"
                          placeholder="parent@email.com"
                          value={parentData.email}
                          onChange={handleParentChange}
                          required
                          className={cn(
                            'h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10',
                            validationErrors.parentEmail && 'border-red-500'
                          )}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Login credentials will be sent to this email
                        </p>
                        {validationErrors.parentEmail && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {validationErrors.parentEmail}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="parentPhone" className="font-semibold text-slate-900 dark:text-slate-100">
                            Phone Number <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="parentPhone"
                            name="phoneNumber"
                            type="tel"
                            placeholder="+254 7XX XXX XXX"
                            value={parentData.phoneNumber}
                            onChange={handleParentChange}
                            required
                            className={cn(
                              'h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10',
                              validationErrors.parentPhone && 'border-red-500'
                            )}
                          />
                          {validationErrors.parentPhone && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {validationErrors.parentPhone}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nationalId" className="font-semibold text-slate-900 dark:text-slate-100">
                            National ID <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="nationalId"
                            name="nationalId"
                            placeholder="12345678"
                            value={parentData.nationalId}
                            onChange={handleParentChange}
                            required
                            className={cn(
                              'h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10',
                              validationErrors.parentNationalId && 'border-red-500'
                            )}
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Required to create the parent's portal login account
                          </p>
                          {validationErrors.parentNationalId && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {validationErrors.parentNationalId}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-semibold text-slate-900 dark:text-slate-100">
                            Relationship <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={parentData.relationship}
                            onValueChange={(value) => {
                              setParentData((prev) => ({
                                ...prev,
                                relationship: value,
                              }));
                              if (validationErrors.parentRelationship) {
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  parentRelationship: '',
                                }));
                              }
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                'h-11 border-slate-200 focus:border-blue-500',
                                validationErrors.parentRelationship && 'border-red-500'
                              )}
                            >
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="father">Father</SelectItem>
                              <SelectItem value="mother">Mother</SelectItem>
                              <SelectItem value="guardian">Guardian</SelectItem>
                            </SelectContent>
                          </Select>
                          {validationErrors.parentRelationship && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {validationErrors.parentRelationship}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="occupation" className="font-semibold text-slate-900 dark:text-slate-100">
                            Occupation
                          </Label>
                          <Input
                            id="occupation"
                            name="occupation"
                            placeholder="Teacher, Engineer, etc."
                            value={parentData.occupation}
                            onChange={handleParentChange}
                            className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </TabsContent>

              {/* Health Tab */}
              <TabsContent value="health" className="p-6 space-y-6 m-0 bg-white dark:bg-slate-900">
                <Card className="border-2 border-slate-200 bg-slate-50 dark:bg-slate-800">
                  <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={() => toggleSection('health')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                            Health & Special Needs
                          </CardTitle>
                          <CardDescription>Health information and special requirements.</CardDescription>
                        </div>
                      </div>
                      <div className="text-slate-400 group-hover:text-slate-600 dark:text-slate-400">
                        {expandedSections['health'] ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {expandedSections['health'] && (
                    <CardContent className="pt-6 space-y-6 bg-white dark:bg-slate-900">
                      <div className="space-y-2">
                        <Label htmlFor="specialNeeds" className="font-semibold text-slate-900 dark:text-slate-100">
                          Special Needs (if any)
                        </Label>
                        <textarea
                          id="specialNeeds"
                          name="specialNeeds"
                          placeholder="Describe any special educational needs, physical limitations, or other requirements..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm font-sans outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
                          rows={3}
                          value={learnerData.specialNeeds}
                          onChange={handleLearnerChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="medicalConditions" className="font-semibold text-slate-900 dark:text-slate-100">
                          Medical Conditions
                        </Label>
                        <textarea
                          id="medicalConditions"
                          name="medicalConditions"
                          placeholder="List any chronic medical conditions, medications, or treatments..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm font-sans outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
                          rows={3}
                          value={learnerData.medicalConditions}
                          onChange={handleLearnerChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="allergies" className="font-semibold text-slate-900 dark:text-slate-100">
                          Allergies
                        </Label>
                        <textarea
                          id="allergies"
                          name="allergies"
                          placeholder="List any known allergies and reactions..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm font-sans outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
                          rows={3}
                          value={learnerData.allergies}
                          onChange={handleLearnerChange}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="p-6 space-y-4 m-0 bg-white dark:bg-slate-900">
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Documents can be uploaded later</p>
                  <p className="text-sm mt-1">Birth certificate, transfer letter, etc.</p>
                </div>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="p-6 space-y-4 m-0 bg-white dark:bg-slate-900">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="font-semibold text-slate-900 dark:text-slate-100">
                      Additional Information
                    </Label>
                    <textarea
                      id="notes"
                      placeholder="Add any additional notes about the student..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm font-sans outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
                      rows={6}
                      value={documentsData.notes}
                      onChange={(e) =>
                        setDocumentsData({
                          ...documentsData,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Card>

          {/* Right rail */}
          <div className="space-y-4 lg:sticky lg:top-6">
            {/* Admission ID */}
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Admission ID <span className="text-red-500">*</span>
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="admissionNumber"
                    name="admissionNumber"
                    placeholder="ADM2024001"
                    value={learnerData.admissionNumber}
                    onChange={handleLearnerChange}
                    required
                    disabled={isEditMode}
                    className={cn(
                      'h-10 text-lg font-bold border-slate-200 focus:border-blue-500 focus:ring-blue-500/10',
                      validationErrors.admissionNumber && 'border-red-500',
                      isEditMode && 'bg-slate-100 cursor-not-allowed'
                    )}
                  />
                  {learnerData.admissionNumber && (
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(learnerData.admissionNumber)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                      aria-label="Copy admission number"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {validationErrors.admissionNumber && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.admissionNumber}
                  </p>
                )}
                {isEditMode && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Admission number cannot be changed</p>
                )}
              </CardContent>
            </Card>

            {/* Nationality */}
            <Card className="border-0 shadow-sm bg-orange-100 dark:bg-orange-950/30">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-700/80">Nationality</p>
                <Select
                  value={learnerData.nationality}
                  onValueChange={(value) => setLearnerData((prev) => ({ ...prev, nationality: value }))}
                >
                  <SelectTrigger className="h-11 border-orange-200 bg-white text-lg font-bold text-orange-950 focus:border-orange-500">
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kenyan">Kenyan</SelectItem>
                    <SelectItem value="Ugandan">Ugandan</SelectItem>
                    <SelectItem value="Tanzanian">Tanzanian</SelectItem>
                    <SelectItem value="Rwandan">Rwandan</SelectItem>
                    <SelectItem value="Burundian">Burundian</SelectItem>
                    <SelectItem value="South Sudanese">South Sudanese</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Government & CBC Details */}
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="p-4 space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  Government &amp; CBC Details
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="birthCertificateNumber" className="text-xs font-medium text-slate-500">
                    Birth Certificate Number
                  </Label>
                  <Input
                    id="birthCertificateNumber"
                    name="birthCertificateNumber"
                    placeholder="123456789ABC"
                    value={learnerData.birthCertificateNumber}
                    onChange={handleLearnerChange}
                    className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nemisNumber" className="text-xs font-medium text-slate-500">
                    NEMIS Number
                  </Label>
                  <Input
                    id="nemisNumber"
                    name="nemisNumber"
                    placeholder="NEMIS123456"
                    value={learnerData.nemisNumber}
                    onChange={handleLearnerChange}
                    className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Primary Action Center */}
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Primary Action Center</p>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-auto min-h-11 py-2.5 px-3 gap-2 whitespace-normal text-center leading-snug bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <span>{isEditMode ? 'Update Student' : 'Complete Application & Create Student'}</span>
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-700"
                >
                  <Link to="/school-admin/learners">Cancel</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </form>
    </div>
  );
}
