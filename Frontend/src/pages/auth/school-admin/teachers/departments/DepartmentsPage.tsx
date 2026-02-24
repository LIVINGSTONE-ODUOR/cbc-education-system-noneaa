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
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import type { Department, DepartmentFormData } from './types';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from './mockData';
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
                          <span className="text-muted-foreground text-xs">teachers</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{dept.subjectCount}</span>
                          <span className="text-muted-foreground text-xs">subjects</span>
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
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot
              be undone.
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
