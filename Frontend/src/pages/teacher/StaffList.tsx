import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  GraduationCap,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Clock,
  Award,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { deleteTeacher, getTeachers } from '@/lib/api/teacherApi';
import type { StaffMember } from './StaffManagement/types';
import ViewTeacherModal from './ViewTeacherModal';
import EditTeacherModal from './EditTeacherModal';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ─────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────

interface Teacher {
  id: string;
  staffNo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  qualifications: string;
  experience: number; // years
  status: 'active' | 'on_leave' | 'terminated' | 'suspended' | 'inactive';
  joinDate: string;
  avatar?: string;
}


interface FilterState {
  searchTerm: string;
  subject: string;
  status: string;
}

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  active: { label: 'Active', variant: 'default', icon: CheckCircle },
  on_leave: { label: 'On Leave', variant: 'secondary', icon: Calendar },
  terminated: { label: 'Terminated', variant: 'destructive', icon: X },
  suspended: { label: 'Suspended', variant: 'outline', icon: AlertCircle },
};

const ITEMS_PER_PAGE = 12;



// ─────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getUniqueSubjects = (teachers: Teacher[]): string[] => {
  const subjects = new Set(teachers.map(t => t.subject).filter(Boolean));
  return Array.from(subjects).sort();
};

// Status from backend: we map UI “active/on_leave/…” into backend is_active where possible.
const mapStatusToBackend = (status: string): boolean | undefined => {
  if (status === 'all') return undefined;
  if (status === 'active') return true;
  // backend list supports only is_active; treat everything else as inactive for now
  if (['on_leave', 'suspended', 'terminated'].includes(status)) return false;
  return undefined;
};

// ─────────────────────────────────────────────────────────────────
// STAT CARD COMPONENT

// ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  bgColor: string;
}

function StatCard({ title, value, icon: Icon, description, bgColor }: StatCardProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={cn('p-3 rounded-lg', bgColor)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────
// FILTER BAR COMPONENT
// ─────────────────────────────────────────────────────────────────

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  subjects: string[];
  teacherCount: number;
  totalTeachers: number;
  onExport: () => void;
}

function FilterBar({
  filters,
  onFilterChange,
  subjects,
  teacherCount,
  totalTeachers,
  onExport,
}: FilterBarProps) {
  const handleReset = useCallback(() => {
    onFilterChange({
      searchTerm: '',
      subject: 'all',
      status: 'all',
    });
  }, [onFilterChange]);

  const hasActiveFilters =
    filters.searchTerm ||
    filters.subject !== 'all' ||
    filters.status !== 'all';

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or staff ID..."
            value={filters.searchTerm}
            onChange={(e) =>
              onFilterChange({ ...filters, searchTerm: e.target.value })
            }
            className="pl-9"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-end flex-wrap">
          <div>
            <Select
              value={filters.subject}
              onValueChange={(value) =>
                onFilterChange({ ...filters, subject: value })
              }
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                onFilterChange({ ...filters, status: value })
              }
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results info and export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{teacherCount}</span> of{' '}
          <span className="font-semibold text-foreground">{totalTeachers}</span> teachers
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="gap-2 w-fit"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TEACHER ROW COMPONENT
// ─────────────────────────────────────────────────────────────────

interface TeacherRowProps {
  teacher: Teacher;
  onView: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
}

function TeacherRow({ teacher, onView, onEdit, onDelete }: TeacherRowProps) {
  const statusInfo = STATUS_CONFIG[teacher.status] ?? STATUS_CONFIG.active;


  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={teacher.avatar} />
            <AvatarFallback className="bg-primary/10 text-xs font-semibold">
              {getInitials(teacher.firstName, teacher.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-sm">
              {teacher.firstName} {teacher.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{teacher.staffNo}</p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-1 text-sm">
          <Award className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="truncate">{teacher.subject}</span>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="truncate">{teacher.qualifications}</span>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-1 text-sm">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{teacher.experience} yrs</span>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant={statusInfo.variant} className="text-xs">
            <statusInfo.icon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </TableCell>

      <TableCell className="text-xs text-muted-foreground">
        {formatDate(teacher.joinDate)}
      </TableCell>

      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(teacher)} className="gap-2 cursor-pointer">
              <Eye className="h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(teacher)} className="gap-2 cursor-pointer">
              <Edit className="h-4 w-4" />
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(teacher)}
              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ─────────────────────────────────────────────────────────────────
// PAGINATION COMPONENT
// ─────────────────────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsShowing: number;
  totalItems: number;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsShowing,
  totalItems,
}: PaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
      <p className="text-sm text-muted-foreground">
        Page <span className="font-semibold text-foreground">{currentPage}</span> of{' '}
        <span className="font-semibold text-foreground">{totalPages || 1}</span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DELETE CONFIRMATION DIALOG
// ─────────────────────────────────────────────────────────────────

interface DeleteDialogProps {
  isOpen: boolean;
  teacherName: string;
  staffNo: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function DeleteConfirmDialog({
  isOpen,
  teacherName,
  staffNo,
  onConfirm,
  onCancel,
  isLoading,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={() => !isLoading && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Remove Teacher</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
          <p>
            <span className="font-semibold">Name:</span> {teacherName}
          </p>
          <p>
            <span className="font-semibold">Staff ID:</span> {staffNo}
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? 'Removing...' : 'Remove'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function AdminTeachers() {
  const navigate = useNavigate();
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{

    isOpen: boolean;
    teacher: Teacher | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    teacher: null,
    isLoading: false,
  });

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    subject: 'all',
    status: 'all',
  });

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number }>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    pages: 1,
  });

  const [viewDialog, setViewDialog] = useState<{ isOpen: boolean; teacherId: string | null }>({
    isOpen: false,
    teacherId: null,
  });
  const [editDialog, setEditDialog] = useState<{ isOpen: boolean; teacherId: string | null }>({
    isOpen: false,
    teacherId: null,
  });

  // Reusable fetch, shared by the initial load, filter/page changes,
  // the manual refresh button, and post-edit/post-delete refetches.
  const fetchTeachers = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const page = currentPage;
        const limit = ITEMS_PER_PAGE;

        // getTeachers supports: page, limit, status, search
        // we pass backend status as is_active derived from our UI status.
        const is_active = mapStatusToBackend(filters.status);

        // subject filtering will remain client-side for now.
        const res = await getTeachers({
          page,
          limit,
          search: filters.searchTerm,
          status: is_active === undefined ? undefined : is_active.toString(),
        });

        // res.teachers already mapped to StaffMember, but our local Teacher interface differs.
        // We transform StaffMember -> Teacher for this UI.
        const mapped: Teacher[] = res.teachers.map((t: StaffMember) => {
          return {
            id: t.id,
            staffNo: t.tscNumber ? `TCH/${t.tscNumber}` : t.idNumber ? t.idNumber : t.id,
            firstName: t.firstName,
            lastName: t.lastName,
            email: t.email,
            phone: t.phoneNumber || t.mobilePhone || '',
            subject: (t.teachingSubjects?.[0] || t.subjectsTaught?.[0] || '—').toString(),
            qualifications: (t.qualifications || []).join(', ') || '—',
            experience: 0,
            // map backend status to our UI labels (approx)
            status: t.status === 'active' ? 'active' : (filters.status !== 'all' ? (filters.status as Teacher['status']) : 'inactive'),

            joinDate: t.dateJoined || (t.hireDate || new Date().toISOString().split('T')[0]),
            avatar: t.photo ?? null,

          };
        });

        // Client-side subject filtering
        const subjectFiltered = filters.subject === 'all' ? mapped : mapped.filter((t) => t.subject === filters.subject);

        setTeachers(subjectFiltered);
        setPagination({
          page: res.pagination.page,
          limit: res.pagination.limit,
          total: res.pagination.total,
          pages: res.pagination.pages,
        });
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'Failed to fetch teachers');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, filters.searchTerm, filters.status, filters.subject]
  );

  // Server-side fetch (pagination + search + active/inactive)
  useEffect(() => {
    void fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters.searchTerm, filters.status, filters.subject]);

  const subjects = useMemo(() => getUniqueSubjects(teachers), [teachers]);

  const totalPages = pagination.pages || 1;
  const paginatedTeachers = teachers; // already paginated by backend

  const stats = useMemo(() => {
    const total = pagination.total || teachers.length;
    const activeCount = teachers.filter((t) => t.status === 'active').length;
    const onLeaveCount = teachers.filter((t) => t.status === 'on_leave').length;
    const avgExperience = teachers.length ? Math.round(teachers.reduce((sum, t) => sum + (t.experience || 0), 0) / teachers.length) : 0;
    return { total, active: activeCount, onLeave: onLeaveCount, avgExperience };
  }, [pagination.total, teachers]);


  // Callbacks
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Manual refresh button — refetches the current page/filters without
  // showing the full-page skeleton, just a spinning icon on the button.
  const handleRefresh = useCallback(() => {
    void fetchTeachers({ silent: true });
  }, [fetchTeachers]);

  const handleExport = useCallback(() => {
    const rows = teachers.map((t) => ({
      'Staff ID': t.staffNo,
      'First Name': t.firstName,
      'Last Name': t.lastName,
      Email: t.email,
      Phone: t.phone,
      Subject: t.subject,
      Qualifications: t.qualifications,
      'Experience (years)': t.experience,
      Status: STATUS_CONFIG[t.status]?.label ?? t.status,
      'Join Date': formatDate(t.joinDate),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 14 }, // Staff ID
      { wch: 16 }, // First Name
      { wch: 16 }, // Last Name
      { wch: 28 }, // Email
      { wch: 16 }, // Phone
      { wch: 18 }, // Subject
      { wch: 24 }, // Qualifications
      { wch: 18 }, // Experience
      { wch: 12 }, // Status
      { wch: 14 }, // Join Date
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');
    XLSX.writeFile(workbook, `teachers-list-${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [teachers]);


  const handleViewProfile = useCallback((teacher: Teacher) => {
    setViewDialog({ isOpen: true, teacherId: teacher.id });
  }, []);

  const handleEditProfile = useCallback((teacher: Teacher) => {
    setEditDialog({ isOpen: true, teacherId: teacher.id });
  }, []);

  const closeViewDialog = useCallback(() => {
    setViewDialog({ isOpen: false, teacherId: null });
  }, []);

  const closeEditDialog = useCallback(() => {
    setEditDialog({ isOpen: false, teacherId: null });
  }, []);

  const handleEditSuccess = useCallback(() => {
    void fetchTeachers({ silent: true });
  }, [fetchTeachers]);

  const handleDeleteConfirm = useCallback(() => {
    const teacherId = deleteDialog.teacher?.id;
    if (!teacherId) return;

    const run = async () => {
      try {
        setDeleteDialog((prev) => ({ ...prev, isLoading: true }));
        await deleteTeacher(teacherId);
        setDeleteDialog({ isOpen: false, teacher: null, isLoading: false });
        // refetch current page
        await fetchTeachers({ silent: true });
      } catch (e) {
        console.error(e);
        setDeleteDialog({ isOpen: false, teacher: null, isLoading: false });
      }
    };

    void run();
  }, [deleteDialog.teacher, fetchTeachers]);



  const openDeleteDialog = useCallback((teacher: Teacher) => {
    setDeleteDialog({ isOpen: true, teacher, isLoading: false });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ isOpen: false, teacher: null, isLoading: false });
  }, []);

  // Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Teachers</h1>
              <p className="text-sm text-muted-foreground">Manage and monitor teaching staff</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Teachers"
            value={stats.total}
            icon={GraduationCap}
            bgColor="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Active"
            value={stats.active}
            icon={CheckCircle}
            description={`${Math.round((stats.active / stats.total) * 100)}% of total`}
            bgColor="bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400"
          />
          <StatCard
            title="On Leave"
            value={stats.onLeave}
            icon={Calendar}
            bgColor="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            title="Avg. Experience"
            value={stats.avgExperience}
            icon={Award}
            description="years of experience"
            bgColor="bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
          />
        </div>

        {/* Filter Bar Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Filters & Search</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                >
                  <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                  Refresh
                </Button>
                <Button size="sm" className="gap-2" onClick={() => navigate('/school-admin/teachers?add=1')}>
                  <Plus className="h-4 w-4" />
                  Add Teacher
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              subjects={subjects}
              teacherCount={teachers.length}
              totalTeachers={pagination.total}
              onExport={handleExport}
            />
          </CardContent>

        </Card>

        {/* Teachers Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {paginatedTeachers.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <TableHead className="font-semibold">Teacher</TableHead>
                        <TableHead className="font-semibold">Subject</TableHead>
                        <TableHead className="font-semibold">Qualifications</TableHead>
                        <TableHead className="font-semibold">Experience</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Joined</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTeachers.map((teacher) => (
                        <TeacherRow
                          key={teacher.id}
                          teacher={teacher}
                          onView={handleViewProfile}
                          onEdit={handleEditProfile}
                          onDelete={openDeleteDialog}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="border-t p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900/30">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsShowing={paginatedTeachers.length}
                    totalItems={pagination.total}

                  />
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-lg bg-muted/50 mb-4">
                  <GraduationCap className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground mt-2">No teachers found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialog.teacher && (
        <DeleteConfirmDialog
          isOpen={deleteDialog.isOpen}
          teacherName={`${deleteDialog.teacher.firstName} ${deleteDialog.teacher.lastName}`}
          staffNo={deleteDialog.teacher.staffNo}
          onConfirm={handleDeleteConfirm}
          onCancel={closeDeleteDialog}
          isLoading={deleteDialog.isLoading}
        />
      )}

      {/* View Profile Dialog */}
      <ViewTeacherModal
        open={viewDialog.isOpen}
        onOpenChange={(open) => (open ? null : closeViewDialog())}
        teacherId={viewDialog.teacherId}
      />

      {/* Edit Profile Dialog */}
      <EditTeacherModal
        open={editDialog.isOpen}
        onOpenChange={(open) => (open ? null : closeEditDialog())}
        teacherId={editDialog.teacherId}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
