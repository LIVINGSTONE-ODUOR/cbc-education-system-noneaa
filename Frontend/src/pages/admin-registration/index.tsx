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
import PageLoader from '@/components/PageLoader';

const getApiUrl = () => {
  if (import.meta.env.PROD) return '';
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
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
    cardDesc: 'Enter your school information to get started with CBE Noneaa',
    icon: GraduationCap,
    color: '#3b82f6',
  },
  {
    number: 2,
    title: 'Location & Contact',
    subtitle: 'Where to find your school',
    cardTitle: 'School Location & Contact',
    cardDesc: 'Help parents and teachers locate and reach your school',
    icon: MapPin,
    color: '#10b981',
  },
  {
    number: 3,
    title: 'Admin Account',
    subtitle: 'Create administrator access',
    cardTitle: 'Create Administrator Account',
    cardDesc: 'Set up your secure admin credentials to access the portal',
    icon: UserCog,
    color: '#8b5cf6',
  },
];

const TRUST_ITEMS = [
  { icon: Lock, label: 'End-to-end encrypted' },
  { icon: Shield, label: 'Kenya MoE Approved' },
  { icon: Globe, label: 'CBE Compliant' },
  { icon: Sparkles, label: 'KNEC Aligned' },
];

export default function AdminRegistrationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

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
      const backendLevel = step1Data.levelsOffered[0]
        ? mapLevelToBackend(step1Data.levelsOffered[0])
        : 'primary';

      const payload = {
        school_name: step1Data.name,
        school_code: step1Data.code,
        school_type: step1Data.schoolType || 'private',
        level: backendLevel,
        year_established: step1Data.yearEstablished ? parseInt(step1Data.yearEstablished) : null,
        county: step2Data.county,
        sub_county: step2Data.subCounty,
        ward: step2Data.ward,
        physical_address: step2Data.physicalAddress,
        postal_address: step2Data.postalAddress,
        phone_number: step2Data.phoneNumber,
        school_email: step2Data.email,
        website: step2Data.website || null,
        admin_name: s3.fullName,
        admin_email: s3.email,
        password: s3.password,
        tsc_number: s3.tscNo || null,
        role: s3.role || 'school_admin',
        national_id: s3.nationalIdOrPassport || null,
        passport_number: s3.nationalIdOrPassport || null,
        username: s3.username || s3.email.split('@')[0],
        appointment_date: new Date().toISOString().split('T')[0],
      };
      const res = await fetch(`${AUTH_API_URL}/v1/register/school-admin`, {
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

  return (
    <>
      <PageLoader />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        .reg-root, .reg-root * { box-sizing: border-box; }

        .reg-page {
          min-height: 100vh;
          background: #f8fafc;
          position: relative;
          overflow-x: hidden;
        }

        /* Subtle top gradient accent */
        .reg-page::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 400px;
          background: linear-gradient(180deg, #eef2ff 0%, transparent 100%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── HEADER ── */
        .reg-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .reg-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .reg-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .reg-logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(79,70,229,0.3);
        }
        .reg-logo-text {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.3px;
        }
        .reg-logo-sub {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 400;
        }
        .reg-header-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          font-size: 12px;
          font-weight: 600;
          color: #16a34a;
        }
        .reg-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          animation: dotPulse 2s ease-in-out infinite;
        }
        @keyframes dotPulse { 0%,100%{opacity:1;}50%{opacity:0.4;} }

        /* ── STEPPER ── */
        .reg-stepper-wrap {
          position: relative;
          z-index: 1;
          background: #fff;
          border-bottom: 1px solid #f1f5f9;
        }
        .reg-stepper {
          max-width: 620px;
          margin: 0 auto;
          padding: 32px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .reg-step-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 1;
        }
        .reg-step-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }
        .reg-step-circle.completed {
          background: #10b981;
          color: #fff;
          box-shadow: 0 4px 12px rgba(16,185,129,0.3);
        }
        .reg-step-circle.active {
          background: #4f46e5;
          color: #fff;
          box-shadow: 0 4px 16px rgba(79,70,229,0.35);
          transform: scale(1.08);
        }
        .reg-step-circle.active::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid rgba(79,70,229,0.2);
          animation: ringPulse 2.5s ease-in-out infinite;
        }
        @keyframes ringPulse { 0%,100%{opacity:0.6;transform:scale(1);}50%{opacity:0;transform:scale(1.2);} }
        .reg-step-circle.pending {
          background: #f1f5f9;
          color: #94a3b8;
          border: 2px solid #e2e8f0;
        }
        .reg-step-label {
          text-align: center;
        }
        .reg-step-title {
          font-size: 12px;
          font-weight: 600;
          color: #1e293b;
          letter-spacing: -0.1px;
        }
        .reg-step-title.pending { color: #94a3b8; }
        .reg-step-subtitle {
          font-size: 10px;
          color: #94a3b8;
          margin-top: 1px;
        }
        .reg-step-connector {
          flex: 0 0 80px;
          height: 2px;
          background: #e2e8f0;
          margin: 0 8px;
          margin-bottom: 32px;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }
        .reg-step-connector-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background: #10b981;
          border-radius: 2px;
          transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
        }

        /* ── CONTENT AREA ── */
        .reg-content {
          position: relative;
          z-index: 1;
          max-width: 680px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }

        /* Step header */
        .reg-step-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
        }
        .reg-step-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .reg-step-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          background: #eef2ff;
          color: #4f46e5;
          border: 1px solid #c7d2fe;
          margin-bottom: 6px;
        }
        .reg-step-heading {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }
        .reg-step-desc {
          font-size: 14px;
          color: #64748b;
          margin-top: 4px;
          line-height: 1.5;
        }

        /* ── FORM CARD ── */
        .reg-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow:
            0 1px 3px rgba(0,0,0,0.04),
            0 8px 32px rgba(0,0,0,0.06);
        }

        /* Thin accent bar at top of card */
        .reg-card-accent {
          height: 3px;
          background: #e2e8f0;
          position: relative;
          overflow: hidden;
        }
        .reg-card-accent-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          border-radius: 0 3px 3px 0;
          transition: width 0.5s ease;
        }

        .reg-card-header {
          padding: 24px 28px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .reg-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.2px;
        }
        .reg-card-subtitle {
          font-size: 13px;
          color: #64748b;
          margin-top: 2px;
        }
        .reg-card-counter {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .reg-card-body {
          padding: 28px 28px 32px;
        }

        /* ── HELP SECTION ── */
        .reg-help {
          margin-top: 20px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .reg-help-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #eef2ff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .reg-help-title {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }
        .reg-help-sub {
          font-size: 12px;
          color: #64748b;
          margin-top: 1px;
        }
        .reg-help-btn {
          margin-left: auto;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 8px 16px;
          border-radius: 10px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          font-size: 12px;
          font-weight: 600;
          color: #0284c7;
          text-decoration: none;
          transition: all 0.15s;
          font-family: inherit;
          cursor: pointer;
        }
        .reg-help-btn:hover {
          background: #e0f2fe;
          border-color: #7dd3fc;
        }

        /* ── TRUST BADGES ── */
        .reg-trust {
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .reg-trust-item {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 20px;
          background: #fff;
          border: 1px solid #e2e8f0;
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 640px) {
          .reg-step-connector { flex: 0 0 24px; }
          .reg-step-label { display: none; }
          .reg-step-connector { margin-bottom: 0; }
          .reg-card-header, .reg-card-body { padding-left: 20px; padding-right: 20px; }
          .reg-step-heading { font-size: 18px; }
          .reg-content { padding: 24px 16px 60px; }
          .reg-help { display: none; }
        }
      `}</style>

      <div className="reg-root">
        <div className="reg-page">

          {/* ═══ HEADER ═══ */}
          <header className="reg-header">
            <div className="reg-header-inner">
              <div className="reg-logo">
                <div className="reg-logo-icon">
                  <GraduationCap size={18} color="#fff" />
                </div>
                <div>
                  <div className="reg-logo-text">CBE Noneaa</div>
                  <div className="reg-logo-sub">School Registration</div>
                </div>
              </div>
              <div className="reg-header-badge">
                <span className="reg-badge-dot" />
                Secure Registration
              </div>
            </div>
          </header>

          {/* ═══ STEPPER ═══ */}
          <div className="reg-stepper-wrap">
            <div className="reg-stepper">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const status = currentStep > step.number ? 'completed'
                  : currentStep === step.number ? 'active' : 'pending';

                return (
                  <React.Fragment key={step.number}>
                    <div className="reg-step-node">
                      <div className={`reg-step-circle ${status}`}>
                        {status === 'completed'
                          ? <Check size={18} strokeWidth={2.5} />
                          : status === 'active'
                            ? <Icon size={18} />
                            : <span>{step.number}</span>
                        }
                      </div>
                      <div className="reg-step-label">
                        <div className={`reg-step-title${status === 'pending' ? ' pending' : ''}`}>
                          {step.title}
                        </div>
                        <div className="reg-step-subtitle">{step.subtitle}</div>
                      </div>
                    </div>

                    {i < STEPS.length - 1 && (
                      <div className="reg-step-connector">
                        <div
                          className="reg-step-connector-fill"
                          style={{ width: currentStep > step.number ? '100%' : '0%' }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ═══ MAIN CONTENT ═══ */}
          <main className="reg-content">

            {/* Step header */}
            <motion.div
              className="reg-step-header"
              key={`header-${currentStep}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="reg-step-icon"
                style={{ background: `linear-gradient(135deg, ${active.color}, ${active.color}dd)` }}
              >
                <active.icon size={22} color="#fff" />
              </div>
              <div>
                <div className="reg-step-badge">
                  <Sparkles size={10} />
                  Step {currentStep} of {STEPS.length}
                </div>
                <div className="reg-step-heading">{active.cardTitle}</div>
                <div className="reg-step-desc">{active.cardDesc}</div>
              </div>
            </motion.div>

            {/* Form card */}
            <motion.div
              className="reg-card"
              key={`card-${currentStep}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            >
              {/* Accent bar */}
              <div className="reg-card-accent">
                <div
                  className="reg-card-accent-fill"
                  style={{
                    width: `${(currentStep / STEPS.length) * 100}%`,
                    background: `linear-gradient(90deg, ${active.color}, ${active.color}aa)`,
                  }}
                />
              </div>

              {/* Card header */}
              <div className="reg-card-header">
                <div>
                  <div className="reg-card-title">{active.cardTitle}</div>
                  <div className="reg-card-subtitle">{active.cardDesc}</div>
                </div>
                <div className="reg-card-counter">
                  {currentStep}/{STEPS.length}
                </div>
              </div>

              {/* Form body */}
              <div className="reg-card-body">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div key="s1"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
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
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
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
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
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
            </motion.div>

            {/* Help section */}
            <div className="reg-help">
              <div className="reg-help-icon">
                <Mail size={16} style={{ color: '#4f46e5' }} />
              </div>
              <div>
                <div className="reg-help-title">Need assistance?</div>
                <div className="reg-help-sub">Our team is available Mon-Fri, 8am-6pm EAT</div>
              </div>
              <a href="mailto:support@cbenoneaa.ac.ke" className="reg-help-btn">
                Contact support <ChevronRight size={12} />
              </a>
            </div>

            {/* Trust badges */}
            <div className="reg-trust">
              {TRUST_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <div className="reg-trust-item" key={item.label}>
                    <Icon size={11} style={{ color: '#10b981' }} />
                    {item.label}
                  </div>
                );
              })}
            </div>

          </main>
        </div>
      </div>
    </>
  );
}
