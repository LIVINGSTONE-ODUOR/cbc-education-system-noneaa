import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, ChevronRight, GraduationCap, RefreshCw, CalendarDays } from "lucide-react";
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

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 shadow-sm">
        <div className={cn("absolute inset-0 opacity-5 bg-gradient-to-br", GRADIENTS.primary)} />
        <div className="relative p-4 sm:p-8 md:p-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-8">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className={cn("p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br text-white shadow-md flex-shrink-0", GRADIENTS.primary)}>
                <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                  Daily Attendance
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Select a class/stream to record or update today's attendance
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
              <button
                onClick={onRefresh}
                className="p-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
                title="Refresh classes"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by grade or stream (e.g. Grade 4, East)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl border-gray-300 max-w-md"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border border-gray-200 animate-pulse">
              <CardContent className="p-5 h-24" />
            </Card>
          ))}
        </div>
      )}

      {/* Grouped classes */}
      {!isLoading && grouped.length === 0 && (
        <Card className="rounded-2xl border border-gray-200 shadow-sm">
          <CardContent className="p-10 text-center text-gray-500">
            No classes found. Try adjusting your search or create a class first.
          </CardContent>
        </Card>
      )}

      {!isLoading &&
        grouped.map(([grade, streams]) => (
          <div key={grade} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className={cn("p-1.5 rounded-lg bg-gradient-to-br text-white", GRADIENTS.primary)}>
                <GraduationCap className="h-4 w-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">{grade}</h2>
              <Badge variant="outline" className="ml-1 text-gray-600 font-semibold">
                {streams.length} {streams.length === 1 ? "stream" : "streams"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {streams.map((cls) => (
                <Card
                  key={cls.id}
                  onClick={() => onSelectClass(cls)}
                  className="rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all group bg-white dark:bg-slate-900"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {cls.grade_level}
                          {cls.stream_name ? ` – ${cls.stream_name}` : ""}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-600">
                          <Users className="h-3.5 w-3.5" />
                          <span className="font-medium">
                            {cls.learner_count} learner{cls.learner_count === 1 ? "" : "s"}
                          </span>
                        </div>
                        {!cls.is_active && (
                          <Badge variant="destructive" className="mt-2">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};
