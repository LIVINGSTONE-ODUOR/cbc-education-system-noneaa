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
import { CalendarClock, Loader2, Plus, Pencil, Trash2, AlertTriangle, School, Settings, Printer, Users, Copy } from 'lucide-react';

import { getClasses, getClassLearningAreas, ClassApiItem, ClassLearningArea } from '@/lib/api/classApi';
import { getTeachers } from '@/lib/api/teacherApi';
import {
  getTimetable,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot,
  getDaySettings,
  updateDaySettings,
  getSchoolTimetable,
  getTeacherLoadReport,
  getTimetablePeriods,
  copyTimetable,
  SchoolTimetableResponse,
  TeacherLoad,
  TeacherDayStatus,
  TimetableConflictError,
  TimetableGrid,
  TimetableSlot,
  DaySetting,
  WeekDay,
  WEEK_DAYS,
  TimetablePeriodsResponse,
  CopyTimetableResponse,
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

  // ── Year/Term picker: powers Print + Timetable Setup so admin can work
  // with a different term/year than whatever's currently marked "current"
  // (e.g. print last term's timetable, or plan next term's lesson counts).
  const [periods, setPeriods] = useState<TimetablePeriodsResponse>({ academic_years: [], academic_terms: [] });

  useEffect(() => {
    (async () => {
      try {
        const res = await getTimetablePeriods();
        setPeriods(res.data);
      } catch {
        // Non-fatal — pickers just fall back to "current" only.
      }
    })();
  }, []);

  const currentYear = useMemo(() => periods.academic_years.find((y) => y.is_current) || null, [periods]);
  const currentTerm = useMemo(() => periods.academic_terms.find((t) => t.is_current) || null, [periods]);

  // ── Timetable Setup: lessons-per-day, e.g. Monday = 8, Friday = 6 ────────
  const [daySettings, setDaySettings] = useState<DaySetting[]>(
    WEEK_DAYS.map(({ value }) => ({ day: value, lessons_count: 8 }))
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<Record<WeekDay, number>>({} as Record<WeekDay, number>);
  const [settingsYearId, setSettingsYearId] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState(false);

  const lessonLimit = useCallback(
    (day: WeekDay) => daySettings.find((s) => s.day === day)?.lessons_count ?? 8,
    [daySettings]
  );

  const loadDaySettings = useCallback(async () => {
    try {
      const res = await getDaySettings();
      setDaySettings(res.data.settings);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load timetable setup');
    }
  }, []);

  useEffect(() => {
    loadDaySettings();
  }, [loadDaySettings]);

  const openSettingsDialog = () => {
    const draft = {} as Record<WeekDay, number>;
    WEEK_DAYS.forEach(({ value }) => { draft[value] = lessonLimit(value); });
    setSettingsDraft(draft);
    setSettingsYearId(currentYear?.id || '');
    setSettingsOpen(true);
  };

  // Reload the per-day lesson counts for whichever year is picked in the
  // dialog, so switching to next year's row doesn't show this year's numbers.
  const handleSettingsYearChange = async (yearId: string) => {
    setSettingsYearId(yearId);
    try {
      const res = await getDaySettings(yearId ? { academic_year_id: yearId } : undefined);
      const draft = {} as Record<WeekDay, number>;
      WEEK_DAYS.forEach(({ value }) => {
        draft[value] = res.data.settings.find((s) => s.day === value)?.lessons_count ?? 8;
      });
      setSettingsDraft(draft);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load timetable setup for that year');
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const days = WEEK_DAYS.map(({ value }) => ({ day: value, lessons_count: settingsDraft[value] }));
      const res = await updateDaySettings({ academic_year_id: settingsYearId || undefined, days });
      // Only refresh the live grid's lesson caps when editing the year
      // that's actually current — editing next year's setup shouldn't
      // change what today's grid shows as "full".
      if (!settingsYearId || settingsYearId === currentYear?.id) {
        setDaySettings(res.data.settings);
      }
      toast.success('Timetable setup saved');
      setSettingsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save timetable setup');
    } finally {
      setSavingSettings(false);
    }
  };

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<TimetableSlot | null>(null);

  // ── Print: full school timetable (all classes, all lessons, teachers) ───
  const [printData, setPrintData] = useState<SchoolTimetableResponse | null>(null);
  const [printing, setPrinting] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printYearId, setPrintYearId] = useState<string>('');
  const [printTermId, setPrintTermId] = useState<string>('');

  // ── Teacher Load report: who's free, who's overloaded, per day ──────────
  const [loadReportOpen, setLoadReportOpen] = useState(false);
  const [loadReportLoading, setLoadReportLoading] = useState(false);
  const [teacherLoad, setTeacherLoad] = useState<TeacherLoad[]>([]);

  // ── Copy Timetable: bulk-duplicate a term/year's lessons into another
  // term/year, so the admin only tweaks what's different instead of
  // rebuilding the whole grid every term ───────────────────────────────
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copySourceYearId, setCopySourceYearId] = useState<string>('');
  const [copySourceTermId, setCopySourceTermId] = useState<string>('');
  const [copyTargetYearId, setCopyTargetYearId] = useState<string>('');
  const [copyTargetTermId, setCopyTargetTermId] = useState<string>('');
  const [copyOnlySelectedClass, setCopyOnlySelectedClass] = useState(false);
  const [copyOverwrite, setCopyOverwrite] = useState(false);
  const [copyResult, setCopyResult] = useState<CopyTimetableResponse | null>(null);

  const openCopyDialog = () => {
    setCopySourceYearId(currentYear?.id || '');
    setCopySourceTermId(currentTerm?.id || '');
    setCopyTargetYearId('');
    setCopyTargetTermId('');
    setCopyOnlySelectedClass(false);
    setCopyOverwrite(false);
    setCopyResult(null);
    setCopyDialogOpen(true);
  };

  const handleCopy = async () => {
    if (!copyTargetYearId) {
      toast.error('Choose a target academic year to copy into.');
      return;
    }
    setCopying(true);
    setCopyResult(null);
    try {
      const res = await copyTimetable({
        source_academic_year_id: copySourceYearId || undefined,
        source_term_id: copySourceTermId || undefined,
        target_academic_year_id: copyTargetYearId,
        target_term_id: copyTargetTermId || undefined,
        class_ids: copyOnlySelectedClass && selectedClassId ? [selectedClassId] : undefined,
        overwrite: copyOverwrite,
      });
      setCopyResult(res.data);
      if (res.data.skipped_count === 0) {
        toast.success(`Copied ${res.data.copied} lesson(s).`);
      } else {
        toast.warning(`Copied ${res.data.copied} of ${res.data.total_source} lesson(s) — ${res.data.skipped_count} skipped due to conflicts.`);
      }
      // If the target period is what's currently on screen, refresh the grid.
      if (selectedClassId && copyTargetYearId === currentYear?.id) {
        await loadClassData(selectedClassId);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to copy the timetable');
    } finally {
      setCopying(false);
    }
  };

  const openLoadReport = async () => {
    setLoadReportOpen(true);
    setLoadReportLoading(true);
    try {
      const res = await getTeacherLoadReport();
      setTeacherLoad(res.data.teachers);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load the teacher load report');
    } finally {
      setLoadReportLoading(false);
    }
  };

  const statusBadgeVariant = (status: TeacherDayStatus): 'secondary' | 'outline' | 'destructive' | 'default' => {
    if (status === 'overloaded') return 'destructive';
    if (status === 'free') return 'outline';
    if (status === 'light') return 'secondary';
    return 'default';
  };

  const openPrintDialog = () => {
    setPrintYearId(currentYear?.id || '');
    setPrintTermId(currentTerm?.id || '');
    setPrintDialogOpen(true);
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const res = await getSchoolTimetable({
        academic_year_id: printYearId || undefined,
        term_id: printTermId || undefined,
      });
      setPrintData(res.data);
      setPrintDialogOpen(false);
      // Wait a tick so the print-only markup is in the DOM before printing.
      setTimeout(() => window.print(), 50);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load the timetable for printing');
    } finally {
      setPrinting(false);
    }
  };

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

    // Respect the lessons-per-day cap set in Timetable Setup (e.g. Monday
    // maxes out at 8 lessons). Editing an existing slot doesn't add a new
    // lesson to the day, so it's exempt from this check.
    if (!editingSlot) {
      const fullDays = days.filter((d) => (grid[d]?.length || 0) >= lessonLimit(d));
      if (fullDays.length) {
        const label = fullDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
        setFormError(`${label} already has its full lesson count for this class. Remove a lesson first or raise the limit in Timetable Setup.`);
        return;
      }
    }

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            School Timetable
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Assign teachers to learning areas per class, and schedule the days and times each lesson runs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Button variant="outline" onClick={openSettingsDialog}>
            <Settings className="h-4 w-4 mr-2" />
            Timetable Setup
          </Button>
          <Button variant="outline" onClick={openCopyDialog}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Timetable
          </Button>
          <Button variant="outline" onClick={openLoadReport}>
            <Users className="h-4 w-4 mr-2" />
            Teacher Load
          </Button>
          <Button variant="outline" onClick={openPrintDialog} disabled={printing}>
            {printing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
            Print Timetable
          </Button>
          <Button onClick={openAddDialog} disabled={!selectedClassId || loadingClasses}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Lesson
          </Button>
        </div>
      </div>

      <Card className="no-print">
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

      <Card className="no-print">
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
                  <div className="text-sm font-semibold text-center py-1.5 rounded-md bg-muted flex items-center justify-center gap-1.5">
                    {label}
                    <Badge
                      variant={(grid[value]?.length || 0) >= lessonLimit(value) ? 'destructive' : 'secondary'}
                      className="text-[10px] font-normal"
                    >
                      {grid[value]?.length || 0}/{lessonLimit(value)}
                    </Badge>
                  </div>
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

      {/* ── Timetable Setup: lessons per day ───────────────────────────── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Timetable Setup</DialogTitle>
            <DialogDescription>
              Set how many lessons are taught on each day, e.g. Monday = 8 lessons, Friday = 6.
              Applies school-wide and caps how many lessons any class can be scheduled for on that day.
            </DialogDescription>
          </DialogHeader>

          {periods.academic_years.length > 0 && (
            <div className="space-y-1.5">
              <Label>Academic Year</Label>
              <Select value={settingsYearId} onValueChange={handleSettingsYearChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Current year" />
                </SelectTrigger>
                <SelectContent>
                  {periods.academic_years.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}{y.is_current ? ' (current)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Switch year to plan next term's lesson counts without touching the current setup.
              </p>
            </div>
          )}

          <div className="space-y-3 py-2">
            {WEEK_DAYS.map(({ value, label }) => (
              <div key={value} className="flex items-center justify-between gap-4">
                <Label className="w-28">{label}</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={settingsDraft[value] ?? 8}
                  onChange={(e) =>
                    setSettingsDraft((s) => ({ ...s, [value]: Math.max(1, Math.min(20, Number(e.target.value) || 1)) }))
                  }
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground">lessons</span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)} disabled={savingSettings}>
              Cancel
            </Button>
            <Button onClick={saveSettings} disabled={savingSettings}>
              {savingSettings && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Print: Year/Term picker ──────────────────────────────────────
           Defaults to the current term/year; lets the admin print last
           term's timetable for the archive, or preview next term's plan. */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Print Timetable</DialogTitle>
            <DialogDescription>
              Choose which term and academic year to print. Defaults to the current one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Academic Year</Label>
              <Select value={printYearId} onValueChange={setPrintYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Current year" />
                </SelectTrigger>
                <SelectContent>
                  {periods.academic_years.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}{y.is_current ? ' (current)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Term</Label>
              <Select value={printTermId} onValueChange={setPrintTermId}>
                <SelectTrigger>
                  <SelectValue placeholder="Current term" />
                </SelectTrigger>
                <SelectContent>
                  {periods.academic_terms.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}{t.is_current ? ' (current)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)} disabled={printing}>
              Cancel
            </Button>
            <Button onClick={handlePrint} disabled={printing}>
              {printing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Copy Timetable: bulk-duplicate a term/year into another ──────
           so the admin only tweaks what's different instead of rebuilding
           the whole grid every term. */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Copy Timetable</DialogTitle>
            <DialogDescription>
              Copy every lesson from one term/year into another. Existing lessons in the target period are left
              untouched unless you choose to overwrite them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>From — Year</Label>
                <Select value={copySourceYearId} onValueChange={setCopySourceYearId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Current year" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.academic_years.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.name}{y.is_current ? ' (current)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>From — Term</Label>
                <Select value={copySourceTermId} onValueChange={setCopySourceTermId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Current term" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.academic_terms.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}{t.is_current ? ' (current)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>To — Year</Label>
                <Select value={copyTargetYearId} onValueChange={setCopyTargetYearId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a year" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.academic_years.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.name}{y.is_current ? ' (current)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>To — Term</Label>
                <Select value={copyTargetTermId} onValueChange={setCopyTargetTermId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No specific term" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.academic_terms.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}{t.is_current ? ' (current)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={copyOnlySelectedClass}
                  onCheckedChange={(checked) => setCopyOnlySelectedClass(checked === true)}
                  disabled={!selectedClassId}
                />
                Only copy {selectedClass ? `${selectedClass.grade_level}${selectedClass.stream_name ? ' ' + selectedClass.stream_name : ''}` : 'the selected class'} (leave unchecked to copy every class)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={copyOverwrite}
                  onCheckedChange={(checked) => setCopyOverwrite(checked === true)}
                />
                Overwrite existing lessons for the copied class(es) in the target period
              </label>
              {!copyOverwrite && (
                <p className="text-xs text-muted-foreground">
                  Without overwrite, any source lesson that clashes with something already in the target
                  (same class, teacher, or room) is skipped rather than replaced — you'll see exactly what
                  was skipped and why.
                </p>
              )}
            </div>

            {copyResult && (
              <div className="rounded-md border p-3 space-y-2">
                <p className="text-sm font-medium">
                  Copied {copyResult.copied} of {copyResult.total_source} lesson(s) across {copyResult.classes_copied} class(es).
                </p>
                {copyResult.skipped_count > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 text-xs">
                    {copyResult.skipped.map((s, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-muted-foreground">
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-destructive" />
                        <span>
                          <span className="font-medium text-foreground">{s.class || 'Class'}</span>
                          {' — '}{s.learning_area || 'Lesson'} on {s.day} ({s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}): {s.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyDialogOpen(false)} disabled={copying}>
              Close
            </Button>
            <Button onClick={handleCopy} disabled={copying || !copyTargetYearId}>
              {copying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Teacher Load report ─────────────────────────────────────────── */}
      <Dialog open={loadReportOpen} onOpenChange={setLoadReportOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Teacher Clash / Free-Period Report</DialogTitle>
            <DialogDescription>
              Lessons taught per day against that day's limit (set in Timetable Setup). "Free" means no lessons
              that day at all; "Overloaded" means more lessons than the day's configured limit.
            </DialogDescription>
          </DialogHeader>

          {loadReportLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading teacher load…
            </div>
          ) : teacherLoad.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No active teachers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3">Teacher</th>
                    {WEEK_DAYS.map(({ value, label }) => (
                      <th key={value} className="text-center py-2 px-2">{label.slice(0, 3)}</th>
                    ))}
                    <th className="text-center py-2 pl-3">Weekly</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherLoad.map((t) => (
                    <tr key={t.teacher_id} className="border-b last:border-b-0">
                      <td className="py-2 pr-3 font-medium whitespace-nowrap">
                        {t.name}
                        {(t.days_unassigned > 0 || t.days_overloaded > 0) && (
                          <div className="text-xs text-muted-foreground font-normal">
                            {t.days_overloaded > 0 && <span className="text-destructive">{t.days_overloaded} overloaded day(s)</span>}
                            {t.days_overloaded > 0 && t.days_unassigned > 0 && ' · '}
                            {t.days_unassigned > 0 && <span>{t.days_unassigned} free day(s)</span>}
                          </div>
                        )}
                      </td>
                      {t.days.map((d) => (
                        <td key={d.day} className="text-center py-2 px-2">
                          <Badge variant={statusBadgeVariant(d.status)} title={`${d.lessons_count} of ${d.limit} lessons`}>
                            {d.lessons_count}/{d.limit}
                          </Badge>
                        </td>
                      ))}
                      <td className="text-center py-2 pl-3 font-medium">{t.weekly_total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadReportOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Print-only: full school timetable — every class, every lesson,
           teacher assigned per subject per class ──────────────────────── */}
      {printData && (
        <div className="hidden print:block">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold uppercase">{printData.school?.name}</h1>
            <p className="text-sm">
              {printData.term?.name || 'Term'} — {printData.academic_year?.name || 'Academic Year'}
            </p>
            <h2 className="text-base font-semibold mt-1">School Timetable</h2>
          </div>

          {printData.classes.map((cls) => (
            <div key={cls.id} className="mb-6 break-inside-avoid">
              <h3 className="font-semibold text-sm mb-1 bg-muted px-2 py-1">
                {cls.grade_level}{cls.stream_name ? ` ${cls.stream_name}` : ''}
              </h3>
              <table className="w-full text-xs border-collapse border">
                <thead>
                  <tr>
                    {WEEK_DAYS.map(({ value, label }) => (
                      <th key={value} className="border p-1 text-left align-top">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {WEEK_DAYS.map(({ value }) => (
                      <td key={value} className="border p-1 align-top">
                        {(cls.timetable[value] || [])
                          .slice()
                          .sort((a, b) => a.start_time.localeCompare(b.start_time))
                          .map((slot) => (
                            <div key={slot.id} className="mb-1.5 pb-1.5 border-b last:border-b-0 last:mb-0 last:pb-0">
                              <div className="font-medium">
                                {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)} {slot.learning_area?.name || 'Lesson'}
                              </div>
                              <div className="text-muted-foreground">
                                {teacherName(slot)}{slot.room ? ` • ${slot.room}` : ''}
                              </div>
                            </div>
                          ))}
                        {(cls.timetable[value] || []).length === 0 && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; font-size: 11pt; }
          .no-print { display: none !important; }
          @page { margin: 1.2cm; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
