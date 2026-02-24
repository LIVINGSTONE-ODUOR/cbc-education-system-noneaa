import { useState } from 'react';
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
import type { DepartmentTeacher } from './types';
import { mockTeachers } from './mockData';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTeachers: DepartmentTeacher[];
  onSave: (teacherId: string, role: 'HOD' | 'Teacher' | 'Assistant') => Promise<void>;
}

export default function AssignTeacherModal({ open, onOpenChange, existingTeachers, onSave }: Props) {
  const [teacherId, setTeacherId] = useState('');
  const [role, setRole] = useState<'HOD' | 'Teacher' | 'Assistant'>('Teacher');
  const [saving, setSaving] = useState(false);

  const existingIds = new Set(existingTeachers.map(t => t.teacherId));
  const available = mockTeachers.filter(t => !existingIds.has(t.id));

  const handleSave = async () => {
    if (!teacherId) return;
    setSaving(true);
    try {
      await onSave(teacherId, role);
      setTeacherId('');
      setRole('Teacher');
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Assign Teacher</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Teacher <span className="text-destructive">*</span></Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {available.length === 0 ? (
                  <SelectItem value="none" disabled>All teachers assigned</SelectItem>
                ) : (
                  available.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={v => setRole(v as 'HOD' | 'Teacher' | 'Assistant')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOD">Head of Department</SelectItem>
                <SelectItem value="Teacher">Teacher</SelectItem>
                <SelectItem value="Assistant">Assistant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!teacherId || saving}>
            {saving ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
