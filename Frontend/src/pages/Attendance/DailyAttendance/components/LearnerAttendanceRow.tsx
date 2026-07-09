import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AttendanceStatus } from "@/lib/api/attendanceApi";
import { RosterLearner, STATUS_OPTIONS } from "../types";

interface LearnerAttendanceRowProps {
  learner: RosterLearner;
  onStatusChange: (learnerId: string, status: AttendanceStatus) => void;
  onArrivalTimeChange: (learnerId: string, time: string) => void;
  onRemarksChange: (learnerId: string, remarks: string) => void;
}

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700",
  absent: "bg-red-600 text-white border-red-600 hover:bg-red-700",
  late: "bg-amber-600 text-white border-amber-600 hover:bg-amber-700",
  excused: "bg-blue-600 text-white border-blue-600 hover:bg-blue-700",
};

const INACTIVE_STYLE = "bg-white text-gray-600 border-gray-300 hover:bg-gray-50";

export const LearnerAttendanceRow: React.FC<LearnerAttendanceRowProps> = ({
  learner,
  onStatusChange,
  onArrivalTimeChange,
  onRemarksChange,
}) => {
  const initials = `${learner.first_name?.[0] || ""}${learner.last_name?.[0] || ""}`.toUpperCase();
  const showArrivalTime = learner.draft_status === "present" || learner.draft_status === "late";

  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row lg:items-center gap-4 p-4 rounded-2xl border transition-colors",
        learner.draft_status === "absent"
          ? "bg-red-50/50 border-red-200"
          : learner.draft_status === "late"
          ? "bg-amber-50/50 border-amber-200"
          : learner.draft_status === "excused"
          ? "bg-blue-50/50 border-blue-200"
          : learner.draft_status === "present"
          ? "bg-emerald-50/40 border-emerald-200"
          : "bg-white border-gray-200"
      )}
    >
      {/* Identity */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-11 w-11 border border-gray-200 flex-shrink-0">
          {learner.photo_url && <AvatarImage src={learner.photo_url} alt={learner.first_name} />}
          <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold text-sm">
            {initials || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {learner.first_name} {learner.last_name}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">{learner.admission_number}</span>
            {learner.gender && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-600">
                {learner.gender}
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
              learner.draft_status === opt.value ? STATUS_STYLES[opt.value] : INACTIVE_STYLE
            )}
            onClick={() => onStatusChange(learner.learner_id, opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Arrival time + remarks */}
      <div className="flex items-center gap-2 lg:w-72 flex-shrink-0">
        <Input
          type="time"
          value={learner.draft_arrival_time}
          onChange={(e) => onArrivalTimeChange(learner.learner_id, e.target.value)}
          disabled={!showArrivalTime}
          className="rounded-lg border-gray-300 text-sm h-9 w-28 flex-shrink-0 disabled:opacity-50"
          title="Arrival time"
        />
        <Input
          type="text"
          placeholder="Remarks (optional)"
          value={learner.draft_remarks}
          onChange={(e) => onRemarksChange(learner.learner_id, e.target.value)}
          className="rounded-lg border-gray-300 text-sm h-9"
        />
      </div>
    </div>
  );
};
