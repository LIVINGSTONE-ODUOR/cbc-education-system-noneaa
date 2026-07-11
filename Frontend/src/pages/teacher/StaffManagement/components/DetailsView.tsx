import React, { useState } from "react";
import {
  Edit,
  IdCard,
  Phone,
  Briefcase,
  BookOpen,
  Mail,
  MapPin,
  Calendar,
  Badge as BadgeIcon,
  Copy,
  Check,
  ChevronDown,
  GraduationCap,
  Briefcase as BriefcaseIcon,
  FileText,
  Award,
  DollarSign,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { StaffMember } from "../types";
import { fmt, getStaffTypeLabel, getStaffTypeColor } from "../helpers";
import { TopNav, NavBtn, Avatar, StatusBadge, Toast } from "./index";
import { TeacherAssignmentsCard } from "./TeacherAssignmentsCard";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Field {
  label: string;
  value: string;
  copyable?: boolean;
  badge?: boolean;
  icon?: React.ElementType;
  show?: boolean;
}

const formatSalary = (salary: number) => {
  if (!salary || salary === 0) return "Not set";
  return `KSh ${salary.toLocaleString()} per month`;
};

interface DetailsViewProps {
  selected: StaffMember;
  onBack: () => void;
  onEdit: () => void;
  toast: string | null;
}

export const DetailsView: React.FC<DetailsViewProps> = ({
  selected,
  onBack,
  onEdit,
  toast,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    contact: true,
    employment: true,
    teaching: true,
  });

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const typeColor = getStaffTypeColor(selected.staffType);

  // Helper function to safely get nested values
  const getValue = (value: any): string => {
    if (!value || value === null || value === undefined) return "";
    return String(value);
  };

  // Get display values with fallbacks
  const displayValues = {
    fullName: `${selected.firstName || ""} ${selected.lastName || ""}`.trim(),
    nationalId: getValue(selected.idNumber),
    dateOfBirth: getValue(selected.dateOfBirth),
    gender: getValue(selected.sex || (selected as any).gender),
    tscNumber: getValue(selected.tscNumber),
    email: getValue(selected.email),
    mobilePhone: getValue(selected.mobilePhone),
    county: getValue(selected.county),
    location: getValue(selected.location),
    designation: getValue(selected.designation),
    branch: getValue(selected.branch),
    jobStatus: getValue(selected.jobStatus),
    hireDate: getValue(selected.hireDate),
    contractStart: getValue(selected.contractStart),
    contractEnd: getValue(selected.contractEnd),
    teachingSubjects: selected.teachingSubjects || [],
    qualifications: selected.qualifications || [],
    salary: selected.salary,
  };

  const sections = [
    {
      id: "personal",
      icon: IdCard,
      title: "Personal Information",
      color: "#1A56DB",
      fields: [
        { label: "Full Name", value: displayValues.fullName, copyable: true },
        {
          label: "National ID",
          value: displayValues.nationalId || "—",
          copyable: true,
        },
        { label: "Date of Birth", value: displayValues.dateOfBirth || "—" },
        { label: "Gender", value: displayValues.gender || "—" },
        {
          label: "TSC Number",
          value: displayValues.tscNumber || "—",
          copyable: true,
          show: selected.staffType === "teaching",
        },
      ],
    },
    {
      id: "contact",
      icon: Phone,
      title: "Contact Information",
      color: "#15803D",
      fields: [
        {
          label: "Email",
          value: displayValues.email || "—",
          copyable: true,
          icon: Mail,
        },
        {
          label: "Mobile",
          value: displayValues.mobilePhone || "—",
          copyable: true,
          icon: Phone,
        },
        { label: "County", value: displayValues.county || "—" },
        {
          label: "Location",
          value: displayValues.location || "—",
          icon: MapPin,
        },
      ],
    },
    {
      id: "employment",
      icon: Briefcase,
      title: "Employment Information",
      color: "#B45309",
      fields: [
        { label: "Designation", value: displayValues.designation || "—" },
        { label: "Branch", value: displayValues.branch || "—" },
        { label: "Status", value: displayValues.jobStatus || "active", badge: true },
        {
          label: "Hire Date",
          value: displayValues.hireDate || "—",
          icon: Calendar,
        },
        {
          label: "Contract Start",
          value: displayValues.contractStart || "—",
          icon: Clock,
        },
        {
          label: "Contract End",
          value: displayValues.contractEnd || "—",
          icon: Clock,
        },
      ],
    },
    {
      id: "teaching",
      icon: BookOpen,
      title: "Teaching & Qualifications",
      color: "#1D4ED8",
      show: selected.staffType === "teaching",
    },
  ];

  const InfoField = ({
    label,
    value,
    copyable = false,
    badge = false,
    icon: Icon,
  }: {
    label: string;
    value: string;
    copyable?: boolean;
    badge?: boolean;
    icon?: React.ElementType;
  }) => (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          {label}
        </p>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
          {badge ? (
            <StatusBadge status={value} />
          ) : (
            <p className="text-sm font-medium text-foreground truncate">
              {value}
            </p>
          )}
        </div>
      </div>
      {copyable && value !== "—" && (
        <button
          onClick={() => handleCopy(value, label)}
          className="mt-5 p-1.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
          title="Copy to clipboard"
        >
          {copiedField === label ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBack} 
          className="flex items-center gap-2 px-4 py-2 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back</span>
        </Button>
        <Button onClick={onEdit} size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit Staff
        </Button>
      </div>

      {/* Header Section */}
      <div
        className="rounded-xl border border-primary/10 overflow-hidden shadow-sm"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--primary) / 0.12) 100%)",
        }}
      >
        <div className="px-6 py-8 space-y-6">
          {/* Top Row: Profile & Salary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            {/* Profile Section */}
            <div className="flex items-start gap-4 flex-1">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {selected.photo ? (
                  <img
                    src={selected.photo}
                    alt={`${selected.firstName} ${selected.lastName}`}
                    className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-white shadow-md flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {selected.firstName?.[0]}
                      {selected.lastName?.[0]}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow-md">
                  <BadgeIcon size={14} className="text-white" strokeWidth={2.5} />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  {displayValues.branch || "No Branch"}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 break-words">
                  {displayValues.fullName || "Unknown"}
                </h1>
                <p className="text-sm text-muted-foreground mb-4">
                  {displayValues.designation || "No Designation"}
                </p>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className="gap-1.5"
                    style={{
                      background: typeColor.bg,
                      color: typeColor.text,
                      border: `1px solid ${typeColor.text}30`,
                    }}
                  >
                    {selected.staffType === "teaching" ? (
                      <GraduationCap className="w-3 h-3" />
                    ) : (
                      <BriefcaseIcon className="w-3 h-3" />
                    )}
                    {getStaffTypeLabel(selected.staffType)}
                  </Badge>

                  <StatusBadge status={displayValues.jobStatus} />

                  {displayValues.tscNumber &&
                    displayValues.tscNumber !== "—" &&
                    selected.staffType === "teaching" && (
                      <Badge variant="outline" className="gap-1">
                        <Award className="w-3 h-3" />
                        TSC: {displayValues.tscNumber}
                      </Badge>
                    )}
                </div>
              </div>
            </div>

            {/* Salary Card */}
            {displayValues.salary !== undefined && (
              <Card className="border-0 shadow-sm min-w-fit flex-shrink-0">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Monthly Salary
                    </p>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-primary">
                    {formatSalary(displayValues.salary).split(" ").slice(1).join(" ")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections
          .filter((section) => section.show !== false)
          .map((section) => {
            const SectionIcon = section.icon;
            const isTeaching = section.id === "teaching";
            const isExpanded = expandedSections[section.id];

            return (
              <Card key={section.id} className="border-0 shadow-sm overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between gap-3 p-4 hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${section.color}15`,
                        border: `1px solid ${section.color}30`,
                      }}
                    >
                      <SectionIcon
                        size={18}
                        color={section.color}
                        strokeWidth={2}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">
                        {section.title}
                      </h3>
                      {section.fields && (
                        <p className="text-xs text-muted-foreground">
                          {section.fields.filter((f) => f.show !== false).length} fields
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {/* Content */}
                {isExpanded && (
                  <>
                    <Separator />
                    <CardContent className="p-4">
                      {isTeaching ? (
                        <div className="space-y-5">
                          {/* Subjects */}
                          {displayValues.teachingSubjects &&
                            displayValues.teachingSubjects.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <BookOpen className="w-4 h-4 text-primary" />
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Subjects Taught
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {displayValues.teachingSubjects.map(
                                    (subject: string, idx: number) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="bg-primary/5 text-primary border-primary/30"
                                      >
                                        {subject}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Qualifications */}
                          {displayValues.qualifications &&
                            displayValues.qualifications.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Award className="w-4 h-4 text-green-600" />
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Qualifications
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {displayValues.qualifications.map(
                                    (qual: string, idx: number) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="bg-green-50 text-green-700 border-green-200"
                                      >
                                        {qual}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {(!displayValues.teachingSubjects ||
                            displayValues.teachingSubjects.length === 0) &&
                            (!displayValues.qualifications ||
                              displayValues.qualifications.length === 0) && (
                              <div className="text-center py-8 text-muted-foreground">
                                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">
                                  No teaching details recorded
                                </p>
                              </div>
                            )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {section.fields
                            ?.filter((f) => f.show !== false)
                            .map((field, idx, arr) => (
                              <div key={idx}>
                                <InfoField
                                  label={field.label}
                                  value={field.value}
                                  copyable={field.copyable}
                                  badge={(field as any).badge}
                                  icon={(field as any).icon}
                                />
                                {idx < arr.length - 1 && <Separator />}
                              </div>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            );
          })}

        {selected.staffType === "teaching" && (
          <TeacherAssignmentsCard teacherId={selected.id} />
        )}
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  );
};
