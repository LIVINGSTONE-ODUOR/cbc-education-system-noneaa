import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  BookOpen, Target, BarChart3, Users, Layers, FileText,
  CheckCircle, ArrowRight, GraduationCap, Lightbulb,
  Zap, Shield, Eye, TrendingUp, Sparkles, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// ── Animation Variants ─────────────────────────────────────────

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

// ── Data ────────────────────────────────────────────────────────

const learningAreaDistribution = [
  { area: 'Maths', strands: 4, subStrands: 16 },
  { area: 'English', strands: 5, subStrands: 20 },
  { area: 'Science', strands: 4, subStrands: 18 },
  { area: 'Kiswahili', strands: 4, subStrands: 15 },
  { area: 'Social St.', strands: 4, subStrands: 14 },
  { area: 'CRE', strands: 3, subStrands: 12 },
  { area: 'Creative Arts', strands: 4, subStrands: 16 },
  { area: 'PE', strands: 3, subStrands: 10 },
];

const gradeDistribution = [
  { name: 'Pre-Primary', value: 2, color: '#3b82f6' },
  { name: 'Lower Primary', value: 3, color: '#8b5cf6' },
  { name: 'Upper Primary', value: 3, color: '#f59e0b' },
  { name: 'Junior Secondary', value: 3, color: '#22c55e' },
  { name: 'Senior Secondary', value: 3, color: '#ec4899' },
];

const competencyCoverage = [
  { area: 'Communication', coverage: 95 },
  { area: 'Critical Thinking', coverage: 88 },
  { area: 'Creativity', coverage: 82 },
  { area: 'Digital Literacy', coverage: 78 },
  { area: 'Citizenship', coverage: 90 },
  { area: 'Self-Efficacy', coverage: 85 },
  { area: 'Learning to Learn', coverage: 80 },
];

const curriculumAreas = [
  { title: 'Language Activities', grades: 'Pre-Primary 1 & 2', strands: ['Listening & Speaking', 'Reading', 'Writing', 'Book & Print Awareness'], color: 'bg-blue-50 border-blue-800', iconBg: 'bg-blue-900/30 text-blue-600' },
  { title: 'Mathematics', grades: 'Grade 1–9', strands: ['Numbers', 'Measurement', 'Geometry', 'Data Handling & Probability'], color: 'bg-emerald-50 border-emerald-800', iconBg: 'bg-emerald-900/30 text-emerald-600' },
  { title: 'Integrated Science', grades: 'Grade 4–9', strands: ['Living Things & Environment', 'Materials & Energy', 'Earth & Space', 'Health & Safety'], color: 'bg-purple-50 border-purple-800', iconBg: 'bg-purple-900/30 text-purple-600' },
  { title: 'Social Studies', grades: 'Grade 4–9', strands: ['Citizenship', 'People & Population', 'Culture & Society', 'Resources & Economic Activities'], color: 'bg-amber-50 border-amber-200', iconBg: 'bg-amber-900/30 text-amber-600' },
  { title: 'Creative Arts & Sports', grades: 'Grade 1–9', strands: ['Performing Arts', 'Visual Arts', 'Physical Education', 'Swimming'], color: 'bg-rose-50 border-rose-200', iconBg: 'bg-rose-900/30 text-rose-600' },
  { title: 'Religious Education', grades: 'Grade 1–9', strands: ['CRE / IRE / HRE', 'Moral Values', 'Community Service', 'Spiritual Growth'], color: 'bg-cyan-50 border-cyan-200', iconBg: 'bg-cyan-900/30 text-cyan-600' },
];

const gradeLevels = [
  { level: 'Pre-Primary', grades: 'PP1 & PP2', age: '4–5 years', areas: 5, color: 'from-blue-500 to-blue-600' },
  { level: 'Lower Primary', grades: 'Grade 1–3', age: '6–8 years', areas: 6, color: 'from-purple-500 to-purple-600' },
  { level: 'Upper Primary', grades: 'Grade 4–6', age: '9–11 years', areas: 8, color: 'from-amber-500 to-amber-600' },
  { level: 'Junior Secondary', grades: 'Grade 7–9', age: '12–14 years', areas: 12, color: 'from-green-500 to-emerald-600' },
  { level: 'Senior Secondary', grades: 'Grade 10–12', age: '15–17 years', areas: 'Pathways', color: 'from-rose-500 to-pink-600' },
];

// ── Components ──────────────────────────────────────────────────

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <div ref={ref} className={className}>
      <motion.div
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────

export default function CurriculumPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900" />
        <motion.div
          className="absolute top-16 right-16 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-10 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible">
              <motion.p variants={fadeUp} custom={0} className="text-blue-300 font-semibold uppercase tracking-wider text-sm mb-4">
                Curriculum Management
              </motion.p>
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Manage Kenya&apos;s CBC Curriculum <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">with Confidence</span>
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-blue-100 mb-8 max-w-xl">
                Organize, track, and assess every learning area, strand, and sub-strand — from Pre-Primary to Senior Secondary. Built for the 2-6-3-3-3 structure.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-slate-800 text-blue-900 hover:bg-blue-50" asChild>
                  <Link to="/get-started">Get Started Free <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link to="/demo">Request Demo</Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Chart — Learning Areas */}
            <motion.div variants={scaleIn} initial="hidden" animate="visible" className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <p className="text-white/70 text-sm mb-3 font-medium">Learning Areas — Strands & Sub-Strands</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={learningAreaDistribution} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="area" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1e1b4b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="strands" fill="#818cf8" name="Strands" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="subStrands" fill="#c084fc" name="Sub-Strands" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────── */}
      <section className="bg-slate-800/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Learning Areas', value: '8+', icon: BookOpen },
              { label: 'Strands Tracked', value: '35+', icon: Layers },
              { label: 'Sub-Strands', value: '120+', icon: Target },
              { label: 'Grade Levels', value: 'PP1–G12', icon: GraduationCap },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center p-6 rounded-xl bg-slate-800 shadow-sm"
              >
                <stat.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Grade Level Structure ────────────────────────────── */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">2-6-3-3-3 Structure</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">CBC Grade Level Structure</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Kenya&apos;s CBC organizes learners from Pre-Primary through Senior Secondary, each with defined learning areas and pathways.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Grade Level Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {gradeLevels.map((item, i) => (
                <motion.div
                  key={item.level}
                  variants={fadeUp}
                  custom={i + 1}
                  className="text-center p-5 rounded-xl border hover:shadow-lg hover:-translate-y-1 transition-all group"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center text-white mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">{item.level}</h3>
                  <p className="text-xs text-muted-foreground mb-1">{item.grades} • {item.age}</p>
                  <p className="text-xs font-medium text-blue-600">
                    {typeof item.areas === 'number' ? `${item.areas} Learning Areas` : item.areas}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Grade Distribution Pie Chart */}
            <motion.div variants={scaleIn} className="bg-slate-800 rounded-2xl shadow-lg border p-6">
              <p className="text-sm font-medium text-gray-500 mb-4">Grade Level Distribution</p>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }: { name: string; value: number }) => `${name} (${value})`}
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value} grades`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── Learning Areas & Strands ─────────────────────────── */}
      <AnimatedSection className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-3">KICD Aligned</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Learning Areas & Strands</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Every learning area is organized into strands and sub-strands. NONEAA tracks competency at every level of the curriculum hierarchy.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curriculumAreas.map((area, i) => (
              <motion.div
                key={area.title}
                variants={fadeUp}
                custom={i + 1}
                className={`rounded-2xl border p-6 ${area.color} hover:shadow-lg hover:-translate-y-1 transition-all group`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${area.iconBg} group-hover:scale-110 transition-transform`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white mb-1">{area.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{area.grades}</p>
                <div className="space-y-2">
                  {area.strands.map((strand) => (
                    <div key={strand} className="flex items-center gap-2 text-sm text-slate-200">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {strand}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── Competency Coverage Radar ────────────────────────── */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-3">
                Competency Integration
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Every Subject Maps to Core Competencies
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-slate-300 mb-8">
                CBE isn&apos;t just about subjects — it&apos;s about developing competencies. Our curriculum management system maps every learning activity to the 7 core competencies, so you can see exactly how your curriculum develops the whole learner.
              </motion.p>
              <div className="space-y-4">
                {[
                  { text: 'Automatic competency tagging for every assessment', icon: Target },
                  { text: 'Identify curriculum gaps in competency coverage', icon: Eye },
                  { text: 'Ensure balanced development across all 7 competencies', icon: Shield },
                  { text: 'Visual reports for curriculum audits and KICD reviews', icon: BarChart3 },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} custom={3 + i} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-900/30 flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-slate-200">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div variants={scaleIn} className="bg-slate-800 rounded-2xl shadow-lg border p-6">
              <p className="text-sm font-medium text-gray-500 mb-4">Competency Coverage Across Curriculum (%)</p>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={competencyCoverage}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="area" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Coverage" dataKey="coverage" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── Strand & Sub-Strand Detail Chart ─────────────────── */}
      <AnimatedSection className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={scaleIn} className="order-2 lg:order-1 bg-slate-800 rounded-2xl shadow-lg border p-6">
              <p className="text-sm font-medium text-gray-500 mb-4">Strands & Sub-Strands per Learning Area</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={learningAreaDistribution} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="area" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="strands" fill="#3b82f6" name="Strands" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="subStrands" fill="#a78bfa" name="Sub-Strands" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
            <div className="order-1 lg:order-2">
              <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
                Granular Organization
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Every Strand. Every Sub-Strand. Tracked.
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-slate-300 mb-8">
                Don&apos;t just track &ldquo;Mathematics&rdquo; — track Numbers, Geometry, Measurement, and Data Handling separately. When a learner struggles, you know <em>exactly</em> where they need support.
              </motion.p>
              <div className="space-y-3">
                {[
                  'Over 120 sub-strands organized and ready to use',
                  'Teachers see only the strands assigned to them',
                  'Auto-linked to KICD curriculum design documents',
                  'Customizable for school-specific enrichment programs',
                ].map((text, i) => (
                  <motion.div key={i} variants={fadeUp} custom={3 + i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-200">{text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── Management Features ──────────────────────────────── */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">Platform Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">What You Can Do with NONEAA</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Practical tools for teachers and administrators to manage the CBC curriculum day-to-day.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Strand & Sub-Strand Tracking', desc: 'Organize learning areas by strands and sub-strands as defined by KICD. Track progress at every level of the curriculum hierarchy.', icon: Layers, color: 'bg-blue-900/30 text-blue-600' },
              { title: 'Competency Level Assessment', desc: 'Record learner competencies using the 4-level scale: Exceeding, Meeting, Approaching, and Below Expectations.', icon: Target, color: 'bg-purple-900/30 text-purple-600' },
              { title: 'Progress Reports', desc: 'Generate term-end reports showing each learner\'s competency levels across all learning areas and indicators.', icon: BarChart3, color: 'bg-green-900/30 text-green-600' },
              { title: 'Rubric Customization', desc: 'Use KICD-aligned rubrics or create custom assessment criteria for formative and summative assessments.', icon: FileText, color: 'bg-amber-900/30 text-amber-600' },
              { title: 'Teacher Allocation', desc: 'Assign teachers to specific learning areas and grade levels. Teachers only see the subjects and classes assigned to them.', icon: Users, color: 'bg-rose-900/30 text-rose-600' },
              { title: 'Learning Outcomes Mapping', desc: 'Map each assessment to specific learning outcomes so you always know what competencies are being measured.', icon: Lightbulb, color: 'bg-indigo-900/30 text-indigo-600' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                custom={i + 1}
                className="p-6 rounded-2xl border bg-slate-800 hover:shadow-lg transition-shadow group"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${feature.color} group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-300 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── Why Schools Choose NONEAA ──────────────────────── */}
      <AnimatedSection className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">The Difference</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why Schools Choose NONEAA for Curriculum</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Set Up in Under 1 Hour', desc: 'Pre-loaded with the full KICD curriculum. Just select your grade levels and start.', icon: Clock, color: 'bg-blue-900/30 text-blue-600' },
              { title: 'Always Up to Date', desc: 'When KICD updates the curriculum, we update the system — automatically.', icon: Zap, color: 'bg-amber-900/30 text-amber-600' },
              { title: 'Teacher-Friendly', desc: 'Simple interface that teachers can learn in minutes, not days.', icon: Sparkles, color: 'bg-purple-900/30 text-purple-600' },
              { title: 'Data-Driven', desc: 'Make curriculum decisions backed by real assessment data, not guesswork.', icon: TrendingUp, color: 'bg-emerald-900/30 text-emerald-600' },
            ].map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i + 1} className="p-6 rounded-2xl border bg-slate-800 text-center hover:shadow-lg transition-shadow group">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl mx-auto mb-4 ${item.color} group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-300">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <BookOpen className="w-12 h-12 text-blue-200 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Start Managing Your Curriculum Today
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Whether you&apos;re a single school or a school group, NONEAA scales to your needs. Set up learning areas, assign teachers, and begin tracking competencies in under an hour.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-slate-800 text-blue-700 hover:bg-blue-50" asChild>
                <Link to="/get-started">Get Started Free <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                <Link to="/contact">Talk to Our Team</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
