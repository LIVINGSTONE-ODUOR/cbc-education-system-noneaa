import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Search,
  MoreHorizontal,
  AlertCircle,
  RefreshCw,
  Download,
  FlaskConical,
  Clock,
} from 'lucide-react';

import ProtectedTableSkeleton from '@/components/skeletons/ProtectedTableSkeleton';
import AddTeacherModal from './AddTeacherModal';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  employee_number: string;
  subjects: string[];
  is_active: boolean;
  created_at: string;
  // Optional fields — shown when present, gracefully hidden otherwise.
  department?: string | null;
  year_group?: string | null;
  qualifications?: string | null;
  years_experience?: number | null;
}

const ALL = '__all__';

function initials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TeachersListPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState(ALL);
  const [subjectFilter, setSubjectFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);

  const fetchTeachers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('school_id', user?.schoolId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTeachers(data || []);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Failed to load teachers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.schoolId]);

  useEffect(() => {
    void fetchTeachers();
  }, [fetchTeachers]);

  // Support links/buttons elsewhere in the app (e.g. dashboard quick actions)
  // that navigate to /school-admin/teachers?add=1 — open the popup instead
  // of requiring a dedicated page.
  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setIsAddOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('add');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleAddSuccess = () => {
    void fetchTeachers();
  };

  const departmentOptions = useMemo(
    () => Array.from(new Set(teachers.map(t => t.department).filter(Boolean))) as string[],
    [teachers]
  );
  const subjectOptions = useMemo(
    () => Array.from(new Set(teachers.flatMap(t => t.subjects || []))).sort(),
    [teachers]
  );

  const filteredTeachers = teachers.filter(teacher => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(query) ||
      teacher.email.toLowerCase().includes(query) ||
      teacher.employee_number?.toLowerCase().includes(query) ||
      (teacher.subjects || []).some(s => s.toLowerCase().includes(query));

    const matchesDepartment = departmentFilter === ALL || teacher.department === departmentFilter;
    const matchesSubject = subjectFilter === ALL || (teacher.subjects || []).includes(subjectFilter);
    const matchesStatus =
      statusFilter === ALL ||
      (statusFilter === 'active' ? teacher.is_active : !teacher.is_active);

    return matchesSearch && matchesDepartment && matchesSubject && matchesStatus;
  });

  const handleExport = () => {
    const rows = [
      ['Name', 'Employee No.', 'Email', 'Phone', 'Subjects', 'Qualifications', 'Status', 'Joined'],
      ...filteredTeachers.map(t => [
        `${t.first_name} ${t.last_name}`,
        t.employee_number,
        t.email,
        t.phone_number,
        (t.subjects || []).join('; '),
        t.qualifications || '',
        t.is_active ? 'Active' : 'Inactive',
        formatDate(t.created_at),
      ]),
    ];
    const csv = rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teachers.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <ProtectedTableSkeleton rowCount={8} columnCount={6} />;
  }


  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
          <p className="mt-4 text-red-600">{error}</p>
          <Button onClick={() => fetchTeachers()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teachers</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your school's teaching staff
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchTeachers(true)} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Quick find by name, ID, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Department</SelectItem>
            {departmentOptions.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Subjects</SelectItem>
            {subjectOptions.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Teachers Table */}
      <Card>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm text-muted-foreground">
            Showing {filteredTeachers.length} of {teachers.length}
          </p>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredTeachers.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
        <CardContent className="p-0">
          {filteredTeachers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Qualifications</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-primary">
                              {initials(teacher.first_name, teacher.last_name)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium leading-tight">{teacher.first_name} {teacher.last_name}</p>
                            <p className="text-xs text-muted-foreground">{teacher.employee_number}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <FlaskConical className="w-3.5 h-3.5 text-muted-foreground" />
                          {teacher.subjects?.[0] || '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {teacher.qualifications ? (
                          <Badge variant="secondary" className="font-normal">
                            {teacher.qualifications}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {teacher.years_experience ?? 0} yrs
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            teacher.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-100 border-transparent'
                              : ''
                          }
                          variant={teacher.is_active ? 'default' : 'secondary'}
                        >
                          {teacher.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(teacher.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Edit Details</DropdownMenuItem>
                            <DropdownMenuItem>Assign Classes</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {searchQuery ? 'No teachers found matching your search.' : 'No teachers added yet.'}
              </div>
              {!searchQuery && (
                <Button onClick={() => setIsAddOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Teacher
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AddTeacherModal open={isAddOpen} onOpenChange={setIsAddOpen} onSuccess={handleAddSuccess} />
    </div>
  );
}
