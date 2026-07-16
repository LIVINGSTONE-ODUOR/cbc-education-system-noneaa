import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CalendarClock, Loader2, Plus, Pencil, Trash2, AlertTriangle, School } from 'lucide-react';

import { getClasses, getClassLearningAreas, ClassApiItem, ClassLearningArea } from '@/lib/api/classApi';
import { getTeachers } from '@/lib/api/teacherApi';
import {
  getTimetable,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot,
  TimetableConflictError,
  TimetableGrid,
  TimetableSlot,
  WeekDay,
  WEEK_DAYS,
} from '@/lib/api/timetableApi';

interface TeacherOption {
  id: string;
  name: string;
}

const emptyGrid = (): TimetableGrid => ({
  monday: [], tuesday: [], wednesday: [], thursday: [], friday: [],
});

interface FormState {
  learning_area_id: string;
  teacher_id: string;
  // The day this lesson is being scheduled for. Each day/time slot on the
  // grid is independent — Monday 8-9AM can be Maths while Tuesday 8-9AM is
  // English for the same class, with no conflict between them.
  primaryDay: WeekDay | '';
  // Opt-in only: when checked, the SAME learning area + teacher + time is
  // also booked on the extra days below (e.g. Maths every day 8-9AM).
  repeatOnExtraDays: boolean;
  extraDays: WeekDay[];
  start_time: string;
  end_time: string;
  room: string;
}

const emptyForm: FormState = {
  learning_area_id: '',
  teacher_id: '',
  primaryDay: '',
  repeatOnExtraDays: false,
  extraDays: [],
  start_time: '08:00',
  end_time: '09:00',
  room: '',
};

export default function TimetablePage() {
  const [classes, setClasses] = useState<ClassApiItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [learningAreas, setLearningAreas] = useState<ClassLearningArea[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [grid, setGrid] = useState<TimetableGrid>(emptyGrid());

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<TimetableSlot | null>(null);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  // ── Initial data: classes + teachers ────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoadingClasses(true);
        const [classesRes, teachersRes] = await Promise.all([
          getClasses({ is_active: 'true', limit: 200 }),
          getTeachers({ limit: 200, status: 'active' }),
        ]);
        const classList = classesRes.data.classes || [];
        setClasses(classList);
        setTeachers(
          (teachersRes.teachers || []).map((t: any) => ({
            id: t.id,
            name: t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Unnamed teacher',
          }))
        );
        if (classList.length) setSelectedClassId(classList[0].id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load classes and teachers');
      } finally {
        setLoadingClasses(false);
      }
    })();
  }, []);

  // ── Learning areas + grid for the selected class ────────────────────────
  const loadClassData = useCallback(async (classId: string) => {
    if (!classId) return;
    setLoadingGrid(true);
    try {
      const [areasRes, timetableRes] = await Promise.all([
        getClassLearningAreas(classId),
        getTimetable({ class_id: classId }),
      ]);
      setLearningAreas(areasRes.data.learning_areas || []);
      setGrid(timetableRes.data.timetable || emptyGrid());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load timetable for this class');
      setGrid(emptyGrid());
    } finally {
      setLoadingGrid(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) loadClassData(selectedClassId);
  }, [selectedClassId, loadClassData]);

  // ── Dialog helpers ───────────────────────────────────────────────────────
  const openAddDialog = () => {
    setEditingSlot(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setForm({
      learning_area_id: slot.learning_area_id,
      teacher_id: slot.teacher_id,
      primaryDay: slot.day,
      repeatOnExtraDays: false,
      extraDays: [],
      start_time: slot.start_time.slice(0, 5),
      end_time: slot.end_time.slice(0, 5),
      room: slot.room || '',
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const toggleExtraDay = (day: WeekDay) => {
    setForm((f) => ({
      ...f,
      extraDays: f.extraDays.includes(day) ? f.extraDays.filter((d) => d !== day) : [...f.extraDays, day],
    }));
  };

  const handleSubmit = async () => {
    if (!selectedClassId) return;
    if (!form.learning_area_id || !form.teacher_id || !form.primaryDay) {
      setFormError('Select a learning area, a teacher, and a day.');
      return;
    }
    if (form.start_time >= form.end_time) {
      setFormError('Start time must be before end time.');
      return;
    }

    // The primary day is always included. Extra days are only added when
    // the admin explicitly opted in to repeat this exact lesson on them —
    // otherwise every other day/time on the grid is left untouched, so
    // Tuesday 8-9AM can be a completely different subject.
    const days: WeekDay[] = form.repeatOnExtraDays
      ? [form.primaryDay, ...form.extraDays.filter((d) => d !== form.primaryDay)]
      : [form.primaryDay];

    setSaving(true);
    setFormError(null);
    try {
      if (editingSlot) {
        await updateTimetableSlot(editingSlot.id, {
          day: form.primaryDay,
          start_time: form.start_time,
          end_time: form.end_time,
          teacher_id: form.teacher_id,
          learning_area_id: form.learning_area_id,
          room: form.room || undefined,
        });
        toast.success('Lesson updated');
      } else {
        await createTimetableSlot({
          class_id: selectedClassId,
          learning_area_id: form.learning_area_id,
          teacher_id: form.teacher_id,
          day: days,
          start_time: form.start_time,
          end_time: form.end_time,
          room: form.room || undefined,
        });
        toast.success(days.length > 1 ? 'Lesson scheduled for the selected days' : 'Lesson scheduled');
      }
      setDialogOpen(false);
      await loadClassData(selectedClassId);
    } catch (err) {
      if (err instanceof TimetableConflictError) {
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : 'Failed to save lesson');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTimetableSlot(deleteTarget.id);
      toast.success('Lesson removed from timetable');
      setDeleteTarget(null);
      await loadClassData(selectedClassId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove lesson');
    }
  };

  const teacherName = (slot: TimetableSlot) =>
    slot.teacher?.users ? `${slot.teacher.users.first_name} ${slot.teacher.users.last_name}` : 'Unassigned';

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            School Timetable
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Assign teachers to learning areas per class, and schedule the days and times each lesson runs.
          </p>
        </div>
        <Button onClick={openAddDialog} disabled={!selectedClassId || loadingClasses}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Lesson
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Select Class</CardTitle>
          <CardDescription>The timetable grid below shows lessons for the class you pick here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={loadingClasses}>
              <SelectTrigger>
                <SelectValue placeholder={loadingClasses ? 'Loading classes…' : 'Choose a class'} />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <School className="h-3.5 w-3.5" />
                      {c.grade_level}{c.stream_name ? ` ${c.stream_name}` : ''}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">
            Weekly Grid{selectedClass ? ` — ${selectedClass.grade_level}${selectedClass.stream_name ? ' ' + selectedClass.stream_name : ''}` : ''}
          </CardTitle>
          <CardDescription>Click a lesson to edit it, or the trash icon to remove it from the timetable.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingGrid ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading timetable…
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {WEEK_DAYS.map(({ value, label }) => (
                <div key={value} className="space-y-2">
                  <div className="text-sm font-semibold text-center py-1.5 rounded-md bg-muted">{label}</div>
                  <div className="space-y-2 min-h-[80px]">
                    {(grid[value] || []).length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md">
                        No lessons
                      </div>
                    )}
                    {(grid[value] || [])
                      .slice()
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => openEditDialog(slot)}
                          className="w-full text-left rounded-md border p-2.5 hover:border-primary hover:bg-accent transition-colors group relative"
                        >
                          <div className="text-xs text-muted-foreground">
                            {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                          </div>
                          <div className="text-sm font-medium truncate">{slot.learning_area?.name || 'Learning area'}</div>
                          <div className="text-xs text-muted-foreground truncate">{teacherName(slot)}</div>
                          {slot.room && <Badge variant="outline" className="mt-1 text-[10px]">{slot.room}</Badge>}
                          <span
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(slot);
                            }}
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add / Edit Dialog ──────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSlot ? 'Edit Lesson' : 'Schedule Lesson'}</DialogTitle>
            <DialogDescription>
              {selectedClass ? `${selectedClass.grade_level}${selectedClass.stream_name ? ' ' + selectedClass.stream_name : ''}` : 'Select a class first'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Learning Area</Label>
              <Select value={form.learning_area_id} onValueChange={(v) => setForm((f) => ({ ...f, learning_area_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select learning area" />
                </SelectTrigger>
                <SelectContent>
                  {learningAreas.map((la) => (
                    <SelectItem key={la.id} value={la.id}>{la.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {learningAreas.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No learning areas are assigned to this class yet — set them up under Curriculum first.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Teacher</Label>
              <Select value={form.teacher_id} onValueChange={(v) => setForm((f) => ({ ...f, teacher_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Day</Label>
              <Select
                value={form.primaryDay}
                onValueChange={(v) => setForm((f) => ({ ...f, primaryDay: v as WeekDay, extraDays: f.extraDays.filter((d) => d !== v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {WEEK_DAYS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Each day and time slot is independent — e.g. Maths on Monday 8-9AM doesn't affect what's taught Tuesday 8-9AM.
              </p>
            </div>

            {!editingSlot && (
              <div className="space-y-2 rounded-md border p-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={form.repeatOnExtraDays}
                    onCheckedChange={(checked) => setForm((f) => ({ ...f, repeatOnExtraDays: checked === true }))}
                  />
                  Repeat this exact lesson on other days too
                </label>
                {form.repeatOnExtraDays && (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {WEEK_DAYS.filter(({ value }) => value !== form.primaryDay).map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-1.5 text-sm">
                        <Checkbox
                          checked={form.extraDays.includes(value)}
                          onCheckedChange={() => toggleExtraDay(value)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Only use this if the same learning area and teacher genuinely repeat, e.g. Maths every weekday 8-9AM.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Room (optional)</Label>
              <Input
                placeholder="e.g. Room 4"
                value={form.room}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
              />
            </div>

            {formError && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSlot ? 'Save Changes' : 'Schedule Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>This will remove {deleteTarget.learning_area?.name || 'this lesson'} on{' '}
                  {deleteTarget.day} ({deleteTarget.start_time.slice(0, 5)}–{deleteTarget.end_time.slice(0, 5)}) from the timetable.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
