import React, { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Download,
  Award,
  UserCheck,
  Clock,
  MapPin,
  Briefcase,
  Search,
  ChevronRight,
  TrendingUp,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { StaffMember } from "../types";
import { TopNav, NavBtn, StatCard, Avatar, StatusBadge, Toast } from "./index";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface DashboardViewProps {
  staff: StaffMember[];
  onBack?: () => void;
  onViewList: () => void;
  onCreate: () => void;
  onViewPerformance?: () => void;
  toast: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  staff,
  onBack,
  onViewList,
  onCreate,
  onViewPerformance,
  toast,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "onleave">("all");
  const [filterType, setFilterType] = useState<"all" | "teaching" | "non-teaching">("all");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Calculate statistics
  const stats = useMemo(() => {
    const active = staff.filter((s) => {
      const status = s.jobStatus?.toLowerCase().trim();
      return status === "active" || status === "currently working" || (!status && s.isActive !== false);
    }).length;
    const onLeave = staff.filter((s) => {
      const status = s.jobStatus?.toLowerCase().trim();
      return status === "on leave" || status === "away";
    }).length;
    const teaching = staff.filter((s) => s.staffType === "teaching").length;
    const nonTeaching = staff.filter((s) => s.staffType === "non-teaching").length;
    const branches = new Set(
      staff
        .map((s) => s.branch?.trim())
        .filter((name): name is string => Boolean(name))
    ).size;

    return {
      total: staff.length,
      active,
      onLeave,
      teaching,
      nonTeaching,
      branches,
      activePercent: Math.round((active / Math.max(staff.length, 1)) * 100),
    };
  }, [staff]);

  // Filter and search staff
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.designation?.toLowerCase().includes(q) ||
          s.branch?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filterStatus !== "all") {
        if (filterStatus === "active" && s.jobStatus?.toLowerCase() !== "active") return false;
        if (filterStatus === "onleave" && s.jobStatus?.toLowerCase() !== "on leave") return false;
      }

      // Type filter
      if (filterType !== "all" && s.staffType !== filterType) return false;

      return true;
    });
  }, [staff, searchQuery, filterStatus, filterType]);

  const handleImageError = (staffId: string) => {
    setImageErrors((prev) => ({ ...prev, [staffId]: true }));
  };

  const quickActions = [
    {
      icon: UserPlus,
      label: "Register New Staff",
      sub: "Add teacher or support staff",
      action: onCreate,
      color: "#1A56DB",
      bg: "#EBF0FF",
      gradient: "from-blue-50 to-blue-100",
    },
    {
      icon: Users,
      label: "View All Staff",
      sub: "Browse & manage records",
      action: onViewList,
      color: "#15803D",
      bg: "#F0FDF4",
      gradient: "from-green-50 to-green-100",
    },
    {
      icon: Download,
      label: "Export Records",
      sub: "CSV, PDF, or Excel format",
      action: () => {},
      color: "#7C3AED",
      bg: "#F5F3FF",
      gradient: "from-purple-50 to-purple-100",
    },
    {
      icon: Award,
      label: "Performance",
      sub: "Attendance & reports",
      action: onViewPerformance || (() => {}),
      color: "#B45309",
      bg: "#FEF3C7",
      gradient: "from-amber-50 to-amber-100",
    },
  ];

  const statCards = [
    {
      icon: Users,
      label: "Total Staff",
      value: stats.total,
      color: "#16a34a",
      bg: "#F0FDF4",
      trend: `${stats.total} members`,
      icon_bg: "bg-green-100",
    },
    {
      icon: UserCheck,
      label: "Active",
      value: stats.active,
      color: "#15803D",
      bg: "#F0FDF4",
      trend: `${stats.activePercent}% of total`,
      icon_bg: "bg-emerald-100",
    },
    {
      icon: Clock,
      label: "On Leave",
      value: stats.onLeave,
      color: "#B45309",
      bg: "#FFFBEB",
      trend: "Currently away",
      icon_bg: "bg-amber-100",
    },
    {
      icon: MapPin,
      label: "Branches",
      value: stats.branches,
      color: "#7C3AED",
      bg: "#F5F3FF",
      trend: "Locations",
      icon_bg: "bg-purple-100",
    },
    {
      icon: Briefcase,
      label: "Non-Teaching",
      value: stats.nonTeaching,
      color: "#B45309",
      bg: "#FEF3C7",
      trend: "Support staff",
      icon_bg: "bg-amber-100",
    },
    {
      icon: Award,
      label: "Teaching",
      value: stats.teaching,
      color: "#4F46E5",
      bg: "#EEF2FF",
      trend: "Educators",
      icon_bg: "bg-indigo-100",
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl border border-primary/10 shadow-sm"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--primary) / 0.12) 50%, hsl(var(--primary) / 0.06) 100%)",
        }}>
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: "radial-gradient(hsl(var(--primary) / 0.13) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2">
                {onBack && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onBack} 
                    className="flex items-center gap-2 px-4 py-2 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-medium">Back</span>
                  </Button>
                )}
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Staff Management</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage teaching and non-teaching staff records, allocations, and performance
              </p>
            </div>
            <Button onClick={onCreate} className="flex-shrink-0 w-full sm:w-auto" size="lg">
              <UserPlus className="w-4 h-4 mr-2" />
              Register Staff
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className={cn("w-8 h-8 rounded-lg mb-3 flex items-center justify-center", stat.icon_bg)}>
                    <Icon size={16} style={{ color: stat.color }} strokeWidth={2.5} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mb-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.trend}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Quick Actions</h2>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(({ icon: Icon, label, sub, action, color, bg, gradient }) => (
            <button
              key={label}
              onClick={action}
              className="group relative bg-gradient-to-br from-card to-card border border-border rounded-xl p-4 cursor-pointer flex gap-3 items-start text-left transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/40 overflow-hidden"
            >
              {/* Background accent */}
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-1/2 translate-x-1/4"
                style={{ background: color }}
              />

              {/* Icon */}
              <div
                className="relative z-10 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{ background: bg }}
              >
                <Icon size={18} color={color} strokeWidth={2.5} />
              </div>

              {/* Content */}
              <div className="relative z-10 flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>

              {/* Arrow */}
              <ChevronRight
                size={16}
                className="text-muted-foreground relative z-10 flex-shrink-0 group-hover:translate-x-1 transition-transform"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Staff List Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Staff Directory</CardTitle>
              <CardDescription>
                {filteredStaff.length} of {staff.length} staff members
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              {/* Filters */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Status
                    {filterStatus !== "all" && (
                      <Badge variant="secondary" className="ml-1">
                        1
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setFilterStatus("all")}
                    className={filterStatus === "all" ? "bg-primary/10" : ""}
                  >
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterStatus("active")}
                    className={filterStatus === "active" ? "bg-primary/10" : ""}
                  >
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterStatus("onleave")}
                    className={filterStatus === "onleave" ? "bg-primary/10" : ""}
                  >
                    On Leave
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Briefcase className="h-4 w-4" />
                    Type
                    {filterType !== "all" && (
                      <Badge variant="secondary" className="ml-1">
                        1
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setFilterType("all")}
                    className={filterType === "all" ? "bg-primary/10" : ""}
                  >
                    All Types
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterType("teaching")}
                    className={filterType === "teaching" ? "bg-primary/10" : ""}
                  >
                    Teaching
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterType("non-teaching")}
                    className={filterType === "non-teaching" ? "bg-primary/10" : ""}
                  >
                    Non-Teaching
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={onViewList}>
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredStaff.length > 0 ? (
            <div className="divide-y divide-border/50">
              {filteredStaff.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 hover:bg-muted/40 transition-colors cursor-pointer group"
                  onClick={onViewList}
                >
                  {/* Staff Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {s.photo && !imageErrors[s.id] ? (
                        <img
                          src={s.photo}
                          alt={`${s.firstName} ${s.lastName}`}
                          className="w-10 h-10 rounded-full object-cover border border-border"
                          onError={() => handleImageError(s.id)}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-border">
                          <span className="text-xs font-semibold text-primary">
                            {s.firstName[0]}
                            {s.lastName[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Name & Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.designation || "Staff"} • {s.branch || "No Branch"}
                      </p>
                    </div>
                  </div>

                  {/* Type Badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "hidden sm:inline-flex flex-shrink-0",
                      s.staffType === "teaching"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                  >
                    {s.staffType === "teaching" ? "Teaching" : "Support"}
                  </Badge>

                  {/* Status Badge */}
                  <StatusBadge status={s.jobStatus} />

                  {/* Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={onViewList}>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Send Message</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              {/* Show more button */}
              {filteredStaff.length > 8 && (
                <div className="text-center py-4">
                  <Button variant="outline" onClick={onViewList} className="gap-2">
                    View all {filteredStaff.length} staff members
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium mb-1">No staff members found</p>
              <p className="text-xs mb-4">Try adjusting your filters or search terms</p>
              <Button onClick={onCreate} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add your first staff member
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {toast && <Toast msg={toast} />}
    </div>
  );
};