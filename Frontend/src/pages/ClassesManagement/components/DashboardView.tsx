// components/DashboardView.tsx
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  School,
  CheckCircle,
  Users,
  Target,
  BarChart3,
  Building2,
  GraduationCap,
  List,
  Plus,
  Download,
  UserPlus,
  ChevronRight,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADIENTS, GRADE_LEVELS } from "../constants";
import { ClassItem } from "../types";
import { getTotalLearners, getTotalCapacity, getUtilizationRate } from "../utils";

interface DashboardViewProps {
  classes: ClassItem[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onCreateClick: () => void;
  onViewAllClick: () => void;
  onFilterGradeClick: (grade: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  classes,
  isRefreshing,
  onRefresh,
  onCreateClick,
  onViewAllClick,
  onFilterGradeClick,
}) => {
  const totalLearners = useMemo(() => getTotalLearners(classes), [classes]);
  const totalCapacity = useMemo(() => getTotalCapacity(classes), [classes]);
  const activeClasses = useMemo(
    () => classes.filter((c) => c.is_active).length,
    [classes]
  );
  const fullClasses = useMemo(
    () => classes.filter((c) => c.capacity && c.learner_count >= c.capacity).length,
    [classes]
  );
  const utilizationRate = useMemo(
    () => getUtilizationRate(totalLearners, totalCapacity),
    [totalLearners, totalCapacity]
  );
  const branches = useMemo(
    () => Array.from(new Set(classes.map((c) => c.branch?.name).filter(Boolean))),
    [classes]
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-gray-200 shadow-sm">
        <div className={cn("absolute inset-0 opacity-5 bg-gradient-to-br", GRADIENTS.primary)} />
        <div className="relative p-4 sm:p-8 md:p-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-8">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className={cn("p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br text-white shadow-md flex-shrink-0", GRADIENTS.primary)}>
                <School className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                  Classes Management
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  Manage classes, streams, timetables and learner enrollment
                </p>
                <div className="flex flex-wrap items-center gap-6 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>{activeClasses} active classes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <span>{totalLearners} enrolled</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <Target className="h-4 w-4 text-amber-600" />
                    <span>{utilizationRate}% utilization</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
                onClick={onRefresh}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
              <Button
                size="sm"
                className={cn("rounded-xl gap-1.5 bg-gradient-to-r text-white font-semibold hover:shadow-lg", GRADIENTS.primary)}
                onClick={onCreateClick}
              >
                <Plus className="h-4 w-4" /> New Class
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Classes",
            value: classes.length,
            icon: School,
            gradient: GRADIENTS.primary,
          },
          {
            label: "Active Classes",
            value: activeClasses,
            icon: CheckCircle,
            gradient: GRADIENTS.success,
          },
          {
            label: "Total Learners",
            value: totalLearners,
            icon: Users,
            gradient: GRADIENTS.primary,
          },
          {
            label: "Full Classes",
            value: fullClasses,
            icon: Target,
            gradient: GRADIENTS.danger,
          },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                    {stat.label}
                  </p>
                  <p className="text-2xl sm:text-4xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={cn("p-2 sm:p-3 rounded-xl bg-gradient-to-br text-white shadow-md flex-shrink-0", stat.gradient)}>
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Capacity & Branch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capacity */}
        <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-4 border-b border-gray-200">
            <CardTitle className="text-lg font-bold flex items-center gap-3 text-gray-900">
              <div className={cn("p-2 rounded-lg bg-gradient-to-br text-white", GRADIENTS.primary)}>
                <BarChart3 className="h-5 w-5" />
              </div>
              Capacity Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-gray-700">Overall Enrollment</span>
              <span className="text-sm font-bold text-gray-900">
                {totalLearners} / {totalCapacity}
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all bg-gradient-to-r",
                  utilizationRate > 90
                    ? GRADIENTS.danger
                    : utilizationRate > 75
                    ? GRADIENTS.warning
                    : GRADIENTS.success
                )}
                style={{ width: `${utilizationRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 font-semibold">
              <span>{utilizationRate}% utilized</span>
              <span>{totalCapacity - totalLearners} available</span>
            </div>
          </CardContent>
        </Card>

        {/* Branch Distribution */}
        <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-4 border-b border-gray-200">
            <CardTitle className="text-lg font-bold flex items-center gap-3 text-gray-900">
              <div className={cn("p-2 rounded-lg bg-gradient-to-br text-white", GRADIENTS.primary)}>
                <Building2 className="h-5 w-5" />
              </div>
              Branch Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            {branches.map((branch) => {
              const branchClasses = classes.filter((c) => c.branch?.name === branch);
              const branchEnrollment = branchClasses.reduce(
                (sum, c) => sum + c.learner_count,
                0
              );
              const branchCapacity = branchClasses.reduce(
                (sum, c) => sum + (c.capacity || 0),
                0
              );
              const branchUtilization = branchCapacity
                ? Math.round((branchEnrollment / branchCapacity) * 100)
                : 0;

              return (
                <div
                  key={branch}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg bg-gradient-to-br text-white", GRADIENTS.primary)}>
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{branch}</p>
                      <p className="text-xs text-gray-600">
                        {branchClasses.length} classes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {branchUtilization}%
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Grade Levels */}
      <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
          <CardTitle className="text-lg font-bold flex items-center gap-3 text-gray-900">
            <div className={cn("p-2 rounded-lg bg-gradient-to-br text-white", GRADIENTS.primary)}>
              <GraduationCap className="h-5 w-5" />
            </div>
            Classes by Grade
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            className="text-indigo-600 hover:bg-indigo-50 font-semibold"
            onClick={onViewAllClick}
          >
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GRADE_LEVELS.slice(0, 9).map((grade) => {
              const gradeClasses = classes.filter(
                (c) => c.grade_level === grade && c.is_active
              );
              const enrolled = gradeClasses.reduce(
                (s, c) => s + c.learner_count,
                0
              );

              return gradeClasses.length > 0 ? (
                <div
                  key={grade}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-indigo-300 cursor-pointer hover:shadow-sm transition-all"
                  onClick={() => onFilterGradeClick(grade)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg bg-gradient-to-br text-white", GRADIENTS.primary)}>
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{grade}</p>
                      <p className="text-xs text-gray-600">
                        {gradeClasses.length} stream(s)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{enrolled}</p>
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "View All", icon: List, action: onViewAllClick, gradient: GRADIENTS.primary },
          { label: "Add Class", icon: Plus, action: onCreateClick, gradient: GRADIENTS.success },
          { label: "Export Data", icon: Download, action: () => {}, gradient: GRADIENTS.primary },
          { label: "Enroll Learners", icon: UserPlus, action: onViewAllClick, gradient: GRADIENTS.primary },
        ].map((action) => (
          <Card
            key={action.label}
            className="rounded-2xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer bg-white transition-all group"
            onClick={action.action}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-lg bg-gradient-to-br text-white", action.gradient)}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">
                    {action.label}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};