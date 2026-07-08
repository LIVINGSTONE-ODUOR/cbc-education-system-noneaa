import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, AlertCircle, Mail, Phone } from 'lucide-react';
import { getTeacher } from '@/lib/api/teacherApi';
import type { StaffMember } from './StaffManagement/types';

interface ViewTeacherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string | null;
}

const getInitials = (first?: string, last?: string) => {
  const initials = `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
  return initials || '—';
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  const display = value === 0 ? '0' : value || '—';
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{display}</span>
    </div>
  );
}

export default function ViewTeacherModal({ open, onOpenChange, teacherId }: ViewTeacherModalProps) {
  const [teacher, setTeacher] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !teacherId) return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTeacher(teacherId);
        if (!cancelled) setTeacher(data);
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to load teacher profile.'));
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
      setTeacher(null);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden sm:rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b space-y-1">
          <DialogTitle>Teacher Profile</DialogTitle>
          <DialogDescription>Full details for this staff member</DialogDescription>
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
        ) : teacher ? (
          <ScrollArea className="max-h-[70vh]">
            <div className="px-6 py-5 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={teacher.photo || undefined} />
                  <AvatarFallback className="text-lg font-semibold bg-primary/10">
                    {getInitials(teacher.firstName, teacher.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">
                    {teacher.firstName} {teacher.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {teacher.tscNumber ? `TCH/${teacher.tscNumber}` : teacher.idNumber || teacher.id}
                  </p>
                  <Badge
                    variant={teacher.status === 'active' || teacher.isActive ? 'default' : 'secondary'}
                    className="mt-1"
                  >
                    {teacher.status === 'active' || teacher.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {/* Contact */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Contact
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm py-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {teacher.email || '—'}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm py-1">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {teacher.phoneNumber || teacher.mobilePhone || '—'}
                  </div>
                </div>
              </div>

              {/* Employment */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Employment
                </p>
                <InfoRow label="Designation" value={teacher.designation} />
                <InfoRow label="Staff Type" value={teacher.staffType} />
                <InfoRow label="TSC Number" value={teacher.tscNumber} />
                <InfoRow label="ID Number" value={teacher.idNumber} />
                <InfoRow
                  label="Subjects Taught"
                  value={(teacher.teachingSubjects?.length ? teacher.teachingSubjects : teacher.subjectsTaught || []).join(', ')}
                />
                <InfoRow label="Qualifications" value={(teacher.qualifications || []).join(', ')} />
                <InfoRow label="Job Status" value={teacher.jobStatus} />
                <InfoRow
                  label="Hire Date"
                  value={teacher.dateJoined || teacher.hireDate || undefined}
                />
              </div>

              {/* Personal */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Personal
                </p>
                <InfoRow label="Gender" value={teacher.gender || teacher.sex} />
                <InfoRow label="Date of Birth" value={teacher.dateOfBirth} />
                <InfoRow label="County" value={teacher.county} />
                <InfoRow label="Location" value={teacher.location} />
                <InfoRow label="Branch" value={teacher.branch} />
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
