import React, { useState, useMemo } from "react";
import {
  Users,
  X,
  Save,
  ChevronDown,
  CheckCircle,
  Camera,
  AlertCircle,
  Info,
  ArrowLeft,
} from "lucide-react";
import { StaffMember } from "../types";
import {
  STATUS_CFG,
  DESIGNATIONS,
  COUNTIES,
  ALL_SUBJECTS,
} from "../constants";
import { initials, avatarBg } from "../helpers";
import { TopNav, NavBtn, StatusBadge, FormField, Toast } from "./index";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import type { Branch } from "@/lib/api/schoolsApi";


interface FormViewProps {
  form: StaffMember;
  selected: StaffMember | null;
  tab: "general" | "teaching" | "contact";
  slots: string[];
  branches: Branch[];
  onBack: () => void;
  onSave: () => void;
  onDiscard?: () => void;
  onTabChange: (tab: "general" | "teaching" | "contact") => void;
  onFieldChange: <K extends keyof StaffMember>(
    key: K,
    value: StaffMember[K]
  ) => void;
  onSlotsChange: (slots: string[]) => void;
  toast: string | null;
}

const inputClasses =
  "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-sans";
const selectClasses = cn(inputClasses, "appearance-none pr-8 cursor-pointer");

// ✅ PROGRESS TRACKER SECTION CONFIG — mirrors the Add Learner page's sidebar nav
const SECTIONS: Array<{
  value: "general" | "teaching" | "contact";
  label: string;
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
  barColor: string;
}> = [
  { value: "general", label: "Personal & Employment", icon: Users, iconBg: "bg-blue-100", iconColor: "text-blue-600", barColor: "bg-blue-500" },
  { value: "teaching", label: "Teaching Details", icon: Camera, iconBg: "bg-green-100", iconColor: "text-green-600", barColor: "bg-green-500" },
  { value: "contact", label: "Contact & Address", icon: Users, iconBg: "bg-rose-100", iconColor: "text-rose-500", barColor: "bg-rose-400" },
];

const pct = (filled: number, total: number) => (total ? Math.round((filled / total) * 100) : 0);

export const FormView: React.FC<FormViewProps> = ({
  form,
  selected,
  tab,
  slots,
  branches,
  onBack,
  onSave,
  onDiscard,
  onTabChange,
  onFieldChange,
  onSlotsChange,
  toast,
}) => {
  const [photoPreview, setPhotoPreview] = useState<string>(form.photo || "");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPhotoPreview(url);
    onFieldChange("photo", url);
  };

  const handleImagePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64String = e.target?.result as string;
            setPhotoPreview(base64String);
            onFieldChange("photo", base64String);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const DD = ({
    k,
    opts,
    placeholder,
  }: {
    k: keyof StaffMember;
    opts: string[];
    placeholder?: string;
  }) => {
    const currentValue = String(form[k] ?? "").trim();
    const normalizedOptions = opts.map((o) => String(o).trim()).filter(Boolean);
    const includeCurrent = currentValue && !normalizedOptions.includes(currentValue);
    const optionValues = includeCurrent
      ? [...normalizedOptions, currentValue]
      : normalizedOptions;

    return (
      <div className="relative">
        <select
          className={selectClasses}
          value={currentValue}
          onChange={(e) =>
            onFieldChange(k, e.target.value as StaffMember[typeof k])
          }
        >
          {placeholder && <option value="">{placeholder}</option>}
          {optionValues.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
        />
      </div>
    );
  };

const branchOptions = useMemo(() => {
  const normalized = branches
    .map((branch) => branch.name?.trim())
    .filter(Boolean);
  
  const unique = Array.from(new Set(normalized));
  const selectedBranch = form.branch?.trim();

  if (selectedBranch && !unique.includes(selectedBranch)) {
    return [...unique, selectedBranch];
  }

  return unique;
}, [branches, form.branch]);

  // Calculate form completion
  const requiredFields = [
    form.firstName,
    form.lastName,
    form.idNumber,
    form.sex,
    form.designation,
    form.branch,
    form.email,
    form.mobilePhone,
  ];
  const completedCount = requiredFields.filter(Boolean).length;
  const completionPercent = Math.round((completedCount / requiredFields.length) * 100);

  const completionChecks = [
    ["Full Name", !!(form.firstName && form.lastName)],
    ["ID Number", !!form.idNumber],
    ["Gender", !!form.sex],
    ["Designation", !!form.designation],
    ["Branch", !!form.branch],
    ["Email", !!form.email],
    ["Phone", !!form.mobilePhone],
    ["Salary", !!form.salary],
  ] as [string, boolean][];

  // ✅ Per-section completion — purely presentational, drives the Progress Tracker bars
  const sectionCompletion: Record<"general" | "teaching" | "contact", number> = {
    general: pct(
      [form.firstName, form.lastName, form.idNumber, form.sex, form.designation, form.branch].filter(Boolean).length,
      6
    ),
    teaching: pct(
      [form.tscNumber, form.qualifications?.length > 0, slots.some(Boolean)].filter(Boolean).length,
      3
    ),
    contact: pct([form.email, form.mobilePhone].filter(Boolean).length, 2),
  };

  return (
    <div className="w-full space-y-6 p-4 md:p-6 bg-[#EAEFF9] dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="mt-0.5 border-slate-200 hover:bg-slate-100 dark:bg-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1
            className="text-3xl md:text-4xl font-semibold italic text-slate-900 dark:text-slate-100"
            style={{ fontFamily: "'EB Garamond', serif" }}
          >
            {selected ? "Edit Staff Member" : "Register New Staff"}
          </h1>
          <p className="text-slate-600 mt-2">
            {selected ? "Update staff information" : "Add a new staff member to your school"}
          </p>
        </div>
      </div>

      {/* Header Alert */}
      {!selected && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 text-sm">
            Fill in all required fields (marked with <span className="font-bold">*</span>) to register the staff member.
          </AlertDescription>
        </Alert>
      )}

      {/* Sidebar progress tracker + main content + right rail */}
      <Tabs
        value={tab}
        onValueChange={(t) => onTabChange(t as "general" | "teaching" | "contact")}
        className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_300px] gap-6 items-start"
      >
        {/* Progress Tracker sidebar */}
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 p-3 lg:sticky lg:top-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 px-2 pb-2">
            Progress Tracker
          </p>
          <nav className="space-y-1">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const percent = sectionCompletion[section.value];
              return (
                <button
                  key={section.value}
                  type="button"
                  onClick={() => onTabChange(section.value)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    tab === section.value
                      ? "bg-slate-100 dark:bg-slate-800"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  )}
                >
                  <span className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", section.iconBg)}>
                    <Icon className={cn("w-4 h-4", section.iconColor)} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {section.label}
                      </span>
                      <span className="text-xs text-slate-400">{percent}%</span>
                    </span>
                    <span className="mt-1.5 block h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <span
                        className={cn("block h-full rounded-full transition-all", section.barColor)}
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Main content */}
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-0">
            {/* General Tab */}
            <TabsContent value="general" className="p-6 space-y-6 m-0 bg-white dark:bg-slate-900">
              {/* Photo Section */}
              <Card className="border-2 border-slate-200 bg-slate-50 dark:bg-slate-800">
                <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-900 dark:text-slate-100">Staff Photo</CardTitle>
                      <CardDescription>Upload a photo URL or paste an image.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 bg-white dark:bg-slate-900">
                  <div className="flex items-end gap-6">
                    {/* Photo Preview */}
                    <div className="flex-shrink-0">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Staff preview"
                          className="w-24 h-24 rounded-lg object-cover shadow-md border border-slate-200"
                          onError={() => setPhotoPreview("")}
                        />
                      ) : (
                        <div
                          className="w-24 h-24 rounded-lg flex items-center justify-center text-2xl font-bold text-white shadow-md border border-slate-200"
                          style={{
                            background: form.firstName
                              ? `linear-gradient(135deg, ${avatarBg(selected?.id ?? "0")}, ${avatarBg(selected?.id ?? "0")}dd)`
                              : undefined,
                          }}
                        >
                          {form.firstName && form.lastName ? (
                            initials(form.firstName, form.lastName)
                          ) : (
                            <Camera size={24} className="text-slate-300" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Input */}
                    <div className="flex-1 rounded-lg p-4 bg-blue-50 dark:bg-blue-950/30">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Photo URL or Paste Image
                      </label>
                      <input
                        className={inputClasses}
                        value={form.photo || ""}
                        onChange={handlePhotoChange}
                        onPaste={handleImagePaste}
                        placeholder="Enter photo URL or paste an image"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Enter a URL or paste an image directly from clipboard
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card className="border-2 border-slate-200 bg-slate-50 dark:bg-slate-800">
                <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-900 dark:text-slate-100">Personal Information</CardTitle>
                      <CardDescription>Staff member's personal details.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 bg-white dark:bg-slate-900">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="First Name" required>
                      <input
                        className={inputClasses}
                        value={form.firstName}
                        onChange={(e) =>
                          onFieldChange("firstName", e.target.value)
                        }
                        placeholder="e.g. Jeremy"
                      />
                    </FormField>
                    <FormField label="Last Name" required>
                      <input
                        className={inputClasses}
                        value={form.lastName}
                        onChange={(e) =>
                          onFieldChange("lastName", e.target.value)
                        }
                        placeholder="e.g. Bravoge"
                      />
                    </FormField>
                    <FormField label="National ID" required>
                      <input
                        className={inputClasses}
                        value={form.idNumber}
                        onChange={(e) =>
                          onFieldChange("idNumber", e.target.value)
                        }
                        placeholder="e.g. ID001234567"
                      />
                    </FormField>
                    <FormField label="Gender" required>
                      <DD k="sex" opts={["Male", "Female"]} />
                    </FormField>
                    <FormField label="Date of Birth">
                      <input
                        className={inputClasses}
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) =>
                          onFieldChange("dateOfBirth", e.target.value)
                        }
                      />
                    </FormField>
                    <FormField label="Salary (KSh/month)">
                      <input
                        className={inputClasses}
                        type="number"
                        value={form.salary || ""}
                        onChange={(e) =>
                          onFieldChange("salary", Number(e.target.value) || 0)
                        }
                        placeholder="e.g. 45000"
                      />
                    </FormField>
                  </div>
                </CardContent>
              </Card>

              {/* Employment Details */}
              <Card className="border-2 border-slate-200 bg-slate-50 dark:bg-slate-800">
                <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-900 dark:text-slate-100">Employment Details</CardTitle>
                      <CardDescription>Role, branch and contract information.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 bg-white dark:bg-slate-900">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Staff Type" required>
                      <div className="relative">
                        <select
                          className={selectClasses}
                          value={String(form.staffType || "teaching")}
                          onChange={(e) =>
                            onFieldChange(
                              "staffType",
                              e.target.value as "teaching" | "non-teaching"
                            )
                          }
                        >
                          <option value="teaching">Teaching Staff</option>
                          <option value="non-teaching">Non-Teaching Staff</option>
                        </select>
                        <ChevronDown
                          size={16}
                          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                        />
                      </div>
                    </FormField>
                    <FormField label="Designation" required>
                      <DD k="designation" opts={DESIGNATIONS} placeholder="Select…" />
                    </FormField>
                    <FormField label="Job Status">
                      <DD k="jobStatus" opts={Object.keys(STATUS_CFG)} />
                    </FormField>
                    <FormField label="Branch" required>
                      <div className="relative">
                        <select
                          className={selectClasses}
                          value={form.branch || ""}
                          onChange={(e) =>
                            onFieldChange("branch", e.target.value as StaffMember["branch"])
                          }
                        >
                          <option value="">Select…</option>
                          {branchOptions.map((branchName) => (
                            <option key={branchName} value={branchName}>
                              {branchName}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={16}
                          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                        />
                      </div>
                    </FormField>
                    <FormField label="Hire Date">
                      <input
                        className={inputClasses}
                        type="date"
                        value={form.hireDate}
                        onChange={(e) =>
                          onFieldChange("hireDate", e.target.value)
                        }
                      />
                    </FormField>
                    <FormField label="Contract Start">
                      <input
                        className={inputClasses}
                        type="date"
                        value={form.contractStart}
                        onChange={(e) =>
                          onFieldChange("contractStart", e.target.value)
                        }
                      />
                    </FormField>
                    <FormField label="Contract End">
                      <input
                        className={inputClasses}
                        type="date"
                        value={form.contractEnd}
                        onChange={(e) =>
                          onFieldChange("contractEnd", e.target.value)
                        }
                      />
                    </FormField>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Teaching Tab */}
            <TabsContent value="teaching" className="p-6 space-y-6 m-0 bg-white dark:bg-slate-900">
              <Card className="border-2 border-slate-200 bg-slate-50 dark:bg-slate-800">
                <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-900 dark:text-slate-100">Teaching Details</CardTitle>
                      <CardDescription>TSC registration, subjects and qualifications.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6 bg-white dark:bg-slate-900">
                  {/* TSC Number */}
                  <FormField label="TSC Number">
                    <input
                      className={inputClasses}
                      value={form.tscNumber}
                      onChange={(e) =>
                        onFieldChange("tscNumber", e.target.value)
                      }
                      placeholder="e.g. TSC123456"
                    />
                  </FormField>

                  {/* Subjects */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Subjects Assigned (up to 4)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {slots.map((s, i) => (
                        <div key={i}>
                          <label className="text-xs text-slate-500 block mb-2">
                            Subject {i + 1}
                          </label>
                          <div className="relative">
                            <select
                              className={selectClasses}
                              value={s}
                              onChange={(e) => {
                                const ns = [...slots];
                                ns[i] = e.target.value;
                                onSlotsChange(ns);
                              }}
                            >
                              <option value="">— None —</option>
                              {ALL_SUBJECTS.map((sub) => (
                                <option key={sub}>{sub}</option>
                              ))}
                            </select>
                            <ChevronDown
                              size={16}
                              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Qualifications */}
                  <FormField label="Qualifications (comma separated)">
                    <input
                      className={inputClasses}
                      value={form.qualifications.join(", ")}
                      onChange={(e) =>
                        onFieldChange(
                          "qualifications",
                          e.target.value
                            .split(",")
                            .map((q) => q.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="e.g. B.Ed Mathematics, Diploma in Education"
                    />
                  </FormField>

                  {/* Qualification Tags */}
                  {form.qualifications && form.qualifications.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Added Qualifications
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {form.qualifications.map((qual, idx) => (
                          <Badge key={idx} variant="outline">
                            {qual}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="p-6 space-y-6 m-0 bg-white dark:bg-slate-900">
              <Card className="border-2 border-slate-200 bg-slate-50 dark:bg-slate-800">
                <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-900 dark:text-slate-100">Contact & Address</CardTitle>
                      <CardDescription>How to reach this staff member.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 bg-white dark:bg-slate-900">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Email" required>
                      <input
                        className={inputClasses}
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          onFieldChange("email", e.target.value)
                        }
                        placeholder="name@school.ac.ke"
                      />
                    </FormField>
                    <FormField label="Mobile" required>
                      <input
                        className={inputClasses}
                        value={form.mobilePhone}
                        onChange={(e) =>
                          onFieldChange("mobilePhone", e.target.value)
                        }
                        placeholder="+254712345678"
                      />
                    </FormField>
                    <FormField label="County">
                      <DD k="county" opts={COUNTIES} placeholder="Select county…" />
                    </FormField>
                    <FormField label="Location">
                      <input
                        className={inputClasses}
                        value={form.location}
                        onChange={(e) =>
                          onFieldChange("location", e.target.value)
                        }
                        placeholder="e.g. Mathare North"
                      />
                    </FormField>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </CardContent>
        </Card>

        {/* Right rail */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {/* Profile Preview */}
          <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6 text-center">
              {form.photo ? (
                <img
                  src={form.photo}
                  alt="Staff"
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3 shadow-md border border-slate-200"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold shadow-md border border-slate-200"
                  style={{
                    background: form.firstName
                      ? `linear-gradient(135deg, ${avatarBg(selected?.id ?? "0")}, ${avatarBg(selected?.id ?? "0")}dd)`
                      : undefined,
                    color: form.firstName ? "white" : undefined,
                  }}
                >
                  {form.firstName && form.lastName ? (
                    initials(form.firstName, form.lastName)
                  ) : (
                    <Users size={20} className="text-slate-400" />
                  )}
                </div>
              )}
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {form.firstName || "First"} {form.lastName || "Last"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {form.designation || "No designation"}
              </p>
              {form.jobStatus && (
                <div className="mt-3 flex justify-center">
                  <StatusBadge status={form.jobStatus} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completion Checklist */}
          <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center justify-between">
                <span>Form Completion</span>
                <span className="text-blue-600 font-bold">{completionPercent}%</span>
              </p>
              <Progress value={completionPercent} className="h-2" />
              <div className="space-y-2">
                {completionChecks.map(([label, done]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-xs text-slate-500">
                      {label}
                    </span>
                    {done ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Primary Action Center */}
          <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Primary Action Center</p>
              <Button
                type="button"
                onClick={onSave}
                className="w-full h-auto min-h-11 py-2.5 px-3 gap-2 whitespace-normal text-center leading-snug bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm"
              >
                <Save className="w-4 h-4 shrink-0" />
                <span>{selected ? "Save Changes" : "Register"}</span>
              </Button>
              {selected && onDiscard && (
                <Button
                  type="button"
                  onClick={onDiscard}
                  variant="outline"
                  className="w-full gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                  Discard Changes
                </Button>
              )}
              <Button
                type="button"
                onClick={onBack}
                variant="outline"
                className="w-full gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
                {selected ? "Cancel" : "Back"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Tabs>

      {toast && <Toast msg={toast} />}
    </div>
  );
};
