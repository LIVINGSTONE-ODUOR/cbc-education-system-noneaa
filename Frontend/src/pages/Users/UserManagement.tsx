import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Edit,
  Lock,
  Unlock,
  Users,
  UserCheck,
  UserX,
  Crown,
  School,
  CheckCircle2,
  KeyRound,
  Smartphone,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Shield,
  Activity,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface SystemUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  role: "super_admin" | "school_admin" | "teacher" | "parent" | "student";
  status: string;
  is_active: boolean;
  email_verified: boolean;
  two_factor_enabled: boolean;
  last_login: string | null;
  login_attempts: number;
  locked_until: string | null;
  active_sessions: number;
  max_sessions: number;
  school_id: string | null;
  school_name?: string | null;
  created_at: string;
  updated_at?: string;
  password_reset_required?: boolean;
}

interface SchoolOption {
  id: string;
  name: string;
}

interface UserStats {
  total_users: number;
  super_admins: number;
  school_admins: number;
  active_users: number;
  locked_users: number;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface AddUserForm {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: string;
  school_id: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  max_sessions: number;
  is_active: boolean;
}

// ══════════════════════════════════════════════════════���════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const API_URL = (import.meta.env.VITE_API_URL || "")
  .replace(/\/api(?:\/v1)?\/?$/, "")
  .replace(/\/+$/, "");

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  school_admin: "School Admin",
  teacher: "Teacher",
  parent: "Parent",
  student: "Student",
};

const ROLE_BADGE_CLASSES: Record<string, string> = {
  super_admin: "bg-destructive/10 text-destructive border-destructive/20",
  school_admin: "bg-primary/10 text-primary border-primary/20",
  teacher: "bg-accent/80 text-accent-foreground border-accent",
  parent: "bg-secondary text-secondary-foreground border-secondary",
  student: "bg-blue-100 text-blue-800 border-blue-200",
};

const EMPTY_FORM: AddUserForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  role: "teacher",
  school_id: "",
  email_verified: false,
  two_factor_enabled: false,
  max_sessions: 5,
  is_active: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<any>> => {
  const token = localStorage.getItem("cbe_access_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
};

const getUserStatus = (
  user: SystemUser
): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
  const now = new Date();
  if (user.locked_until && new Date(user.locked_until) > now) {
    return { label: "Locked", variant: "destructive" };
  }
  if (!user.is_active) {
    return { label: "Inactive", variant: "secondary" };
  }
  if (!user.email_verified) {
    return { label: "Email Not Verified", variant: "outline" };
  }
  return { label: "Active", variant: "default" };
};

const isLocked = (user: SystemUser): boolean => {
  return (
    !!user.locked_until && new Date(user.locked_until) > new Date()
  );
};

const getDefaultMaxSessions = (role: string): number => {
  return role === "super_admin" ? 10 : 5;
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const DetailRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  </div>
);

interface RoleSchoolFieldsProps {
  form: AddUserForm;
  setForm: (f: AddUserForm) => void;
  availableRoles: string[];
  schools: SchoolOption[];
  currentUserRole: string;
  isEdit?: boolean;
}

const RoleSchoolFields: React.FC<RoleSchoolFieldsProps> = ({
  form,
  setForm,
  availableRoles,
  schools,
  currentUserRole,
  isEdit,
}) => (
  <>
    <div className="space-y-2">
      <Label htmlFor="role">
        Role <span className="text-destructive">*</span>
      </Label>
      <Select
        value={form.role}
        onValueChange={(v) =>
          setForm({
            ...form,
            role: v,
            max_sessions: getDefaultMaxSessions(v),
            school_id: v === "super_admin" ? "" : form.school_id,
          })
        }
      >
        <SelectTrigger id="role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((r) => (
            <SelectItem key={r} value={r}>
              {ROLE_LABELS[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {form.role !== "super_admin" && currentUserRole === "super_admin" && (
      <div className="space-y-2">
        <Label htmlFor="school">School</Label>
        <Select value={form.school_id} onValueChange={(v) => setForm({ ...form, school_id: v })}>
          <SelectTrigger id="school">
            <SelectValue placeholder="Select school" />
          </SelectTrigger>
          <SelectContent>
            {schools.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )}

    {form.role !== "super_admin" && currentUserRole === "school_admin" && (
      <div className="space-y-2">
        <Label htmlFor="school-display">School</Label>
        <Input
          id="school-display"
          value="Auto-assigned (your school)"
          disabled
          className="bg-muted/50"
        />
      </div>
    )}
  </>
);

interface StatsCardProps {
  title: string;
  value: number;
  type: "total" | "super_admin" | "school_admin" | "active" | "locked";
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, type }) => {
  const iconMap: Record<StatsCardProps["type"], React.ElementType> = {
    total: Users,
    super_admin: Crown,
    school_admin: School,
    active: UserCheck,
    locked: Lock,
  };

  const Icon = iconMap[type];
  const colorMap: Record<StatsCardProps["type"], string> = {
    total: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
    super_admin: "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400",
    school_admin: "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400",
    active: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400",
    locked: "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400",
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorMap[type]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ────────────────────���────────────────────────────────────────────────────

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  const [addOpen, setAddOpen] = useState(false);
  const [viewUser, setViewUser] = useState<SystemUser | null>(null);
  const [editUser, setEditUser] = useState<SystemUser | null>(null);
  const [addForm, setAddForm] = useState<AddUserForm>({ ...EMPTY_FORM });
  const [editForm, setEditForm] = useState<AddUserForm>({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentUserRole = (currentUser?.role as string) || "super_admin";
  const currentUserSchoolId = (currentUser?.schoolId as string) || null;

  // ─────────────────────────────────────────────────────────────────────────
  // QUERIES
  // ─────────────────────────────────────────────────────────────────────────

  const { data: usersData, isLoading, refetch } = useQuery<
    PaginatedResponse<SystemUser>
  >({
    queryKey: ["system-users", page, limit, roleFilter, statusFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      const result = await fetchWithAuth(
        `${API_URL}/api/v1/users?${params}`
      );
      return result;
    },
    staleTime: 30000,
  });

  const { data: statsData } = useQuery<UserStats>({
    queryKey: ["system-users-stats"],
    queryFn: async () => {
      const result = await fetchWithAuth(`${API_URL}/api/v1/users/stats/summary`);
      return result.data || {
        total_users: 0,
        super_admins: 0,
        school_admins: 0,
        active_users: 0,
        locked_users: 0,
      };
    },
    staleTime: 30000,
  });

  const { data: schoolsData } = useQuery<{ success: boolean; data: SchoolOption[] }>({
    queryKey: ["schools-list"],
    queryFn: async () => {
      const result = await fetchWithAuth(`${API_URL}/api/v1/schools`);
      return result;
    },
    enabled: currentUserRole === "super_admin",
  });

  // ─────────────────────────────────────────────────────────────────────────
  // MUTATIONS
  // ─────────────────────────────────────────────────────────────────────────

  const createUserMutation = useMutation({
    mutationFn: async (userData: AddUserForm) => {
      const schoolId =
        userData.role === "super_admin"
          ? null
          : currentUserRole === "school_admin"
          ? currentUserSchoolId
          : userData.school_id || null;

      return fetchWithAuth(`${API_URL}/api/users`, {
        method: "POST",
        body: JSON.stringify({
          first_name: userData.first_name.trim(),
          last_name: userData.last_name.trim(),
          email: userData.email.trim(),
          phone_number: userData.phone_number.trim() || null,
          role: userData.role,
          school_id: schoolId,
        }),
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("✓ User added successfully. Invite email will be sent.", {
          icon: <CheckCircle2 className="h-4 w-4" />,
        });
        setAddOpen(false);
        setAddForm({ ...EMPTY_FORM });
        setShowAdvanced(false);
        queryClient.invalidateQueries({ queryKey: ["system-users"] });
        queryClient.invalidateQueries({ queryKey: ["system-users-stats"] });
      } else {
        toast.error(data.message || "Failed to add user", {
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add user", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: Partial<AddUserForm> }) => {
      const schoolId =
        userData.role === "super_admin"
          ? null
          : currentUserRole === "school_admin"
          ? currentUserSchoolId
          : userData.school_id || null;

      return fetchWithAuth(`${API_URL}/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          first_name: userData.first_name?.trim(),
          last_name: userData.last_name?.trim(),
          phone_number: userData.phone_number?.trim() || null,
          role: userData.role,
          school_id: schoolId,
          is_active: userData.is_active,
        }),
      });
    },
    onSuccess: () => {
      toast.success("✓ User updated successfully", {
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ["system-users"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update user", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return fetchWithAuth(`${API_URL}/api/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: isActive }),
      });
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success(
          variables.isActive ? "✓ User activated" : "✓ User deactivated",
          { icon: <CheckCircle2 className="h-4 w-4" /> }
        );
        queryClient.invalidateQueries({ queryKey: ["system-users"] });
        queryClient.invalidateQueries({ queryKey: ["system-users-stats"] });
      } else {
        toast.error(data.message || "Failed to update status", {
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchWithAuth(`${API_URL}/api/users/${id}/unlock`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast.success("✓ User unlocked", { icon: <CheckCircle2 className="h-4 w-4" /> });
      queryClient.invalidateQueries({ queryKey: ["system-users"] });
      queryClient.invalidateQueries({ queryKey: ["system-users-stats"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to unlock", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchWithAuth(`${API_URL}/api/users/${id}/reset-password`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast.success("✓ Password reset email sent", {
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reset password", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchWithAuth(`${API_URL}/api/users/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast.success("✓ User deleted", { icon: <CheckCircle2 className="h-4 w-4" /> });
      queryClient.invalidateQueries({ queryKey: ["system-users"] });
      queryClient.invalidateQueries({ queryKey: ["system-users-stats"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete user", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ─────────────────────────────────────────────────────────────────────────

  const users = usersData?.data || [];
  const schools = schoolsData?.data || [];

  const stats = useMemo(
    () => ({
      total: statsData?.total_users || 0,
      superAdmins: statsData?.super_admins || 0,
      schoolAdmins: statsData?.school_admins || 0,
      active: statsData?.active_users || 0,
      locked: statsData?.locked_users || 0,
    }),
    [statsData]
  );

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        u.first_name.toLowerCase().includes(term) ||
        u.last_name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);

      const matchesRole = roleFilter === "all" || u.role === roleFilter;

      let matchesStatus = true;
      if (statusFilter !== "all") {
        const s = getUserStatus(u);
        const map: Record<string, string> = {
          active: "Active",
          locked: "Locked",
          inactive: "Inactive",
          not_verified: "Email Not Verified",
        };
        matchesStatus = s.label === map[statusFilter];
      }

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const availableRoles =
    currentUserRole === "school_admin"
      ? ["school_admin", "teacher", "parent"]
      : ["super_admin", "school_admin", "teacher", "parent", "student"];

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handleAddUser = useCallback(async () => {
    if (!addForm.first_name.trim() || !addForm.last_name.trim() || !addForm.email.trim()) {
      toast.error("First name, last name, and email are required", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }
    setSubmitting(true);
    createUserMutation.mutate(addForm);
    setSubmitting(false);
  }, [addForm, createUserMutation]);

  const handleEditUser = useCallback(async () => {
    if (!editUser) return;
    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      toast.error("First name and last name are required", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }
    setSubmitting(true);
    updateUserMutation.mutate({ id: editUser.id, userData: editForm });
    setSubmitting(false);
  }, [editUser, editForm, updateUserMutation]);

  const handleToggleActive = useCallback((user: SystemUser) => {
    toggleActiveMutation.mutate({ id: user.id, isActive: !user.is_active });
  }, [toggleActiveMutation]);

  const handleUnlock = useCallback((user: SystemUser) => {
    unlockMutation.mutate(user.id);
  }, [unlockMutation]);

  const handleResetPassword = useCallback((user: SystemUser) => {
    resetPasswordMutation.mutate(user.id);
  }, [resetPasswordMutation]);

  const handleDelete = useCallback((user: SystemUser) => {
    if (window.confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  }, [deleteUserMutation]);

  const openEdit = useCallback((user: SystemUser) => {
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number || "",
      role: user.role,
      school_id: user.school_id || "",
      email_verified: user.email_verified,
      two_factor_enabled: user.two_factor_enabled,
      max_sessions: user.max_sessions,
      is_active: user.is_active,
    });
    setEditUser(user);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total Users" value={stats.total} type="total" />
        <StatsCard title="Super Admins" value={stats.superAdmins} type="super_admin" />
        <StatsCard title="School Admins" value={stats.schoolAdmins} type="school_admin" />
        <StatsCard title="Active Users" value={stats.active} type="active" />
        <StatsCard title="Locked Users" value={stats.locked} type="locked" />
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-3 flex-wrap min-w-0">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}>
            <SelectTrigger className="w-[160px] flex-shrink-0">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="school_admin">School Admin</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}>
            <SelectTrigger className="w-[160px] flex-shrink-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="not_verified">Not Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh user list</TooltipContent>
          </Tooltip>

          <Button
            size="sm"
            onClick={() => {
              setAddForm({ ...EMPTY_FORM });
              setShowAdvanced(false);
              setAddOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card className="w-full overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="flex-shrink-0">User</TableHead>
                  <TableHead className="flex-shrink-0">Email</TableHead>
                  <TableHead className="flex-shrink-0">Role</TableHead>
                  <TableHead className="flex-shrink-0">School</TableHead>
                  <TableHead className="flex-shrink-0">Status</TableHead>
                  <TableHead className="flex-shrink-0">Last Login</TableHead>
                  <TableHead className="flex-shrink-0">Sessions</TableHead>
                  <TableHead className="text-right flex-shrink-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <p className="text-muted-foreground">Loading users...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((user) => {
                    const status = getUserStatus(user);
                    const locked = isLocked(user);

                    return (
                      <TableRow key={user.id} className={locked ? "bg-destructive/5" : ""}>
                        {/* User Name */}
                        <TableCell className="flex-shrink-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-9 w-9 flex-shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                                {user.first_name?.[0]}
                                {user.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-medium truncate">
                                {user.first_name} {user.last_name}
                              </span>
                              {locked && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Lock className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent>Account Locked</TooltipContent>
                                </Tooltip>
                              )}
                              {user.email_verified && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent>Email Verified</TooltipContent>
                                </Tooltip>
                              )}
                              {user.two_factor_enabled && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Smartphone className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent>2FA Enabled</TooltipContent>
                                </Tooltip>
                              )}
                              {user.login_attempts > 3 && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex-shrink-0">
                                      {user.login_attempts}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Failed login attempts: {user.login_attempts}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="text-muted-foreground truncate flex-shrink-0">
                          {user.email}
                        </TableCell>

                        {/* Role */}
                        <TableCell className="flex-shrink-0">
                          <Badge
                            variant="outline"
                            className={ROLE_BADGE_CLASSES[user.role]}
                          >
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </TableCell>

                        {/* School */}
                        <TableCell className="flex-shrink-0">
                          {user.school_name ? (
                            <span className="text-sm">{user.school_name}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Platform Level
                            </span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="flex-shrink-0">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>

                        {/* Last Login */}
                        <TableCell className="text-sm text-muted-foreground flex-shrink-0 whitespace-nowrap">
                          {user.last_login ? (
                            format(new Date(user.last_login), "MMM d, HH:mm")
                          ) : (
                            <span className="italic text-xs">Never</span>
                          )}
                        </TableCell>

                        {/* Sessions */}
                        <TableCell className="flex-shrink-0">
                          <span className="text-sm font-mono">
                            {user.active_sessions}/{user.max_sessions}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right flex-shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewUser(user)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                                {user.is_active ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                <KeyRound className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              {locked && (
                                <DropdownMenuItem onClick={() => handleUnlock(user)}>
                                  <Unlock className="h-4 w-4 mr-2" />
                                  Unlock
                                </DropdownMenuItem>
                              )}
                              {currentUserRole === "super_admin" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(user)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {usersData?.pagination?.total || 0} users
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= (usersData?.pagination?.pages || 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ADD USER DIALOG */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. An invite email will be sent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-first-name">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-first-name"
                  value={addForm.first_name}
                  onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-last-name">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-last-name"
                  value={addForm.last_name}
                  onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="john@school.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-phone">Phone Number</Label>
              <Input
                id="add-phone"
                value={addForm.phone_number}
                onChange={(e) => setAddForm({ ...addForm, phone_number: e.target.value })}
                placeholder="+254 7XX XXX XXX"
              />
            </div>

            <Separator />
            <RoleSchoolFields
              form={addForm}
              setForm={setAddForm}
              availableRoles={availableRoles}
              schools={schools}
              currentUserRole={currentUserRole}
            />

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="add-status">Account Status</Label>
              <Select
                value={addForm.is_active ? "active" : "inactive"}
                onValueChange={(v) =>
                  setAddForm({ ...addForm, is_active: v === "active" })
                }
              >
                <SelectTrigger id="add-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Security Settings */}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground w-full justify-start"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Shield className="h-4 w-4 mr-2" />
              {showAdvanced ? "Hide" : "Show"} Security Settings
            </Button>

            {showAdvanced && (
              <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="add-email-verified"
                    checked={addForm.email_verified}
                    onCheckedChange={(c) =>
                      setAddForm({ ...addForm, email_verified: !!c })
                    }
                  />
                  <Label htmlFor="add-email-verified" className="text-sm font-normal">
                    Email Verified
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="add-2fa"
                    checked={addForm.two_factor_enabled}
                    onCheckedChange={(c) =>
                      setAddForm({ ...addForm, two_factor_enabled: !!c })
                    }
                  />
                  <Label htmlFor="add-2fa" className="text-sm font-normal">
                    Enable 2FA
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-max-sessions" className="text-sm">
                    Max Sessions
                  </Label>
                  <Input
                    id="add-max-sessions"
                    type="number"
                    min={1}
                    max={20}
                    value={addForm.max_sessions}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        max_sessions: parseInt(e.target.value) || 5,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={submitting || createUserMutation.isPending}
              className="gap-2"
            >
              {createUserMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {createUserMutation.isPending ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW USER DIALOG */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>

          {viewUser && (
            <div className="space-y-1">
              <div className="flex items-center gap-3 pb-4">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {viewUser.first_name?.[0]}
                    {viewUser.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-lg truncate">
                    {viewUser.first_name} {viewUser.last_name}
                  </p>
                  <Badge variant="outline" className={ROLE_BADGE_CLASSES[viewUser.role]}>
                    {ROLE_LABELS[viewUser.role]}
                  </Badge>
                </div>
              </div>

              <Separator />

              <DetailRow icon={Mail} label="Email" value={viewUser.email} />
              <DetailRow icon={Phone} label="Phone" value={viewUser.phone_number || "—"} />
              <DetailRow
                icon={School}
                label="School"
                value={viewUser.school_name || "Platform Level"}
              />
              <DetailRow
                icon={CheckCircle2}
                label="Email Verified"
                value={viewUser.email_verified ? "Yes" : "No"}
              />
              <DetailRow
                icon={Smartphone}
                label="2FA Enabled"
                value={viewUser.two_factor_enabled ? "Yes" : "No"}
              />

              <Separator />

              <DetailRow
                icon={Activity}
                label="Login Attempts"
                value={viewUser.login_attempts}
              />
              <DetailRow
                icon={Lock}
                label="Locked Until"
                value={
                  viewUser.locked_until
                    ? format(new Date(viewUser.locked_until), "MMM d, yyyy HH:mm")
                    : "Not Locked"
                }
              />
              <DetailRow
                icon={Users}
                label="Active Sessions"
                value={`${viewUser.active_sessions} / ${viewUser.max_sessions}`}
              />
              <DetailRow
                icon={Calendar}
                label="Created At"
                value={format(new Date(viewUser.created_at), "MMM d, yyyy HH:mm")}
              />
              <DetailRow
                icon={Calendar}
                label="Last Login"
                value={
                  viewUser.last_login
                    ? format(new Date(viewUser.last_login), "MMM d, yyyy HH:mm")
                    : "Never"
                }
              />
              <DetailRow
                icon={Shield}
                label="Status"
                value={
                  <Badge variant={getUserStatus(viewUser).variant}>
                    {getUserStatus(viewUser).label}
                  </Badge>
                }
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUser(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT USER DIALOG */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Email and created_at cannot be changed here.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-first-name"
                  value={editForm.first_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, first_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-last-name"
                  value={editForm.last_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, last_name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                value={editForm.email}
                disabled
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editForm.phone_number}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone_number: e.target.value })
                }
              />
            </div>

            <Separator />

            <RoleSchoolFields
              form={editForm}
              setForm={setEditForm}
              availableRoles={availableRoles}
              schools={schools}
              currentUserRole={currentUserRole}
              isEdit
            />

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="edit-max-sessions">Max Sessions</Label>
              <Input
                id="edit-max-sessions"
                type="number"
                min={1}
                max={20}
                value={editForm.max_sessions}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    max_sessions: parseInt(e.target.value) || 5,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Account Status</Label>
              <Select
                value={editForm.is_active ? "active" : "inactive"}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, is_active: v === "active" })
                }
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditUser}
              disabled={submitting || updateUserMutation.isPending}
              className="gap-2"
            >
              {updateUserMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;