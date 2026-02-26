import React, { useState } from "react";

import { StaffMember, StaffManagementProps } from "./types";
import { SEED_STAFF } from "./constants";
import { DashboardView, ListView, FormView, DetailsView, PerformanceView } from "./components";

/* ─── MAIN ───────────────────────────────────────────────────────────── */
const StaffManagement: React.FC<StaffManagementProps> = ({ onBack }) => {
  const [view, setView]         = useState<"dashboard"|"list"|"form"|"details"|"performance">("dashboard");
  const [staff, setStaff]       = useState<StaffMember[]>(SEED_STAFF);
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
  const handleSave = () => {
    const rec: StaffMember = { ...form, teachingSubjects: slots.filter(Boolean), id: selected?.id ?? Date.now().toString() };
    if (selected) { setStaff(s => s.map(x => x.id === selected.id ? rec : x)); notify("Staff record updated."); }
    else          { setStaff(s => [...s, rec]); notify("New staff member registered."); }
    setView("list");
  };
  const del = (id: string) => { setStaff(s => s.filter(x => x.id !== id)); notify("Staff record deleted."); };

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
        onRefresh={() => {}}
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
