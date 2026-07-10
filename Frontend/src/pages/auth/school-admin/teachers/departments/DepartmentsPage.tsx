import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Users, BookOpen, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import type { Department, DepartmentFormData } from './types';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from './departmentApi';
import AddEditDepartmentModal from './AddEditDepartmentModal';

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  return (
    <Badge
      className={
        status === 'active'
          ? 'bg-green-100 text-green-700 hover:bg-green-100'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
      }
    >
      {status === 'active' ? 'Active' : 'Inactive'}
    </Badge>
  );
}

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDepartments(); }, [loadDepartments]);

  const activeDepts = departments.filter(d => d.status === 'active').length;
  const inactiveDepts = departments.filter(d => d.status === 'inactive').length;

  const statusChartData = useMemo(() => {
    const data: { name: string; value: number; color: string }[] = [];
    if (activeDepts > 0) data.push({ name: 'Active', value: activeDepts, color: '#10b981' });
    if (inactiveDepts > 0) data.push({ name: 'Inactive', value: inactiveDepts, color: '#ef4444' });
    return data;
  }, [activeDepts, inactiveDepts]);

  const teachersPerDeptData = useMemo(() =>
    departments.map(d => ({ name: d.name, teachers: d.teacherCount })).sort((a, b) => b.teachers - a.teachers),
  [departments]);

  const subjectsPerDeptData = useMemo(() =>
    departments.map(d => ({ name: d.name, subjects: d.subjectCount })).sort((a, b) => b.subjects - a.subjects),
  [departments]);

  const ratioData = useMemo(() =>
    departments.map(d => ({
      name: d.name,
      ratio: d.subjectCount > 0 ? Number((d.teacherCount / d.subjectCount).toFixed(2)) : 0,
    })).sort((a, b) => b.ratio - a.ratio),
  [departments]);

  const stackedData = useMemo(() =>
    departments.map(d => ({ name: d.name, teachers: d.teacherCount, subjects: d.subjectCount })).sort((a, b) => (b.teachers + b.subjects) - (a.teachers + a.subjects)),
  [departments]);

  const sizeRankingData = useMemo(() => {
    const sorted = departments.map(d => ({ name: d.name, total: d.teacherCount + d.subjectCount })).sort((a, b) => b.total - a.total);
    const max = sorted[0]?.total || 1;
    return sorted.map(d => ({ ...d, percent: Math.round((d.total / max) * 100) }));
  }, [departments]);

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.hodName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditTarget(dept);
    setModalOpen(true);
  };

  const handleSave = async (data: DepartmentFormData) => {
    try {
      if (editTarget) {
        const updated = await updateDepartment(editTarget.id, data);
        setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d));
        toast.success('Department updated successfully');
      } else {
        const created = await createDepartment(data);
        setDepartments(prev => [created, ...prev]);
        toast.success('Department created successfully');
      }
    } catch {
      toast.error('Failed to save department');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDepartment(deleteTarget.id);
      setDepartments(prev => prev.filter(d => d.id !== deleteTarget.id));
      toast.success('Department deleted');
    } catch {
      toast.error('Failed to delete department');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Departments</h1>
          <p className="text-muted-foreground mt-1">Manage your school's academic departments</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, or HOD..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      {departments.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Teachers per Department */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Teachers per Department
                </CardTitle>
                <CardDescription className="text-xs">Number of teachers in each department</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teachersPerDeptData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                      <Bar dataKey="teachers" name="Teachers" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Subjects per Department */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <BookOpen className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  Subjects per Department
                </CardTitle>
                <CardDescription className="text-xs">Subject count per department</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectsPerDeptData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                      <Bar dataKey="subjects" name="Subjects" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Department Status */}
            {statusChartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                      <BarChart3 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    Department Status
                  </CardTitle>
                  <CardDescription className="text-xs">Active vs Inactive departments</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-[120px] h-[120px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} paddingAngle={3} dataKey="value" strokeWidth={0}>
                            {statusChartData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                          </Pie>
                          <Tooltip formatter={(val: number) => [val, 'Departments']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {statusChartData.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
                            <span className="text-xs text-muted-foreground">{entry.name}</span>
                          </div>
                          <span className="text-sm font-bold">{entry.value}</span>
                        </div>
                      ))}
                      <div className="pt-1 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Total</span>
                          <span className="text-xs font-bold">{departments.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Teacher-to-Subject Ratio */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  Teacher-to-Subject Ratio
                </CardTitle>
                <CardDescription className="text-xs">Teachers per subject in each department</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ratioData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(val: number) => [`${val}:1`, 'Ratio']} />
                      <Bar dataKey="ratio" name="Ratio" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Department Size Overview (Stacked) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                    <BarChart3 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  </div>
                  Department Size Overview
                </CardTitle>
                <CardDescription className="text-xs">Teachers + Subjects per department</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stackedData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="teachers" name="Teachers" fill="#3b82f6" stackId="size" radius={[0, 0, 0, 0]} maxBarSize={36} />
                      <Bar dataKey="subjects" name="Subjects" fill="#8b5cf6" stackId="size" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Department Size Ranking */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-rose-100 dark:bg-rose-900 flex items-center justify-center">
                    <BarChart3 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  </div>
                  Department Ranking
                </CardTitle>
                <CardDescription className="text-xs">Largest to smallest by total staff + subjects</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                  {sizeRankingData.map((d, i) => (
                    <div key={d.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate max-w-[60%]">
                          {i + 1}. {d.name}
                        </span>
                        <span className="text-xs font-bold">{d.total}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${d.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Departments</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${filtered.length} department${filtered.length !== 1 ? 's' : ''} found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Head of Department</TableHead>
                    <TableHead>Teachers</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(dept => (
                    <TableRow key={dept.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{dept.name}</p>
                          {dept.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                              {dept.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{dept.code || '—'}</TableCell>
                      <TableCell>{dept.hodName || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{dept.teacherCount}</span>
                          <span className="text-muted-foreground text-xs">{dept.teacherCount === 1 ? 'teacher' : 'teachers'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{dept.subjectCount}</span>
                          <span className="text-muted-foreground text-xs">{dept.subjectCount === 1 ? 'subject' : 'subjects'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={dept.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/school-admin/teachers/departments/${dept.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(dept)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget(dept)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
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
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No departments match your search.' : 'No departments added yet.'}
              </p>
              {!searchQuery && (
                <Button onClick={handleOpenAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Department
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      <AddEditDepartmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        department={editTarget}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
