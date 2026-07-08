diff --git a/Frontend/src/pages/teacher/StaffList.tsx b/Frontend/src/pages/teacher/StaffList.tsx
index 3e56aae..a7c3048 100644
--- a/Frontend/src/pages/teacher/StaffList.tsx
+++ b/Frontend/src/pages/teacher/StaffList.tsx
@@ -41,7 +41,9 @@ import {
   Plus,
   Clock,
   Award,
+  RefreshCw,
 } from 'lucide-react';
+import * as XLSX from 'xlsx';
 import {
   DropdownMenu,
   DropdownMenuContent,
@@ -53,6 +55,8 @@ import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
 import { cn } from '@/lib/utils';
 import { deleteTeacher, getTeachers } from '@/lib/api/teacherApi';
 import type { StaffMember } from './StaffManagement/types';
+import ViewTeacherModal from './ViewTeacherModal';
+import EditTeacherModal from './EditTeacherModal';
 
 import {
   AlertDialog,
@@ -531,6 +535,7 @@ export default function AdminTeachers() {
 
   const [teachers, setTeachers] = useState<Teacher[]>([]);
   const [loading, setLoading] = useState(false);
+  const [refreshing, setRefreshing] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number }>({
     page: 1,
@@ -539,11 +544,26 @@ export default function AdminTeachers() {
     pages: 1,
   });
 
-  // Server-side fetch (pagination + search + active/inactive)
-  useEffect(() => {
-    const fetchTeachers = async () => {
+  const [viewDialog, setViewDialog] = useState<{ isOpen: boolean; teacherId: string | null }>({
+    isOpen: false,
+    teacherId: null,
+  });
+  const [editDialog, setEditDialog] = useState<{ isOpen: boolean; teacherId: string | null }>({
+    isOpen: false,
+    teacherId: null,
+  });
+
+  // Reusable fetch, shared by the initial load, filter/page changes,
+  // the manual refresh button, and post-edit/post-delete refetches.
+  const fetchTeachers = useCallback(
+    async (options?: { silent?: boolean }) => {
+      const silent = options?.silent ?? false;
       try {
-        setLoading(true);
+        if (silent) {
+          setRefreshing(true);
+        } else {
+          setLoading(true);
+        }
         setError(null);
 
         const page = currentPage;
@@ -583,7 +603,6 @@ export default function AdminTeachers() {
           };
         });
 
-
         // Client-side subject filtering
         const subjectFiltered = filters.subject === 'all' ? mapped : mapped.filter((t) => t.subject === filters.subject);
 
@@ -599,10 +618,16 @@ export default function AdminTeachers() {
         setError(e?.message || 'Failed to fetch teachers');
       } finally {
         setLoading(false);
+        setRefreshing(false);
       }
-    };
+    },
+    [currentPage, filters.searchTerm, filters.status, filters.subject]
+  );
 
+  // Server-side fetch (pagination + search + active/inactive)
+  useEffect(() => {
     void fetchTeachers();
+    // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [currentPage, filters.searchTerm, filters.status, filters.subject]);
 
   const subjects = useMemo(() => getUniqueSubjects(teachers), [teachers]);
@@ -630,43 +655,66 @@ export default function AdminTeachers() {
     window.scrollTo({ top: 0, behavior: 'smooth' });
   }, []);
 
+  // Manual refresh button — refetches the current page/filters without
+  // showing the full-page skeleton, just a spinning icon on the button.
+  const handleRefresh = useCallback(() => {
+    void fetchTeachers({ silent: true });
+  }, [fetchTeachers]);
+
   const handleExport = useCallback(() => {
-    const csv = [
-      ['Staff ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Subject', 'Qualifications', 'Experience (years)', 'Status', 'Join Date'],
-      ...teachers.map((t) => [
-
-        t.staffNo,
-        t.firstName,
-        t.lastName,
-        t.email,
-        t.phone,
-        t.subject,
-        t.qualifications,
-        t.experience,
-        STATUS_CONFIG[t.status].label,
-        formatDate(t.joinDate),
-      ]),
-    ]
-      .map((row) => row.map((cell) => `"${cell}"`).join(','))
-      .join('\n');
-
-    const blob = new Blob([csv], { type: 'text/csv' });
-    const url = window.URL.createObjectURL(blob);
-    const a = document.createElement('a');
-    a.href = url;
-    a.download = `teachers-list-${new Date().toISOString().split('T')[0]}.csv`;
-    a.click();
+    const rows = teachers.map((t) => ({
+      'Staff ID': t.staffNo,
+      'First Name': t.firstName,
+      'Last Name': t.lastName,
+      Email: t.email,
+      Phone: t.phone,
+      Subject: t.subject,
+      Qualifications: t.qualifications,
+      'Experience (years)': t.experience,
+      Status: STATUS_CONFIG[t.status]?.label ?? t.status,
+      'Join Date': formatDate(t.joinDate),
+    }));
+
+    const worksheet = XLSX.utils.json_to_sheet(rows);
+    worksheet['!cols'] = [
+      { wch: 14 }, // Staff ID
+      { wch: 16 }, // First Name
+      { wch: 16 }, // Last Name
+      { wch: 28 }, // Email
+      { wch: 16 }, // Phone
+      { wch: 18 }, // Subject
+      { wch: 24 }, // Qualifications
+      { wch: 18 }, // Experience
+      { wch: 12 }, // Status
+      { wch: 14 }, // Join Date
+    ];
+
+    const workbook = XLSX.utils.book_new();
+    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');
+    XLSX.writeFile(workbook, `teachers-list-${new Date().toISOString().split('T')[0]}.xlsx`);
   }, [teachers]);
 
 
   const handleViewProfile = useCallback((teacher: Teacher) => {
-    console.log('View profile:', teacher);
+    setViewDialog({ isOpen: true, teacherId: teacher.id });
   }, []);
 
   const handleEditProfile = useCallback((teacher: Teacher) => {
-    console.log('Edit teacher:', teacher);
+    setEditDialog({ isOpen: true, teacherId: teacher.id });
+  }, []);
+
+  const closeViewDialog = useCallback(() => {
+    setViewDialog({ isOpen: false, teacherId: null });
+  }, []);
+
+  const closeEditDialog = useCallback(() => {
+    setEditDialog({ isOpen: false, teacherId: null });
   }, []);
 
+  const handleEditSuccess = useCallback(() => {
+    void fetchTeachers({ silent: true });
+  }, [fetchTeachers]);
+
   const handleDeleteConfirm = useCallback(() => {
     const teacherId = deleteDialog.teacher?.id;
     if (!teacherId) return;
@@ -677,41 +725,7 @@ export default function AdminTeachers() {
         await deleteTeacher(teacherId);
         setDeleteDialog({ isOpen: false, teacher: null, isLoading: false });
         // refetch current page
-        const page = currentPage;
-        const limit = ITEMS_PER_PAGE;
-        const is_active = mapStatusToBackend(filters.status);
-
-        const res = await getTeachers({
-          page,
-          limit,
-          search: filters.searchTerm,
-          status: is_active === undefined ? undefined : is_active.toString(),
-        });
-
-        const mapped: Teacher[] = res.teachers.map((t: StaffMember) => ({
-          id: t.id,
-          staffNo: t.tscNumber ? `TCH/${t.tscNumber}` : t.idNumber ? t.idNumber : t.id,
-          firstName: t.firstName,
-          lastName: t.lastName,
-          email: t.email,
-          phone: t.phoneNumber || t.mobilePhone || '',
-          subject: (t.teachingSubjects?.[0] || t.subjectsTaught?.[0] || '—').toString(),
-          qualifications: (t.qualifications || []).join(', ') || '—',
-          experience: 0,
-            status: t.status === 'active' ? 'active' : (filters.status !== 'all' ? (filters.status as Teacher['status']) : 'inactive'),
-
-          joinDate: t.dateJoined || (t.hireDate || new Date().toISOString().split('T')[0]),
-          avatar: t.photo || null as any,
-        }));
-
-        const subjectFiltered = filters.subject === 'all' ? mapped : mapped.filter((t) => t.subject === filters.subject);
-        setTeachers(subjectFiltered);
-        setPagination({
-          page: res.pagination.page,
-          limit: res.pagination.limit,
-          total: res.pagination.total,
-          pages: res.pagination.pages,
-        });
+        await fetchTeachers({ silent: true });
       } catch (e) {
         console.error(e);
         setDeleteDialog({ isOpen: false, teacher: null, isLoading: false });
@@ -719,7 +733,7 @@ export default function AdminTeachers() {
     };
 
     void run();
-  }, [deleteDialog.teacher, currentPage, filters.searchTerm, filters.status, filters.subject, setTeachers]);
+  }, [deleteDialog.teacher, fetchTeachers]);
 
 
 
@@ -786,10 +800,22 @@ export default function AdminTeachers() {
                 <Filter className="h-5 w-5 text-muted-foreground" />
                 <CardTitle className="text-lg">Filters & Search</CardTitle>
               </div>
-              <Button size="sm" className="gap-2" onClick={() => navigate('/school-admin/teachers?add=1')}>
-                <Plus className="h-4 w-4" />
-                Add Teacher
-              </Button>
+              <div className="flex items-center gap-2">
+                <Button
+                  size="sm"
+                  variant="outline"
+                  className="gap-2"
+                  onClick={handleRefresh}
+                  disabled={refreshing || loading}
+                >
+                  <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
+                  Refresh
+                </Button>
+                <Button size="sm" className="gap-2" onClick={() => navigate('/school-admin/teachers?add=1')}>
+                  <Plus className="h-4 w-4" />
+                  Add Teacher
+                </Button>
+              </div>
             </div>
           </CardHeader>
           <CardContent>
@@ -875,6 +901,21 @@ export default function AdminTeachers() {
           isLoading={deleteDialog.isLoading}
         />
       )}
+
+      {/* View Profile Dialog */}
+      <ViewTeacherModal
+        open={viewDialog.isOpen}
+        onOpenChange={(open) => (open ? null : closeViewDialog())}
+        teacherId={viewDialog.teacherId}
+      />
+
+      {/* Edit Profile Dialog */}
+      <EditTeacherModal
+        open={editDialog.isOpen}
+        onOpenChange={(open) => (open ? null : closeEditDialog())}
+        teacherId={editDialog.teacherId}
+        onSuccess={handleEditSuccess}
+      />
     </div>
   );
 }
