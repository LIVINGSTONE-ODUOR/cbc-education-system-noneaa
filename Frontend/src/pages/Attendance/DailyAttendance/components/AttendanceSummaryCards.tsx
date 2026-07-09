import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle2, XCircle, Clock3, ShieldCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttendanceApiSummary } from "@/lib/api/attendanceApi";

interface AttendanceSummaryCardsProps {
  summary: AttendanceApiSummary;
}

export const AttendanceSummaryCards: React.FC<AttendanceSummaryCardsProps> = ({ summary }) => {
  const cards = [
    {
      label: "Total",
      value: summary.total,
      icon: Users,
      iconClass: "bg-gradient-to-br from-indigo-600 to-blue-500",
    },
    {
      label: "Present",
      value: summary.present,
      icon: CheckCircle2,
      iconClass: "bg-gradient-to-br from-emerald-600 to-emerald-500",
      valueClass: "text-emerald-600",
    },
    {
      label: "Absent",
      value: summary.absent,
      icon: XCircle,
      iconClass: "bg-gradient-to-br from-red-600 to-red-500",
      valueClass: "text-red-600",
    },
    {
      label: "Late",
      value: summary.late,
      icon: Clock3,
      iconClass: "bg-gradient-to-br from-amber-600 to-amber-500",
      valueClass: "text-amber-600",
    },
    {
      label: "Excused",
      value: summary.excused,
      icon: ShieldCheck,
      iconClass: "bg-gradient-to-br from-blue-600 to-blue-500",
      valueClass: "text-blue-600",
    },
    {
      label: "Attendance Rate",
      value: `${summary.attendance_rate}%`,
      icon: TrendingUp,
      iconClass: "bg-gradient-to-br from-indigo-600 to-blue-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="rounded-2xl border border-gray-200 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 truncate">
                  {c.label}
                </p>
                <p className={cn("text-lg sm:text-2xl font-bold text-gray-900 mt-1", c.valueClass)}>
                  {c.value}
                </p>
              </div>
              <div className={cn("p-1.5 sm:p-2 rounded-lg text-white shadow-sm flex-shrink-0", c.iconClass)}>
                <c.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
