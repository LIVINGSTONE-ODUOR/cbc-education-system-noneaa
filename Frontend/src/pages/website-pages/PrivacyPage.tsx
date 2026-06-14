import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Shield, Eye, Lock, Users, Mail, ArrowRight,
  CheckCircle, Database, FileText, Globe,
  UserCheck, Bell, Trash2, Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' },
  }),
};

const principles = [
  { title: 'Transparency', desc: 'We clearly explain what data we collect, why we collect it, and how it is used.', icon: Eye, color: 'from-blue-500 to-blue-600' },
  { title: 'Minimal Collection', desc: 'We only collect data that is strictly necessary for providing our educational services.', icon: Database, color: 'from-purple-500 to-purple-600' },
  { title: 'Strong Encryption', desc: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256) — no exceptions.', icon: Lock, color: 'from-emerald-500 to-emerald-600' },
  { title: 'User Control', desc: 'You own your data. Export, correct, or delete your information at any time.', icon: UserCheck, color: 'from-amber-500 to-amber-600' },
  { title: 'No Selling Data', desc: 'We never sell, trade, or share personal data with third parties for marketing.', icon: Shield, color: 'from-rose-500 to-rose-600' },
  { title: 'Compliance', desc: 'Fully compliant with the Kenya Data Protection Act 2019 and GDPR standards.', icon: Globe, color: 'from-indigo-500 to-indigo-600' },
];

const sections = [
  {
    icon: Lock,
    title: 'Information We Collect',
    color: 'border-l-blue-500',
    subsections: [
      {
        subtitle: 'Personal Information',
        desc: 'We may collect the following personal information when you register or use our platform:',
        items: ['Name and contact information (email, phone number)', 'Educational records and academic performance data', 'School and institutional affiliation', 'User account credentials (securely hashed)', 'Profile information and preferences'],
      },
      {
        subtitle: 'Usage Data',
        desc: 'We automatically collect certain information when you use our platform:',
        items: ['IP address and approximate location', 'Browser type and version', 'Device information and screen resolution', 'Login times and session duration', 'Pages visited and features used', 'Assessment submissions and progress data'],
      },
    ],
  },
  {
    icon: Users,
    title: 'How We Use Your Information',
    color: 'border-l-purple-500',
    subsections: [
      {
        subtitle: 'Core Services',
        desc: 'We use collected information to:',
        items: ['Provide and maintain our educational platform', 'Process and track student progress and assessments', 'Generate competency reports and analytics for schools', 'Enable parent-teacher communication'],
      },
      {
        subtitle: 'Platform Improvement',
        desc: 'We also use data to:',
        items: ['Improve our services and develop new features', 'Ensure platform security and prevent unauthorized access', 'Comply with legal obligations and educational regulations'],
      },
    ],
  },
  {
    icon: Mail,
    title: 'Information Sharing & Disclosure',
    color: 'border-l-amber-500',
    subsections: [
      {
        subtitle: 'When We Share',
        desc: 'We may share your information only in these circumstances:',
        items: ['With your school for academic record management', 'With parents/guardians for student progress monitoring', 'With trusted service providers who help operate our platform', 'When required by law or to protect our legal rights', 'In connection with a business transfer (with advance notice)'],
      },
      {
        subtitle: 'What We Never Do',
        desc: '',
        items: ['We never sell your personal information', 'We never share data with advertisers', 'We never use student data for commercial profiling'],
      },
    ],
  },
  {
    icon: Shield,
    title: 'Data Security',
    color: 'border-l-emerald-500',
    subsections: [
      {
        subtitle: 'How We Protect Your Data',
        desc: 'We implement industry-leading security measures:',
        items: ['End-to-end encryption for all data transfers', 'AES-256 encryption for data stored on our servers', 'Regular security audits and penetration testing', 'Role-based access control (RBAC) across the platform', '24/7 monitoring for suspicious activity'],
      },
    ],
  },
  {
    icon: FileText,
    title: 'Your Rights',
    color: 'border-l-rose-500',
    subsections: [
      {
        subtitle: 'Under the Kenya Data Protection Act 2019',
        desc: 'You have the right to:',
        items: ['Access your personal data held by us', 'Request correction of inaccurate data', 'Request deletion of your personal data', 'Object to processing of your data', 'Data portability — export your data in standard formats', 'Withdraw consent at any time'],
      },
    ],
  },
];

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <div ref={ref} className={className}>
      <motion.div initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}>
        {children}
      </motion.div>
    </div>
  );
}

export default function PrivacyPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />
        <motion.div className="absolute top-16 right-16 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl" animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 6, repeat: Infinity }} />
        <motion.div className="absolute bottom-10 left-10 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl" animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 5, repeat: Infinity, delay: 1.5 }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Privacy Policy
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-blue-200 mb-6 max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information when using the NONEAA platform.
            </motion.p>
            <motion.p variants={fadeUp} custom={3} className="text-sm text-blue-300/70">
              Last updated: June 2026
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Principles Grid */}
      <AnimatedSection className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">Our Commitment</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Privacy Principles We Live By</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These principles guide every decision we make about your data.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {principles.map((p, i) => (
              <motion.div key={p.title} variants={fadeUp} custom={i + 1} className="bg-white rounded-2xl p-6 border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${p.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                  <p.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-600">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Policy Sections */}
      {sections.map((section, sIdx) => (
        <AnimatedSection key={section.title} className={sIdx % 2 === 0 ? 'py-16' : 'py-16 bg-gray-50'}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeUp} custom={0} className={`bg-white rounded-2xl border-l-4 ${section.color} border shadow-sm p-8`}>
              <div className="flex items-center gap-3 mb-6">
                <section.icon className="w-6 h-6 text-gray-700" />
                <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
              </div>
              <div className="space-y-6">
                {section.subsections.map((sub) => (
                  <div key={sub.subtitle}>
                    <h4 className="font-semibold text-gray-900 mb-2">{sub.subtitle}</h4>
                    {sub.desc && <p className="text-sm text-gray-600 mb-3">{sub.desc}</p>}
                    <ul className="space-y-2">
                      {sub.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </AnimatedSection>
      ))}

      {/* Data Retention & Cookies */}
      <AnimatedSection className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div variants={fadeUp} custom={0} className="bg-white rounded-2xl border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Database className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Data Retention</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                We retain your personal data only as long as necessary to provide our services and comply with legal obligations.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />Account data: retained while your account is active</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />Academic records: retained per school policy and regulations</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />Usage logs: retained for 12 months</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />Deleted data: permanently purged within 30 days</li>
              </ul>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="bg-white rounded-2xl border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Cookies & Tracking</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                We use cookies to keep you logged in and improve your experience. We do not use advertising or tracking cookies.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />Essential cookies: login session and security</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />Preference cookies: language and UI settings</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />Analytics: anonymized usage statistics only</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />No third-party advertising cookies — ever</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Children's Privacy */}
      <AnimatedSection className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="bg-white rounded-2xl border shadow-sm p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Children&apos;s Privacy</h3>
            <p className="text-gray-600 max-w-2xl mx-auto mb-4">
              As an educational platform, we take extra care with student data. All learner data is managed through school administrator and parent accounts. Students under 18 cannot create accounts independently.
            </p>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We comply with the Kenya Children Act 2022 and international standards for protecting minors&apos; data in educational settings.
            </p>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Contact */}
      <AnimatedSection className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Questions About Your Privacy?</h3>
                <p className="text-gray-600 mb-6">
                  If you have any questions about this Privacy Policy or how we handle your data, our Data Protection Officer is here to help.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <Mail className="w-4 h-4 text-blue-600" /> privacy@noneaa.com
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <Globe className="w-4 h-4 text-blue-600" /> www.noneaa.com/privacy
                  </div>
                </div>
              </div>
              <div className="text-center md:text-right">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                  <Link to="/contact">Contact Us <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      <Footer />
    </div>
  );
}
