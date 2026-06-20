import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { StaffMember, StaffManagementProps } from "./types";
import { 
  getTeachers, 
  inviteTeacher, 
  updateTeacher, 
  deleteTeacher
} from "@/lib/api/teacherApi";
import { getBranches, type Branch } from "@/lib/api/schoolsApi";
import { uploadStaffPhoto } from "./photoUtils";

import { DashboardView, ListView, FormView, DetailsView, PerformanceView } from "./components";


/* ─── MAIN ───────────────────────────────────────────────────────────── */
const StaffManagement: React.FC<StaffManagementProps> = ({ onBack }) => {
  const { isAuthenticated, schoolId } = useAuth();
  const [view, setView]         = useState<"dashboard"|"list"|"form"|"details"|"performance">("dashboard");
  const [staff, setStaff]       = useState<StaffMember[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [query, setQuery]       = useState("");
  const [fStatus, setFStatus]   = useState("all");
  const [fBranch, setFBranch]   = useState("all");
  const [fStaffType, setFStaffType] = useState("all");
  const [tab, setTab]           = useState<"general"|"teaching"|"contact">("general");
  const [toast, setToast]       = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, teacher: StaffMember | null}>({show: false, teacher: null});
  const [deleting, setDeleting] = useState(false);
  const [slots, setSlots]       = useState<string[]>(["","","",""]);
  const [branches, setBranches] = useState<Branch[]>([]);


  const empty: StaffMember = { 
    id:"", 
    firstName:"", 
    lastName:"", 
    idNumber:"", 
    designation:"", 
    dateOfBirth:"", 
    contractStart:"", 
    contractEnd:"", 
    jobStatus:"Active", 
    sex:"Male", 
    branch:"", 
    county:"", 
    location:"", 
    email:"", 
    phoneNumber: "",
    tscNumber:"", 
    teachingSubjects:[], 
    qualifications:[], 
    salary:0, 
    hireDate:"",
    staffType: "teaching",
    photo: "",
    status: "active"
  };
  const [form, setForm] = useState<StaffMember>(empty);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = staff.filter(s => {
    const q = query.toLowerCase();
    const matchesQuery = !q || `${s.firstName} ${s.lastName} ${s.idNumber} ${s.email} ${s.tscNumber}`.toLowerCase().includes(q);
    const matchesStatus = fStatus === "all" || (() => {
      const status = s.jobStatus?.toLowerCase().trim();
      const filterStatus = fStatus.toLowerCase().trim();
      return status === filterStatus || 
             (filterStatus === "active" && (status === "currently working" || (!status && s.isActive !== false))) ||
             (filterStatus === "onleave" && status === "away");
    })();
    const normalizedBranch = s.branch?.trim() || "";
    const matchesBranch =
      fBranch === "all" ||
      (fBranch === "no_branch" ? normalizedBranch === "" : normalizedBranch === fBranch);
    const matchesStaffType = fStaffType === "all" || s.staffType === fStaffType;
    
    return matchesQuery && matchesStatus && matchesBranch && matchesStaffType;
  });

  const openEdit = (m: StaffMember) => {
    console.log('[DEBUG] openEdit: Loading teacher:', m.id);
    console.log('[DEBUG] openEdit: Loaded teacher photo:', m.photo);
    setSelected(m); 
    setForm({...m});
    console.log('[DEBUG] openEdit: Form updated, form.photo should now be:', m.photo);
    setSlots([...m.teachingSubjects, "","",""].slice(0,4));
    setTab("general"); setView("form");
  };
  const openCreate = () => {
    setSelected(null); setForm(empty);
    setSlots(["","","",""]); setTab("general"); setView("form");
  };

  const discardChanges = () => {
    if (selected) {
      setForm({...selected});
      setSlots([...selected.teachingSubjects, "","",""].slice(0,4));
      setTab("general");
    }
  };
  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getTeachers({ page: 1, limit: 100 });
      setStaff(result.teachers.filter((teacher): teacher is StaffMember => Boolean(teacher && teacher.id)));
    } catch (err: any) {
      setError(err.message);
      notify(`Failed to load staff: ${err.message}`);
      console.error('Fetch teachers error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshKey]);

  const fetchBranches = useCallback(async () => {
    if (!isAuthenticated || !schoolId) return;
    try {
      const branchesData = await getBranches(schoolId);
      setBranches(branchesData);
    } catch (err: any) {
      console.error('Fetch branches error:', err);
      // Don't show error toast for branches, just use empty array
    }
  }, [isAuthenticated, schoolId]);

  useEffect(() => {
    refresh();
    fetchBranches();
  }, [refresh, fetchBranches]);

  const handleSave = async () => {
    // Validate for update only
    if (selected && !selected.id) {
      const msg = 'Invalid teacher ID. Please refresh the list.';
      setToast(msg);
      return;
    }

    // Sync subjects from slots to form
    const currentSubjects = slots.filter(s => s && s.trim() !== "");

    try {
      console.log('[DEBUG] handleSave payload:', form);
      console.log('[DEBUG] handleSave photo field:', form.photo);
      console.log('[DEBUG] handleSave photo is base64:', form.photo?.startsWith('data:image'));

      let photoUrl = form.photo || '';

      // If photo is base64, upload it to Supabase Storage
      if (photoUrl && photoUrl.startsWith('data:image')) {
        console.log('[DEBUG] Uploading base64 photo to Supabase...');
        const staffId = selected?.id || `temp-${Date.now()}`;
        const uploadedUrl = await uploadStaffPhoto(photoUrl, staffId);
        
        if (uploadedUrl) {
          // Upload succeeded - use the new URL
          photoUrl = uploadedUrl;
          console.log('[DEBUG] Photo uploaded successfully, new URL:', photoUrl);
          setForm(f => ({ ...f, photo: photoUrl }));
        } else {
          // Upload failed - notify user and handle gracefully
          console.warn('[DEBUG] Photo upload failed, handling gracefully');
          if (selected?.photo) {
            // Update mode: keep existing photo
            photoUrl = selected.photo;
            notify("⚠️ Photo upload failed. Keeping existing photo. Changes to other fields will be saved.");
          } else {
            // Create mode: clear photo (don't send base64 to backend)
            photoUrl = '';
            notify("⚠️ Photo upload failed. Saving without photo. You can add a photo later.");
          }
          console.log('[DEBUG] Using fallback photo URL:', photoUrl);
        }
      }

      if (selected?.id) {
        // Update existing - pass camelCase form directly with uploaded photo URL
        console.log('[DEBUG] Updating teacher:', selected.id);
        console.log('[DEBUG] form.photo before merge:', form.photo);
        console.log('[DEBUG] photoUrl to merge:', photoUrl);
        const formWithPhoto = { ...form, photo: photoUrl, subjectsTaught: currentSubjects };
        console.log('[DEBUG] formWithPhoto after merge:', formWithPhoto);
        console.log('[DEBUG] formWithPhoto.photo explicitly:', formWithPhoto.photo);
        console.log('[DEBUG] All keys in formWithPhoto:', Object.keys(formWithPhoto));
        const updated = await updateTeacher(selected.id, formWithPhoto, schoolId);
        setSelected(updated.data);
        notify("Staff record updated successfully.");
      } else {
        // Create new - convert to backend format for invite
        const invitePayload = {
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          phone_number: form.mobilePhone || form.phoneNumber,
          tsc_number: form.tscNumber || null,
          qualifications: form.qualifications || [],
          date_joined: form.hireDate || new Date().toISOString().split('T')[0],
          // NEW FIELDS
          id_number: form.idNumber,
          designation: form.designation,
          branch: form.branch,
          job_status: form.jobStatus,
          staff_type: form.staffType,
          salary: form.salary,
          contract_start: form.contractStart,
          contract_end: form.contractEnd,
          date_of_birth: form.dateOfBirth,
          gender: form.sex || form.gender,
          county: form.county,
          location: form.location,
          subjects_taught: currentSubjects,
          photo: photoUrl // Add photo to invite payload
        } as Parameters<typeof inviteTeacher>[0];
        
        console.log('[DEBUG] Creating new teacher with payload:', invitePayload);
        await inviteTeacher(invitePayload);
        notify("New staff member invited successfully. They will receive an email to complete registration.");
      }
      
      setView("list");
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      console.error('[DEBUG] handleSave error:', err);
      notify(`Operation failed: ${err.message}`);
    }
  };


  const del = async (teacher: StaffMember) => {
    setDeleteConfirm({show: true, teacher});
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.teacher) return;
    
    setDeleting(true);
    try {
      await deleteTeacher(deleteConfirm.teacher.id);
      notify("Staff record deleted.");
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      notify(`Delete failed: ${err.message}`);
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
      setDeleteConfirm({show: false, teacher: null});
    }
  };


  const setF = <K extends keyof StaffMember>(k: K, v: StaffMember[K]) => setForm(f => ({...f, [k]: v}));

  /* ══════════ RENDER VIEWS ══════════ */
  
  // Dashboard View
  if (view === "dashboard") {
    return (
      <DashboardView
        staff={staff}
        onBack={onBack}
        onViewList={() => setView("list")}
        onCreate={openCreate}
        onViewPerformance={() => setView("performance")}
        toast={toast}
      />
    );
  }

  // List View
  if (view === "list") {
    return (
      <ListView
        staff={staff}
        filtered={filtered}
        branches={branches}
        query={query}
        fStatus={fStatus}
        fBranch={fBranch}
        fStaffType={fStaffType}
        onBack={() => setView("dashboard")}
        onCreate={openCreate}
        onViewDetails={(s) => { setSelected(s); setView("details"); }}
        onEdit={openEdit}
        onDelete={del}
        onQueryChange={setQuery}
        onStatusChange={setFStatus}
        onBranchChange={setFBranch}
        onStaffTypeChange={setFStaffType}
        onRefresh={() => setRefreshKey(k => k + 1)}
        toast={toast}
      />
    );
  }


  // Form View
  if (view === "form") {
    return (
      <FormView
        form={form}
        selected={selected}
        tab={tab}
        slots={slots}
        branches={branches}
        onBack={() => setView("list")}
        onSave={handleSave}
        onDiscard={discardChanges}
        onTabChange={setTab}
        onFieldChange={setF}
        onSlotsChange={setSlots}
        toast={toast}
      />
    );
  }

  // Details View
  if (view === "details" && selected) {
    return (
      <DetailsView
        selected={selected}
        onBack={() => setView("list")}
        onEdit={() => openEdit(selected)}
        toast={toast}
      />
    );
  }

  // Performance View
  if (view === "performance") {
    return (
      <PerformanceView
        staffList={staff.map(s => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          role: s.designation,
          department: s.branch,
          attendanceRate: 95,
          presentDays: 38,
          totalDays: 40,
          performanceScore: 88,
          trend: "up" as const,
          lastCheckin: "Today 8:00 AM",
          status: "present" as const,
          employeeId: s.id,
          joiningDate: s.hireDate,
          qualifications: s.qualifications
        } as any))}
        onBack={() => setView("dashboard")}
      />
    );
  }

  // Delete Confirmation Dialog
  if (deleteConfirm.show && deleteConfirm.teacher) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <strong>{deleteConfirm.teacher.firstName} {deleteConfirm.teacher.lastName}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm({show: false, teacher: null})}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default StaffManagement;
