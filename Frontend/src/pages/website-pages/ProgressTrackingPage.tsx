import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, CheckCircle, BarChart3, Target,
  Users, GraduationCap, ArrowRight, Zap,
  Eye, Shield, Clock, Layers,
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

const termProgressData = [
  { week: 'W1', score: 52 }, { week: 'W2', score: 55 },
  { week: 'W3', score: 58 }, { week: 'W4', score: 61 },
  { week: 'W5', score: 59 }, { week: 'W6', score: 64 },
  { week: 'W7', score: 68 }, { week: 'W8', score: 72 },
  { week: 'W9', score: 75 }, { week: 'W10', score: 78 },
  { week: 'W11', score: 82 }, { week: 'W12', score: 86 },
];

const subjectTrends = [
  { subject: 'Maths', term1: 62, term2: 71, term3: 78 },
  { subject: 'English', term1: 68, term2: 74, term3: 82 },
  { subject: 'Science', term1: 55, term2: 65, term3: 73 },
  { subject: 'Kiswahili', term1: 70, term2: 75, term3: 80 },
  { subject: 'Social St.', term1: 60, term2: 68, term3: 76 },
];

const competencyGrowth = [
  { month: 'Jan', communication: 45, thinking: 40, creativity: 50, digital: 35 },
  { month: 'Mar', communication: 55, thinking: 52, creativity: 58, digital: 48 },
  { month: 'May', communication: 65, thinking: 62, creativity: 66, digital: 60 },
  { month: 'Jul', communication: 72, thinking: 70, creativity: 74, digital: 68 },
  { month: 'Sep', communication: 80, thinking: 78, creativity: 82, digital: 76 },
  { month: 'Nov', communication: 88, thinking: 85, creativity: 89, digital: 84 },
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

export default function ProgressTrackingPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900" />
        <motion.div
          className="absolute top-20 right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-10 left-10 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, delay: 1 }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible">
              <motion.p variants={fadeUp} custom={0} className="text-blue-300 font-semibold uppercase tracking-wider text-sm mb-4">
                Real-Time Progress Tracking
              </motion.p>
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Watch Every Learner <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Grow</span>
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-blue-100 mb-8 max-w-xl">
                Track academic performance across all subjects, terms, and competencies with beautiful visualizations that make data actionable.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50" asChild>
                  <Link to="/get-started">Start Tracking <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link to="/demo">View Demo</Link>
                </Button>
              </motion.div>
            </motion.div>
            <motion.div variants={scaleIn} initial="hidden" animate="visible" className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <p className="text-white/70 text-sm mb-3 font-medium">Learner Progress — Term Overview</p>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={termProgressData}>
                    <defs>
                      <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[40, 90]} />
                    <Tooltip contentStyle={{ background: '#1e1b4b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Area type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={2} fill="url(#heroGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Schools Using Progress Tracking', value: '250+', icon: Target },
              { label: 'Learners Tracked', value: '45,000+', icon: Users },
              { label: 'Data Points Analyzed', value: '2.5M+', icon: BarChart3 },
              { label: 'Average Improvement', value: '23%', icon: TrendingUp },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center p-6 rounded-xl bg-white shadow-sm"
              >
                <stat.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature: Subject Performance Trends */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
                Subject Analytics
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Track Performance Across Every Subject
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-600 mb-8">
                See how learners perform across Mathematics, English, Science, Kiswahili, and more. Compare term-over-term growth and identify subjects that need extra attention.
              </motion.p>
              <div className="space-y-4">
                {[
                  { text: 'Term-by-term comparison charts for every subject', icon: BarChart3 },
                  { text: 'Identify struggling subjects early with trend analysis', icon: Eye },
                  { text: 'Generate individual learner progress reports', icon: GraduationCap },
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
            <motion.div variants={scaleIn} className="bg-white rounded-2xl shadow-lg border p-6">
              <p className="text-sm font-medium text-gray-500 mb-4">Subject Performance — Term Comparison</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectTrends} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="term1" fill="#93c5fd" name="Term 1" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="term2" fill="#60a5fa" name="Term 2" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="term3" fill="#2563eb" name="Term 3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Feature: Competency Growth */}
      <AnimatedSection className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={scaleIn} className="order-2 lg:order-1 bg-white rounded-2xl shadow-lg border p-6">
              <p className="text-sm font-medium text-gray-500 mb-4">CBE Competency Growth Over the Year</p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={competencyGrowth} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Line type="monotone" dataKey="communication" stroke="#3b82f6" strokeWidth={2} name="Communication" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="thinking" stroke="#8b5cf6" strokeWidth={2} name="Critical Thinking" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="creativity" stroke="#f59e0b" strokeWidth={2} name="Creativity" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="digital" stroke="#10b981" strokeWidth={2} name="Digital Literacy" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
            <div className="order-1 lg:order-2">
              <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-3">
                Competency Mapping
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Beyond Grades — Track Real Competencies
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-600 mb-8">
                CBE isn&apos;t just about marks. Our system tracks the 7 core competencies defined by KICD — Communication, Critical Thinking, Creativity, Digital Literacy, and more — giving you a holistic view of each learner&apos;s development.
              </motion.p>
              <div className="space-y-4">
                {[
                  { text: 'Visual growth charts for every core competency', icon: TrendingUp },
                  { text: 'Automated alerts when a learner falls behind', icon: Shield },
                  { text: 'Compare competency growth across classes and grades', icon: Layers },
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
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">Why Schools Choose Us</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Progress Tracking That Makes a Difference</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every feature is designed to help teachers, parents, and administrators understand and support each learner&apos;s journey.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Real-Time Updates', desc: 'Scores and assessments sync instantly. Parents can check progress from their phones anytime.', icon: Zap, color: 'bg-blue-100 text-blue-600' },
              { title: 'Smart Alerts', desc: 'Get notified when a learner\'s performance drops below threshold in any subject or competency.', icon: Shield, color: 'bg-red-100 text-red-600' },
              { title: 'Visual Reports', desc: 'Beautiful, easy-to-read charts and graphs that turn complex data into clear insights.', icon: BarChart3, color: 'bg-purple-100 text-purple-600' },
              { title: 'Term Comparisons', desc: 'Compare performance across Term 1, 2, and 3 to see trends and measure improvement.', icon: TrendingUp, color: 'bg-green-100 text-green-600' },
              { title: 'Individual Focus', desc: 'Drill down to any learner to see their complete academic journey and competency profile.', icon: GraduationCap, color: 'bg-amber-100 text-amber-600' },
              { title: 'Attendance Integration', desc: 'Correlate attendance patterns with academic performance to identify at-risk learners.', icon: Clock, color: 'bg-indigo-100 text-indigo-600' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                custom={i}
                className="p-6 rounded-2xl border bg-white hover:shadow-lg transition-shadow group"
              >
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
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to See Every Learner&apos;s Progress?
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of Kenyan schools using NONEAA to monitor, analyze, and improve student outcomes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50" asChild>
                <Link to="/get-started">Get Started Free <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                <Link to="/demo">Request Demo</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
