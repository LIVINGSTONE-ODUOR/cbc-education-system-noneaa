import React from "react";
import { STATUS_CFG, T } from "../constants";
import { avatarBg, initials, fmt } from "../helpers";
import { inp, sel } from "../styles";
import { StaffMember } from "../types";
import {
  CheckCircle, XCircle, Clock, AlertCircle, Users, ArrowLeft,
  Search, ChevronDown, School, MapPin, Phone, Mail, IdCard,
  BookOpen, UserCheck, Briefcase, Eye, Edit, Trash2, Download,
  UserPlus, Save, X
} from "lucide-react";

/* ─── SMALL COMPONENTS ───────────────────────────────────────────────── */

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG["Inactive"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px 3px 7px", borderRadius: 20,
      fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
      background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        background: cfg.text, flexShrink: 0,
        animation: status === "Active" ? "livePulse 2s infinite" : "none",
      }} />
      {status}
    </span>
  );
}

export function Avatar({ staff, size = 36 }: { staff: StaffMember; size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.28),
      background: avatarBg(staff.id),
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, fontSize: Math.round(size * 0.34),
      fontWeight: 800, color: "white",
      letterSpacing: "-0.01em",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    }}>
      {initials(staff.firstName, staff.lastName)}
    </div>
  );
}

export function StatCard({
  icon: Icon, label, value,
  color = T.accent, bg = T.accentSoft,
}: { icon: React.ElementType; label: string; value: string | number; color?: string; bg?: string }) {
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid rgba(0,0,0,0.07)",
      borderRadius: 16, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
      position: "relative",
    }}>
      {/* top accent bar — your gradient style */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}44, transparent)` }} />

      {/* ghost watermark icon — matches screenshot */}
      <div style={{
        position: "absolute", bottom: -6, right: -6,
        opacity: 0.05, pointerEvents: "none",
      }}>
        <Icon size={72} strokeWidth={1} color={color} />
      </div>

      <div style={{ padding: "16px 18px 14px" }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: bg, border: `1px solid ${color}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 12, flexShrink: 0,
        }}>
          <Icon size={17} color={color} strokeWidth={2.2} />
        </div>

        <div style={{
          fontSize: 10.5, fontWeight: 700, color: "#9CA3AF",
          textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 4,
        }}>
          {label}
        </div>

        <div style={{
          fontSize: 30, fontWeight: 800, color: "#111827", lineHeight: 1,
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}

export function DetailRow({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "9px 0", borderBottom: "1px solid rgba(0,0,0,0.06)",
    }}>
      <span style={{
        fontSize: 11, fontWeight: 600, color: "#9CA3AF",
        textTransform: "uppercase", letterSpacing: "0.07em",
        minWidth: 130, flexShrink: 0,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 13, color: "#111827", fontWeight: 600,
        textAlign: "right", maxWidth: 240, wordBreak: "break-word",
      }}>
        {value}
      </span>
    </div>
  );
}

export function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 10.5, fontWeight: 700, color: "#6B7280",
        textTransform: "uppercase", letterSpacing: "0.08em",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        {label}
        {required && <span style={{ color: "#EF4444", fontSize: 16, lineHeight: 0.5 }}>·</span>}
      </label>
      {children}
    </div>
  );
}

export function NavBtn({ icon: Icon, label, onClick, primary }: { icon: React.ElementType; label: string; onClick?: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 14px",
        background: primary ? "linear-gradient(135deg, #166534, #16a34a)" : "white",
        border: primary ? "none" : "1px solid rgba(0,0,0,0.10)",
        borderRadius: 8,
        color: primary ? "white" : "#374151",
        fontSize: 12, fontWeight: primary ? 700 : 600,
        cursor: "pointer",
        boxShadow: primary ? "0 2px 12px rgba(22,163,74,0.30)" : "0 1px 3px rgba(0,0,0,0.06)",
        transition: "filter 0.15s, transform 0.15s",
      }}
    >
      <Icon size={13} strokeWidth={2.4} /> {label}
    </button>
  );
}

export function TopNav({ crumb, onBack, actions }: { crumb: string; onBack?: () => void; actions?: React.ReactNode }) {
  return (
    <div style={{
      background: "white",
      borderBottom: "1px solid rgba(0,0,0,0.07)",
      padding: "0 28px", height: 52,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "linear-gradient(135deg, #166534, #16a34a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
        }}>
          <School size={14} color="white" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
        <span style={{ color: "#16a34a" }}>STAFF</span>
        </span>

       
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {onBack && (
          <button onClick={onBack} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 11px", background: "white",
            border: "1px solid rgba(0,0,0,0.10)", borderRadius: 8,
            color: "#6B7280", fontSize: 11.5, fontWeight: 600, cursor: "pointer",
          }}>
            <ArrowLeft size={12} /> Back
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}

export function HeroBar({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #f0fdf4 100%)",
      borderBottom: "1px solid rgba(22,163,74,0.12)",
      padding: "24px 28px 0",
      position: "relative", overflow: "hidden",
    }}>
      {/* dot-grid texture */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(rgba(22,163,74,0.12) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        opacity: 0.7,
      }} />
      {/* ambient glow */}
      <div style={{
        position: "absolute", top: -60, right: -60,
        width: 220, height: 220, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(22,163,74,0.10) 0%, transparent 70%)",
      }} />

      <div style={{ position: "relative", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: "#9CA3AF",
          letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8,
        }}>
          Republic of Kenya · CBC School · HR
        </div>
        <h1 style={{
          fontSize: 22, fontWeight: 800, color: "#111827",
          letterSpacing: "-0.03em", marginBottom: sub ? 4 : 0,
        }}>
          {title}
        </h1>
        {sub && (
          <p style={{ fontSize: 12.5, color: "#6B7280", marginBottom: 16 }}>
            {sub}
          </p>
        )}
        {children && <div style={{ paddingBottom: 22 }}>{children}</div>}
      </div>
    </div>
  );
}

export function Toast({ msg }: { msg: string }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      background: "white", color: "#111827",
      padding: "11px 16px 11px 12px", borderRadius: 12,
      fontSize: 13, fontWeight: 600,
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
      border: "1px solid rgba(22,163,74,0.18)",
      zIndex: 900,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <CheckCircle size={14} color="#16a34a" strokeWidth={2.4} />
      </div>
      {msg}
    </div>
  );
}

// Re-export commonly used items
export { inp, sel, T, fmt, initials, avatarBg };

// Export view components
export { DashboardView } from "./DashboardView";
export { ListView } from "./ListView";
export { FormView } from "./FormView";
export { DetailsView } from "./DetailsView";
export { PerformanceDashboard as PerformanceView } from "./Performance";
