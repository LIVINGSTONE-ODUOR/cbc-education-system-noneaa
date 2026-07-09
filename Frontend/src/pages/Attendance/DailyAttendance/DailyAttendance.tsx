import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getClasses } from "@/lib/api/classApi";
import {
  getClassAttendanceRoster,
  saveClassAttendance,
  AttendanceStatus,
} from "@/lib/api/attendanceApi";
import { ClassGroupSelector } from "./components/ClassGroupSelector";
import { AttendanceRosterView } from "./components/AttendanceRosterView";
import { AttendanceView, ClassGroupItem, RosterLearner } from "./types";

const todayISO = () => new Date().toISOString().split("T")[0];

const DailyAttendance: React.FC = () => {
  // ─── STATE ──────────────────────────────────────────────────────────────
  const [view, setView] = useState<AttendanceView>("classes");
  const [selectedDate, setSelectedDate] = useState(todayISO());

  const [classes, setClasses] = useState<ClassGroupItem[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  const [selectedClass, setSelectedClass] = useState<ClassGroupItem | null>(null);
  const [learners, setLearners] = useState<RosterLearner[]>([]);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ─── DATA FETCHING ──────────────────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    setIsLoadingClasses(true);
    try {
      const response = await getClasses({ is_active: "true", limit: 200 });
      const apiClasses = response.data?.classes || [];
      setClasses(
        apiClasses.map((c) => ({
          id: String(c.id),
          grade_level: c.grade_level || "Unassigned",
          stream_name: c.stream_name || null,
          capacity: c.capacity ?? null,
          is_active: c.is_active ?? true,
          learner_count: typeof c.learner_count === "number" ? c.learner_count : 0,
        }))
      );
    } catch (error) {
      console.error("Failed to load classes:", error);
      toast.error("Unable to load classes. Check your backend connection.");
    } finally {
      setIsLoadingClasses(false);
    }
  }, []);

  const fetchRoster = useCallback(async (classId: string, date: string) => {
    setIsLoadingRoster(true);
    try {
      const response = await getClassAttendanceRoster(classId, date);
      const data = response.data;
      setAlreadyMarked(data.already_marked);
      setLearners(
        data.learners.map((l) => ({
          ...l,
          draft_status: l.status,
          draft_arrival_time: l.arrival_time || "",
          draft_remarks: l.remarks || "",
        }))
      );
    } catch (error) {
      console.error("Failed to load attendance roster:", error);
      toast.error("Unable to load learners for this class. Check your backend connection.");
      setLearners([]);
    } finally {
      setIsLoadingRoster(false);
    }
  }, []);

  useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClass) {
      void fetchRoster(selectedClass.id, selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass?.id, selectedDate]);

  // ─── EVENT HANDLERS ─────────────────────────────────────────────────────
  const handleSelectClass = useCallback((cls: ClassGroupItem) => {
    setSelectedClass(cls);
    setView("roster");
  }, []);

  const handleBack = useCallback(() => {
    setView("classes");
    setSelectedClass(null);
    setLearners([]);
  }, []);

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleStatusChange = useCallback((learnerId: string, status: AttendanceStatus) => {
    setLearners((prev) =>
      prev.map((l) => {
        if (l.learner_id !== learnerId) return l;
        const shouldAutoTime =
          (status === "present" || status === "late") && !l.draft_arrival_time;
        return {
          ...l,
          draft_status: status,
          draft_arrival_time: shouldAutoTime
            ? new Date().toTimeString().slice(0, 5)
            : l.draft_arrival_time,
        };
      })
    );
  }, []);

  const handleArrivalTimeChange = useCallback((learnerId: string, time: string) => {
    setLearners((prev) =>
      prev.map((l) => (l.learner_id === learnerId ? { ...l, draft_arrival_time: time } : l))
    );
  }, []);

  const handleRemarksChange = useCallback((learnerId: string, remarks: string) => {
    setLearners((prev) =>
      prev.map((l) => (l.learner_id === learnerId ? { ...l, draft_remarks: remarks } : l))
    );
  }, []);

  const handleMarkAllPresent = useCallback(() => {
    const nowTime = new Date().toTimeString().slice(0, 5);
    setLearners((prev) =>
      prev.map((l) => ({
        ...l,
        draft_status: "present",
        draft_arrival_time: l.draft_arrival_time || nowTime,
      }))
    );
    toast.success("All learners marked present");
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedClass) return;

    const unmarked = learners.filter((l) => !l.draft_status);
    if (unmarked.length > 0) {
      toast.error(
        `Please mark attendance for all learners (${unmarked.length} unmarked) before saving.`
      );
      return;
    }

    setIsSaving(true);
    try {
      const records = learners.map((l) => ({
        learner_id: l.learner_id,
        status: l.draft_status as AttendanceStatus,
        arrival_time: l.draft_arrival_time || null,
        remarks: l.draft_remarks || null,
      }));

      await saveClassAttendance(selectedClass.id, selectedDate, records);
      toast.success(
        `Attendance saved for ${selectedClass.grade_level}${
          selectedClass.stream_name ? ` – ${selectedClass.stream_name}` : ""
        } on ${selectedDate}`
      );
      // Reload to reflect the saved state (attendance_id, already_marked, etc.)
      void fetchRoster(selectedClass.id, selectedDate);
    } catch (error) {
      console.error("Failed to save attendance:", error);
      toast.error("Could not save attendance. Check your backend connection and permissions.");
    } finally {
      setIsSaving(false);
    }
  }, [selectedClass, selectedDate, learners, fetchRoster]);

  const handleRefreshClasses = useCallback(() => {
    void fetchClasses();
  }, [fetchClasses]);

  const handleRefreshRoster = useCallback(() => {
    if (selectedClass) {
      void fetchRoster(selectedClass.id, selectedDate);
    }
  }, [selectedClass, selectedDate, fetchRoster]);

  // ─── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6 bg-gray-50">
      {view === "classes" && (
        <ClassGroupSelector
          classes={classes}
          isLoading={isLoadingClasses}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onSelectClass={handleSelectClass}
          onRefresh={handleRefreshClasses}
        />
      )}

      {view === "roster" && selectedClass && (
        <AttendanceRosterView
          selectedClass={selectedClass}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          learners={learners}
          isLoading={isLoadingRoster}
          isSaving={isSaving}
          alreadyMarked={alreadyMarked}
          onBack={handleBack}
          onRefresh={handleRefreshRoster}
          onStatusChange={handleStatusChange}
          onArrivalTimeChange={handleArrivalTimeChange}
          onRemarksChange={handleRemarksChange}
          onMarkAllPresent={handleMarkAllPresent}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default DailyAttendance;
