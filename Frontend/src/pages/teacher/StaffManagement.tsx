import React, { useState } from "react";
import {
  Users, UserPlus, ArrowLeft, Edit, Trash2, Search,
  Download, Eye, MapPin, Phone, Mail, IdCard, BookOpen,
  Award, UserCheck, ChevronDown, X, Save, School,
  Briefcase, CheckCircle, Clock, AlertCircle, XCircle
} from "lucide-react";

/* ─── TOKENS ─────────────────────────────────────────────────────────── */
const T = {
  bg: "#F5F6FA",
  surface: "#FFFFFF",
  border: "#E4E7EE",
  text: { primary: "#0F1624", secondary: "#4B5568", muted: "#8A94A6" },
  accent: "#1A56DB",
  accentSoft: "#EBF0FF",
};

const STATUS_CFG: Record<string, { icon: React.ElementType; bg: string; text: string; border: string }> = {
  "Active":     { icon: CheckCircle, bg: "#F0FDF4", text: "#15803D", border: "#86EFAC" },
  "Inactive":   { icon: XCircle,     bg: "#F8FAFC", text: "#475569", border: "#CBD5E1" },
  "On Leave":   { icon: Clock,       bg: "#FFFBEB", text: "#B45309", border: "#FCD34D" },
  "Terminated": { icon: AlertCircle, bg: "#FEF2F2", text: "#B91C1C", border: "#FCA5A5" },
};

/* ─── TYPES ──────────────────────────────────────────────────────────── */
interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  designation: string;
  dateOfBirth: string;
  contractStart: string;
  contractEnd: string;
  jobStatus: string;
  sex: string;
  branch: string;
  county: string;
  location: string;
  email: string;
  mobilePhone: string;
  tscNumber: string;
  teachingSubjects: string[];
  qualifications: string[];
  salary: number;
  hireDate: string;
}

interface StaffManagementProps {
  onBack?: () => void;
}

/* ─── CONSTANTS ──────────────────────────────────────────────────────── */
const DESIGNATIONS = ["Head Teacher","Deputy Head Teacher","Senior Teacher","Teacher","Assistant Teacher","Physical Education Teacher","Support Staff"];
const BRANCHES     = ["Nairobi - Mathare","Kakamega - Butere"];
const COUNTIES     = ["Nairobi","Mombasa","Kisumu","Nakuru","Kakamega","Eldoret","Nyeri","Machakos"];
const ALL_SUBJECTS = ["Mathematics","English","Kiswahili","Science","Social Studies","Physics","Chemistry","Biology","History","Geography","CRE","Physical Education","Health Sciences","Literature","Business Studies","Computer Studies","Art & Design","Music","Home Science","Agriculture"];
const AVATAR_COLORS = ["#1A56DB","#7C3AED","#059669","#B45309","#0891B2","#DC2626","#9333EA"];

const SEED_STAFF: StaffMember[] = [
  { id:"1", firstName:"Jeremy",  lastName:"Bravoge",   idNumber:"ID001234567", designation:"Senior Teacher",            dateOfBirth:"1985-06-15", contractStart:"2020-01-15", contractEnd:"2025-01-15", jobStatus:"Active",   sex:"Male",   branch:"Nairobi - Mathare", county:"Nairobi",  location:"Mathare North",  email:"jeremy.bravoge@school.ac.ke",  mobilePhone:"+254712345678", tscNumber:"TSC123456", teachingSubjects:["Mathematics","Physics"],              qualifications:["B.Ed Mathematics","Diploma in Education"],  salary:45000, hireDate:"2020-01-15" },
  { id:"2", firstName:"Mary",    lastName:"Wanjiku",   idNumber:"ID002345678", designation:"Head Teacher",               dateOfBirth:"1980-03-22", contractStart:"2018-09-01", contractEnd:"2026-09-01", jobStatus:"Active",   sex:"Female", branch:"Nairobi - Mathare", county:"Nairobi",  location:"Mathare South",  email:"mary.wanjiku@school.ac.ke",    mobilePhone:"+254723456789", tscNumber:"TSC234567", teachingSubjects:["English","Literature"],                qualifications:["M.Ed Educational Management","B.Ed English"], salary:65000, hireDate:"2018-09-01" },
  { id:"3", firstName:"David",   lastName:"Kiprotich", idNumber:"ID003456789", designation:"Physical Education Teacher", dateOfBirth:"1990-11-08", contractStart:"2021-03-01", contractEnd:"2024-03-01", jobStatus:"On Leave", sex:"Male",   branch:"Kakamega - Butere", county:"Kakamega", location:"Butere Township", email:"david.kiprotich@school.ac.ke",  mobilePhone:"+254734567890", tscNumber:"TSC345678", teachingSubjects:["Physical Education"],                 qualifications:["Diploma in Physical Education"],             salary:35000, hireDate:"2021-03-01" },
  { id:"4", firstName:"Grace",   lastName:"Achieng",   idNumber:"ID004567890", designation:"Teacher",                    dateOfBirth:"1992-07-14", contractStart:"2022-01-10", contractEnd:"2027-01-10", jobStatus:"Active",   sex:"Female", branch:"Nairobi - Mathare", county:"Nairobi",  location:"Mathare East",   email:"grace.achieng@school.ac.ke",    mobilePhone:"+254745678901", tscNumber:"TSC456789", teachingSubjects:["Kiswahili","Social Studies"],          qualifications:["B.Ed Arts","Certificate in Education"],      salary:38000, hireDate:"2022-01-10" },
  { id:"5", firstName:"Samuel",  lastName:"Otieno",    idNumber:"ID005678901", designation:"Deputy Head Teacher",        dateOfBirth:"1978-02-28", contractStart:"2016-06-01", contractEnd:"2026-06-01", jobStatus:"Active",   sex:"Male",   branch:"Kakamega - Butere", county:"Kakamega", location:"Butere North",    email:"samuel.otieno@school.ac.ke",    mobilePhone:"+254756789012", tscNumber:"TSC567890", teachingSubjects:["Biology","Chemistry"],                 qualifications:["M.Sc Biology","B.Ed Science"],               salary:58000, hireDate:"2016-06-01" },
  { id:"6", firstName:"Faith",   lastName:"Njeri",     idNumber:"ID006789012", designation:"Support Staff",              dateOfBirth:"1995-09-03", contractStart:"2023-02-01", contractEnd:"2025-02-01", jobStatus:"Inactive", sex:"Female", branch:"Nairobi - Mathare", county:"Nairobi",  location:"Mathare West",   email:"faith.njeri@school.ac.ke",      mobilePhone:"+254767890123", tscNumber:"N/A",       teachingSubjects:[],                                      qualifications:["Certificate in Office Administration"],       salary:22000, hireDate:"2023-02-01" },
];

/* ─── HELPERS ────────────────────────────────────────────────────────── */
const fmt      = (n: number) => `KSh ${Number(n).toLocaleString("en-KE")}`;
const initials = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();
const avatarBg = (id: string) => AVATAR_COLORS[parseInt(id) % AVATAR_COLORS.length];

/* ─── SHARED CSS-in-JS STYLES ────────────────────────────────────────── */
const inp: React.CSSProperties = {
  width: "100%", padding: "8px 12px",
  border: `1px solid ${T.border}`, borderRadius: 8,
  fontSize: 13, color: T.text.primary, background: "white",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};
const sel: React.CSSProperties = { ...inp, appearance: "none", cursor: "pointer" };

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  button, select, input { font-family: inherit; }
  .card-h { transition: all 0.18s; }
  .card-h:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.10) !important; transform: translateY(-2px); }
  .icon-btn:hover { background: #F1F5F9 !important; }
  .row-h:hover { background: #F8FAFC !important; cursor: pointer; }
  @keyframes fu { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .fu { animation: fu 0.25s ease both; }
`;

/* ─── SMALL COMPONENTS ───────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG["Inactive"];
  const Icon = cfg.icon;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:cfg.bg, color:cfg.text, border:`1px solid ${cfg.border}` }}>
      <Icon size={11} /> {status}
    </span>
  );
}

function Avatar({ staff, size = 36 }: { staff: StaffMember; size?: number }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:avatarBg(staff.id), display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:Math.round(size*0.36), fontWeight:800, color:"white" }}>
      {initials(staff.firstName, staff.lastName)}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = T.accent, bg = T.accentSoft }: { icon: React.ElementType; label: string; value: string | number; color?: string; bg?: string }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 20px", display:"flex", alignItems:"center", gap:14 }}>
      <div style={{ width:40, height:40, borderRadius:10, background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:T.text.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:22, fontWeight:800, color:T.text.primary, lineHeight:1 }}>{value}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
      <span style={{ fontSize:12, color:T.text.muted, fontWeight:600, minWidth:130, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13, color:T.text.primary, fontWeight:600, textAlign:"right", maxWidth:240, wordBreak:"break-word" }}>{value}</span>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:T.text.secondary, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>
        {label}{required && <span style={{ color:"#DC2626", marginLeft:2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function NavBtn({ icon: Icon, label, onClick, primary }: { icon: React.ElementType; label: string; onClick?: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background: primary ? T.accent : "rgba(255,255,255,0.08)", border: primary ? "none" : "1px solid rgba(255,255,255,0.12)", borderRadius:8, color: primary ? "white" : "rgba(255,255,255,0.75)", fontSize:12, fontWeight: primary ? 700 : 600, cursor:"pointer" }}>
      <Icon size={13} /> {label}
    </button>
  );
}

function TopNav({ crumb, onBack, actions }: { crumb: string; onBack?: () => void; actions?: React.ReactNode }) {
  return (
    <div style={{ background:"#0a1a0a", borderBottom:"1px solid rgba(197, 197, 197, 0.75)", padding:"13px 32px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:T.accent, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <School size={16} color="white" />
        </div>
        <span style={{ fontSize:13, fontWeight:700, color:"rgba(255, 255, 255, 0.85)" }}>CBC School</span>
        <span style={{ color:"rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ fontSize:13, color:"rgba(255,255,255,0.45)" }}>Staff</span>
        {crumb && <><span style={{ color:"rgba(255,255,255,0.2)" }}>›</span><span style={{ fontSize:13, color:"rgba(255,255,255,0.65)", fontWeight:600 }}>{crumb}</span></>}
      </div>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        {onBack && (
          <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"rgba(255,255,255,0.75)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            <ArrowLeft size={13} /> Back
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}

function HeroBar({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div style={{ background:"linear-gradient(to bottom right, #166534, #16a34a, #10b981)", padding:"22px 32px 30px" }}>
      <div style={{ maxWidth:1400, margin:"0 auto" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"rgba(163, 0, 0, 0.28)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>Republic of Kenya · CBC School · HR</div>
        <h1 style={{ fontSize:24, fontWeight:800, color:"white", marginBottom: sub ? 4 : 20 }}>{title}</h1>
        {sub && <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:20 }}>{sub}</p>}
        {children}
      </div>
    </div>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, background:"#111827", color:"white", padding:"12px 20px", borderRadius:12, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:10, boxShadow:"0 8px 32px rgba(0,0,0,0.25)", zIndex:900 }}>
      <CheckCircle size={15} color="#4ADE80" /> {msg}
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────── */
const StaffManagement: React.FC<StaffManagementProps> = ({ onBack }) => {
  const [view, setView]         = useState<"dashboard"|"list"|"form"|"details">("dashboard");
  const [staff, setStaff]       = useState<StaffMember[]>(SEED_STAFF);
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [query, setQuery]       = useState("");
  const [fStatus, setFStatus]   = useState("all");
  const [fBranch, setFBranch]   = useState("all");
  const [tab, setTab]           = useState<"general"|"teaching"|"contact">("general");
  const [toast, setToast]       = useState<string | null>(null);
  const [slots, setSlots]       = useState<string[]>(["","","",""]);

  const empty: StaffMember = { id:"", firstName:"", lastName:"", idNumber:"", designation:"", dateOfBirth:"", contractStart:"", contractEnd:"", jobStatus:"Active", sex:"Male", branch:"", county:"", location:"", email:"", mobilePhone:"", tscNumber:"", teachingSubjects:[], qualifications:[], salary:0, hireDate:"" };
  const [form, setForm] = useState<StaffMember>(empty);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = staff.filter(s => {
    const q = query.toLowerCase();
    return (!q || `${s.firstName} ${s.lastName} ${s.idNumber} ${s.email} ${s.tscNumber}`.toLowerCase().includes(q))
      && (fStatus === "all" || s.jobStatus === fStatus)
      && (fBranch === "all" || s.branch === fBranch);
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

  /* ══════════ DASHBOARD ══════════ */
  if (view === "dashboard") return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <style>{GLOBAL_CSS}</style>
      <TopNav crumb="Dashboard" onBack={onBack} actions={<NavBtn icon={UserPlus} label="Register Staff" onClick={openCreate} primary />} />
      <HeroBar title="Staff Management" sub="Teaching and non-teaching staff records">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:12 }}>
          <StatCard icon={Users}     label="Total"      value={staff.length}                                               color={T.accent}  bg={T.accentSoft} />
          <StatCard icon={UserCheck} label="Active"     value={staff.filter(s=>s.jobStatus==="Active").length}             color="#15803D"   bg="#F0FDF4" />
          <StatCard icon={Clock}     label="On Leave"   value={staff.filter(s=>s.jobStatus==="On Leave").length}           color="#B45309"   bg="#FFFBEB" />
          <StatCard icon={MapPin}    label="Branches"   value={[...new Set(staff.map(s=>s.branch))].length}                color="#7C3AED"   bg="#F5F3FF" />
          <StatCard icon={Briefcase} label="Roles"      value={[...new Set(staff.map(s=>s.designation))].length}           color="#0891B2"   bg="#ECFEFF" />
        </div>
      </HeroBar>

      <div style={{ maxWidth:1400, margin:"0 auto", padding:"22px 24px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14, marginBottom:22 }}>
          {([
            { icon:UserPlus, label:"Register New Staff",   sub:"Add teacher or support staff", action:openCreate,                                color:"#1A56DB", bg:"#EBF0FF" },
            { icon:Users,    label:"View All Staff",        sub:"Browse & manage all records",  action:() => setView("list"),                     color:"#15803D", bg:"#F0FDF4" },
            { icon:Download, label:"Export Records",        sub:"Download CSV or PDF",          action:() => notify("Export coming soon"),         color:"#7C3AED", bg:"#F5F3FF" },
            { icon:Award,    label:"Staff Reports",         sub:"Attendance & performance",     action:() => notify("Reports coming soon"),        color:"#B45309", bg:"#FEF3C7" },
          ] as const).map(({ icon:Icon, label, sub, action, color, bg }) => (
            <div key={label} className="card-h" onClick={action} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px", cursor:"pointer", display:"flex", gap:14, alignItems:"flex-start" }}>
              <div style={{ width:38, height:38, borderRadius:10, background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon size={17} color={color} /></div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.text.primary, marginBottom:2 }}>{label}</div>
                <div style={{ fontSize:12, color:T.text.muted }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"13px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:13, fontWeight:800, color:T.text.primary }}>Recent Staff</span>
            <button onClick={() => setView("list")} style={{ fontSize:12, fontWeight:600, color:T.accent, background:"none", border:"none", cursor:"pointer" }}>View all →</button>
          </div>
          {staff.slice(0,5).map((s,i) => (
            <div key={s.id} className="row-h" onClick={() => { setSelected(s); setView("details"); }} style={{ display:"flex", alignItems:"center", gap:13, padding:"11px 20px", borderBottom: i<4 ? `1px solid ${T.border}` : "none" }}>
              <Avatar staff={s} size={34} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.text.primary }}>{s.firstName} {s.lastName}</div>
                <div style={{ fontSize:11, color:T.text.muted }}>{s.designation} · {s.branch}</div>
              </div>
              <StatusBadge status={s.jobStatus} />
            </div>
          ))}
        </div>
      </div>
      {toast && <Toast msg={toast} />}
    </div>
  );

  /* ══════════ LIST ══════════ */
  if (view === "list") return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <style>{GLOBAL_CSS}</style>
      <TopNav crumb="All Staff" onBack={() => setView("dashboard")} actions={
        <><NavBtn icon={Download} label="Export" onClick={() => notify("Export coming soon")} /><NavBtn icon={UserPlus} label="Add Staff" onClick={openCreate} primary /></>
      }/>
      <HeroBar title="All Staff" sub={`${filtered.length} of ${staff.length} staff members`}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10 }}>
          {(["All","Active","On Leave","Inactive","Terminated"] as const).map(lbl => (
            <div key={lbl} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 14px" }}>
              <div style={{ fontSize:10, fontWeight:700, color:T.text.muted, textTransform:"uppercase", letterSpacing:"0.07em" }}>{lbl}</div>
              <div style={{ fontSize:19, fontWeight:800, color:T.text.primary, lineHeight:1.2 }}>{lbl==="All" ? staff.length : staff.filter(s=>s.jobStatus===lbl).length}</div>
            </div>
          ))}
        </div>
      </HeroBar>

      {/* Filters sticky bar */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"11px 32px", position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ maxWidth:1400, margin:"0 auto", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:"1 1 200px", maxWidth:270 }}>
            <Search size={14} color={T.text.muted} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, ID, email, TSC…" style={{ ...inp, paddingLeft:32, background:T.bg }} />
          </div>
          {[
            { val:fStatus, set:setFStatus, opts:[["all","All Statuses"], ...Object.keys(STATUS_CFG).map(k=>[k,k])], w:150 },
            { val:fBranch, set:setFBranch, opts:[["all","All Branches"], ...BRANCHES.map(b=>[b,b])], w:190 },
          ].map(({ val, set, opts, w }, i) => (
            <div key={i} style={{ position:"relative" }}>
              <select value={val} onChange={e => set(e.target.value)} style={{ ...sel, paddingRight:28, background:T.bg, minWidth:w }}>
                {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <ChevronDown size={12} color={T.text.muted} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
            </div>
          ))}
          <span style={{ marginLeft:"auto", fontSize:12, color:T.text.muted, fontWeight:500 }}>{filtered.length} result{filtered.length!==1?"s":""}</span>
        </div>
      </div>

      <div style={{ maxWidth:1400, margin:"0 auto", padding:"20px 24px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ width:46, height:46, background:T.bg, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}><Search size={20} color={T.text.muted}/></div>
            <div style={{ fontSize:14, fontWeight:700, color:T.text.secondary }}>No staff found</div>
            <div style={{ fontSize:12, color:T.text.muted, marginTop:5 }}>Adjust your search or filters</div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(275px,1fr))", gap:14 }}>
            {filtered.map(s => (
              <div key={s.id} className="card-h fu" style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                <div style={{ height:3, background: STATUS_CFG[s.jobStatus]?.text ?? T.accent }} />
                <div style={{ padding:"13px 15px" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar staff={s} size={37} />
                      <div>
                        <div style={{ fontSize:13, fontWeight:800, color:T.text.primary, lineHeight:1.2 }}>{s.firstName} {s.lastName}</div>
                        <div style={{ fontSize:11, color:T.text.muted, marginTop:1 }}>{s.designation}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:4 }}>
                      {([
                        { Icon:Eye,    cb:() => { setSelected(s); setView("details"); }, danger:false },
                        { Icon:Edit,   cb:() => openEdit(s),                             danger:false },
                        { Icon:Trash2, cb:() => del(s.id),                               danger:true  },
                      ] as const).map(({ Icon, cb, danger }, i) => (
                        <button key={i} className="icon-btn" onClick={cb} style={{ width:28, height:28, border:`1px solid ${danger ? "#FCA5A5" : T.border}`, borderRadius:7, background: danger ? "#FEF2F2" : "white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Icon size={13} color={danger ? "#DC2626" : T.text.secondary} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:"grid", gap:5 }}>
                    {([
                      [Mail, s.email], [Phone, s.mobilePhone], [MapPin, s.branch], [IdCard, `TSC: ${s.tscNumber}`]
                    ] as [React.ElementType, string][]).map(([Icon, v]) => (
                      <div key={v} style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <Icon size={11} color={T.text.muted} />
                        <span style={{ fontSize:12, color:T.text.secondary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10, paddingTop:8, borderTop:`1px solid ${T.border}` }}>
                    <StatusBadge status={s.jobStatus} />
                    {s.salary > 0 && <span style={{ fontSize:11, fontWeight:700, color:T.text.muted }}>{fmt(s.salary)}/mo</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <Toast msg={toast} />}
    </div>
  );

  /* ══════════ FORM ══════════ */
  if (view === "form") {
    const sectionHeader = (title: string) => (
      <div style={{ fontSize:12, fontWeight:800, color:T.text.primary, marginBottom:14, paddingBottom:9, borderBottom:`1px solid ${T.border}`, textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>{title}</div>
    );
    const DD = ({ k, opts, placeholder }: { k: keyof StaffMember; opts: string[]; placeholder?: string }) => (
      <div style={{ position:"relative" }}>
        <select style={sel} value={String(form[k])} onChange={e => setF(k, e.target.value as StaffMember[typeof k])}>
          {placeholder && <option value="">{placeholder}</option>}
          {opts.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={12} color={T.text.muted} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
      </div>
    );

    return (
      <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
        <style>{GLOBAL_CSS}</style>
        <TopNav crumb={selected ? "Edit Staff" : "Register Staff"} onBack={() => setView("list")} actions={
          <><NavBtn icon={X} label="Cancel" onClick={() => setView("list")} /><NavBtn icon={Save} label={selected ? "Save Changes" : "Register"} onClick={handleSave} primary /></>
        }/>
        <div style={{ background:"#0F1624", padding:"18px 32px 26px" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            <h1 style={{ fontSize:20, fontWeight:800, color:"white", marginBottom:3 }}>{selected ? `Edit — ${selected.firstName} ${selected.lastName}` : "Register New Staff Member"}</h1>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>Fields marked * are required</p>
          </div>
        </div>

        <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"0 32px" }}>
          <div style={{ maxWidth:1100, margin:"0 auto", display:"flex" }}>
            {(["general","teaching","contact"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding:"12px 18px", border:"none", background:"transparent", cursor:"pointer", fontSize:13, fontWeight: tab===t ? 700 : 500, color: tab===t ? T.accent : T.text.muted, borderBottom:`2.5px solid ${tab===t ? T.accent : "transparent"}` }}>
                {t==="general" ? "Personal & Employment" : t==="teaching" ? "Teaching Details" : "Contact & Address"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth:1100, margin:"0 auto", padding:"20px 24px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 205px", gap:16 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {tab === "general" && <>
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 20px" }}>
                  {sectionHeader("Personal Information")}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <FormField label="First Name" required><input style={inp} value={form.firstName}  onChange={e => setF("firstName", e.target.value)}  placeholder="e.g. Jeremy"/></FormField>
                    <FormField label="Last Name"  required><input style={inp} value={form.lastName}   onChange={e => setF("lastName",  e.target.value)}  placeholder="e.g. Bravoge"/></FormField>
                    <FormField label="National ID" required><input style={inp} value={form.idNumber}  onChange={e => setF("idNumber",  e.target.value)}  placeholder="e.g. ID001234567"/></FormField>
                    <FormField label="Gender" required><DD k="sex" opts={["Male","Female"]} /></FormField>
                    <FormField label="Date of Birth"><input style={inp} type="date" value={form.dateOfBirth}  onChange={e => setF("dateOfBirth", e.target.value)}/></FormField>
                    <FormField label="Salary (KSh/month)"><input style={inp} type="number" value={form.salary || ""} onChange={e => setF("salary", Number(e.target.value))} placeholder="e.g. 45000"/></FormField>
                  </div>
                </div>
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 20px" }}>
                  {sectionHeader("Employment Details")}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <FormField label="Designation"  required><DD k="designation"  opts={DESIGNATIONS} placeholder="Select…" /></FormField>
                    <FormField label="Job Status"            ><DD k="jobStatus"    opts={Object.keys(STATUS_CFG)} /></FormField>
                    <FormField label="Branch"       required><DD k="branch"       opts={BRANCHES} placeholder="Select…" /></FormField>
                    <FormField label="Hire Date"            ><input style={inp} type="date" value={form.hireDate}       onChange={e => setF("hireDate",       e.target.value)}/></FormField>
                    <FormField label="Contract Start"       ><input style={inp} type="date" value={form.contractStart}  onChange={e => setF("contractStart",  e.target.value)}/></FormField>
                    <FormField label="Contract End"         ><input style={inp} type="date" value={form.contractEnd}    onChange={e => setF("contractEnd",    e.target.value)}/></FormField>
                  </div>
                </div>
              </>}

              {tab === "teaching" && (
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 20px" }}>
                  {sectionHeader("Teaching Details")}
                  <div style={{ display:"grid", gap:14 }}>
                    <FormField label="TSC Number"><input style={inp} value={form.tscNumber} onChange={e => setF("tscNumber", e.target.value)} placeholder="e.g. TSC123456"/></FormField>
                    <div>
                      <label style={{ display:"block", fontSize:11, fontWeight:700, color:T.text.secondary, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Subjects Assigned (up to 4)</label>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        {slots.map((s, i) => (
                          <div key={i}>
                            <label style={{ fontSize:11, color:T.text.muted, display:"block", marginBottom:4 }}>Subject {i+1}</label>
                            <div style={{ position:"relative" }}>
                              <select style={sel} value={s} onChange={e => { const ns=[...slots]; ns[i]=e.target.value; setSlots(ns); }}>
                                <option value="">— None —</option>
                                {ALL_SUBJECTS.map(sub => <option key={sub}>{sub}</option>)}
                              </select>
                              <ChevronDown size={12} color={T.text.muted} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <FormField label="Qualifications (comma separated)">
                      <input style={inp} value={form.qualifications.join(", ")} onChange={e => setF("qualifications", e.target.value.split(",").map(q=>q.trim()).filter(Boolean))} placeholder="e.g. B.Ed Mathematics, Diploma in Education"/>
                    </FormField>
                  </div>
                </div>
              )}

              {tab === "contact" && (
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 20px" }}>
                  {sectionHeader("Contact & Address")}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <FormField label="Email" required><input style={inp} type="email" value={form.email}       onChange={e => setF("email",       e.target.value)} placeholder="name@school.ac.ke"/></FormField>
                    <FormField label="Mobile" required><input style={inp}            value={form.mobilePhone} onChange={e => setF("mobilePhone", e.target.value)} placeholder="+254712345678"/></FormField>
                    <FormField label="County"><DD k="county" opts={COUNTIES} placeholder="Select county…" /></FormField>
                    <FormField label="Location"><input style={inp} value={form.location} onChange={e => setF("location", e.target.value)} placeholder="e.g. Mathare North"/></FormField>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px", textAlign:"center" }}>
                <div style={{ width:60, height:60, borderRadius:"50%", background: form.firstName ? avatarBg(selected?.id ?? "0") : T.bg, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px", fontSize:20, fontWeight:800, color: form.firstName ? "white" : T.text.muted }}>
                  {form.firstName && form.lastName ? initials(form.firstName, form.lastName) : <Users size={22} color={T.text.muted}/>}
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:T.text.primary }}>{form.firstName||"First"} {form.lastName||"Last"}</div>
                <div style={{ fontSize:11, color:T.text.muted, marginTop:2 }}>{form.designation||"No designation"}</div>
                {form.jobStatus && <div style={{ marginTop:8 }}><StatusBadge status={form.jobStatus}/></div>}
              </div>
              <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"14px 16px" }}>
                <div style={{ fontSize:11, fontWeight:800, color:T.text.primary, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>Completion</div>
                {([["Name",!!(form.firstName&&form.lastName)],["ID Number",!!form.idNumber],["Designation",!!form.designation],["Branch",!!form.branch],["Email",!!form.email],["Phone",!!form.mobilePhone]] as [string,boolean][]).map(([lbl,done])=>(
                  <div key={lbl} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ fontSize:12, color:T.text.secondary }}>{lbl}</span>
                    {done ? <CheckCircle size={14} color="#15803D"/> : <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${T.border}` }}/>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {toast && <Toast msg={toast}/>}
      </div>
    );
  }

  /* ══════════ DETAILS ══════════ */
  if (view === "details" && selected) return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <style>{GLOBAL_CSS}</style>
      <TopNav crumb="Profile" onBack={() => setView("list")} actions={<NavBtn icon={Edit} label="Edit Profile" onClick={() => openEdit(selected)} primary/>}/>
      <div style={{ background:"#0F1624", padding:"22px 32px 30px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", gap:18 }}>
          <Avatar staff={selected} size={66}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.28)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{selected.branch}</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:"white", marginBottom:5 }}>{selected.firstName} {selected.lastName}</h1>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <span style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>{selected.designation}</span>
              <StatusBadge status={selected.jobStatus}/>
              {selected.tscNumber && selected.tscNumber!=="N/A" && <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>TSC: {selected.tscNumber}</span>}
            </div>
          </div>
          {selected.salary > 0 && (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Monthly Salary</div>
              <div style={{ fontSize:20, fontWeight:800, color:"white" }}>{fmt(selected.salary)}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"22px 24px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {([
            { icon:IdCard,    label:"Personal",   color:"#1A56DB", bg:T.accentSoft, rows:[["Full Name",`${selected.firstName} ${selected.lastName}`],["National ID",selected.idNumber],["Date of Birth",selected.dateOfBirth],["Gender",selected.sex],["TSC Number",selected.tscNumber]] },
            { icon:Phone,     label:"Contact",    color:"#15803D", bg:"#F0FDF4",    rows:[["Email",selected.email],["Mobile",selected.mobilePhone],["County",selected.county],["Location",selected.location]] },
            { icon:Briefcase, label:"Employment", color:"#B45309", bg:"#FFFBEB",    rows:[["Designation",selected.designation],["Branch",selected.branch],["Status",selected.jobStatus],["Hire Date",selected.hireDate],["Contract Start",selected.contractStart],["Contract End",selected.contractEnd]] },
          ] as { icon: React.ElementType; label: string; color: string; bg: string; rows: [string,string][] }[]).map(({ icon:Icon, label, color, bg, rows }) => (
            <div key={label} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"12px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:bg, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon size={14} color={color}/></div>
                <span style={{ fontSize:13, fontWeight:800, color:T.text.primary }}>{label} Information</span>
              </div>
              <div style={{ padding:"8px 18px 12px" }}>{rows.map(([l,v]) => <DetailRow key={l} label={l} value={v}/>)}</div>
            </div>
          ))}

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
            <div style={{ padding:"12px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center" }}><BookOpen size={14} color="#1D4ED8"/></div>
              <span style={{ fontSize:13, fontWeight:800, color:T.text.primary }}>Teaching Details</span>
            </div>
            <div style={{ padding:"14px 18px" }}>
              {selected.teachingSubjects.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:T.text.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>Subjects</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{selected.teachingSubjects.map(s=><span key={s} style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20, background:T.accentSoft, color:T.accent }}>{s}</span>)}</div>
                </div>
              )}
              {selected.qualifications.length > 0 && (
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:T.text.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>Qualifications</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{selected.qualifications.map(q=><span key={q} style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20, background:"#F0FDF4", color:"#15803D" }}>{q}</span>)}</div>
                </div>
              )}
              {!selected.teachingSubjects.length && !selected.qualifications.length && <div style={{ fontSize:13, color:T.text.muted }}>No teaching details recorded.</div>}
            </div>
          </div>
        </div>
      </div>
      {toast && <Toast msg={toast}/>}
    </div>
  );

  return null;
};

export default StaffManagement;