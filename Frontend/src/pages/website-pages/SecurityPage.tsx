import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ShieldCheck, Lock, Eye, Server, KeyRound, ArrowRight,
  CheckCircle, Globe, Shield, Fingerprint, RefreshCw,
  AlertTriangle, Clock, Users, Mail, Zap, FileCheck,
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

const stats = [
  { label: 'Uptime SLA', value: '99.9%', icon: Zap },
  { label: 'Data Breaches', value: '0', icon: ShieldCheck },
  { label: 'Monitoring', value: '24/7', icon: Eye },
  { label: 'Encryption', value: 'AES-256', icon: Lock },
];

const securityLayers = [
  { title: 'Data Encryption', icon: Lock, color: 'from-blue-500 to-blue-600', items: ['TLS 1.3 for all data in transit', 'AES-256 encryption for data at rest', 'Passwords hashed with bcrypt (never stored in plain text)', 'Encryption keys managed and rotated regularly'] },
  { title: 'Access Controls', icon: KeyRound, color: 'from-purple-500 to-purple-600', items: ['Role-based access control (RBAC) — admin, teacher, parent, student', 'Multi-factor authentication (MFA) support', 'Automatic session timeouts for inactive users', 'IP allowlisting for school administrators'] },
  { title: 'Infrastructure Security', icon: Server, color: 'from-emerald-500 to-emerald-600', items: ['Hosted on SOC 2 Type II compliant cloud infrastructure', 'Network segmentation and firewall protection', 'Automated vulnerability scanning and patching', 'Geographically distributed redundant backups'] },
  { title: 'Monitoring & Detection', icon: Eye, color: 'from-amber-500 to-amber-600', items: ['24/7 real-time threat detection and alerting', 'Automated intrusion prevention systems (IPS)', 'Comprehensive audit logging of all access events', 'Anomaly detection for unusual login patterns'] },
  { title: 'Incident Response', icon: AlertTriangle, color: 'from-rose-500 to-rose-600', items: ['Documented incident response plan with defined SLAs', 'Dedicated security team for rapid response', 'Affected users notified within 72 hours of confirmed breach', 'Post-incident review and improvement process'] },
  { title: 'Compliance & Audits', icon: FileCheck, color: 'from-indigo-500 to-indigo-600', items: ['Kenya Data Protection Act 2019 compliant', 'GDPR-aligned data handling practices', 'Annual third-party security audits', 'Regular penetration testing by certified firms'] },
];

const practices = [
  { title: 'Secure Development', desc: 'All code goes through security-focused code reviews. We follow OWASP Top 10 guidelines and conduct static analysis on every release.', icon: Shield },
  { title: 'Employee Security', desc: 'All team members undergo background checks and security training. Access to production systems is limited to essential personnel only.', icon: Users },
  { title: 'Backup & Recovery', desc: 'Automated daily backups with 30-day retention. Recovery tested quarterly. RPO < 1 hour, RTO < 4 hours.', icon: RefreshCw },
  { title: 'Responsible Disclosure', desc: 'We welcome security researchers to report vulnerabilities through our responsible disclosure program. We respond within 48 hours.', icon: Fingerprint },
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

export default function SecurityPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-[#e8edf5]">
      <Header />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950" />
        <motion.div className="absolute top-16 right-20 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl" animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 6, repeat: Infinity }} />
        <motion.div className="absolute bottom-10 left-16 w-56 h-56 bg-teal-500/15 rounded-full blur-3xl" animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 5, repeat: Infinity, delay: 1.5 }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Security at NONEAA
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-emerald-200 mb-6 max-w-2xl mx-auto">
              We handle sensitive educational data — student records, assessments, and personal information. Security isn&apos;t a feature; it&apos;s the foundation everything is built on.
            </motion.p>
            <motion.p variants={fadeUp} custom={3} className="text-sm text-emerald-300/70">
              Last updated: June 2026
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#dfe5f0] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} className="text-center p-6 rounded-xl bg-white shadow-sm">
                <stat.icon className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Layers */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">Defense in Depth</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Multiple Layers of Protection</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your data is protected by six interconnected security layers — each one designed to prevent, detect, and respond to threats.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityLayers.map((layer, i) => (
              <motion.div key={layer.title} variants={fadeUp} custom={i + 1} className="bg-white rounded-2xl border shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all group">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${layer.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                  <layer.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{layer.title}</h3>
                <ul className="space-y-2">
                  {layer.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Security Architecture Visual */}
      <AnimatedSection className="py-20 bg-[#dfe5f0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">Architecture</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How We Protect Your Data</h2>
          </motion.div>
          <div className="space-y-4">
            {[
              { layer: 'Edge Layer', desc: 'DDoS protection, WAF, rate limiting, SSL/TLS termination', color: 'bg-blue-500', width: 'w-full' },
              { layer: 'Application Layer', desc: 'Authentication, RBAC, input validation, CSRF protection', color: 'bg-purple-500', width: 'w-[92%]' },
              { layer: 'Data Layer', desc: 'AES-256 encryption, field-level encryption, data masking', color: 'bg-emerald-500', width: 'w-[84%]' },
              { layer: 'Infrastructure', desc: 'Network segmentation, container isolation, secrets management', color: 'bg-amber-500', width: 'w-[76%]' },
              { layer: 'Monitoring', desc: 'Audit logs, anomaly detection, real-time alerting, SIEM', color: 'bg-rose-500', width: 'w-[68%]' },
            ].map((item, i) => (
              <motion.div key={item.layer} variants={fadeUp} custom={i + 1} className={`${item.width} mx-auto`}>
                <div className={`${item.color} rounded-xl p-4 text-white flex items-center justify-between`}>
                  <div>
                    <p className="font-semibold text-sm">{item.layer}</p>
                    <p className="text-xs text-white/80 mt-0.5">{item.desc}</p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-white/60 flex-shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>
          <motion.p variants={fadeUp} custom={6} className="text-center text-sm text-muted-foreground mt-8">
            Each layer adds protection — an attacker would need to bypass all five to reach your data.
          </motion.p>
        </div>
      </AnimatedSection>

      {/* Additional Practices */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">Best Practices</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Security Beyond Technology</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Security is about people and processes too — not just technology.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {practices.map((p, i) => (
              <motion.div key={p.title} variants={fadeUp} custom={i + 1} className="bg-white rounded-2xl border shadow-sm p-6 text-center hover:shadow-lg transition-shadow group">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <p.icon className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-600">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Certifications */}
      <AnimatedSection className="py-16 bg-[#dfe5f0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Compliance & Certifications</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Kenya DPA 2019', desc: 'Data Protection Act compliant' },
              { name: 'GDPR Aligned', desc: 'EU data protection standards' },
              { name: 'SOC 2 Type II', desc: 'Security & availability certified' },
              { name: 'ISO 27001', desc: 'Information security management' },
            ].map((cert, i) => (
              <motion.div key={cert.name} variants={fadeUp} custom={i + 1} className="bg-white rounded-xl border p-4 text-center hover:shadow-md transition-shadow">
                <Shield className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold text-sm text-gray-900">{cert.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{cert.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Report Vulnerability / Contact */}
      <AnimatedSection className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div variants={fadeUp} custom={0} className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-8">
              <Fingerprint className="w-10 h-10 text-emerald-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Report a Vulnerability</h3>
              <p className="text-sm text-gray-600 mb-6">
                Found a security issue? We take all reports seriously and respond within 48 hours. Responsible disclosure is rewarded.
              </p>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Mail className="w-4 h-4 text-emerald-600" /> security@noneaa.com
              </div>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-8">
              <Clock className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Security Questions?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Need more details about our security practices? Our security team is happy to answer questions and provide documentation.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                <Link to="/contact">Contact Security Team <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      <Footer />
    </div>
  );
}
