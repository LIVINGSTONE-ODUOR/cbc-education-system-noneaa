import { useEffect, useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Mail, Phone, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTeacher, updateTeacher } from '@/lib/api/teacherApi';

interface EditTeacherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string | null;
  onSuccess?: () => void;
}

interface EditFormState {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  tscNumber: string;
  designation: string;
  subjects: string; // comma separated
  qualifications: string; // comma separated
  jobStatus: string;
}

const EMPTY_FORM: EditFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  tscNumber: '',
  designation: '',
  subjects: '',
  qualifications: '',
  jobStatus: 'active',
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

export default function EditTeacherModal({ open, onOpenChange, teacherId, onSuccess }: EditTeacherModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<EditFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !teacherId) return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const teacher = await getTeacher(teacherId);
        if (cancelled) return;

        setFormData({
          firstName: teacher.firstName || '',
          lastName: teacher.lastName || '',
          email: teacher.email || '',
          phoneNumber: teacher.phoneNumber || teacher.mobilePhone || '',
          tscNumber: teacher.tscNumber || '',
          designation: teacher.designation || '',
          subjects: (teacher.teachingSubjects?.length ? teacher.teachingSubjects : teacher.subjectsTaught || []).join(', '),
          qualifications: (teacher.qualifications || []).join(', '),
          jobStatus: teacher.jobStatus || (teacher.isActive ? 'active' : 'inactive'),
        });
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to load teacher details.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, teacherId]);

  useEffect(() => {
    if (!open) {
      setFormData(EMPTY_FORM);
      setError(null);
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && saving) return;
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) return;

    try {
      setSaving(true);

      if (!formData.firstName || !formData.lastName || !formData.email) {
        throw new Error('First name, last name and email are required.');
      }

      await updateTeacher(teacherId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        tscNumber: formData.tscNumber || null,
        designation: formData.designation,
        teachingSubjects: formData.subjects
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        qualifications: formData.qualifications
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        jobStatus: formData.jobStatus,
      });

      toast({
        title: 'Teacher Updated',
        description: `${formData.firstName} ${formData.lastName}'s profile has been updated.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast({
        title: 'Update Failed',
        description: getErrorMessage(err, 'Failed to update teacher. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden sm:rounded-2xl">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col max-h-[85vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b space-y-1">
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>Update this teacher's profile details</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="px-6 py-5 space-y-6">
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
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="pl-9"
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
                    <Label htmlFor="tscNumber">TSC / Employee Number</Label>
                    <Input id="tscNumber" name="tscNumber" value={formData.tscNumber} onChange={handleChange} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="designation">Designation</Label>
                    <Input id="designation" name="designation" value={formData.designation} onChange={handleChange} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subjects">Subjects</Label>
                    <Input
                      id="subjects"
                      name="subjects"
                      value={formData.subjects}
                      onChange={handleChange}
                      placeholder="Mathematics, Science, English"
                    />
                    <p className="text-xs text-muted-foreground">Separate multiple subjects with commas</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="qualifications">Qualifications</Label>
                    <Input
                      id="qualifications"
                      name="qualifications"
                      value={formData.qualifications}
                      onChange={handleChange}
                      placeholder="B.Ed, PGDE, etc."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="jobStatus">Status</Label>
                    <Select
                      value={formData.jobStatus}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, jobStatus: value }))}
                    >
                      <SelectTrigger id="jobStatus">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="px-6 py-4 border-t bg-muted/30 sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || loading || !!error}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
