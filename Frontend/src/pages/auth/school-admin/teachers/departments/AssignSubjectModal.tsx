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
import type { DepartmentSubject } from './types';
import { mockSubjects } from './mockData';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSubjects: DepartmentSubject[];
  onSave: (subjectId: string) => Promise<void>;
}

export default function AssignSubjectModal({ open, onOpenChange, existingSubjects, onSave }: Props) {
  const [subjectId, setSubjectId] = useState('');
  const [saving, setSaving] = useState(false);

  const existingIds = new Set(existingSubjects.map(s => s.subjectId));
  const available = mockSubjects.filter(s => !existingIds.has(s.id));

  const handleSave = async () => {
    if (!subjectId) return;
    setSaving(true);
    try {
      await onSave(subjectId);
      setSubjectId('');
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Assign Subject</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Subject <span className="text-destructive">*</span></Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {available.length === 0 ? (
                  <SelectItem value="none" disabled>All subjects assigned</SelectItem>
                ) : (
                  available.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!subjectId || saving}>
            {saving ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
