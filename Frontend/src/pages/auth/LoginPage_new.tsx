import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Eye, EyeOff, Loader2, ArrowLeft, Building2, Shield,
  GraduationCap, Users, Check, ArrowRight, BookOpen, TrendingUp, Award,
} from 'lucide-react';
import loginBg from '@/assets/hero-bg.png';

type LoginUserType = 'admin' | 'super_admin' | 'teacher' | 'parent';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const ROLES = [
  { type: 'admin'       as const, label: 'Administrator', subtitle: 'Manage your school', icon: Building2,     accent: '#3b82f6', lightBg: 'rgba(59,130,246,0.18)' },
  { type: 'super_admin' as const, label: 'Super Admin',   subtitle: 'Full system access', icon: Shield,        accent: '#8b5cf6', lightBg: 'rgba(139,92,246,0.18)' },
  { type: 'teacher'     as const, label: 'Teacher',       subtitle: 'Educate & inspire',  icon: GraduationCap, accent: '#06b6d4', lightBg: 'rgba(6,182,212,0.18)'  },
  { type: 'parent'      as const, label: 'Parent',        subtitle: 'Monitor progress',   icon: Users,         accent: '#10b981', lightBg: 'rgba(16,185,129,0.18)' },
];

const STATS = [
  { icon: BookOpen,   value: '2,400+', label: 'Resources' },
  { icon: Users,      value: '12K+',   label: 'Students'  },
  { icon: TrendingUp, value: '98%',    label: 'Pass Rate' },
  { icon: Award,      value: 'CBC',    label: 'Compliant' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData]         = useState({ email: '', password: '' });
  const [userType, setUserType]         = useState<LoginUserType>('admin');
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [remember, setRemember]         = useState(false);

  const selectedRole = ROLES.find(r => r.type === userType)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      await login(formData.email, formData.password, userType);
      toast({ title: 'Welcome Back', description: 'Successfully signed in.' });
      switch (userType) {
        case 'super_admin':
        case 'admin':   navigate('/school-admin/dashboard'); break;
        case 'teacher': navigate('/teacher/portal');        break;
        case 'parent':  navigate('/parent/portal');         break;
        default:        navigate('/school-admin/dashboard');
      }
    } catch (error: unknown) {
      const msg = getErrorMessage(error, 'Invalid email or password. Please try again.');
      setSubmitError(msg);
      toast({ title: 'Sign In Failed', description: msg, variant: 'destructive' });
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) { navigate(-1); return; }
    navigate('/');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .lp-page {
          position: relative; min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; padding: 24px 16px;
          font-family: 'Outfit', 'Segoe UI', sans-serif;
        }
        .lp-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
        }
        .lp-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(135deg,
            rgba(3,7,18,0.75) 0%,
            rgba(10,20,50,0.68) 50%,
            rgba(3,7,18,0.78) 100%);
          backdrop-filter: blur(3px);
        }
        .lp-blob {
          position: absolute; border-radius: 50%;
          filter: blur(90px); pointer-events: none;
          animation: blobPulse 10s ease-in-out infinite;
        }
        .lp-blob-1 { width:480px;height:480px;top:-140px;left:-140px;background:rgba(59,130,246,0.16);animation-delay:0s; }
        .lp-blob-2 { width:380px;height:380px;top:-80px;right:-80px;background:rgba(139,92,246,0.13);animation-delay:3s; }
        .lp-blob-3 { width:420px;height:420px;bottom:-120px;left:35%;background:rgba(6,182,212,0.10);animation-delay:6s; }
        @keyframes blobPulse {
          0%,100% { transform:scale(1) translate(0,0);opacity:0.8; }
          50%      { transform:scale(1.06) translate(12px,-12px);opacity:1; }
        }
        .lp-dots {
          position:absolute;inset:0;pointer-events:none;
          background-image:radial-gradient(rgba(255,255,255,0.055) 1px,transparent 1px);
          background-size:30px 30px;
        }

        /* Card wrapper */
        .lp-card-wrap {
          position:relative;z-index:10;
          width:100%;max-width:880px;
          animation:cardRise 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes cardRise {
          from{opacity:0;transform:translateY(30px) scale(0.96);}
          to{opacity:1;transform:translateY(0) scale(1);}
        }
        .lp-card {
          display:flex;
          border-radius:26px;overflow:hidden;
          backdrop-filter:blur(24px);
          background:rgba(8,14,32,0.58);
          border:1px solid rgba(255,255,255,0.09);
          box-shadow:
            0 40px 100px rgba(0,0,0,0.6),
            0 0 0 1px rgba(255,255,255,0.05) inset,
            0 1px 0 rgba(255,255,255,0.1) inset;
        }

        /* ── LEFT PANEL ── */
        .lp-left {
          width:42%;
          background:rgba(255,255,255,0.03);
          border-right:1px solid rgba(255,255,255,0.06);
          padding:40px 34px;
          display:flex;flex-direction:column;
          position:relative;overflow:hidden;
        }
        .lp-left-glow {
          position:absolute;top:-80px;right:-80px;
          width:240px;height:240px;
          background:radial-gradient(circle,rgba(59,130,246,0.1) 0%,transparent 65%);
          border-radius:50%;pointer-events:none;
        }

        /* Back btn */
        .lp-back {
          display:inline-flex;align-items:center;gap:7px;
          color:rgba(255,255,255,0.38);font-size:13px;font-weight:500;
          background:none;border:none;cursor:pointer;font-family:inherit;
          padding:0;margin-bottom:28px;transition:all 0.18s;
        }
        .lp-back:hover{color:rgba(255,255,255,0.8);transform:translateX(-4px);}

        /* Logo */
        .lp-logo{display:flex;align-items:center;gap:12px;margin-bottom:34px;}
        .lp-logo-icon{
          width:46px;height:46px;
          background:linear-gradient(135deg,#3b82f6,#6366f1);
          border-radius:14px;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 8px 22px rgba(59,130,246,0.45);
          flex-shrink:0;
        }
        .lp-logo-name{font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.4px;line-height:1.1;}
        .lp-logo-sub{font-size:10px;color:rgba(255,255,255,0.3);font-weight:500;text-transform:uppercase;letter-spacing:1px;margin-top:2px;}

        /* Role section */
        .lp-section-label{font-size:10px;font-weight:700;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:1.4px;margin-bottom:10px;}

        .role-btn{
          display:flex;align-items:center;gap:12px;
          padding:12px 14px;
          border-radius:13px;
          border:1.5px solid rgba(255,255,255,0.07);
          background:rgba(255,255,255,0.03);
          cursor:pointer;font-family:inherit;width:100%;
          transition:all 0.2s;margin-bottom:7px;
          animation:roleSlide 0.35s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes roleSlide{from{opacity:0;transform:translateX(-10px);}to{opacity:1;transform:translateX(0);}}
        .role-btn:hover{background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.15);}
        .role-btn.selected{border-color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.07);}
        .role-ico{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform 0.2s;}
        .role-btn:hover .role-ico{transform:scale(1.1);}
        .role-name{font-size:13px;font-weight:700;color:rgba(255,255,255,0.75);line-height:1.2;text-align:left;}
        .role-sub{font-size:11px;color:rgba(255,255,255,0.3);margin-top:2px;text-align:left;}
        .role-btn.selected .role-name{color:#fff;}
        .role-chk{margin-left:auto;flex-shrink:0;animation:checkBounce 0.25s cubic-bezier(0.34,1.56,0.64,1) both;}
        @keyframes checkBounce{from{transform:scale(0);opacity:0;}to{transform:scale(1);opacity:1;}}

        /* Stats */
        .lp-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:auto;padding-top:22px;}
        .lp-stat{
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.05);
          border-radius:11px;padding:11px 13px;
          display:flex;align-items:center;gap:9px;
          transition:background 0.18s;cursor:default;
        }
        .lp-stat:hover{background:rgba(255,255,255,0.07);}
        .lp-stat-val{font-size:15px;font-weight:800;color:#fff;line-height:1;}
        .lp-stat-lbl{font-size:10px;color:rgba(255,255,255,0.3);margin-top:2px;font-weight:500;}

        /* ── RIGHT PANEL ── */
        .lp-right{
          flex:1;padding:46px 44px;
          display:flex;flex-direction:column;justify-content:center;
          position:relative;overflow:hidden;
        }
        .lp-right-glow{
          position:absolute;bottom:-60px;right:-60px;
          width:220px;height:220px;
          background:radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 65%);
          border-radius:50%;pointer-events:none;
        }

        .lp-title{font-size:29px;font-weight:800;color:#fff;letter-spacing:-0.7px;line-height:1.15;margin-bottom:5px;}
        .lp-sub{font-size:14px;color:rgba(255,255,255,0.38);margin-bottom:30px;}
        .lp-sub strong{color:rgba(255,255,255,0.65);font-weight:600;}

        /* Error */
        .lp-err{
          background:rgba(239,68,68,0.1);
          border:1px solid rgba(239,68,68,0.25);
          border-radius:12px;padding:11px 14px;
          font-size:13px;color:#fca5a5;
          margin-bottom:16px;display:flex;align-items:center;gap:8px;
        }

        /* Fields */
        .lp-field{margin-bottom:16px;}
        .lp-lbl{
          display:flex;align-items:center;justify-content:space-between;
          font-size:13px;font-weight:600;
          color:rgba(255,255,255,0.5);margin-bottom:7px;
        }
        .lp-fgt{
          background:none;border:none;cursor:pointer;font-family:inherit;
          font-size:12px;color:rgba(255,255,255,0.35);font-weight:600;
          transition:color 0.18s;padding:0;
        }
        .lp-fgt:hover{color:rgba(255,255,255,0.75);}
        .lp-inp-wrap{position:relative;}
        .lp-inp{
          width:100%;height:50px;padding:0 16px;
          background:rgba(255,255,255,0.07);
          border:1.5px solid rgba(255,255,255,0.1);
          border-radius:13px;
          font-size:14px;color:#fff;font-family:inherit;outline:none;
          transition:all 0.2s;
        }
        .lp-inp::placeholder{color:rgba(255,255,255,0.2);}
        .lp-inp:focus{
          background:rgba(255,255,255,0.1);
          border-color:rgba(99,102,241,0.65);
          box-shadow:0 0 0 3px rgba(99,102,241,0.14);
        }
        .lp-inp.err{border-color:rgba(239,68,68,0.5);box-shadow:0 0 0 3px rgba(239,68,68,0.1);}
        .lp-inp-pw{padding-right:48px;}
        .lp-eye{
          position:absolute;right:14px;top:50%;transform:translateY(-50%);
          background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.28);
          display:flex;padding:0;transition:color 0.18s;
        }
        .lp-eye:hover{color:rgba(255,255,255,0.75);}

        /* Remember row */
        .lp-rmb{display:flex;align-items:center;gap:9px;margin-bottom:22px;}
        .lp-cb{width:15px;height:15px;accent-color:#6366f1;cursor:pointer;flex-shrink:0;}
        .lp-rmb label{font-size:13px;color:rgba(255,255,255,0.38);cursor:pointer;}

        /* Submit */
        .lp-btn{
          width:100%;height:50px;
          background:linear-gradient(135deg,#3b82f6 0%,#6366f1 100%);
          color:#fff;border:none;border-radius:13px;
          font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:9px;
          box-shadow:0 8px 28px rgba(59,130,246,0.35);
          transition:all 0.22s;position:relative;overflow:hidden;
          margin-bottom:18px;
        }
        .lp-btn::after{
          content:'';position:absolute;inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,0.11),transparent);
          opacity:0;transition:opacity 0.2s;
        }
        .lp-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 38px rgba(59,130,246,0.5);}
        .lp-btn:hover:not(:disabled)::after{opacity:1;}
        .lp-btn:active:not(:disabled){transform:translateY(0);}
        .lp-btn:disabled{opacity:0.45;cursor:not-allowed;box-shadow:none;}

        /* Footer */
        .lp-divider{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
        .lp-divider-ln{flex:1;height:1px;background:rgba(255,255,255,0.07);}
        .lp-divider-txt{font-size:10px;color:rgba(255,255,255,0.18);white-space:nowrap;letter-spacing:0.3px;}
        .lp-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;}
        .lp-foot-copy{font-size:11px;color:rgba(255,255,255,0.18);}
        .lp-foot-links{display:flex;gap:14px;}
        .lp-foot-links a{font-size:11px;color:rgba(255,255,255,0.25);text-decoration:none;transition:color 0.18s;}
        .lp-foot-links a:hover{color:rgba(255,255,255,0.6);}

        @media(max-width:680px){
          .lp-card{flex-direction:column;}
          .lp-left{width:100%;border-right:none;border-bottom:1px solid rgba(255,255,255,0.06);padding:28px 24px;}
          .lp-stats{display:none;}
          .lp-right{padding:28px 24px;}
        }
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>

      <div className="lp-page">
        {/* Background image */}
        <div className="lp-bg" style={{ backgroundImage: `url(${loginBg})` }} />
        {/* Overlay */}
        <div className="lp-overlay" />
        {/* Blobs */}
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />
        {/* Dot grid */}
        <div className="lp-dots" />

        {/* ════ CARD ════ */}
        <div className="lp-card-wrap">
          <div className="lp-card">

            {/* ══ LEFT ══ */}
            <div className="lp-left">
              <div className="lp-left-glow" />

              {/* Back */}
              <button type="button" className="lp-back" onClick={handleGoBack}>
                <ArrowLeft size={15} /> Back to site
              </button>

              {/* Logo */}
              <div className="lp-logo">
                <div className="lp-logo-icon">
                  <GraduationCap size={22} color="#fff" />
                </div>
                <div>
                  <div className="lp-logo-name">CBC Noneaa</div>
                  <div className="lp-logo-sub">Kenya Education</div>
                </div>
              </div>

              {/* Roles */}
              <div className="lp-section-label">Select your role</div>

              {ROLES.map((role, i) => {
                const Icon = role.icon;
                const active = userType === role.type;
                return (
                  <button
                    key={role.type}
                    type="button"
                    className={`role-btn${active ? ' selected' : ''}`}
                    style={{ animationDelay: `${i * 65}ms` }}
                    onClick={() => setUserType(role.type)}
                  >
                    <div
                      className="role-ico"
                      style={{ background: active ? role.lightBg : 'rgba(255,255,255,0.06)' }}
                    >
                      <Icon size={16} style={{ color: active ? role.accent : 'rgba(255,255,255,0.38)' }} />
                    </div>
                    <div>
                      <div className="role-name">{role.label}</div>
                      <div className="role-sub">{role.subtitle}</div>
                    </div>
                    {active && (
                      <div className="role-chk">
                        <Check size={15} style={{ color: role.accent }} />
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Stats grid */}
              <div className="lp-stats">
                {STATS.map(s => {
                  const Icon = s.icon;
                  return (
                    <div className="lp-stat" key={s.label}>
                      <Icon size={13} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                      <div>
                        <div className="lp-stat-val">{s.value}</div>
                        <div className="lp-stat-lbl">{s.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ══ RIGHT ══ */}
            <div className="lp-right">
              <div className="lp-right-glow" />

              <div className="lp-title">Welcome back</div>
              <div className="lp-sub">
                Signing in as <strong>{selectedRole.label}</strong>
              </div>

              {/* Error */}
              {submitError && (
                <div className="lp-err"><span>⚠</span>{submitError}</div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="lp-field">
                  <div className="lp-lbl"><span>Email address</span></div>
                  <div className="lp-inp-wrap">
                    <input
                      type="email" required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className={`lp-inp${submitError ? ' err' : ''}`}
                      placeholder="you@school.ac.ke"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="lp-field">
                  <div className="lp-lbl">
                    <span>Password</span>
                    <button type="button" className="lp-fgt">Forgot password?</button>
                  </div>
                  <div className="lp-inp-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'} required
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className={`lp-inp lp-inp-pw${submitError ? ' err' : ''}`}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button type="button" className="lp-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Remember */}
                <div className="lp-rmb">
                  <input id="rem" type="checkbox" className="lp-cb" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  <label htmlFor="rem">Stay signed in for 30 days</label>
                </div>

                {/* Submit */}
                <button type="submit" className="lp-btn" disabled={isLoading}>
                  {isLoading
                    ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
                    : <>Sign in <ArrowRight size={16} /></>
                  }
                </button>

                {/* Footer */}
                <div className="lp-divider">
                  <div className="lp-divider-ln" />
                  <span className="lp-divider-txt">Secure · Encrypted · CBC Compliant</span>
                  <div className="lp-divider-ln" />
                </div>
                <div className="lp-foot">
                  <span className="lp-foot-copy">© 2026 CBC Noneaa</span>
                  <div className="lp-foot-links">
                    <a href="/privacy">Privacy</a>
                    <a href="/terms">Terms</a>
                    <a href="/support">Help</a>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}