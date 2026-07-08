import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import { createClass } from '@/lib/api/classApi';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClassCreated?: () => void;
};

const VALID_GRADE_LEVELS = [
  'PP1',
  'PP2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
] as const;

export default function AddClassModal({ open, onOpenChange, onClassCreated }: Props) {
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [streamName, setStreamName] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return gradeLevel.trim().length > 0;
  }, [gradeLevel]);

  useEffect(() => {
    if (!open) return;
    // Reset when opening
    setGradeLevel('');
    setStreamName('');
    setSubmitting(false);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      toast.error('Please select a grade level');
      return;
    }

    setSubmitting(true);
    try {
      await createClass({
        grade_level: gradeLevel,
        stream_name: streamName.trim() ? streamName.trim() : null,
      });

      toast.success('Class created successfully');
      onOpenChange(false);
      onClassCreated?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add Class & Stream</DialogTitle>
          <DialogDescription>Create a class for learners. Student count updates automatically after enrollment.</DialogDescription>
        </DialogHeader>

        <Card className="p-4 border-slate-200 shadow-none">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold">Grade / Class</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {VALID_GRADE_LEVELS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Stream (optional)</Label>
              <Input
                value={streamName}
                onChange={(e) => setStreamName(e.target.value)}
                placeholder="e.g. East, West"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit || submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {submitting ? 'Creating...' : 'Create Class'}
              </Button>
            </div>
          </form>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

