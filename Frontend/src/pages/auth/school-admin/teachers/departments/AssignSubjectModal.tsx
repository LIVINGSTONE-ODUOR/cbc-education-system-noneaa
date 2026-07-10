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
import { getLearningAreas, type LearningArea } from '@/lib/api/curriculumApi';
import type { DepartmentLearningArea } from './types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingLearningAreas: DepartmentLearningArea[];
  onSave: (learningAreaId: string) => Promise<void>;
}

// Assigns a learning area (CBC "subject") to a department. The list is
// always fetched live from /api/v1/curriculum/learning-areas — never a
// hardcoded/mock subject list.
export default function AssignSubjectModal({ open, onOpenChange, existingLearningAreas, onSave }: Props) {
  const [learningAreaId, setLearningAreaId] = useState('');
  const [saving, setSaving] = useState(false);

  const [learningAreas, setLearningAreas] = useState<LearningArea[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLearningAreas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLearningAreas({ is_active: true });
      setLearningAreas(res.data.learning_areas || []);
    } catch (error) {
      console.error('Error fetching learning areas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void loadLearningAreas();
  }, [open, loadLearningAreas]);

  const existingIds = new Set(existingLearningAreas.map(la => la.id));
  const available = learningAreas.filter(la => !existingIds.has(la.id));

  const handleSave = async () => {
    if (!learningAreaId) return;
    setSaving(true);
    try {
      await onSave(learningAreaId);
      setLearningAreaId('');
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Assign Learning Area</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Learning Area <span className="text-destructive">*</span></Label>
            <Select value={learningAreaId} onValueChange={setLearningAreaId}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? 'Loading learning areas...' : 'Select learning area'} />
              </SelectTrigger>
              <SelectContent>
                {available.length === 0 ? (
                  <SelectItem value="none" disabled>
                    {loading ? 'Loading learning areas...' : 'All learning areas assigned'}
                  </SelectItem>
                ) : (
                  available.map(la => (
                    <SelectItem key={la.id} value={la.id}>{la.name} ({la.code})</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!learningAreaId || saving}>
            {saving ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
