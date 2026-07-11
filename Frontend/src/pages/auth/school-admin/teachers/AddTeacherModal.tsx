import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Upload,
  User,
  UserRound,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  employeeNumber: '',
  subjects: '',
  qualifications: '',
};

interface AddTeacherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddTeacherModal({ open, onOpenChange, onSuccess }: AddTeacherModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && !isLoading) {
      resetForm();
    }
    onOpenChange(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Photo must be under 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.phoneNumber ||
        !formData.employeeNumber ||
        !formData.subjects
      ) {
        throw new Error('Please fill in all required fields, including the employee number — it doubles as the teacher\'s login credential.');
      }

      const { inviteTeacher, uploadTeacherPhoto } = await import('@/lib/api/teacherApi');

      const subjects_taught = formData.subjects
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const qualifications = formData.qualifications
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      let photoUrl: string | undefined;
      if (photoFile) {
        try {
          photoUrl = await uploadTeacherPhoto(
            photoFile,
            formData.employeeNumber || `${formData.firstName}-${formData.lastName}`
          );
        } catch (photoError) {
          console.warn('Photo upload failed, continuing without photo:', photoError);
          toast({
            title: 'Photo upload skipped',
            description: getErrorMessage(photoError, 'Could not upload photo, continuing without it.'),
            variant: 'destructive',
          });
        }
      }

      await inviteTeacher({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        tsc_number: formData.employeeNumber,
        subjects_taught,
        qualifications: qualifications.length ? qualifications : undefined,
        staff_type: 'teaching',
        job_status: 'active',
        photo: photoUrl,
      });

      toast({
        title: 'Teacher Account Created',
        description: `${formData.firstName} ${formData.lastName} can now log in with email "${formData.email}" and employee number "${formData.employeeNumber}".`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Error adding teacher:', error);
      toast({
        title: 'Add Teacher Failed',
        description: getErrorMessage(error, 'Failed to add teacher. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden sm:rounded-2xl">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col max-h-[85vh]">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-lg">Add New Teacher</DialogTitle>
                <DialogDescription className="mt-0.5">
                  Create a teacher account for your school
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Body */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-5 space-y-6">
              {/* Photo */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-muted flex items-center justify-center ring-2 ring-border">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Teacher preview" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:opacity-90"
                      aria-label="Remove photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div>
                  <Input
                    ref={fileInputRef}
                    id="photo"
                    name="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <Label
                    htmlFor="photo"
                    className="inline-flex items-center gap-2 cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {photoFile ? 'Change Photo' : 'Upload Photo'}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1.5">JPG or PNG, up to 5MB · Optional</p>
                </div>
              </div>

              {/* Personal information */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Personal Information
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Jane"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Wanjiru"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="jane.wanjiru@school.ac.ke"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      placeholder="+254 7XX XXX XXX"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Employment details */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Employment Details
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="employeeNumber">Employee Number *</Label>
                  <Input
                    id="employeeNumber"
                    name="employeeNumber"
                    placeholder="TCH001"
                    value={formData.employeeNumber}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The teacher will log in using their email and this employee number as their password.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subjects">Subjects *</Label>
                  <Input
                    id="subjects"
                    name="subjects"
                    placeholder="Mathematics, Science, English"
                    value={formData.subjects}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple subjects with commas</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="qualifications">Qualifications</Label>
                  <Input
                    id="qualifications"
                    name="qualifications"
                    placeholder="B.Ed, PGDE, etc."
                    value={formData.qualifications}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-muted/30 sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Add Teacher
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
