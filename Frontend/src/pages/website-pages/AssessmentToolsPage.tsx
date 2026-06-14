import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  ClipboardCheck, CheckCircle, Target, Award,
  FileText, Users, ArrowRight, Zap,
  BarChart3, BookOpen, Layers, Shield,
  Sparkles, Download,
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

const competencyDist = [
  { name: 'Exceeding', value: 25, color: '#22c55e' },
  { name: 'Meeting', value: 45, color: '#3b82f6' },
  { name: 'Approaching', value: 22, color: '#f59e0b' },
  { name: 'Below', value: 8, color: '#ef4444' },
];

const strandPerformance = [
  { strand: 'Numbers', score: 78 },
  { strand: 'Geometry', score: 82 },
  { strand: 'Measurement', score: 65 },
  { strand: 'Data Handling', score: 74 },
  { strand: 'Algebra', score: 70 },
  { strand: 'Fractions', score: 68 },
];

const radarData = [
  { competency: 'Communication', score: 85 },
  { competency: 'Critical Thinking', score: 78 },
  { competency: 'Creativity', score: 82 },
  { competency: 'Digital Literacy', score: 75 },
  { competency: 'Citizenship', score: 88 },
  { competency: 'Self-Efficacy', score: 80 },
  { competency: 'Learning to Learn', score: 77 },
];

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

export default function AssessmentToolsPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900" />
        <motion.div
          className="absolute top-16 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-16 right-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, delay: 1 }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible">
              <motion.p variants={fadeUp} custom={0} className="text-purple-300 font-semibold uppercase tracking-wider text-sm mb-4">
                CBE Assessment Tools
              </motion.p>
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Assess Competencies, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Not Just Marks</span>
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-purple-100 mb-8 max-w-xl">
                Purpose-built assessment tools aligned with Kenya&apos;s CBE framework. Record, analyze, and report competency levels with ease.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-purple-900 hover:bg-purple-50" asChild>
                  <Link to="/get-started">Start Assessing <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link to="/demo">See It in Action</Link>
                </Button>
              </motion.div>
            </motion.div>
            <motion.div variants={scaleIn} initial="hidden" animate="visible" className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <p className="text-white/70 text-sm mb-4 font-medium">Competency Level Distribution</p>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={competencyDist} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {competencyDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value}%`, name]} contentStyle={{ background: '#1e1b4b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {competencyDist.map((item) => (
                    <span key={item.name} className="flex items-center gap-1.5 text-xs text-white/70">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} /> {item.name}: {item.value}%
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <AnimatedSection className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Assess in 3 Simple Steps</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Select Learner & Subject', desc: 'Choose the student, learning area, strand, and sub-strand you want to assess.', icon: Users, color: 'bg-blue-600' },
              { step: '02', title: 'Record Competency Level', desc: 'Mark the learner as Exceeding, Meeting, Approaching, or Below Expectation based on observed performance.', icon: ClipboardCheck, color: 'bg-purple-600' },
              { step: '03', title: 'Generate Reports', desc: 'Instantly generate individual, class-wide, or school-wide assessment reports with visual breakdowns.', icon: FileText, color: 'bg-indigo-600' },
            ].map((item, i) => (
              <motion.div key={item.step} variants={fadeUp} custom={i + 1} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-sm border hover:shadow-lg transition-shadow h-full">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${item.color} text-white mb-6`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <span className="text-6xl font-bold text-gray-100 absolute top-4 right-6">{item.step}</span>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Strand-Level Analysis */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
                Granular Insights
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Drill Down to Strand & Sub-Strand Level
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-600 mb-8">
                Don&apos;t just know that a learner is struggling in Mathematics — know <em>exactly which strand</em> needs attention. Our tools break down performance into Numbers, Geometry, Measurement, Data Handling, and more.
              </motion.p>
              <div className="space-y-4">
                {[
                  'Identify exact learning gaps at the strand level',
                  'Teachers can plan targeted interventions based on data',
                  'KICD-aligned strands and sub-strands built in',
                ].map((text, i) => (
                  <motion.div key={i} variants={fadeUp} custom={3 + i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div variants={scaleIn} className="bg-white rounded-2xl shadow-lg border p-6">
              <p className="text-sm font-medium text-gray-500 mb-4">Mathematics — Strand Performance</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={strandPerformance} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="strand" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} formatter={(value: number) => [`${value}%`, 'Score']} />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                    {strandPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score >= 75 ? '#22c55e' : entry.score >= 60 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Competency Radar */}
      <AnimatedSection className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={scaleIn} className="order-2 lg:order-1 bg-white rounded-2xl shadow-lg border p-6">
              <p className="text-sm font-medium text-gray-500 mb-4">Learner Competency Profile</p>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="competency" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
            <div className="order-1 lg:order-2">
              <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-3">
                Holistic Assessment
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                7 Core Competencies — One Clear Picture
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-600 mb-8">
                CBE assesses learners across 7 core competencies. Our radar chart gives teachers and parents a holistic view of a learner&apos;s strengths and areas for growth — all in one glance.
              </motion.p>
              <div className="space-y-4">
                {[
                  { text: 'Communication & Collaboration', icon: Users },
                  { text: 'Critical Thinking & Problem Solving', icon: Target },
                  { text: 'Creativity & Imagination', icon: Sparkles },
                  { text: 'Digital Literacy & Citizenship', icon: Shield },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} custom={3 + i} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-gray-700">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Features Grid */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Powerful Assessment Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to assess, report, and improve learner outcomes.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Rubric Builder', desc: 'Create custom rubrics for formative and summative assessments aligned to KICD standards.', icon: Layers, color: 'bg-blue-100 text-blue-600' },
              { title: 'Bulk Assessment', desc: 'Record assessments for an entire class in minutes with our streamlined interface.', icon: Zap, color: 'bg-amber-100 text-amber-600' },
              { title: 'Report Cards', desc: 'Auto-generate CBE-compliant report cards with competency levels, teacher remarks, and parent notes.', icon: FileText, color: 'bg-green-100 text-green-600' },
              { title: 'Portfolio Tracking', desc: 'Maintain digital portfolios of learner work samples as evidence of competency development.', icon: BookOpen, color: 'bg-purple-100 text-purple-600' },
              { title: 'Export & Print', desc: 'Download reports as PDF, export data to Excel, or print report cards in bulk.', icon: Download, color: 'bg-indigo-100 text-indigo-600' },
              { title: 'Award Certificates', desc: 'Automatically recognize top performers with printable certificates and badges.', icon: Award, color: 'bg-rose-100 text-rose-600' },
            ].map((feature, i) => (
              <motion.div key={feature.title} variants={fadeUp} custom={i} className="p-6 rounded-2xl border bg-white hover:shadow-lg transition-shadow group">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${feature.color} group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Transform How You Assess Learners
            </h2>
            <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
              Move beyond traditional exams. Embrace competency-based assessment tools that truly measure what matters.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-purple-700 hover:bg-purple-50" asChild>
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
