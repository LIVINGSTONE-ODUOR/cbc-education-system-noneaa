import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { StaffMember, StaffManagementProps } from "./types";
import { 
  getTeachers, 
  inviteTeacher, 
  updateTeacher, 
  deleteTeacher, 
  mapBackendToStaffMember 
} from "@/lib/api/teacherApi";

const camelToSnake = (obj: Record<string, any>): Record<string, any> => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      return [snakeKey, value];
    })
  );
};
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
  const [slots, setSlots]       = useState<string[]>(["","","",""]);


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
    mobilePhone:"", 
    tscNumber:"", 
    teachingSubjects:[], 
    qualifications:[], 
    salary:0, 
    hireDate:"",
    staffType: "teaching",
    photo: "" // Photo URL
  };
  const [form, setForm] = useState<StaffMember>(empty);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = staff.filter(s => {
    const q = query.toLowerCase();
    const matchesQuery = !q || `${s.firstName} ${s.lastName} ${s.idNumber} ${s.email} ${s.tscNumber}`.toLowerCase().includes(q);
    const matchesStatus = fStatus === "all" || s.jobStatus === fStatus;
    const matchesBranch = fBranch === "all" || s.branch === fBranch;
    const matchesStaffType = fStaffType === "all" || s.staffType === fStaffType;
    
    return matchesQuery && matchesStatus && matchesBranch && matchesStaffType;
  });

  const openEdit = (m: StaffMember) => {
    setSelected(m); setForm({...m});
    setSlots([...m.teachingSubjects, "","",""].slice(0,4));
    setTab("general"); setView("form");
  };
  const openCreate = () => {
    setSelected(null); setForm(empty);
    setSlots(["","","",""]); setTab("general"); setView("form");
  };
  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getTeachers({ page: 1, limit: 100 });
      setStaff(res.data.teachers.map(mapBackendToStaffMember));
    } catch (err: any) {
      setError(err.message);
      setToast(`Failed to load staff: ${err.message}`);
      console.error('Fetch teachers error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshKey]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  const handleSave = async () => {
    // Validate for update only
    if (selected && !selected.id) {
      const msg = 'Invalid teacher ID. Please refresh the list.';
      setToast(msg);
      return;
    }

    try {

      const payload = {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone_number: form.mobilePhone || undefined,
        tsc_number: form.tscNumber || undefined,
        qualifications: form.qualifications || undefined,
        designation: form.designation,
        branch: form.branch,
        id_number: form.idNumber,
      } as Parameters<typeof inviteTeacher>[0];
      
      console.log('[DEBUG] handleSave payload:', payload);

      if (selected?.id) {
        // Update existing
        console.log('[DEBUG] Updating teacher:', selected.id);
        await updateTeacher(selected.id, payload, schoolId);
        setToast("Staff record updated successfully.");
      } else {
        // Create new
        console.log('[DEBUG] Creating new teacher');
        await inviteTeacher(payload);
        setToast("New staff member invited successfully. They will receive an email to complete registration.");
      }
      
      setView("list");
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      console.error('[DEBUG] handleSave error:', err);
      setToast(`Operation failed: ${err.message}`);
    }
  };


  const del = async (id: string) => {
    try {
      await deleteTeacher(id);
      setToast("Staff record deleted.");
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      setToast(`Delete failed: ${err.message}`);
      console.error('Delete error:', err);
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
        onBack={() => setView("list")}
        onSave={handleSave}
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
        }))}
      />
    );
  }

  return null;
};

export default StaffManagement;
