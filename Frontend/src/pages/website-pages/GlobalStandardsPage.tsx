import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import {
  Globe, Shield, CheckCircle, ArrowRight,
  Award, Lock, Server, FileCheck,
  Users, Zap, BookOpen, Target,
  MapPin, GraduationCap, TrendingUp, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const alignmentData = [
  { framework: 'KICD', alignment: 98, color: '#22c55e' },
  { framework: 'UNESCO', alignment: 92, color: '#3b82f6' },
  { framework: 'IB Framework', alignment: 88, color: '#8b5cf6' },
  { framework: 'Cambridge', alignment: 85, color: '#f59e0b' },
  { framework: 'SDG 4', alignment: 95, color: '#06b6d4' },
  { framework: 'AU Agenda', alignment: 90, color: '#ec4899' },
];

const standards = [
  {
    category: 'Educational Standards',
    items: [
      { title: 'KICD Curriculum Alignment', desc: 'Fully aligned with Kenya Institute of Curriculum Development guidelines. Every learning area, strand, and sub-strand maps directly to the official curriculum designs.', icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
      { title: 'UNESCO Education Framework', desc: 'Supports the UNESCO International Bureau of Education framework for competency-based learning and sustainable development.', icon: Globe, color: 'bg-cyan-100 text-cyan-600' },
      { title: 'SDG 4: Quality Education', desc: 'Aligned with the United Nations Sustainable Development Goal 4, ensuring inclusive and equitable quality education for all.', icon: Target, color: 'bg-green-100 text-green-600' },
    ],
  },
  {
    category: 'Data & Security Standards',
    items: [
      { title: 'GDPR Compliant', desc: 'Student and staff data is handled in compliance with the General Data Protection Regulation, ensuring privacy and data rights.', icon: Shield, color: 'bg-purple-100 text-purple-600' },
      { title: 'Kenya Data Protection Act', desc: 'Full compliance with the Kenya Data Protection Act 2019, protecting personal data of all school stakeholders.', icon: Lock, color: 'bg-red-100 text-red-600' },
      { title: 'SOC 2 Type II', desc: 'Our infrastructure meets SOC 2 Type II compliance standards for security, availability, and confidentiality of data.', icon: Server, color: 'bg-gray-100 text-gray-600' },
    ],
  },
  {
    category: 'Accessibility Standards',
    items: [
      { title: 'WCAG 2.1 AA', desc: 'Our platform meets Web Content Accessibility Guidelines 2.1 Level AA, ensuring usability for people with diverse abilities.', icon: Users, color: 'bg-amber-100 text-amber-600' },
      { title: 'Mobile-First Design', desc: 'Optimized for mobile devices commonly used in Kenyan schools. Works on low-bandwidth connections and affordable smartphones.', icon: Zap, color: 'bg-indigo-100 text-indigo-600' },
      { title: 'Multi-Language Support', desc: 'Interface available in English and Kiswahili, with support for local language content in learning materials.', icon: MapPin, color: 'bg-rose-100 text-rose-600' },
    ],
  },
];

const certifications = [
  { name: 'KICD Approved', desc: 'Recognized by the Kenya Institute of Curriculum Development', icon: Award },
  { name: 'ISO 27001', desc: 'Information Security Management certified', icon: Shield },
  { name: 'Data Protection', desc: 'Kenya DPA 2019 compliant', icon: Lock },
  { name: 'WCAG 2.1 AA', desc: 'Web accessibility standard met', icon: FileCheck },
];

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <div ref={ref} className={className}>
      <motion.div initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
        {children}
      </motion.div>
    </div>
  );
}

export default function GlobalStandardsPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />
        <motion.div
          className="absolute top-16 right-10 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-16 left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible">
              <motion.p variants={fadeUp} custom={0} className="text-blue-300 font-semibold uppercase tracking-wider text-sm mb-4">
                Global Standards
              </motion.p>
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Built to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">World-Class</span> Standards
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-blue-100 mb-8 max-w-xl">
                NONEAA meets international education, data protection, and accessibility standards. Your school&apos;s data is secure, your processes are compliant, and your learners get world-class tools.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50" asChild>
                  <Link to="/get-started">Get Started <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link to="/cbe-standards">CBE Standards</Link>
                </Button>
              </motion.div>
            </motion.div>
            <motion.div variants={scaleIn} initial="hidden" animate="visible" className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <p className="text-white/70 text-sm mb-4 font-medium">Framework Alignment Score (%)</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={alignmentData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                    <YAxis type="category" dataKey="framework" tick={{ fill: '#cbd5e1', fontSize: 11 }} width={80} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#1e1b4b', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(value: number) => [`${value}%`, 'Alignment']} />
                    <Bar dataKey="alignment" radius={[0, 6, 6, 0]}>
                      {alignmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Certifications Bar */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {certifications.map((cert, i) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center p-6 rounded-xl bg-white shadow-sm"
              >
                <cert.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <p className="text-base font-bold text-gray-900">{cert.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{cert.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Standards Sections */}
      {standards.map((section, sectionIdx) => (
        <AnimatedSection key={section.category} className={sectionIdx % 2 === 0 ? 'py-20' : 'py-20 bg-gray-50'}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeUp} custom={0} className="mb-12">
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">{section.category}</p>
              <h2 className="text-3xl font-bold text-gray-900">{section.category}</h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              {section.items.map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  custom={i + 1}
                  className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all group"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${item.color} group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      ))}

      {/* Why It Matters */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
                Why Standards Matter
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Trust Built on Transparency
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-600 mb-8">
                When you choose NONEAA, you choose a platform that holds itself to the highest standards — not because it&apos;s required, but because your learners deserve it.
              </motion.p>
              <div className="space-y-4">
                {[
                  { text: 'Regular independent security audits', icon: Shield },
                  { text: 'Data stored on encrypted servers within East Africa', icon: Server },
                  { text: 'Annual compliance review with KICD', icon: FileCheck },
                  { text: 'Open roadmap aligned with global education trends', icon: TrendingUp },
                  { text: 'Dedicated data protection officer', icon: Lock },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} custom={3 + i} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-gray-700">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div variants={fadeUp} custom={2} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-200">
              <div className="text-center space-y-6">
                <Globe className="w-16 h-16 text-blue-600 mx-auto" />
                <h3 className="text-2xl font-bold text-gray-900">Trusted by 250+ Schools</h3>
                <p className="text-gray-600">
                  Schools across Kenya trust NONEAA to manage their academic data securely and in compliance with national and international standards.
                </p>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  {[
                    { value: '99.9%', label: 'Uptime' },
                    { value: '0', label: 'Data breaches' },
                    { value: '24/7', label: 'Monitoring' },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-2xl font-bold text-blue-600">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-slate-800 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <Shield className="w-12 h-12 text-blue-300 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Global Standards. Local Impact.
            </h2>
            <p className="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
              Empower your school with a platform that meets world-class standards while being built specifically for Kenyan education.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50" asChild>
                <Link to="/get-started">Get Started Free <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                <Link to="/demo">Book a Demo</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
