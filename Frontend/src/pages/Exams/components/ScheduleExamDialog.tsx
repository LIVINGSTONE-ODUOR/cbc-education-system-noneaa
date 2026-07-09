import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableCombobox, type ComboboxOption } from '@/components/ui/searchable-combobox';
import { AlertCircle, CalendarClock, Clock, MapPin, UserCheck } from 'lucide-react';

import { getTeachers } from '@/lib/api/teacherApi';
import type { StaffMember } from '@/pages/teacher/StaffManagement/types';
import { getClasses } from '@/lib/api/classApi';
import type { ClassApiItem } from '@/lib/api/classApi';

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

/**
 * Minimal shape of the exam this dialog is scheduling. Only the fields
 * needed to render dialog context are required — this stays decoupled
 * from the full ExamApiItem type used elsewhere in the page.
 */
export interface ScheduleExamTarget {
  id: string;
  exam_name: string;
  exam_type: string;
}

export interface ScheduleExamFormState {
  examDate: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: string; // derived, human-readable (e.g. "1h 30m")
  room: string;
  invigilator: string;
}

interface ScheduleExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: ScheduleExamTarget | null;
}

const EMPTY_FORM: ScheduleExamFormState = {
  examDate: '',
  startTime: '',
  endTime: '',
  duration: '',
  room: '',
  invigilator: '',
};

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/** Computes a human-readable duration ("1h 30m") from two HH:mm strings. */
const computeDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return '';

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  if ([startH, startM, endH, endM].some((n) => Number.isNaN(n))) return '';

  const minutes = endH * 60 + endM - (startH * 60 + startM);
  if (minutes <= 0) return '';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// ─────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────

/**
 * Schedule Exam dialog — UI ONLY.
 *
 * This component only manages its own local form state and light client-side
 * validation for feedback purposes. It is intentionally NOT wired to any API
 * call or the parent's data — hooking up `getExams` refresh / a
 * `scheduleExam` endpoint is a follow-up task.
 */
export const ScheduleExamDialog: React.FC<ScheduleExamDialogProps> = ({
  open,
  onOpenChange,
  exam,
}) => {
  const [form, setForm] = useState<ScheduleExamFormState>(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Invigilators (teachers) — fetched from the existing backend API.
  const [teachers, setTeachers] = useState<StaffMember[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);

  // Rooms — sourced from Classes & Streams (e.g. "Grade 7 - Blue") so the
  // Room field offers real venues instead of free-typed guesses.
  const [classes, setClasses] = useState<ClassApiItem[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  // Reset the form whenever the dialog is opened for a (possibly new) exam.
  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setTouched({});
    }
  }, [open, exam?.id]);

  // ── Load teachers for the Invigilator dropdown ─────────────────────────
  const loadTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    setTeachersError(null);
    try {
      const res = await getTeachers({ limit: 200 });
      setTeachers(res.teachers || []);
    } catch (error: any) {
      console.error('Failed to load teachers:', error);
      const message = error?.message || 'Could not load teachers. Check your connection and try again.';
      setTeachersError(message);
      toast.error(message);
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadTeachers();
    }
  }, [open, loadTeachers]);

  // Only active teachers are offered as invigilators.
  const invigilatorOptions = useMemo(
    () =>
      teachers
        .filter((t) => (t.jobStatus || 'active').toLowerCase() === 'active')
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    [teachers]
  );

  const invigilatorSearchOptions: ComboboxOption[] = useMemo(
    () =>
      invigilatorOptions.map((teacher) => ({
        value: teacher.id,
        label: `${teacher.firstName} ${teacher.lastName}`.trim(),
        description: teacher.designation || undefined,
      })),
    [invigilatorOptions]
  );

  // ── Load classes/streams for the Room dropdown ──────────────────────────
  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    setRoomsError(null);
    try {
      const res = await getClasses({ is_active: 'true', limit: 200 });
      setClasses(res.data?.classes || []);
    } catch (error: any) {
      console.error('Failed to load classes/streams:', error);
      const message =
        error?.message || 'Could not load rooms. Check your connection and try again.';
      setRoomsError(message);
      toast.error(message);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadRooms();
    }
  }, [open, loadRooms]);

  // Each class stream (e.g. "Grade 7 - Blue") becomes a searchable room
  // option, since exams are typically held in the class's own room.
  const roomOptions: ComboboxOption[] = useMemo(
    () =>
      classes
        .map((c) => {
          const label = c.stream_name
            ? `Grade ${c.grade_level} - ${c.stream_name}`
            : `Grade ${c.grade_level}`;
          const branchName = c.branches?.name || c.branch?.name;
          return {
            value: label,
            label,
            description: branchName || undefined,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
    [classes]
  );

  // Keep the derived duration field in sync with start/end time.
  useEffect(() => {
    setForm((f) => ({ ...f, duration: computeDuration(f.startTime, f.endTime) }));
  }, [form.startTime, form.endTime]);

  const updateField = <K extends keyof ScheduleExamFormState>(
    key: K,
    value: ScheduleExamFormState[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const markTouched = (key: string) => setTouched((t) => ({ ...t, [key]: true }));

  // ── Local, client-side-only validation (no submission wired up) ────────
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.examDate) e.examDate = 'Exam date is required.';
    if (!form.startTime) e.startTime = 'Start time is required.';
    if (!form.endTime) e.endTime = 'End time is required.';
    if (form.startTime && form.endTime && !computeDuration(form.startTime, form.endTime)) {
      e.endTime = 'End time must be after start time.';
    }
    if (!form.room.trim()) e.room = 'Room is required.';
    if (!form.invigilator.trim()) e.invigilator = 'Invigilator is required.';
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const handleClose = () => {
    onOpenChange(false);
  };

  // Placeholder only — save/backend wiring is a follow-up task.
  const handleScheduleClick = () => {
    setTouched({
      examDate: true,
      startTime: true,
      endTime: true,
      room: true,
      invigilator: true,
    });
    if (!isValid) return;
    // eslint-disable-next-line no-console
    console.log('[ScheduleExamDialog] Local form state (not yet persisted):', form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-indigo-600" />
            Schedule Exam
          </DialogTitle>
          <DialogDescription>
            {exam ? (
              <>
                Set the date, time and venue for{' '}
                <span className="font-medium text-gray-700">{exam.exam_name}</span>
                {exam.exam_type ? ` (${exam.exam_type})` : ''}.
              </>
            ) : (
              'Set the date, time and venue for this exam.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Exam Date */}
          <div className="space-y-1.5">
            <Label htmlFor="schedule-exam-date">Exam Date</Label>
            <Input
              id="schedule-exam-date"
              type="date"
              className="rounded-xl"
              value={form.examDate}
              onChange={(e) => updateField('examDate', e.target.value)}
              onBlur={() => markTouched('examDate')}
            />
            {touched.examDate && errors.examDate && (
              <p className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.examDate}
              </p>
            )}
          </div>

          {/* Start Time / End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="schedule-start-time">Start Time</Label>
              <Input
                id="schedule-start-time"
                type="time"
                className="rounded-xl"
                value={form.startTime}
                onChange={(e) => updateField('startTime', e.target.value)}
                onBlur={() => markTouched('startTime')}
              />
              {touched.startTime && errors.startTime && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.startTime}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="schedule-end-time">End Time</Label>
              <Input
                id="schedule-end-time"
                type="time"
                className="rounded-xl"
                value={form.endTime}
                onChange={(e) => updateField('endTime', e.target.value)}
                onBlur={() => markTouched('endTime')}
              />
              {touched.endTime && errors.endTime && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>

          {/* Duration (derived, read-only) */}
          <div className="space-y-1.5">
            <Label htmlFor="schedule-duration">Duration</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="schedule-duration"
                readOnly
                placeholder="Auto-calculated from start / end time"
                className="rounded-xl pl-9 bg-gray-50 text-gray-600 cursor-default"
                value={form.duration}
              />
            </div>
          </div>

          {/* Room */}
          <div className="space-y-1.5">
            <Label htmlFor="schedule-room">Room</Label>
            <SearchableCombobox
              id="schedule-room"
              options={roomOptions}
              value={form.room}
              onChange={(value) => updateField('room', value)}
              onBlur={() => markTouched('room')}
              loading={loadingRooms}
              loadingText="Loading rooms..."
              placeholder="Search a room / class stream..."
              searchPlaceholder="Search rooms..."
              emptyText={roomsError ? 'Could not load rooms' : 'No class streams found'}
              icon={<MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />}
              allowCustomValue
              aria-invalid={touched.room && !!errors.room}
            />
            {roomsError && (
              <p className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {roomsError}
              </p>
            )}
            {touched.room && errors.room && !roomsError && (
              <p className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.room}
              </p>
            )}
          </div>

          {/* Invigilator */}
          <div className="space-y-1.5">
            <Label htmlFor="schedule-invigilator">Invigilator</Label>
            <SearchableCombobox
              id="schedule-invigilator"
              options={invigilatorSearchOptions}
              value={form.invigilator}
              onChange={(value) => updateField('invigilator', value)}
              onBlur={() => markTouched('invigilator')}
              loading={loadingTeachers}
              loadingText="Loading teachers..."
              disabled={!!teachersError}
              placeholder="Search an invigilator..."
              searchPlaceholder="Search teachers..."
              emptyText={teachersError ? 'Could not load teachers' : 'No teachers found'}
              icon={<UserCheck className="h-4 w-4 text-gray-400 flex-shrink-0" />}
              aria-invalid={touched.invigilator && !!errors.invigilator}
            />
            {teachersError && (
              <p className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {teachersError}
              </p>
            )}
            {touched.invigilator && errors.invigilator && !teachersError && (
              <p className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.invigilator}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
            onClick={handleScheduleClick}
            title="UI preview only — saving is not yet implemented"
          >
            Schedule Exam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleExamDialog;
