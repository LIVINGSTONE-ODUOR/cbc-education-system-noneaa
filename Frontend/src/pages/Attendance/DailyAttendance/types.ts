import { AttendanceApiLearner, AttendanceStatus } from "@/lib/api/attendanceApi";

export type AttendanceView = "classes" | "roster";

export interface ClassGroupItem {
  id: string;
  grade_level: string;
  stream_name: string | null;
  capacity: number | null;
  is_active: boolean;
  learner_count: number;
}

export interface RosterLearner extends AttendanceApiLearner {
  // Local editable draft state (mirrors backend fields, edited before Save)
  draft_status: AttendanceStatus | null;
  draft_arrival_time: string;
  draft_remarks: string;
}

export const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
];
