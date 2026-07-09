import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Search,
  CheckCheck,
  Save,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADIENTS } from "@/pages/ClassesManagement/constants";
import { AttendanceStatus, AttendanceApiSummary } from "@/lib/api/attendanceApi";
import { AttendanceSummaryCards } from "./AttendanceSummaryCards";
import { LearnerAttendanceRow } from "./LearnerAttendanceRow";
import { ClassGroupItem, RosterLearner } from "../types";

interface AttendanceRosterViewProps {
  selectedClass: ClassGroupItem;
  selectedDate: string;
  onDateChange: (date: string) => void;
  learners: RosterLearner[];
  isLoading: boolean;
  isSaving: boolean;
  alreadyMarked: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onStatusChange: (learnerId: string, status: AttendanceStatus) => void;
  onArrivalTimeChange: (learnerId: string, time: string) => void;
  onRemarksChange: (learnerId: string, remarks: string) => void;
  onMarkAllPresent: () => void;
  onSave: () => void;
}

// Live summary computed from the current in-memory draft state, so the
// cards react instantly as the user marks learners (not just after saving).
const computeLiveSummary = (learners: RosterLearner[]): AttendanceApiSummary => {
  const total = learners.length;
  const present = learners.filter((l) => l.draft_status === "present").length;
  const absent = learners.filter((l) => l.draft_status === "absent").length;
  const late = learners.filter((l) => l.draft_status === "late").length;
  const excused = learners.filter((l) => l.draft_status === "excused").length;
  const marked = present + absent + late + excused;
  const attendance_rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  return { total, present, absent, late, excused, marked, attendance_rate };
};

export const AttendanceRosterView: React.FC<AttendanceRosterViewProps> = ({
  selectedClass,
  selectedDate,
  onDateChange,
  learners,
  isLoading,
  isSaving,
  alreadyMarked,
  onBack,
  onRefresh,
  onStatusChange,
  onArrivalTimeChange,
  onRemarksChange,
  onMarkAllPresent,
  onSave,
}) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return learners;
    const q = search.toLowerCase();
    return learners.filter(
      (l) =>
        `${l.first_name} ${l.last_name}`.toLowerCase().includes(q) ||
        l.admission_number.toLowerCase().includes(q)
    );
  }, [learners, search]);

  const summary = useMemo(() => computeLiveSummary(learners), [learners]);

  const className = `${selectedClass.grade_level}${
    selectedClass.stream_name ? ` – ${selectedClass.stream_name}` : ""
  }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 shadow-sm">
        <div className={cn("absolute inset-0 opacity-5 bg-gradient-to-br", GRADIENTS.primary)} />
        <div className="relative p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl border-gray-300 flex-shrink-0"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{className}</h1>
                  {alreadyMarked && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-transparent font-semibold">
                      Attendance recorded
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {summary.total} learner{summary.total === 1 ? "" : "s"} enrolled
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="rounded-xl border-gray-300 font-semibold"
              />
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl border-gray-300 flex-shrink-0"
                onClick={onRefresh}
                title="Refresh roster"
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
              placeholder="Search by name or admission number..."
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
              onClick={onMarkAllPresent}
              disabled={isLoading || learners.length === 0}
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
              onClick={onSave}
              disabled={isSaving || isLoading || learners.length === 0}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Attendance
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Learner list */}
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
            {learners.length === 0
              ? "No learners are enrolled in this class yet."
              : "No learners match your search."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((learner) => (
            <LearnerAttendanceRow
              key={learner.learner_id}
              learner={learner}
              onStatusChange={onStatusChange}
              onArrivalTimeChange={onArrivalTimeChange}
              onRemarksChange={onRemarksChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
