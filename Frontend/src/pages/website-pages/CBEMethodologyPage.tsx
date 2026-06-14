import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  BookOpen, Target, Award, Users, CheckCircle,
  Lightbulb, GraduationCap, ArrowRight, Layers,
  Heart, Globe, Shield, Cpu, Sparkles, Eye,
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

const competencies = [
  { title: 'Communication & Collaboration', desc: 'Developing effective listening, speaking, reading, and writing skills. Working productively with others in diverse settings.', icon: Users, color: 'from-blue-500 to-blue-600' },
  { title: 'Critical Thinking & Problem Solving', desc: 'Analyzing issues, evaluating evidence, and making reasoned decisions. Finding creative solutions to real-world problems.', icon: Target, color: 'from-purple-500 to-purple-600' },
  { title: 'Creativity & Imagination', desc: 'Using imagination and inventiveness to generate new ideas, products, and approaches to everyday challenges.', icon: Sparkles, color: 'from-amber-500 to-orange-500' },
  { title: 'Citizenship', desc: 'Understanding rights and responsibilities. Developing respect for diversity, democratic values, and national identity.', icon: Shield, color: 'from-green-500 to-emerald-500' },
  { title: 'Digital Literacy', desc: 'Navigating, evaluating, and creating information using digital technologies safely, ethically, and effectively.', icon: Cpu, color: 'from-indigo-500 to-blue-500' },
  { title: 'Learning to Learn', desc: 'Developing self-awareness, self-regulation, and the ability to manage one\'s own learning journey.', icon: Lightbulb, color: 'from-rose-500 to-pink-500' },
  { title: 'Self-Efficacy', desc: 'Building confidence in one\'s ability to succeed. Developing resilience, perseverance, and a growth mindset.', icon: Heart, color: 'from-red-500 to-rose-500' },
];

const levels = [
  { name: 'Exceeding Expectation', desc: 'Learner demonstrates understanding and application beyond the expected competency level.', color: 'bg-green-500', pct: '25%' },
  { name: 'Meeting Expectation', desc: 'Learner demonstrates the expected competency level for their grade.', color: 'bg-blue-500', pct: '45%' },
  { name: 'Approaching Expectation', desc: 'Learner is progressing toward the expected competency level.', color: 'bg-amber-500', pct: '22%' },
  { name: 'Below Expectation', desc: 'Learner needs additional support to achieve the expected competency level.', color: 'bg-red-500', pct: '8%' },
];

const cbeTimeline = [
  { year: '2017', event: 'CBC officially launched by KICD', desc: 'Kenya Institute of Curriculum Development introduces the Competency-Based Curriculum to replace 8-4-4 system.' },
  { year: '2019', event: 'PP1 and PP2 roll-out begins', desc: 'Pre-primary levels begin implementing CBC nationwide across all public and private schools.' },
  { year: '2021', event: 'Grade 4 implementation', desc: 'CBC extends to upper primary. Assessment moves from exams to continuous competency evaluation.' },
  { year: '2023', event: 'Junior Secondary begins', desc: 'Grade 7-9 (Junior Secondary) starts under the new 2-6-3-3-3 education structure.' },
  { year: '2025', event: 'Full CBC integration', desc: 'Digital platforms like NONEAA enable schools to fully manage CBC assessments, reporting, and competency tracking.' },
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

export default function CBEMethodologyPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900" />
        <motion.div
          className="absolute top-10 right-16 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-10 left-10 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <motion.div initial="hidden" animate="visible">
              <motion.p variants={fadeUp} custom={0} className="text-emerald-300 font-semibold uppercase tracking-wider text-sm mb-4">
                CBE Methodology
              </motion.p>
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                The Future of Education <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">is Competency-Based</span>
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-emerald-100 mb-8 max-w-2xl">
                Kenya&apos;s Competency-Based Education (CBE) framework focuses on developing real-world skills and competencies — not just memorization. Learn how our platform brings this methodology to life.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-slate-800 text-emerald-900 hover:bg-emerald-50" asChild>
                  <Link to="/get-started">Get Started <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link to="/cbe-standards">View CBE Standards</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What is CBE */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">
                Understanding CBE
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-white mb-6">
                What is Competency-Based Education?
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-slate-300 mb-6">
                CBE shifts the focus from what learners <em>know</em> to what they can <em>do</em>. Instead of cramming for exams, learners develop practical skills, critical thinking abilities, and values that prepare them for real life.
              </motion.p>
              <motion.p variants={fadeUp} custom={3} className="text-lg text-slate-300 mb-8">
                Kenya adopted the CBC structure (2-6-3-3-3) to replace the traditional 8-4-4 system. Our platform is built from the ground up to support this new approach.
              </motion.p>
              <div className="space-y-3">
                {[
                  'Focus on skills and application, not memorization',
                  'Continuous assessment instead of high-stakes exams',
                  'Every learner progresses at their own pace',
                  'Parents and teachers collaborate on each learner\'s growth',
                ].map((text, i) => (
                  <motion.div key={i} variants={fadeUp} custom={4 + i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-200">{text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div variants={fadeUp} custom={2} className="bg-gradient-to-br from-emerald-950/30 to-teal-950/30 rounded-3xl p-8 border border-emerald-800">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Old System', value: '8-4-4', sub: 'Exam-focused', color: 'text-red-600 bg-red-50' },
                  { label: 'New System', value: '2-6-3-3-3', sub: 'Competency-focused', color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Assessment', value: 'Continuous', sub: 'No cramming', color: 'text-blue-600 bg-blue-50' },
                  { label: 'Competencies', value: '7 Core', sub: 'Holistic growth', color: 'text-purple-600 bg-purple-50' },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl p-4 ${item.color} text-center`}>
                    <p className="text-xs font-medium opacity-70">{item.label}</p>
                    <p className="text-2xl font-bold mt-1">{item.value}</p>
                    <p className="text-xs mt-1">{item.sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* 7 Core Competencies */}
      <AnimatedSection className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">Core Competencies</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">The 7 Pillars of CBE</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Every learner is assessed across these 7 competencies, ensuring holistic development beyond academic subjects.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {competencies.map((comp, i) => (
              <motion.div
                key={comp.title}
                variants={fadeUp}
                custom={i}
                className="bg-slate-800 rounded-2xl p-6 shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all group"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${comp.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                  <comp.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{comp.title}</h3>
                <p className="text-sm text-slate-300">{comp.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Assessment Levels */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
                Assessment Framework
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Four Levels of Competency
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-slate-300 mb-8">
                Instead of letter grades or percentages, CBE uses four competency levels to describe a learner&apos;s progress. This approach celebrates growth and reduces the pressure of traditional grading.
              </motion.p>
            </div>
            <div className="space-y-4">
              {levels.map((level, i) => (
                <motion.div key={level.name} variants={fadeUp} custom={i} className="bg-slate-800 rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-4 h-4 rounded-full ${level.color}`} />
                      <h4 className="font-semibold text-white">{level.name}</h4>
                    </div>
                    <span className="text-sm font-bold text-gray-500">{level.pct}</span>
                  </div>
                  <p className="text-sm text-slate-300 ml-7">{level.desc}</p>
                  <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${level.color}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: level.pct }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Timeline */}
      <AnimatedSection className="py-20 bg-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">The Journey</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">CBC Implementation Timeline</h2>
          </motion.div>
          <div className="relative">
            <div className="absolute left-4 sm:left-1/2 sm:-translate-x-px top-0 bottom-0 w-0.5 bg-emerald-200" />
            {cbeTimeline.map((item, i) => (
              <motion.div
                key={item.year}
                variants={fadeUp}
                custom={i}
                className={`relative flex items-start gap-6 mb-10 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'} flex-row`}
              >
                <div className="hidden sm:block sm:w-1/2" />
                <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="ml-14 sm:ml-0 sm:w-1/2 bg-slate-800 rounded-xl border p-5 shadow-sm">
                  <span className="text-sm font-bold text-emerald-600">{item.year}</span>
                  <h4 className="font-semibold text-white mt-1">{item.event}</h4>
                  <p className="text-sm text-slate-300 mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* How NONEAA Supports CBE */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">Our Platform</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How NONEAA Brings CBE to Life</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              We didn&apos;t just adapt an old system. NONEAA was built from scratch for competency-based education.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'KICD-Aligned Curriculum', desc: 'All learning areas, strands, and sub-strands match the official KICD curriculum design documents.', icon: BookOpen, color: 'bg-emerald-900/30 text-emerald-600' },
              { title: 'Competency-Based Reports', desc: 'Auto-generate report cards with the 4 competency levels, replacing traditional percentage-based grading.', icon: Award, color: 'bg-blue-900/30 text-blue-600' },
              { title: 'Formative Assessment', desc: 'Record daily observations and continuous assessments — not just end-of-term exams.', icon: Eye, color: 'bg-purple-900/30 text-purple-600' },
              { title: 'Learner Portfolios', desc: 'Maintain evidence-based portfolios with work samples, photos, and teacher observations.', icon: Layers, color: 'bg-amber-900/30 text-amber-600' },
              { title: 'Parent Engagement', desc: 'Parents see real-time progress, competency profiles, and teacher feedback via the parent portal.', icon: Users, color: 'bg-rose-900/30 text-rose-600' },
              { title: 'Data-Driven Decisions', desc: 'School leaders get dashboards showing school-wide competency trends and areas needing attention.', icon: Globe, color: 'bg-indigo-900/30 text-indigo-600' },
            ].map((feature, i) => (
              <motion.div key={feature.title} variants={fadeUp} custom={i} className="p-6 rounded-2xl border bg-slate-800 hover:shadow-lg transition-shadow group">
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

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <GraduationCap className="w-12 h-12 text-emerald-200 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Embrace the CBE Methodology Today
            </h2>
            <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join the movement toward competency-based education. NONEAA makes the transition seamless for your school.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-slate-800 text-emerald-700 hover:bg-emerald-50" asChild>
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
