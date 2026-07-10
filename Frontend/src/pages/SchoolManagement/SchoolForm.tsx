// SchoolForm.jsx
import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Globe,
  Users,
  School,
  Hash,
  GraduationCap,
} from "lucide-react"

const LEVEL_LABELS = {
  ecde: "ECDE",
  primary: "Primary",
  junior_secondary: "Junior Secondary",
  senior_secondary: "Senior Secondary",
}

const LEVEL_OPTS = ["ecde", "primary", "junior_secondary", "senior_secondary"]
const TYPE_OPTS = ["public", "private"]

const FormSection = ({ title, icon: Icon, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="flex-1">
        <Separator className="flex-1" />
      </div>
    </div>
    <div className="pl-2">{children}</div>
  </div>
)

const FormField = ({ label, id, required, icon: Icon, children }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
      {Icon && <Icon className="h-3 w-3" />}
      {label}
      {required && <span className="text-destructive text-xs">*</span>}
    </Label>
    {children}
  </div>
)

export const SchoolForm = ({ form, setForm }) => {
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6 py-2">
      {/* Basic Information Section */}
      <FormSection title="Basic Information" icon={School}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="School Name" id="name" required icon={Building2}>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => upd("name", e.target.value)}
              placeholder="e.g. Greenfield Academy"
              className="bg-white dark:bg-slate-900"
            />
          </FormField>
          <FormField label="School Code" id="code" required icon={Hash}>
            <Input
              id="code"
              value={form.code}
              onChange={(e) => upd("code", e.target.value)}
              placeholder="e.g. GFA001"
              className="bg-white dark:bg-slate-900 font-mono text-sm"
            />
          </FormField>
          <FormField label="Education Level" id="level" icon={GraduationCap}>
            <Select value={form.level} onValueChange={(v) => upd("level", v)}>
              <SelectTrigger id="level" className="bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVEL_OPTS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {LEVEL_LABELS[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="School Type" id="school_type" icon={Building2}>
            <Select value={form.school_type} onValueChange={(v) => upd("school_type", v)}>
              <SelectTrigger id="school_type" className="bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </FormSection>

      {/* Location Section */}
      <FormSection title="Location Details" icon={MapPin}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="County" id="county">
            <Input
              id="county"
              value={form.county}
              onChange={(e) => upd("county", e.target.value)}
              placeholder="e.g. Nairobi"
              className="bg-white dark:bg-slate-900"
            />
          </FormField>
          <FormField label="Sub County" id="sub_county">
            <Input
              id="sub_county"
              value={form.sub_county}
              onChange={(e) => upd("sub_county", e.target.value)}
              placeholder="e.g. Westlands"
              className="bg-white dark:bg-slate-900"
            />
          </FormField>
          <FormField label="Ward" id="ward">
            <Input
              id="ward"
              value={form.ward}
              onChange={(e) => upd("ward", e.target.value)}
              placeholder="e.g. Parklands"
              className="bg-white dark:bg-slate-900"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField label="Physical Address" id="physical_address">
            <Input
              id="physical_address"
              value={form.physical_address}
              onChange={(e) => upd("physical_address", e.target.value)}
              placeholder="Street name, building number"
              className="bg-white dark:bg-slate-900"
            />
          </FormField>
          <FormField label="Postal Address" id="postal_address">
            <Input
              id="postal_address"
              value={form.postal_address}
              onChange={(e) => upd("postal_address", e.target.value)}
              placeholder="P.O. Box XXXX"
              className="bg-white dark:bg-slate-900"
            />
          </FormField>
        </div>
      </FormSection>

      {/* Contact Information Section */}
      <FormSection title="Contact Information" icon={Phone}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Phone Number" id="phone_number" icon={Phone}>
            <Input
              id="phone_number"
              value={form.phone_number}
              onChange={(e) => upd("phone_number", e.target.value)}
              placeholder="+254 XXX XXX XXX"
              className="bg-white dark:bg-slate-900"
            />
          </FormField>
          <FormField label="Contact Email" id="email" required icon={Mail}>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => upd("email", e.target.value)}
              placeholder="info@school.ac.ke"
              className="bg-white dark:bg-slate-900"
            />
          </FormField>
          <FormField label="Admin Full Name" id="admin_name" icon={Users}>
            <Input
              id="admin_name"
              value={form.admin_name}
              onChange={(e) => upd("admin_name", e.target.value)}
              placeholder="e.g. Jane Wanjiru"
              className="bg-white dark:bg-slate-900"
            />
          </FormField>
          <FormField label="Admin Email" id="admin_email" icon={Mail}>
            <Input
              id="admin_email"
              type="email"
              value={form.admin_email}
              onChange={(e) => upd("admin_email", e.target.value)}
              placeholder="admin@school.ac.ke"
              className="bg-white dark:bg-slate-900"
            />
          </FormField>
          <FormField label="Website" id="website" icon={Globe}>
            <Input
              id="website"
              value={form.website}
              onChange={(e) => upd("website", e.target.value)}
              placeholder="https://school.ac.ke"
              className="bg-white dark:bg-slate-900"
            />
          </FormField>
        </div>
      </FormSection>

      {/* Additional Info Section */}
      <FormSection title="Additional Information" icon={Calendar}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Year Established" id="year_established">
            <Input
              id="year_established"
              type="number"
              value={form.year_established}
              onChange={(e) => upd("year_established", e.target.value)}
              placeholder="e.g. 2000"
              className="bg-white dark:bg-slate-900"
            />
          </FormField>
          <FormField label="Student Capacity" id="student_capacity" icon={Users}>
            <Input
              id="student_capacity"
              type="number"
              value={form.student_capacity}
              onChange={(e) => upd("student_capacity", e.target.value)}
              placeholder="Max number of students"
              className="bg-white dark:bg-slate-900"
            />
          </FormField>
          <FormField label="School Motto" id="motto">
            <Input
              id="motto"
              value={form.motto}
              onChange={(e) => upd("motto", e.target.value)}
              placeholder="Your school motto"
              className="bg-white dark:bg-slate-900"
            />
          </FormField>
        </div>
      </FormSection>
    </div>
  )
}
