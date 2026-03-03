import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Check, GraduationCap, MapPin, UserCog,
  ChevronRight, Mail, Sparkles, Lock, Globe,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SchoolBasicInfoStep from './steps/SchoolBasicInfoStep';
import SchoolDetailsStep from './steps/SchoolDetailsStep';
import AdminDetailsStep from './steps/AdminDetailsStep';
import {
  SchoolRegistrationStep1,
  SchoolRegistrationStep2,
  SchoolRegistrationStep3,
} from '@/types/school';

// Use environment variable for API URL, fallback to relative path for development
// In production, set VITE_API_URL to your backend URL (e.g., https://cbc-education-system-1.onrender.com)
// Use empty string (relative path) in development to leverage Vite proxy
// Production fallback: Use Render backend URL when deployed on Vercel
const getApiUrl = () => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In production (build), use the Render backend
  if (import.meta.env.PROD) {
    return 'https://cbc-education-system-1.onrender.com';
  }
  // In development, use relative path to leverage Vite proxy
  return '';
};

const API_URL = getApiUrl();
const AUTH_API_URL = `${API_URL}/api/auth`;

/* ─── Step config ─────────────────────────────────────── */
const STEPS = [
  {
    number: 1,
    title: 'Basic Info',
    subtitle: 'School identity & details',
    cardTitle: 'Tell us about your school',
    cardDesc:  'Enter your school information to get started with CBC Noneaa',
    icon: GraduationCap,
    gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)',
    color: '#3b82f6',
    soft: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    number: 2,
    title: 'Location & Contact',
    subtitle: 'Where to find your school',
    cardTitle: 'School Location & Contact',
    cardDesc:  'Help parents and teachers locate and reach your school',
    icon: MapPin,
    gradient: 'linear-gradient(135deg,#10b981,#059669)',
    color: '#10b981',
    soft: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    number: 3,
    title: 'Admin Account',
    subtitle: 'Create administrator access',
    cardTitle: 'Create Administrator Account',
    cardDesc:  'Set up your secure admin credentials to access the portal',
    icon: UserCog,
    gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
    color: '#8b5cf6',
    soft: '#faf5ff',
    border: '#ddd6fe',
  },
];

const TRUST_ITEMS = [
  { icon: Lock,     label: 'End-to-end encrypted' },
  { icon: Shield,   label: 'Kenya MoE Approved'   },
  { icon: Globe,    label: 'CBC Compliant'         },
  { icon: Sparkles, label: 'KNEC Aligned'          },
];

/* ─── Types ───────────────────────────────────────────── */
export default function AdminRegistrationPage() {
  const navigate   = useNavigate();
  const { toast }  = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading,   setIsLoading]   = useState(false);

  const [step1Data, setStep1Data] = useState<SchoolRegistrationStep1>({
    name: '', code: '', schoolType: undefined, levelsOffered: [],
    yearEstablished: '', motto: '', logo: undefined,
  });
  const [step2Data, setStep2Data] = useState<SchoolRegistrationStep2>({
    county: '', subCounty: '', ward: '', physicalAddress: '',
    postalAddress: '', phoneNumber: '', email: '', website: '',
  });
  const [step3Data, setStep3Data] = useState<SchoolRegistrationStep3>({
    fullName: '', tscNo: '', role: undefined, phoneNumber: '',
    email: '', nationalIdOrPassport: '', username: '',
    password: '', twoFactorAuth: false,
  });

  const handleStep1Submit = (d: SchoolRegistrationStep1) => { setStep1Data(d); setCurrentStep(2); };
  const handleStep2Submit = (d: SchoolRegistrationStep2) => { setStep2Data(d); setCurrentStep(3); };
  const handleStep3Submit = async (d: SchoolRegistrationStep3) => {
    setStep3Data(d); await handleFinalSubmit(d);
  };

  // Map frontend LevelOffered values to backend expected values
  const mapLevelToBackend = (level: string): string => {
    const levelMap: Record<string, string> = {
      'Pre-Primary': 'ecde',
      'Lower Primary Education (Grade 1-3)': 'primary',
      'Upper Primary Education (Grade 4-6)': 'primary',
      'Junior Secondary School (JSS) (Grade 7-9)': 'junior_secondary',
      'Senior Secondary School (SSS) (Grade 10-12)': 'senior_secondary',
    };
    return levelMap[level] || 'primary';
  };

  const handleFinalSubmit = async (s3: SchoolRegistrationStep3 = step3Data) => {
    setIsLoading(true);
    try {
      // Map the first selected level to backend format
      const backendLevel = step1Data.levelsOffered[0] 
        ? mapLevelToBackend(step1Data.levelsOffered[0])
        : 'primary';

      const payload = {
        // School fields from Step 1
        school_name: step1Data.name,
        school_code: step1Data.code,
        school_type: step1Data.schoolType || 'private',
        level: backendLevel,
        year_established: step1Data.yearEstablished ? parseInt(step1Data.yearEstablished) : null,
        
        // Location fields from Step 2
        county: step2Data.county,
        sub_county: step2Data.subCounty,
        ward: step2Data.ward,
        physical_address: step2Data.physicalAddress,
        postal_address: step2Data.postalAddress,
        phone_number: step2Data.phoneNumber,
        // Use 'email' for school contact (backend now accepts 'school_email' as alternative)
        school_email: step2Data.email,
        website: step2Data.website || null,
        
        // Admin fields from Step 3
        admin_name: s3.fullName,
        admin_email: s3.email,
        password: s3.password,
        tsc_number: s3.tscNo || null,
        // Role field (optional)
        role: s3.role || 'school_admin',
        // National ID or Passport
        national_id: s3.nationalIdOrPassport || null,
        passport_number: s3.nationalIdOrPassport || null,
        // Username (derived from email if not provided)
        username: s3.username || s3.email.split('@')[0],
        // Appointment date (use current date if not provided)
        appointment_date: new Date().toISOString().split('T')[0],
      };
      const res    = await fetch(`${AUTH_API_URL}/v1/register/school-admin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: 'Registration Successful!', description: 'Check your email to verify your account.' });
        navigate('/login');
      } else {
        toast({ title: 'Registration Failed', description: result.message || 'Something went wrong.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Connection Error', description: 'Unable to reach the server. Try again later.', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const active = STEPS[currentStep - 1];
  const pct    = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        .ar-root, .ar-root * { box-sizing: border-box; font-family: 'Outfit','Segoe UI',sans-serif; }

        /* ── PAGE ── same slate gradient preserved */
        .ar-page {
          min-height: 100vh;
          background: linear-gradient(160deg, #f1f5f9 0%, #e2e8f0 50%, #f8fafc 100%);
          position: relative; overflow-x: hidden;
        }

        /* Subtle dot mesh */
        .ar-page::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: radial-gradient(circle, rgba(100,116,139,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        /* Soft ambient orbs */
        .ar-orb {
          position: fixed; border-radius: 50%; filter: blur(120px); pointer-events: none; z-index: 0;
          animation: orbDrift 18s ease-in-out infinite;
        }
        .ar-orb-1 { width: 600px; height: 600px; top: -200px; right: -100px; background: rgba(99,102,241,0.07); }
        .ar-orb-2 { width: 500px; height: 500px; bottom: -100px; left: -120px; background: rgba(16,185,129,0.05); animation-delay: 7s; }
        @keyframes orbDrift { 0%,100%{transform:translate(0,0);}50%{transform:translate(20px,-20px);} }

        /* ══════════════ HEADER ══════════════ */
        .ar-header {
          position: sticky; top: 0; z-index: 100;
          background: #0f172a;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 4px 24px rgba(0,0,0,0.25);
        }
        .ar-header-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 32px;
          height: 66px; display: flex; align-items: center; justify-content: space-between;
        }

        /* Logo */
        .ar-logo { display: flex; align-items: center; gap: 12px; }
        .ar-logo-icon {
          width: 40px; height: 40px; border-radius: 11px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(59,130,246,0.45); flex-shrink: 0;
        }
        .ar-logo-name { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: -0.3px; }
        .ar-logo-sub  { font-size: 11px; color: rgba(255,255,255,0.35); font-weight: 400; margin-top: 1px; }

        /* Header right */
        .ar-header-right { display: flex; align-items: center; gap: 12px; }
        .ar-header-step-txt { font-size: 12px; color: rgba(255,255,255,0.35); font-weight: 500; }
        .ar-header-badge {
          display: flex; align-items: center; gap: 7px;
          padding: 6px 14px; border-radius: 20px;
          background: rgba(34,197,94,0.12);
          border: 1px solid rgba(34,197,94,0.25);
          font-size: 12px; font-weight: 700; color: #4ade80;
        }
        .ar-badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #22c55e;
          animation: badgePulse 2s ease-in-out infinite;
        }
        @keyframes badgePulse { 0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.4);opacity:0.6;} }

        /* ══════════════ PROGRESS TRACK ══════════════ */
        .ar-progress {
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }
        .ar-progress-inner {
          max-width: 720px; margin: 0 auto; padding: 28px 24px;
          display: flex; align-items: flex-start; justify-content: center;
          gap: 0;
        }

        .ar-step-col {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          flex-shrink: 0;
        }

        /* Step circle */
        .ar-step-circle {
          width: 52px; height: 52px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          position: relative; transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }
        .ar-step-circle.done {
          background: linear-gradient(135deg,#10b981,#059669);
          box-shadow: 0 6px 18px rgba(16,185,129,0.35);
        }
        .ar-step-circle.active {
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          transform: scale(1.1);
        }
        .ar-step-circle.pending {
          background: #f1f5f9; border: 2px solid #e2e8f0;
        }

        /* Outer ring for active */
        .ar-step-circle.active::after {
          content: '';
          position: absolute; inset: -5px; border-radius: 50%;
          border: 2px solid rgba(99,102,241,0.3);
          animation: circleRing 2.5s ease-in-out infinite;
        }
        @keyframes circleRing { 0%,100%{opacity:0.7;transform:scale(1);}50%{opacity:0;transform:scale(1.25);} }

        /* Step labels */
        .ar-step-info { text-align: center; }
        .ar-step-name { font-size: 12px; font-weight: 700; color: #0f172a; white-space: nowrap; }
        .ar-step-name.pending { color: #94a3b8; }
        .ar-step-sub  { font-size: 10px; color: #94a3b8; margin-top: 2px; white-space: nowrap; }

        /* Connector */
        .ar-conn {
          flex: 0 0 72px; height: 2px; margin: 25px 6px 0;
          background: #e2e8f0; border-radius: 2px;
          position: relative; overflow: hidden;
        }
        .ar-conn-fill {
          position: absolute; left: 0; top: 0; height: 100%;
          background: linear-gradient(90deg,#10b981,#059669);
          transition: width 0.55s cubic-bezier(0.4,0,0.2,1); border-radius: 2px;
        }

        /* ══════════════ MAIN BODY ══════════════ */
        .ar-body { position: relative; z-index: 1; padding: 40px 24px 80px; }
        .ar-body-inner { max-width: 700px; margin: 0 auto; }

        /* Step hero header */
        .ar-hero {
          display: flex; align-items: flex-start; gap: 18px;
          margin-bottom: 28px;
          animation: heroIn 0.45s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes heroIn { from{opacity:0;transform:translateY(-10px);}to{opacity:1;transform:translateY(0);} }

        .ar-hero-icon {
          width: 58px; height: 58px; border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .ar-hero-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 20px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
          margin-bottom: 7px;
        }
        .ar-hero-title { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.6px; line-height: 1.2; }
        .ar-hero-desc  { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 400; max-width: 420px; }

        /* ══════════════ CARD ══════════════ */
        .ar-card {
          background: #fff;
          border-radius: 24px;
          border: 1px solid rgba(0,0,0,0.07);
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.7) inset,
            0 4px 8px rgba(0,0,0,0.04),
            0 20px 48px rgba(0,0,0,0.09),
            0 40px 80px rgba(0,0,0,0.06);
          animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both;
        }
        @keyframes cardIn { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }

        /* Colorful top bar */
        .ar-card-bar {
          height: 4px;
          background: #f1f5f9;
          position: relative; overflow: hidden;
        }
        .ar-card-bar-track {
          height: 100%;
          transition: width 0.55s cubic-bezier(0.4,0,0.2,1);
          position: relative;
        }
        .ar-card-bar-track::after {
          content: '';
          position: absolute; right: -1px; top: -2px;
          width: 8px; height: 8px; border-radius: 50%;
          background: inherit;
          box-shadow: 0 0 8px currentColor;
        }

        /* Card section header */
        .ar-card-head {
          padding: 26px 32px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex; align-items: center; justify-content: space-between;
        }
        .ar-card-head-title { font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px; }
        .ar-card-head-desc  { font-size: 13px; color: #64748b; margin-top: 3px; }
        .ar-card-step-badge {
          padding: 6px 16px; border-radius: 20px;
          font-size: 12px; font-weight: 800; letter-spacing: 0.3px;
          flex-shrink: 0;
        }

        /* Card body */
        .ar-card-body { padding: 28px 32px 32px; }

        /* ══════════════ BOTTOM AREA ══════════════ */
        /* Help card */
        .ar-help {
          margin-top: 20px;
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(226,232,240,0.8);
          border-radius: 16px; padding: 18px 20px;
          display: flex; align-items: center; gap: 14px;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .ar-help-icon {
          width: 40px; height: 40px; border-radius: 12px;
          background: linear-gradient(135deg,#dbeafe,#ede9fe);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .ar-help-title  { font-size: 13px; font-weight: 700; color: #0f172a; }
        .ar-help-sub    { font-size: 12px; color: #64748b; margin-top: 2px; }
        .ar-help-btn    {
          margin-left: auto; flex-shrink: 0;
          display: inline-flex; align-items: center; gap: 5px;
          padding: 8px 16px; border-radius: 10px;
          background: #f0f9ff; border: 1px solid #bae6fd;
          font-size: 12px; font-weight: 700; color: #0284c7;
          text-decoration: none; transition: all 0.18s;
          font-family: inherit;
        }
        .ar-help-btn:hover { background: #e0f2fe; border-color: #7dd3fc; }

        /* Trust strip */
        .ar-trust {
          margin-top: 20px; display: flex; align-items: center;
          justify-content: center; gap: 6px; flex-wrap: wrap;
        }
        .ar-trust-item {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: 20px;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(226,232,240,0.7);
          font-size: 11px; color: #64748b; font-weight: 600;
          backdrop-filter: blur(4px);
        }

        /* Responsive */
        @media (max-width: 640px) {
          .ar-conn { flex: 0 0 28px; }
          .ar-step-info { display: none; }
          .ar-card-head { flex-direction: column; align-items: flex-start; gap: 8px; }
          .ar-card-head, .ar-card-body { padding-left: 20px; padding-right: 20px; }
          .ar-hero-title { font-size: 20px; }
          .ar-help { display: none; }
        }
      `}</style>

      <div className="ar-root">
        <div className="ar-page">

          {/* Ambience */}
          <div className="ar-orb ar-orb-1" />
          <div className="ar-orb ar-orb-2" />

          {/* ════ HEADER ════ */}
          

          {/* ════ STEP PROGRESS ════ */}
          <div className="ar-progress">
            <div className="ar-progress-inner">
              {STEPS.map((step, i) => {
                const Icon   = step.icon;
                const status = currentStep > step.number ? 'done'
                             : currentStep === step.number ? 'active' : 'pending';

                return (
                  <React.Fragment key={step.number}>
                    {/* Step node */}
                    <div className="ar-step-col">
                      <div className={`ar-step-circle ${status}`}
                        style={status === 'active' ? { background: step.gradient } : undefined}
                      >
                        {status === 'done'
                          ? <Check size={22} color="#fff" strokeWidth={2.5} />
                          : <Icon size={20} color={status === 'active' ? '#fff' : '#94a3b8'} />
                        }
                      </div>
                      <div className="ar-step-info">
                        <div className={`ar-step-name${status === 'pending' ? ' pending' : ''}`}>
                          {step.title}
                        </div>
                        <div className="ar-step-sub">{step.subtitle}</div>
                      </div>
                    </div>

                    {/* Connector */}
                    {i < STEPS.length - 1 && (
                      <div className="ar-conn">
                        <div
                          className="ar-conn-fill"
                          style={{ width: currentStep > step.number ? '100%' : '0%' }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ════ BODY ════ */}
          <main className="ar-body">
            <div className="ar-body-inner">

              {/* Hero header */}
              <div className="ar-hero">
                <div
                  className="ar-hero-icon"
                  style={{ background: active.gradient }}
                >
                  <active.icon size={26} color="#fff" />
                </div>
                <div>
                  <div
                    className="ar-hero-pill"
                    style={{
                      background: active.soft,
                      color: active.color,
                      border: `1px solid ${active.border}`,
                    }}
                  >
                    <Sparkles size={11} />
                    Step {currentStep} of {STEPS.length}
                  </div>
                  <div className="ar-hero-title">{active.cardTitle}</div>
                  <div className="ar-hero-desc">{active.cardDesc}</div>
                </div>
              </div>

              {/* Card */}
              <div className="ar-card">
                {/* Colour progress bar */}
                <div className="ar-card-bar">
                  <div
                    className="ar-card-bar-track"
                    style={{
                      width: `${Math.max(pct, currentStep === 1 ? 8 : pct)}%`,
                      background: active.gradient,
                    }}
                  />
                </div>

                {/* Card header */}
                <div className="ar-card-head">
                  <div>
                    <div className="ar-card-head-title">{active.cardTitle}</div>
                    <div className="ar-card-head-desc">{active.cardDesc}</div>
                  </div>
                  <div
                    className="ar-card-step-badge"
                    style={{
                      background: active.soft,
                      color: active.color,
                      border: `1px solid ${active.border}`,
                    }}
                  >
                    {currentStep}/{STEPS.length}
                  </div>
                </div>

                {/* Form content with framer-motion */}
                <div className="ar-card-body">
                  <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                      <motion.div key="s1"
                        initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -22 }} transition={{ duration: 0.26, ease: [0.22,1,0.36,1] }}
                      >
                        <SchoolBasicInfoStep
                          initialData={step1Data}
                          onSubmit={handleStep1Submit}
                          onBack={() => navigate('/')}
                        />
                      </motion.div>
                    )}
                    {currentStep === 2 && (
                      <motion.div key="s2"
                        initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -22 }} transition={{ duration: 0.26, ease: [0.22,1,0.36,1] }}
                      >
                        <SchoolDetailsStep
                          initialData={step2Data}
                          onSubmit={handleStep2Submit}
                          onBack={() => setCurrentStep(1)}
                        />
                      </motion.div>
                    )}
                    {currentStep === 3 && (
                      <motion.div key="s3"
                        initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -22 }} transition={{ duration: 0.26, ease: [0.22,1,0.36,1] }}
                      >
                        <AdminDetailsStep
                          initialData={step3Data}
                          onSubmit={handleStep3Submit}
                          onBack={() => setCurrentStep(2)}
                          isLoading={isLoading}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Help card */}
              <div className="ar-help">
                <div className="ar-help-icon">
                  <Mail size={18} style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <div className="ar-help-title">Need assistance?</div>
                  <div className="ar-help-sub">Our team is available Mon–Fri, 8am–6pm EAT</div>
                </div>
                <a href="mailto:support@cbcnoneaa.ac.ke" className="ar-help-btn">
                  Contact support <ChevronRight size={13} />
                </a>
              </div>

              {/* Trust row */}
              <div className="ar-trust">
                {TRUST_ITEMS.map(item => {
                  const Icon = item.icon;
                  return (
                    <div className="ar-trust-item" key={item.label}>
                      <Icon size={11} style={{ color: '#22c55e' }} />
                      {item.label}
                    </div>
                  );
                })}
              </div>

            </div>
          </main>

        </div>
      </div>
    </>
  );
}
