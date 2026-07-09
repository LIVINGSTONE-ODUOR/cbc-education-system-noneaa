import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  CheckCheck,
  Save,
  RefreshCw,
  Loader2,
  Users,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADIENTS } from "@/pages/ClassesManagement/constants";
import { AttendanceSummaryCards } from "@/pages/Attendance/DailyAttendance/components/AttendanceSummaryCards";
import {
  getTeacherAttendanceRoster,
  saveTeacherAttendance,
  TeacherAttendanceStatus,
  TeacherAttendanceApiTeacher,
} from "@/lib/api/teacherAttendanceApi";

const todayISO = () => new Date().toISOString().split("T")[0];

interface RosterTeacher extends TeacherAttendanceApiTeacher {
  draft_status: TeacherAttendanceStatus | null;
  draft_check_in: string;
  draft_check_out: string;
  draft_remarks: string;
}

const STATUS_OPTIONS: { value: TeacherAttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
];

const STATUS_STYLES: Record<TeacherAttendanceStatus, string> = {
  present: "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700",
  absent: "bg-red-600 text-white border-red-600 hover:bg-red-700",
  late: "bg-amber-600 text-white border-amber-600 hover:bg-amber-700",
  excused: "bg-blue-600 text-white border-blue-600 hover:bg-blue-700",
};
const INACTIVE_STYLE = "bg-white text-gray-600 border-gray-300 hover:bg-gray-50";

const TeacherAttendance: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [teachers, setTeachers] = useState<RosterTeacher[]>([]);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fetchRoster = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const response = await getTeacherAttendanceRoster(date);
      const data = response.data;
      setAlreadyMarked(data.already_marked);
      setTeachers(
        data.teachers.map((t) => ({
          ...t,
          draft_status: t.status,
          draft_check_in: t.check_in_time || "",
          draft_check_out: t.check_out_time || "",
          draft_remarks: t.remarks || "",
        }))
      );
    } catch (error) {
      console.error("Failed to load teacher attendance roster:", error);
      toast.error("Unable to load teachers. Check your backend connection.");
      setTeachers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRoster(selectedDate);
  }, [selectedDate, fetchRoster]);

  const handleStatusChange = useCallback((teacherId: string, status: TeacherAttendanceStatus) => {
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.teacher_id !== teacherId) return t;
        const shouldAutoTime = (status === "present" || status === "late") && !t.draft_check_in;
        return {
          ...t,
          draft_status: status,
          draft_check_in: shouldAutoTime ? new Date().toTimeString().slice(0, 5) : t.draft_check_in,
        };
      })
    );
  }, []);

  const handleCheckInChange = useCallback((teacherId: string, time: string) => {
    setTeachers((prev) => prev.map((t) => (t.teacher_id === teacherId ? { ...t, draft_check_in: time } : t)));
  }, []);

  const handleCheckOutChange = useCallback((teacherId: string, time: string) => {
    setTeachers((prev) => prev.map((t) => (t.teacher_id === teacherId ? { ...t, draft_check_out: time } : t)));
  }, []);

  const handleRemarksChange = useCallback((teacherId: string, remarks: string) => {
    setTeachers((prev) => prev.map((t) => (t.teacher_id === teacherId ? { ...t, draft_remarks: remarks } : t)));
  }, []);

  const handleMarkAllPresent = useCallback(() => {
    const nowTime = new Date().toTimeString().slice(0, 5);
    setTeachers((prev) =>
      prev.map((t) => ({
        ...t,
        draft_status: "present",
        draft_check_in: t.draft_check_in || nowTime,
      }))
    );
    toast.success("All teachers marked present");
  }, []);

  const handleSave = useCallback(async () => {
    const unmarked = teachers.filter((t) => !t.draft_status);
    if (unmarked.length > 0) {
      toast.error(`Please mark attendance for all teachers (${unmarked.length} unmarked) before saving.`);
      return;
    }

    setIsSaving(true);
    try {
      const records = teachers.map((t) => ({
        teacher_id: t.teacher_id,
        status: t.draft_status as TeacherAttendanceStatus,
        check_in_time: t.draft_check_in || null,
        check_out_time: t.draft_check_out || null,
        remarks: t.draft_remarks || null,
      }));

      await saveTeacherAttendance(selectedDate, records);
      toast.success(`Attendance saved for ${selectedDate}`);
      void fetchRoster(selectedDate);
    } catch (error) {
      console.error("Failed to save teacher attendance:", error);
      toast.error("Could not save attendance. Check your backend connection and permissions.");
    } finally {
      setIsSaving(false);
    }
  }, [teachers, selectedDate, fetchRoster]);

  const filtered = useMemo(() => {
    if (!search.trim()) return teachers;
    const q = search.toLowerCase();
    return teachers.filter(
      (t) =>
        `${t.first_name} ${t.last_name}`.toLowerCase().includes(q) ||
        (t.staff_number || "").toLowerCase().includes(q) ||
        (t.designation || "").toLowerCase().includes(q)
    );
  }, [teachers, search]);

  const summary = useMemo(() => {
    const total = teachers.length;
    const present = teachers.filter((t) => t.draft_status === "present").length;
    const absent = teachers.filter((t) => t.draft_status === "absent").length;
    const late = teachers.filter((t) => t.draft_status === "late").length;
    const excused = teachers.filter((t) => t.draft_status === "excused").length;
    const marked = present + absent + late + excused;
    const attendance_rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, absent, late, excused, marked, attendance_rate };
  }, [teachers]);

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 shadow-sm">
        <div className={cn("absolute inset-0 opacity-5 bg-gradient-to-br", GRADIENTS.primary)} />
        <div className="relative p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn("p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br text-white shadow-md flex-shrink-0", GRADIENTS.primary)}>
                <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Teacher Attendance</h1>
                  {alreadyMarked && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-transparent font-semibold">
                      Attendance recorded
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {summary.total} teacher{summary.total === 1 ? "" : "s"} registered
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border-gray-300 font-semibold"
              />
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl border-gray-300 flex-shrink-0"
                onClick={() => fetchRoster(selectedDate)}
                title="Refresh teachers"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <AttendanceSummaryCards summary={summary} />

      {/* Toolbar */}
      <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, staff number, or designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl border-gray-300"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl gap-1.5 border-gray-300 font-semibold whitespace-nowrap"
              onClick={handleMarkAllPresent}
              disabled={isLoading || teachers.length === 0}
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Present
            </Button>
            <Button
              type="button"
              className={cn(
                "rounded-xl gap-1.5 bg-gradient-to-r text-white font-semibold hover:shadow-lg whitespace-nowrap",
                GRADIENTS.primary
              )}
              onClick={handleSave}
              disabled={isSaving || isLoading || teachers.length === 0}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Attendance
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teacher list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border border-gray-200 animate-pulse">
              <CardContent className="p-4 h-20" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border border-gray-200 shadow-sm">
          <CardContent className="p-10 text-center text-gray-500">
            {teachers.length === 0 ? (
              <div className="flex flex-col items-center gap-2">
                <Users className="h-8 w-8 text-gray-300" />
                <p>No active teachers are registered for this school yet.</p>
              </div>
            ) : (
              "No teachers match your search."
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((teacher) => {
            const initials = `${teacher.first_name?.[0] || ""}${teacher.last_name?.[0] || ""}`.toUpperCase();
            const showTimes = teacher.draft_status === "present" || teacher.draft_status === "late";

            return (
              <div
                key={teacher.teacher_id}
                className={cn(
                  "flex flex-col lg:flex-row lg:items-center gap-4 p-4 rounded-2xl border transition-colors",
                  teacher.draft_status === "absent"
                    ? "bg-red-50/50 border-red-200"
                    : teacher.draft_status === "late"
                    ? "bg-amber-50/50 border-amber-200"
                    : teacher.draft_status === "excused"
                    ? "bg-blue-50/50 border-blue-200"
                    : teacher.draft_status === "present"
                    ? "bg-emerald-50/40 border-emerald-200"
                    : "bg-white border-gray-200"
                )}
              >
                {/* Identity */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-11 w-11 border border-gray-200 flex-shrink-0">
                    {teacher.photo_url && <AvatarImage src={teacher.photo_url} alt={teacher.first_name} />}
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold text-sm">
                      {initials || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {teacher.first_name} {teacher.last_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {teacher.staff_number && (
                        <span className="text-xs text-gray-500 font-medium">{teacher.staff_number}</span>
                      )}
                      {teacher.designation && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-600">
                          {teacher.designation}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status toggle buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {STATUS_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      size="sm"
                      variant="outline"
                      className={cn(
                        "rounded-lg font-semibold text-xs px-3",
                        teacher.draft_status === opt.value ? STATUS_STYLES[opt.value] : INACTIVE_STYLE
                      )}
                      onClick={() => handleStatusChange(teacher.teacher_id, opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>

                {/* Check-in / check-out + remarks */}
                <div className="flex items-center gap-2 lg:w-80 flex-shrink-0">
                  <Input
                    type="time"
                    value={teacher.draft_check_in}
                    onChange={(e) => handleCheckInChange(teacher.teacher_id, e.target.value)}
                    disabled={!showTimes}
                    className="rounded-lg border-gray-300 text-sm h-9 w-24 flex-shrink-0 disabled:opacity-50"
                    title="Check-in time"
                  />
                  <Input
                    type="time"
                    value={teacher.draft_check_out}
                    onChange={(e) => handleCheckOutChange(teacher.teacher_id, e.target.value)}
                    disabled={!showTimes}
                    className="rounded-lg border-gray-300 text-sm h-9 w-24 flex-shrink-0 disabled:opacity-50"
                    title="Check-out time"
                  />
                  <Input
                    type="text"
                    placeholder="Remarks"
                    value={teacher.draft_remarks}
                    onChange={(e) => handleRemarksChange(teacher.teacher_id, e.target.value)}
                    className="rounded-lg border-gray-300 text-sm h-9"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherAttendance;
