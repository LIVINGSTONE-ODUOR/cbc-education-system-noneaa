import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getTeachers } from '@/lib/api/teacherApi';
import { updateClass } from '@/lib/api/classApi';
import type { StaffMember } from '@/pages/teacher/StaffManagement/types';

interface AssignClassTeacherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
  currentTeacherId?: string | null;
  onAssigned: (teacherId: string | null, teacherName: string) => void;
}

export default function AssignClassTeacherModal({
  open,
  onOpenChange,
  classId,
  className,
  currentTeacherId,
  onAssigned,
}: AssignClassTeacherModalProps) {
  const [teachers, setTeachers] = useState<StaffMember[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [teacherId, setTeacherId] = useState<string>(currentTeacherId || '');
  const [isSaving, setIsSaving] = useState(false);

  // Teachers are always fetched live from the registered teachers in the database.
  const loadTeachers = useCallback(async () => {
    setIsLoadingTeachers(true);
    try {
      const res = await getTeachers({ limit: 200 });
      const activeTeachers = (res.teachers || []).filter(
        (t) => t.isActive !== false && t.status !== 'inactive'
      );
      setTeachers(activeTeachers);
    } catch (error) {
      console.error('Failed to load teachers:', error);
      toast.error('Failed to load teachers from backend');
    } finally {
      setIsLoadingTeachers(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setTeacherId(currentTeacherId || '');
      void loadTeachers();
    }
  }, [open, currentTeacherId, loadTeachers]);

  const handleSave = async () => {
    if (!teacherId) return;
    setIsSaving(true);
    try {
      await updateClass(classId, { class_teacher_id: teacherId });
      const teacher = teachers.find((t) => t.id === teacherId);
      const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}`.trim() : 'Assigned';
      toast.success('Class teacher assigned successfully');
      onAssigned(teacherId, teacherName);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to assign class teacher:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign class teacher');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnassign = async () => {
    setIsSaving(true);
    try {
      await updateClass(classId, { class_teacher_id: null });
      toast.success('Class teacher unassigned');
      onAssigned(null, 'Unassigned');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to unassign class teacher:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to unassign class teacher');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Set Class Teacher</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Choose a registered teacher to assign as the class teacher for{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{className}</span>.
          </p>

          <div className="space-y-2">
            <Label>
              Teacher <span className="text-destructive">*</span>
            </Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingTeachers ? 'Loading teachers...' : 'Select teacher'} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingTeachers ? (
                  <SelectItem value="__loading" disabled>
                    Loading teachers...
                  </SelectItem>
                ) : teachers.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No registered teachers found
                  </SelectItem>
                ) : (
                  teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                      {t.designation ? ` — ${t.designation}` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {currentTeacherId && (
            <Button
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleUnassign}
              disabled={isSaving}
            >
              Unassign
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!teacherId || isSaving || isLoadingTeachers}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
