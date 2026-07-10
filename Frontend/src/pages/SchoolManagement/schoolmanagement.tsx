"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { SchoolForm } from "./SchoolForm"
import { PaymentModal } from "./PaymentModal"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  School,
  CheckCircle2,
  AlertCircle,
  Users,
  BookOpen,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Building2,
  ShieldCheck,
  GraduationCap,
  Download,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════════════════════
// DATA & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const INITIAL_SCHOOLS: any[] = [];


const LEVEL_LABELS = {
  ecde: "ECDE",
  primary: "Primary",
  junior_secondary: "Junior Secondary",
  senior_secondary: "Senior Secondary",
}

const SUBSCRIPTION_LABELS = {
  none: "No Plan",
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
}

const STATUS_LABELS = {
  active: "Active",
  no_subscription: "No Subscription",
  suspended: "Suspended",
}

const LEVEL_OPTS = ["ecde", "primary", "junior_secondary", "senior_secondary"]
const TYPE_OPTS = ["public", "private"]
const SUBSCRIPTION_OPTS = ["none", "basic", "standard", "premium"]
const STATUS_OPTS = ["active", "no_subscription", "suspended"]

const EMPTY_FORM = {
  name: "",
  code: "",
  level: "primary",
  school_type: "public",
  county: "",
  sub_county: "",
  ward: "",
  physical_address: "",
  postal_address: "",
  phone_number: "",
  email: "",
  admin_email: "",
  admin_name: "",
  website: "",
  year_established: "",
  student_capacity: "",
  motto: "",
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: "bg-green-50 text-green-700 border-green-200",
    no_subscription: "bg-blue-50 text-blue-700 border-blue-200",
    suspended: "bg-destructive/10 text-destructive border-destructive/20",
  }
  return map[status] || "bg-secondary text-secondary-foreground"
}

const getSubscriptionBadge = (sub: string) => {
  const map: Record<string, string> = {
    premium: "bg-purple-50 text-purple-700 border-purple-200",
    standard: "bg-primary/10 text-primary border-primary/20",
    basic: "bg-amber-50 text-amber-700 border-amber-200",
    none: "bg-gray-50 text-gray-600 border-gray-200",
  }
  return map[sub] || "bg-secondary text-secondary-foreground"
}

const getSchoolInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()

const getAvatarColor = (id: string) => {
  const colors: string[] = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-teal-100 text-teal-700",
  ]
  const idx = id.charCodeAt(0) % colors.length
  return colors[idx]
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium truncate">{value || "—"}</p>
    </div>
  </div>
)

const StatsCard = ({ title, value, type }: { title: string; value: number | string; type: "total" | "active" | "nosub" | "students" }) => {
  const config = {
    total: { 
      icon: School, 
      bgColor: "bg-blue-500", 
      textColor: "text-white",
      iconBg: "bg-white dark:bg-slate-900/20",
      iconColor: "text-white"
    },
    active: { 
      icon: CheckCircle2, 
      bgColor: "bg-green-500", 
      textColor: "text-white",
      iconBg: "bg-white dark:bg-slate-900/20",
      iconColor: "text-white"
    },
    nosub: { 
      icon: AlertCircle, 
      bgColor: "bg-amber-500", 
      textColor: "text-white",
      iconBg: "bg-white dark:bg-slate-900/20",
      iconColor: "text-white"
    },
    students: { 
      icon: GraduationCap, 
      bgColor: "bg-purple-500", 
      textColor: "text-white",
      iconBg: "bg-white dark:bg-slate-900/20",
      iconColor: "text-white"
    },
  }
  const { icon: Icon, bgColor, textColor, iconBg, iconColor } = config[type]
  return (
    <Card className={`overflow-hidden ${bgColor} shadow-lg hover:shadow-xl transition-shadow`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${textColor}/80 mb-1 font-medium`}>{title}</p>
            <p className={`text-2xl font-bold tracking-tight ${textColor}`}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
          <div className={`p-3 rounded-full ${iconBg} backdrop-blur-sm`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════


const SchoolManagement = () => {
  const { toast } = useToast()
  const [schools, setSchools] = useState<any[]>(INITIAL_SCHOOLS)

  // Load schools from backend
  React.useEffect(() => {
    refreshSchools()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshLearnerCountsForSchools = useCallback(async () => {
    try {
      const token = localStorage.getItem("cbe_access_token")
      if (!token) return

      // Fetch learner totals for each school in parallel
      const totals = await Promise.all(
        schools.map(async (school) => {
          try {
            const res = await fetch(`/api/v1/schools/${school.id}/learners`, {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            })
            const data = await res.json()
            if (!data?.success) return { id: school.id, total: 0 }
            return { id: school.id, total: data?.data?.total || 0 }
          } catch {
            return { id: school.id, total: 0 }
          }
        })
      )

      setSchools((prev) =>
        prev.map((s) => {
          const t = totals.find((x) => x.id === s.id)
          return {
            ...s,
            students: t?.total ?? 0,
          }
        })
      )
    } catch {
      // ignore learner count failures
    }
  }, [schools])

  // After schools are loaded, fetch learner totals for each school
  React.useEffect(() => {
    if (!schools.length) return
    refreshLearnerCountsForSchools()
  }, [schools, refreshLearnerCountsForSchools])




  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [viewSchool, setViewSchool] = useState<any | null>(null)
  const [editSchool, setEditSchool] = useState<any | null>(null)
  const [deleteSchool, setDeleteSchool] = useState<any | null>(null)
  const [addForm, setAddForm] = useState<any>({ ...EMPTY_FORM })
  const [editForm, setEditForm] = useState<any>({ ...EMPTY_FORM })

  // Learners count for the selected school (drives Students total in modal)
  const [viewSchoolLearnersTotal, setViewSchoolLearnersTotal] = useState<number>(0)


  const refreshSchools = useCallback(async () => {
    try {
      const token = localStorage.getItem("cbe_access_token")
      const res = await fetch("/api/v1/schools", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!data?.success) throw new Error(data?.message || "Failed to refresh schools")
      setSchools(data?.data?.schools || [])
    } catch (e: any) {
      setError(e?.message || "Failed to refresh schools")
    }
  }, [])

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentSchool, setPaymentSchool] = useState(null)

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: schools.length,
      active: schools.filter((s) => s.status === "active").length,
      noSub: schools.filter((s) => s.status === "no_subscription").length,
      students: schools.reduce((a, s) => a + (parseInt(String(s.students)) || 0), 0),
    }),
    [schools]
  )


  // ── Filtered ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return schools.filter((s) => {
      const matchSearch =
        !term ||
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term) ||
        s.county.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term)
      const matchLevel = levelFilter === "all" || s.level === levelFilter
      const matchStatus = statusFilter === "all" || s.status === statusFilter
      return matchSearch && matchLevel && matchStatus
    })
  }, [schools, searchTerm, levelFilter, statusFilter])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAddSchool = useCallback(async (schoolData: any) => {
    if (!schoolData.name.trim() || !schoolData.code.trim() || !schoolData.email.trim()) return

    try {
      const response = await fetch("/api/v1/schools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cbe_access_token")}`,
        },
        body: JSON.stringify({
          name: schoolData.name,
          code: schoolData.code,
          level: schoolData.level,
          type: schoolData.school_type,
          county: schoolData.county,
          sub_county: schoolData.sub_county,
          ward: schoolData.ward,
          address: schoolData.physical_address,
          postal_address: schoolData.postal_address,
          phone: schoolData.phone_number,
          email: schoolData.email,
          admin_email: schoolData.admin_email,
          admin_name: schoolData.admin_name,
          website: schoolData.website,
          year_established: schoolData.year_established,
          student_capacity: schoolData.student_capacity,
          motto: schoolData.motto,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        console.error("Failed to create school:", data.message)
        return
      }

      const newSchool = {
        ...data.data,
        id: data.data.id || Date.now().toString(16),
        type: data.data.type || schoolData.school_type,
        school_type: schoolData.school_type,
        subscription: data.data.subscription_plan || "none",
        subscription_plan: data.data.subscription_plan || "basic",
        address: data.data.address || schoolData.physical_address,
        postalAddress: data.data.postal_address || schoolData.postal_address,
        physical_address: data.data.address || schoolData.physical_address,
        phone: data.data.phone || schoolData.phone_number,
        phone_number: data.data.phone || schoolData.phone_number,
        adminEmail: data.data.admin_email || schoolData.admin_email,
        admin_email: data.data.admin_email || schoolData.admin_email,
        status: "pending_payment",
        paymentStatus: "pending",
      }

      setSchools((prev) => [newSchool, ...prev])
      setAddOpen(false)
      setAddForm({ ...EMPTY_FORM })

      if (schoolData.admin_email) {
        if (data.data.admin_account_created && data.data.admin_email_sent) {
          toast({
            title: "School created",
            description: `An admin account was created and login details were emailed to ${schoolData.admin_email}.`,
          })
        } else if (data.data.admin_account_created && !data.data.admin_email_sent) {
          toast({
            title: "Admin account created — email not sent",
            description: `The account for ${schoolData.admin_email} was created, but the welcome email failed to send. Check email server settings and resend manually.`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "School created — admin account not set up",
            description: `${schoolData.admin_email} may already have an account, or setup failed. Check School Management for details.`,
            variant: "destructive",
          })
        }
      }

      setPaymentSchool(newSchool)
      setPaymentOpen(true)
    } catch (error) {
      console.error("Failed to create school:", error)
    }
  }, [])

  const handlePaymentComplete = useCallback((schoolId: string, paymentDetails: any) => {
    setSchools((prev) =>
      prev.map((s) =>
        s.id === schoolId
          ? {
              ...s,
              status: "active",
              subscriptionStatus: "active",
              paymentDate: new Date().toISOString(),
              transactionId: paymentDetails?.transactionId,
              billingCycle: paymentDetails?.billingCycle,
            }
          : s
      )
    )

    setPaymentOpen(false)
    setPaymentSchool(null)
    console.log(`Payment completed for school ${schoolId}`, paymentDetails)
  }, [])

  const handleEdit = useCallback(async () => {
    if (!editSchool) return
    try {
      const token = localStorage.getItem("cbe_access_token")
      if (!token) throw new Error("Session expired. Please login again.")

      const response = await fetch(`/api/v1/schools/${editSchool.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          code: editForm.code,
          level: editForm.level,
          school_type: editForm.school_type,
          county: editForm.county,
          sub_county: editForm.sub_county,
          ward: editForm.ward,
          physical_address: editForm.physical_address,
          postal_address: editForm.postal_address,
          phone_number: editForm.phone_number,
          email: editForm.email,
          admin_email: editForm.admin_email,
          website: editForm.website,
          year_established: editForm.year_established,
          student_capacity: editForm.student_capacity,
          motto: editForm.motto,
        }),
      })
      const data = await response.json()
      if (!data?.success) throw new Error(data?.message || "Failed to update school")

      // Refresh list for consistency with backend schema
      await refreshSchools()

      // Open payment when appropriate (backend subscription_plan/subscription_status)
      const updatedFromBackend = data?.data
      const prevStatus = editSchool.status
      const shouldOpenPayment =
        prevStatus === "no_subscription" &&
        (updatedFromBackend?.subscription_plan && updatedFromBackend.subscription_plan !== "none")

      if (shouldOpenPayment) {
        const paymentReadySchool = {
          ...updatedFromBackend,
          status: "pending_payment",
          paymentStatus: "pending",
        }
        setPaymentSchool(paymentReadySchool)
        setPaymentOpen(true)
      }

      setEditSchool(null)
    } catch (e: any) {
      setError(e?.message || "Failed to update school")
      console.error(e)
    }
  }, [editSchool, editForm, refreshSchools])




  const handleDelete = useCallback(async () => {
    if (!deleteSchool) return
    try {
      const token = localStorage.getItem("cbe_access_token")
      if (!token) throw new Error("Session expired. Please login again.")
      const response = await fetch(`/api/v1/schools/${deleteSchool.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      if (!data?.success) throw new Error(data?.message || "Failed to delete school")
      await refreshSchools()
    } catch (e: any) {
      setError(e?.message || "Failed to delete school")
      console.error(e)
    } finally {
      setDeleteSchool(null)
    }
  }, [deleteSchool, refreshSchools])


  const openEdit = useCallback((school) => {
    setEditForm({
      name: school.name,
      code: school.code,
      level: school.level,
      school_type: school.type || school.school_type || "public",
      county: school.county,
      sub_county: school.subCounty || school.sub_county || "",
      ward: school.ward,
      physical_address: school.address || school.physical_address || "",
      postal_address: school.postalAddress || school.postal_address || "",
      phone_number: school.phone || school.phone_number || "",
      email: school.email,
      admin_email: school.adminEmail || school.admin_email || "",
      website: school.website || "",
      year_established: school.year_established || "",
      student_capacity: school.student_capacity || "",
      motto: school.motto || "",
    })
    setEditSchool(school)
  }, [])

  const openViewSchool = useCallback(async (school: any) => {
    setViewSchool(school)
    setViewSchoolLearnersTotal(0)

    try {
      const token = localStorage.getItem("cbe_access_token")
      if (!token) return

      const res = await fetch(`/api/v1/schools/${school.id}/learners`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()
      if (!data?.success) return

      setViewSchoolLearnersTotal(data?.data?.total || 0)
    } catch {
      // ignore: modal will show 0 until it loads
    }
  }, [])


  const handleExport = useCallback(() => {
    const exportData = filtered.map((school) => ({
      'School Name': school.name,
      'School Code': school.code,
      Level: LEVEL_LABELS[school.level],
      Type: school.type.charAt(0).toUpperCase() + school.type.slice(1),
      Status: STATUS_LABELS[school.status],
      Subscription: SUBSCRIPTION_LABELS[school.subscription],
      Students: parseInt(String(school.students)) || 0,
      'Payment Due (KES)': parseInt(String(school.paymentDue)) || 0,
      County: school.county,
      'Sub County': school.subCounty,
      Ward: school.ward,
      Phone: school.phone,
      Email: school.email,
      'Admin Email': school.adminEmail,
      'Created Date': school.createdAt,
      'Registered Date': school.registeredDate,
      Website: school.website || 'N/A',
      'Physical Address': school.address || 'N/A',
      'Postal Address': school.postalAddress || 'N/A',
    }))

    const headers = Object.keys(exportData[0] || {})
    const csvRows = []
    csvRows.push(headers.join(','))
    for (const row of exportData) {
      const values = headers.map((header) => {
        const value = row[header]
        const escaped = String(value).replace(/"/g, '""')
        return `"${escaped}"`
      })
      csvRows.push(values.join(','))
    }

    const csvString = csvRows.join('\n')
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `schools_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [filtered])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-6 p-2 bg-white dark:bg-slate-900">
      {/* Stats Cards with Solid Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard title="Total Schools" value={stats.total} type="total" />
        <StatsCard title="Active Schools" value={stats.active} type="active" />
        <StatsCard title="No Subscription" value={stats.noSub} type="nosub" />
        <StatsCard title="Total Students" value={stats.students} type="students" />
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-1 gap-3 flex-wrap min-w-0">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, county, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[160px] flex-shrink-0 bg-white dark:bg-slate-900">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {LEVEL_OPTS.map((l) => (
                <SelectItem key={l} value={l}>
                  {LEVEL_LABELS[l]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] flex-shrink-0 bg-white dark:bg-slate-900">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-sm text-muted-foreground self-center flex-shrink-0">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </TooltipTrigger>
      <TooltipContent>Export school data to CSV</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                    setSearchTerm("")
                    setLevelFilter("all")
                    setStatusFilter("all")
                  }}>
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset all filters</TooltipContent>
              </Tooltip>

              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add School</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>


      {/* Table */}
      <Card className="w-full overflow-hidden shadow-sm border border-gray-100">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead className="font-semibold">School</TableHead>
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Level</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Students</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No schools found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((school) => (
                    <TableRow key={school.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-9 w-9 flex-shrink-0 shadow-sm">
                            <AvatarFallback className={`text-sm font-semibold ${getAvatarColor(school.id)}`}>
                              {getSchoolInitials(school.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[180px]">{school.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {school.county} · {school.subCounty}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-2 rounded-md font-mono">{school.code}</code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{LEVEL_LABELS[school.level]}</p>
                          <p className="text-xs text-muted-foreground capitalize">{school.type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusBadge(school.status)} px-2 py-0.5`}>
                          {STATUS_LABELS[school.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{parseInt(String(school.students)) || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openViewSchool(school)}>
                                <Eye className="h-4 w-4 text-blue-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(school)}>
                                <Edit className="h-4 w-4 text-amber-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit School</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteSchool(school)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete School</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination hint */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {schools.length} schools
          </p>
        </div>
      )}

      {/* ── ADD DIALOG ───────────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New School</DialogTitle>
            <DialogDescription>Register a new school into the system. Fill in the details below.</DialogDescription>
          </DialogHeader>
          <SchoolForm form={addForm} setForm={setAddForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleAddSchool(addForm)} disabled={!addForm.name || !addForm.code || !addForm.email}>
              Continue to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── VIEW DIALOG ──────────────────────────────────────────────────────── */}
      <Dialog open={!!viewSchool} onOpenChange={() => setViewSchool(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-bold">School Details</DialogTitle>
          </DialogHeader>
          {viewSchool && (
            <div className="px-6 pb-6 space-y-1">
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="h-14 w-14 flex-shrink-0 shadow-md">
                  <AvatarFallback className={`font-semibold text-lg ${getAvatarColor(viewSchool.id)}`}>
                    {getSchoolInitials(viewSchool.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-xl truncate">{viewSchool.name}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className={getStatusBadge(viewSchool.status)}>
                      {STATUS_LABELS[viewSchool.status]}
                    </Badge>
                    <Badge variant="outline" className={getSubscriptionBadge(viewSchool.subscription)}>
                      {SUBSCRIPTION_LABELS[viewSchool.subscription]}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1 mt-4">
                <DetailRow icon={BookOpen} label="School Code" value={viewSchool.code} />
                <DetailRow icon={GraduationCap} label="Level" value={LEVEL_LABELS[viewSchool.level]} />
                <DetailRow icon={Building2} label="Type" value={viewSchool.type.charAt(0).toUpperCase() + viewSchool.type.slice(1)} />
                <DetailRow icon={MapPin} label="Location" value={`${viewSchool.ward}, ${viewSchool.subCounty}, ${viewSchool.county}`} />
                <DetailRow icon={MapPin} label="Physical Address" value={viewSchool.address} />
                <DetailRow icon={MapPin} label="Postal Address" value={viewSchool.postalAddress} />
                <Separator className="my-2" />
                <DetailRow icon={Phone} label="Phone" value={viewSchool.phone} />
                <DetailRow icon={Mail} label="Contact Email" value={viewSchool.email} />
                <DetailRow icon={Mail} label="Admin Email" value={viewSchool.adminEmail} />
                {viewSchool.website && <DetailRow icon={ShieldCheck} label="Website" value={viewSchool.website} />}
                <Separator className="my-2" />
                <DetailRow icon={Users} label="Students" value={(viewSchoolLearnersTotal || 0).toString()} />
                <DetailRow
                  icon={CreditCard}
                  label="Payment Due"
                  value={`KES ${(parseInt(String(viewSchool.paymentDue)) || 0).toLocaleString()}`}
                />
                <DetailRow icon={Calendar} label="Created On" value={viewSchool.createdAt} />
                <DetailRow icon={Calendar} label="Registered Date" value={viewSchool.registeredDate} />
              </div>
            </div>
          )}
          <DialogFooter className="p-6 pt-0">
            <Button variant="outline" onClick={() => setViewSchool(null)}>Close</Button>
            <Button onClick={() => { setViewSchool(null); openEdit(viewSchool); }}>
              <Edit className="h-4 w-4 mr-2" /> Edit School
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT DIALOG ──────────────────────────────────────────────────────── */}
      <Dialog open={!!editSchool} onOpenChange={() => setEditSchool(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit School</DialogTitle>
            <DialogDescription>Update school information. All changes will be saved.</DialogDescription>
          </DialogHeader>
          <SchoolForm form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSchool(null)}>Cancel</Button>
            <Button onClick={handleEdit}>
              {editSchool?.status === "no_subscription" ? "Save and Proceed to Payment" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE DIALOG ────────────────────────────────────────────────────── */}
      <Dialog open={!!deleteSchool} onOpenChange={() => setDeleteSchool(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Delete School</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong className="text-foreground">{deleteSchool?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSchool(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PAYMENT MODAL ────────────────────────────────────────────────────── */}
      <PaymentModal
        school={paymentSchool}
        open={paymentOpen}
        onClose={() => {
          setPaymentOpen(false)
          setPaymentSchool(null)
        }}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  )
}

export default SchoolManagement
