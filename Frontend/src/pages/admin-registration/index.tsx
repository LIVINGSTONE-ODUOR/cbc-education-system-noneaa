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
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
};

const API_URL = getApiUrl();
const AUTH_API_URL = `${API_URL}/api`;

const STEPS = [
  {
    number: 1,
    title: 'Basic Info',
    subtitle: 'School identity & details',
    cardTitle: 'Tell us about your school',
    cardDesc: 'Enter your school information to get started with CBE Noneaa',
    icon: GraduationCap,
    color: '#6366f1',
    bgGrad: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  },
  {
    number: 2,
    title: 'Location & Contact',
    subtitle: 'Where to find your school',
    cardTitle: 'School Location & Contact',
    cardDesc: 'Help parents and teachers locate and reach your school',
    icon: MapPin,
    color: '#10b981',
    bgGrad: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
  {
    number: 3,
    title: 'Admin Account',
    subtitle: 'Create administrator access',
    cardTitle: 'Create Administrator Account',
    cardDesc: 'Set up your secure admin credentials to access the portal',
    icon: UserCog,
    color: '#f59e0b',
    bgGrad: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
    name: '', code: '', subdomain: '', schoolType: undefined, levelsOffered: [],
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
        subdomain: step1Data.subdomain,
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
        const fieldErrors = Array.isArray(result.errors)
          ? result.errors.map((e: { field?: string; message: string }) => e.message).join(' ')
          : null;
        toast({
          title: 'Registration Failed',
          description: fieldErrors || result.message || 'Something went wrong.',
          variant: 'destructive',
        });
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        .lr-root, .lr-root * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif; }

        /* ══════════ LANDSCAPE SPLIT LAYOUT ══════════ */
        .lr-page {
          min-height: 100vh;
          display: flex;
          flex-direction: row;
          background: #f0f2f5;
        }

        /* ── LEFT PANEL (Branding / Decorative) ── */
        .lr-left {
          position: sticky;
          top: 0;
          width: 420px;
          min-width: 420px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px;
          overflow: hidden;
          transition: background 0.6s ease;
        }

        /* Animated mesh background */
        .lr-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1) 0%, transparent 50%);
          z-index: 1;
        }

        /* Floating decorative circles */
        .lr-deco-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.15);
          z-index: 1;
          animation: floatCircle 15s ease-in-out infinite;
        }
        .lr-deco-1 { width: 300px; height: 300px; top: -80px; right: -60px; animation-delay: 0s; }
        .lr-deco-2 { width: 200px; height: 200px; bottom: -40px; left: -40px; animation-delay: 5s; }
        .lr-deco-3 { width: 120px; height: 120px; top: 50%; left: 50%; animation-delay: 2s; opacity: 0.5; }
        @keyframes floatCircle {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(10px, -15px) scale(1.05); }
          66% { transform: translate(-8px, 12px) scale(0.95); }
        }

        .lr-left-content {
          position: relative;
          z-index: 2;
        }

        /* Logo section */
        .lr-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 60px;
        }
        .lr-brand-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.3);
        }
        .lr-brand-name {
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.3px;
        }
        .lr-brand-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          margin-top: 2px;
        }

        /* Step indicator on left panel */
        .lr-step-indicator {
          margin-bottom: 32px;
        }
        .lr-step-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          letter-spacing: 0.3px;
        }

        .lr-left-title {
          font-size: 32px;
          font-weight: 800;
          color: #fff;
          line-height: 1.2;
          letter-spacing: -0.8px;
          margin-bottom: 12px;
        }
        .lr-left-desc {
          font-size: 15px;
          color: rgba(255,255,255,0.7);
          line-height: 1.6;
          max-width: 320px;
        }

        /* Vertical stepper on left */
        .lr-v-stepper {
          margin-top: 48px;
          display: flex;
          flex-direction: column;
          gap: 0;
          position: relative;
          z-index: 2;
        }
        .lr-v-step {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 0;
          position: relative;
        }
        .lr-v-step:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 17px;
          top: 48px;
          width: 2px;
          height: calc(100% - 20px);
          background: rgba(255,255,255,0.15);
        }
        .lr-v-step.done:not(:last-child)::after {
          background: rgba(255,255,255,0.4);
        }
        .lr-v-dot {
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.4s ease;
          position: relative;
          z-index: 1;
        }
        .lr-v-dot.done {
          background: rgba(255,255,255,0.3);
          color: #fff;
        }
        .lr-v-dot.active {
          background: #fff;
          color: #4f46e5;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          transform: scale(1.1);
        }
        .lr-v-dot.pending {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.4);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .lr-v-label { font-size: 14px; font-weight: 600; color: #fff; }
        .lr-v-label.pending { color: rgba(255,255,255,0.4); }
        .lr-v-sublabel { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px; }

        /* Trust badges on left */
        .lr-left-trust {
          position: relative;
          z-index: 2;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .lr-trust-tag {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 20px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          font-size: 11px;
          color: rgba(255,255,255,0.8);
          font-weight: 500;
        }

        /* ── RIGHT PANEL (Form) ── */
        .lr-right {
          flex: 1;
          min-height: 100vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 48px;
          background: #fff;
        }

        .lr-form-wrap {
          width: 100%;
          max-width: 640px;
        }

        /* Right panel header */
        .lr-form-header {
          margin-bottom: 32px;
        }
        .lr-form-step-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .lr-form-title {
          font-size: 28px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.6px;
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .lr-form-desc {
          font-size: 15px;
          color: #6b7280;
          line-height: 1.5;
        }

        /* Progress bar */
        .lr-progress-bar {
          width: 100%;
          height: 4px;
          background: #e5e7eb;
          border-radius: 4px;
          margin-bottom: 32px;
          overflow: hidden;
        }
        .lr-progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Help footer */
        .lr-help {
          margin-top: 32px;
          padding: 16px 20px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fafafa;
        }
        .lr-help-icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          background: #eef2ff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .lr-help-title { font-size: 13px; font-weight: 600; color: #111827; }
        .lr-help-sub { font-size: 12px; color: #6b7280; margin-top: 1px; }
        .lr-help-btn {
          margin-left: auto;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 8px 14px;
          border-radius: 8px;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          font-size: 12px;
          font-weight: 600;
          color: #4f46e5;
          text-decoration: none;
          transition: all 0.15s;
          font-family: inherit;
          cursor: pointer;
        }
        .lr-help-btn:hover { background: #e0e7ff; }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .lr-page { flex-direction: column; }
          .lr-left {
            position: relative;
            width: 100%;
            min-width: unset;
            height: auto;
            min-height: unset;
            padding: 28px 24px;
          }
          .lr-brand { margin-bottom: 20px; }
          .lr-left-title { font-size: 22px; }
          .lr-v-stepper { display: none; }
          .lr-deco-circle { display: none; }
          .lr-right { padding: 28px 20px; }
          .lr-form-title { font-size: 22px; }
          .lr-help { display: none; }
        }
      `}</style>

      <div className="lr-root">
        <div className="lr-page">

          {/* ═══════════ LEFT PANEL ═══════════ */}
          <motion.div
            className="lr-left"
            style={{ background: active.bgGrad }}
            key={`left-${currentStep}`}
            initial={false}
            animate={{ background: active.bgGrad }}
            transition={{ duration: 0.6 }}
          >
            {/* Decorative circles */}
            <div className="lr-deco-circle lr-deco-1" />
            <div className="lr-deco-circle lr-deco-2" />
            <div className="lr-deco-circle lr-deco-3" />

            <div className="lr-left-content">
              {/* Brand */}
              <div className="lr-brand">
                <div className="lr-brand-icon">
                  <GraduationCap size={22} color="#fff" />
                </div>
                <div>
                  <div className="lr-brand-name">CBE Noneaa</div>
                  <div className="lr-brand-sub">Education Platform</div>
                </div>
              </div>

              {/* Step indicator pill */}
              <div className="lr-step-indicator">
                <div className="lr-step-pill">
                  <Sparkles size={12} />
                  Step {currentStep} of {STEPS.length}
                </div>
              </div>

              {/* Title */}
              <motion.div
                key={`title-${currentStep}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="lr-left-title">{active.cardTitle}</h1>
                <p className="lr-left-desc">{active.cardDesc}</p>
              </motion.div>

              {/* Vertical stepper */}
              <div className="lr-v-stepper">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  const status = currentStep > step.number ? 'done'
                    : currentStep === step.number ? 'active' : 'pending';

                  return (
                    <div className={`lr-v-step ${status}`} key={step.number}>
                      <div className={`lr-v-dot ${status}`}>
                        {status === 'done'
                          ? <Check size={16} strokeWidth={2.5} />
                          : status === 'active'
                            ? <Icon size={16} />
                            : <span>{step.number}</span>
                        }
                      </div>
                      <div>
                        <div className={`lr-v-label${status === 'pending' ? ' pending' : ''}`}>
                          {step.title}
                        </div>
                        <div className="lr-v-sublabel">{step.subtitle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trust badges */}
            <div className="lr-left-trust">
              {TRUST_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <div className="lr-trust-tag" key={item.label}>
                    <Icon size={11} />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ═══════════ RIGHT PANEL ═══════════ */}
          <div className="lr-right">
            <div className="lr-form-wrap">

              {/* Header */}
              <motion.div
                className="lr-form-header"
                key={`fh-${currentStep}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div
                  className="lr-form-step-badge"
                  style={{ background: active.color }}
                >
                  <active.icon size={12} />
                  Step {currentStep}
                </div>
                <h2 className="lr-form-title">{active.cardTitle}</h2>
                <p className="lr-form-desc">{active.cardDesc}</p>
              </motion.div>

              {/* Progress bar */}
              <div className="lr-progress-bar">
                <div
                  className="lr-progress-fill"
                  style={{
                    width: `${(currentStep / STEPS.length) * 100}%`,
                    background: active.color,
                  }}
                />
              </div>

              {/* Form steps */}
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div key="s1"
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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

              {/* Help */}
              <div className="lr-help">
                <div className="lr-help-icon">
                  <Mail size={16} style={{ color: '#4f46e5' }} />
                </div>
                <div>
                  <div className="lr-help-title">Need assistance?</div>
                  <div className="lr-help-sub">Mon-Fri, 8am-6pm EAT</div>
                </div>
                <a href="mailto:support@cbenoneaa.ac.ke" className="lr-help-btn">
                  Contact <ChevronRight size={12} />
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}
