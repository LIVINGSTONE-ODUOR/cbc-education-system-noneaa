import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, ChevronRight, Layers, RefreshCw, CalendarDays, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADIENTS, GRADE_LEVELS } from "@/pages/ClassesManagement/constants";
import { ClassGroupItem } from "../types";

interface ClassGroupSelectorProps {
  classes: ClassGroupItem[];
  isLoading: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onSelectClass: (cls: ClassGroupItem) => void;
  onRefresh: () => void;
}

// Muted, single-color occupancy bar — informative without competing with
// the present/absent/late semantics used once you're inside a roster.
const occupancyClass = (learnerCount: number, capacity: number | null) => {
  if (!capacity || capacity <= 0) return "bg-gray-300";
  const pct = learnerCount / capacity;
  if (pct >= 0.9) return "bg-indigo-600";
  if (pct >= 0.5) return "bg-indigo-400";
  return "bg-indigo-300";
};

export const ClassGroupSelector: React.FC<ClassGroupSelectorProps> = ({
  classes,
  isLoading,
  selectedDate,
  onDateChange,
  onSelectClass,
  onRefresh,
}) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return classes;
    const q = search.toLowerCase();
    return classes.filter(
      (c) =>
        c.grade_level.toLowerCase().includes(q) ||
        (c.stream_name || "").toLowerCase().includes(q)
    );
  }, [classes, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, ClassGroupItem[]>();
    filtered.forEach((c) => {
      const key = c.grade_level || "Unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });

    // Order by GRADE_LEVELS first, then any remaining grades alphabetically
    const ordered: [string, ClassGroupItem[]][] = [];
    GRADE_LEVELS.forEach((g) => {
      if (map.has(g)) {
        ordered.push([g, map.get(g)!]);
        map.delete(g);
      }
    });
    Array.from(map.keys())
      .sort()
      .forEach((g) => ordered.push([g, map.get(g)!]));

    return ordered;
  }, [filtered]);

  const totals = useMemo(() => {
    const totalStreams = classes.length;
    const totalLearners = classes.reduce((sum, c) => sum + c.learner_count, 0);
    const activeStreams = classes.filter((c) => c.is_active).length;
    return { totalStreams, totalLearners, activeStreams };
  }, [classes]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 shadow-sm">
        <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", GRADIENTS.primary)} />
        <div className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn("h-9 w-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-sm flex-shrink-0", GRADIENTS.primary)}>
                <CalendarDays className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Daily Attendance</h1>
                <p className="text-sm text-gray-500">Select a class to record or update today's attendance</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="rounded-xl border-gray-300 font-medium h-10"
              />
              <button
                onClick={onRefresh}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex-shrink-0"
                title="Refresh classes"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </button>
            </div>
          </div>

          {/* Quick stats — a glanceable summary, not another set of cards */}
          {!isLoading && classes.length > 0 && (
            <div className="flex items-center gap-5 mt-5 pt-4 border-t border-gray-100 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                <span className="font-semibold text-gray-900">{totals.totalStreams}</span>
                <span>{totals.totalStreams === 1 ? "class" : "classes"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Users className="h-3.5 w-3.5 text-indigo-500" />
                <span className="font-semibold text-gray-900">{totals.totalLearners}</span>
                <span>learners enrolled</span>
              </div>
              {totals.activeStreams < totals.totalStreams && (
                <div className="flex items-center gap-1.5 text-gray-500">
                  <span>{totals.totalStreams - totals.activeStreams} inactive</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by grade or stream..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl border-gray-300 max-w-md h-10"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-xl border border-gray-200 animate-pulse">
              <CardContent className="p-4 h-[76px]" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && grouped.length === 0 && (
        <Card className="rounded-xl border border-dashed border-gray-300 shadow-none">
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {classes.length === 0
                ? "No classes have been created yet."
                : "No classes match your search."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grouped classes */}
      {!isLoading &&
        grouped.map(([grade, streams]) => {
          const gradeLearnerTotal = streams.reduce((sum, s) => sum + s.learner_count, 0);
          return (
            <div key={grade} className="space-y-2.5">
              <div className="flex items-baseline justify-between border-b border-gray-200 pb-1.5 px-0.5">
                <h2 className="text-[13px] font-bold uppercase tracking-wide text-gray-700">{grade}</h2>
                <span className="text-xs text-gray-400">
                  {streams.length} {streams.length === 1 ? "stream" : "streams"} · {gradeLearnerTotal} learners
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {streams.map((cls) => {
                  const pct = cls.capacity ? Math.min(100, Math.round((cls.learner_count / cls.capacity) * 100)) : null;
                  return (
                    <Card
                      key={cls.id}
                      onClick={() => onSelectClass(cls)}
                      className={cn(
                        "rounded-xl border shadow-sm cursor-pointer transition-all group bg-white dark:bg-slate-900",
                        cls.is_active
                          ? "border-gray-200 hover:border-indigo-300 hover:shadow-md"
                          : "border-gray-200 opacity-60"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 truncate">
                                {cls.grade_level}
                                {cls.stream_name ? ` – ${cls.stream_name}` : ""}
                              </p>
                              {!cls.is_active && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-500 border-gray-300 flex-shrink-0">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                              <Users className="h-3.5 w-3.5" />
                              <span>
                                {cls.learner_count}
                                {cls.capacity ? ` / ${cls.capacity}` : ""} learner{cls.learner_count === 1 ? "" : "s"}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                        </div>

                        {pct !== null && (
                          <div className="mt-3 h-1 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", occupancyClass(cls.learner_count, cls.capacity))}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
};
