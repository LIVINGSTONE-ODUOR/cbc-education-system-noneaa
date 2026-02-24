import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { ArrowLeft, Plus, Trash2, Users, BookOpen, UserCheck } from 'lucide-react';
import type { Department, DepartmentTeacher, DepartmentSubject } from './types';
import {
  getDepartments,
  getDepartmentTeachers,
  getDepartmentSubjects,
  assignTeacher,
  removeTeacher,
  assignSubject,
  removeSubject,
} from './mockData';
import AssignTeacherModal from './AssignTeacherModal';
import AssignSubjectModal from './AssignSubjectModal';

export default function DepartmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [department, setDepartment] = useState<Department | null>(null);
  const [teachers, setTeachers] = useState<DepartmentTeacher[]>([]);
  const [subjects, setSubjects] = useState<DepartmentSubject[]>([]);
  const [loading, setLoading] = useState(true);

  const [assignTeacherOpen, setAssignTeacherOpen] = useState(false);
  const [assignSubjectOpen, setAssignSubjectOpen] = useState(false);

  const [removeTeacherTarget, setRemoveTeacherTarget] = useState<DepartmentTeacher | null>(null);
  const [removeSubjectTarget, setRemoveSubjectTarget] = useState<DepartmentSubject | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [depts, teacherList, subjectList] = await Promise.all([
        getDepartments(),
        getDepartmentTeachers(id),
        getDepartmentSubjects(id),
      ]);
      const dept = depts.find(d => d.id === id) ?? null;
      setDepartment(dept);
      setTeachers(teacherList);
      setSubjects(subjectList);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleAssignTeacher = async (teacherId: string, role: 'HOD' | 'Teacher' | 'Assistant') => {
    try {
      const entry = await assignTeacher(id!, teacherId, role);
      setTeachers(prev => [...prev, entry]);
      toast.success('Teacher assigned successfully');
    } catch {
      toast.error('Failed to assign teacher');
    }
  };

  const handleRemoveTeacher = async () => {
    if (!removeTeacherTarget) return;
    try {
      await removeTeacher(id!, removeTeacherTarget.id);
      setTeachers(prev => prev.filter(t => t.id !== removeTeacherTarget.id));
      toast.success('Teacher removed');
    } catch {
      toast.error('Failed to remove teacher');
    } finally {
      setRemoveTeacherTarget(null);
    }
  };

  const handleAssignSubject = async (subjectId: string) => {
    try {
      const entry = await assignSubject(id!, subjectId);
      setSubjects(prev => [...prev, entry]);
      toast.success('Subject assigned successfully');
    } catch {
      toast.error('Failed to assign subject');
    }
  };

  const handleRemoveSubject = async () => {
    if (!removeSubjectTarget) return;
    try {
      await removeSubject(id!, removeSubjectTarget.id);
      setSubjects(prev => prev.filter(s => s.id !== removeSubjectTarget.id));
      toast.success('Subject removed');
    } catch {
      toast.error('Failed to remove subject');
    } finally {
      setRemoveSubjectTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!department) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Department not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/school-admin/teachers/departments')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Departments
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{department.name}</h1>
          <p className="text-muted-foreground text-sm">Code: {department.code || '—'}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teachers">Teachers ({teachers.length})</TabsTrigger>
          <TabsTrigger value="subjects">Subjects ({subjects.length})</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Department Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                  <Badge
                    className={
                      department.status === 'active'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                    }
                  >
                    {department.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Head of Department
                  </p>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    <span className="font-medium">{department.hodName || '—'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm">{department.description || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Created</p>
                  <p className="text-sm">{department.createdAt}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{teachers.length}</p>
                        <p className="text-xs text-muted-foreground">Teachers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{subjects.length}</p>
                        <p className="text-xs text-muted-foreground">Subjects</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Teachers ── */}
        <TabsContent value="teachers" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Assigned Teachers</CardTitle>
              <Button size="sm" onClick={() => setAssignTeacherOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Assign Teacher
              </Button>
            </CardHeader>
            <CardContent>
              {teachers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No teachers assigned yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map(t => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                              {t.teacherName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className="font-medium">{t.teacherName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.role === 'HOD' ? 'default' : 'secondary'}>
                            {t.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {t.subjects.map(s => (
                              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setRemoveTeacherTarget(t)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Subjects ── */}
        <TabsContent value="subjects" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Assigned Subjects</CardTitle>
              <Button size="sm" onClick={() => setAssignSubjectOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Assign Subject
              </Button>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No subjects assigned yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.subjectName}</TableCell>
                        <TableCell className="font-mono text-sm">{s.code}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setRemoveSubjectTarget(s)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Teacher Modal */}
      <AssignTeacherModal
        open={assignTeacherOpen}
        onOpenChange={setAssignTeacherOpen}
        existingTeachers={teachers}
        onSave={handleAssignTeacher}
      />

      {/* Assign Subject Modal */}
      <AssignSubjectModal
        open={assignSubjectOpen}
        onOpenChange={setAssignSubjectOpen}
        existingSubjects={subjects}
        onSave={handleAssignSubject}
      />

      {/* Remove Teacher Confirmation */}
      <AlertDialog open={!!removeTeacherTarget} onOpenChange={o => !o && setRemoveTeacherTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{removeTeacherTarget?.teacherName}</strong> from this department?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveTeacher} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Subject Confirmation */}
      <AlertDialog open={!!removeSubjectTarget} onOpenChange={o => !o && setRemoveSubjectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{removeSubjectTarget?.subjectName}</strong> from this department?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveSubject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
