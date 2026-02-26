import React, { useState } from "react";
import { Users, UserPlus, Download, Award, UserCheck, Clock, MapPin, Briefcase, Search, Filter, MoreVertical, ChevronRight, TrendingUp } from "lucide-react";
import { StaffMember } from "../types";
import { T } from "../constants";
import { TopNav, NavBtn, HeroBar, StatCard, Avatar, StatusBadge, Toast } from "./index";

/* ─── DASHBOARD VIEW - MODERN UI/UX ─────────────────────────────────────── */
interface DashboardViewProps {
  staff: StaffMember[];
  onBack?: () => void;
  onViewList: () => void;
  onCreate: () => void;
  onViewPerformance?: () => void;
  toast: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  staff,
  onBack,
  onViewList,
  onCreate,
  onViewPerformance,
  toast,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const activeStaff = staff.filter(s => s.jobStatus === "Active").length;
  const onLeaveStaff = staff.filter(s => s.jobStatus === "On Leave").length;
  const branches = [...new Set(staff.map(s => s.branch))].length;
  const roles = [...new Set(staff.map(s => s.designation))].length;
  const teachingStaff = staff.filter(s => s.staffType === "teaching").length;
  const nonTeachingStaff = staff.filter(s => s.staffType === "non-teaching").length;

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#F8FAFC", 
      fontFamily: "'DM Sans',system-ui,sans-serif",
    }}>
      <TopNav
        crumb="Dashboard"
        onBack={onBack}
        actions={<NavBtn icon={UserPlus} label="Register Staff" onClick={onCreate} primary />}
      />

      {/* HERO SECTION */}
      <div style={{ 
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)",
        borderBottom: "1px solid rgba(22,163,74,0.12)",
        padding: "28px 24px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Dot-grid texture */}
        <div style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundImage: "radial-gradient(rgba(22,163,74,0.13) 1px, transparent 1px)", 
          backgroundSize: "22px 22px",
          pointerEvents: "none"
        }} />
        <div style={{ maxWidth: 1400, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: 0, marginBottom: 4 }}>
              Staff Management
            </h1>
            <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
              Manage teaching and non-teaching staff records, allocations, and performance
            </p>
          </div>

          {/* STATS GRID - ENHANCED */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))", gap: 12 }}>
            {[
              { icon: Users, label: "Total Staff", value: staff.length, color: T.accent, bg: T.accentSoft, trend: "+2 this month" },
              { icon: UserCheck, label: "Active", value: activeStaff, color: "#15803D", bg: "#F0FDF4", trend: `${Math.round((activeStaff/staff.length)*100)}% of total` },
              { icon: Clock, label: "On Leave", value: onLeaveStaff, color: "#B45309", bg: "#FFFBEB", trend: "Currently away" },
              { icon: MapPin, label: "Branches", value: branches, color: "#7C3AED", bg: "#F5F3FF", trend: "Locations" },
              { icon: Briefcase, label: "Non-Teaching", value: nonTeachingStaff, color: "#B45309", bg: "#FEF3C7", trend: "Support staff" },
              { icon: Award, label: "Teaching", value: teachingStaff, color: "#4F46E5", bg: "#EEF2FF", trend: "Educators" },
            ].map(({ icon: Icon, label, value, color, bg, trend }, idx) => (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.07)",
                  borderRadius: 16,
                  minHeight: 130,
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  transition: "all 0.25s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${color}55`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${color}18`;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                {/* Top accent bar */}
                <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}44, transparent)` }} />
                
                {/* Ghost watermark icon */}
                <div style={{ position: "absolute", bottom: -8, right: -8, opacity: 0.05 }}>
                  <Icon size={76} color={color} strokeWidth={1} />
                </div>
                
                {/* Inner content */}
                <div style={{ padding: "16px 16px 14px", position: "relative", zIndex: 1 }}>
                  {/* Icon box */}
                  <div style={{ 
                    width: 38, 
                    height: 38, 
                    borderRadius: 10, 
                    background: bg, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    border: `1px solid ${color}22`,
                    marginBottom: 12
                  }}>
                    <Icon size={17} color={color} strokeWidth={2.2} />
                  </div>
                  
                  {/* Label */}
                  <div style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    textTransform: "uppercase", 
                    letterSpacing: "0.09em",
                    color: "#9CA3AF",
                    marginBottom: 4
                  }}>
                    {label}
                  </div>
                  
                  {/* Value */}
                  <div style={{ 
                    fontSize: 28, 
                    fontWeight: 800, 
                    color: "#111827", 
                    lineHeight: 1,
                    marginBottom: 6
                  }}>
                    {value}
                  </div>
                  
                  {/* Sub/trend text */}
                  <div style={{ 
                    fontSize: 11.5, 
                    fontWeight: 600, 
                    color: color 
                  }}>
                    {trend}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>
        
        {/* QUICK ACTIONS - MODERNIZED */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text.primary, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.7 }}>
            Quick Actions
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
            {[
              { icon: UserPlus, label: "Register New Staff", sub: "Add teacher or support staff", action: onCreate, color: "#1A56DB", bg: "#EBF0FF" },
              { icon: Users, label: "View All Staff", sub: "Browse & manage records", action: onViewList, color: "#15803D", bg: "#F0FDF4" },
              { icon: Download, label: "Export Records", sub: "CSV, PDF, or Excel format", action: () => {}, color: "#7C3AED", bg: "#F5F3FF" },
              { icon: Award, label: "Performance", sub: "Attendance & reports", action: onViewPerformance || (() => {}), color: "#B45309", bg: "#FEF3C7" },
            ].map(({ icon: Icon, label, sub, action, color, bg }) => (
              <div
                key={label}
                onClick={action}
                onMouseEnter={(e) => {
                  setHoveredCard(label);
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = T.surface;
                  el.style.borderColor = color;
                  el.style.boxShadow = `0 12px 32px ${color}16`;
                  el.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  setHoveredCard(null);
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = T.surface;
                  el.style.borderColor = T.border;
                  el.style.boxShadow = "none";
                  el.style.transform = "translateY(0)";
                }}
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  padding: "18px",
                  cursor: "pointer",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "50%", background: bg, opacity: 0.3, transform: "translate(30%, -30%)" }} />
                <div style={{ 
                  width: 44, height: 44, borderRadius: 12, background: bg, display: "flex", 
                  alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", zIndex: 1 
                }}>
                  <Icon size={20} color={color} strokeWidth={2} />
                </div>
                <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text.primary, marginBottom: 3 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 12, color: T.text.muted }}>
                    {sub}
                  </div>
                </div>
                <ChevronRight size={16} color={T.text.muted} style={{ position: "relative", zIndex: 1 }} />
              </div>
            ))}
          </div>
        </div>

        {/* RECENT STAFF SECTION - ENHANCED */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          
          {/* HEADER WITH SEARCH */}
          <div style={{ 
            padding: "18px 20px", 
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: `${T.surface}`,
            flexWrap: "wrap",
            gap: 12
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text.primary, marginBottom: 4 }}>
                Recent Staff
              </div>
              <div style={{ fontSize: 12, color: T.text.muted }}>
                Latest additions to your directory
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 8,
                background: T.bg,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "6px 12px",
                flex: "0 1 180px"
              }}>
                <Search size={14} color={T.text.muted} />
                <input 
                  type="text" 
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 12,
                    color: T.text.primary,
                    outline: "none",
                    flex: 1,
                    width: "100%"
                  }}
                />
              </div>
              <button
                onClick={onViewList}
                style={{ 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: T.accent, 
                  background: "none", 
                  border: "none", 
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 8px",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = T.text.primary;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = T.accent;
                }}
              >
                View all <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* STAFF LIST */}
          <div>
            {staff.slice(0, 5).map((s, i) => (
              <div
                key={s.id}
                onClick={() => { /* Will be handled by parent */ }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = T.bg;
                  const btn = el.querySelector('[data-action-menu]') as HTMLElement;
                  if (btn) btn.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "transparent";
                  const btn = el.querySelector('[data-action-menu]') as HTMLElement;
                  if (btn) btn.style.opacity = "0";
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  padding: "14px 20px",
                  borderBottom: i < 4 ? `1px solid ${T.border}` : "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <Avatar staff={s} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text.primary, marginBottom: 2 }}>
                    {s.firstName} {s.lastName}
                  </div>
                  <div style={{ fontSize: 11, color: T.text.muted }}>
                    {s.designation} · {s.branch}
                  </div>
                </div>
                <StatusBadge status={s.jobStatus} />
                <button
                  data-action-menu
                  onClick={(e) => { e.stopPropagation(); }}
                  style={{
                    opacity: 0,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 6,
                    transition: "all 0.2s ease",
                    color: T.text.muted,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = T.bg;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "none";
                  }}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  );
};
