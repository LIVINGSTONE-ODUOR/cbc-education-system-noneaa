import { motion } from 'framer-motion';
import {
  Monitor, BarChart3, FileText, Users, Bell, Shield,
  ArrowRight, Play, CheckCircle2
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const platformFeatures = [
  {
    icon: Monitor,
    title: 'Teacher Dashboard',
    description: 'A unified view for managing classes, tracking attendance, recording assessments, and monitoring learner progress across all competency areas.',
    highlights: ['Real-time class overview', 'Quick assessment entry', 'Strand-level tracking'],
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Generate CBC-aligned term reports, competency heat maps, and school-wide performance analytics. Export in PDF or share directly with parents.',
    highlights: ['Automated term reports', 'Competency heat maps', 'Trend analysis'],
  },
  {
    icon: FileText,
    title: 'Assessment Tools',
    description: 'Record formative and summative assessments aligned with KICD rubrics. Track strands, sub-strands, and competency levels for each learner.',
    highlights: ['Formative & summative', 'KICD-aligned rubrics', 'Bulk entry mode'],
  },
  {
    icon: Users,
    title: 'Parent Portal',
    description: 'Parents get secure access to their child\'s progress, attendance records, and teacher feedback — all from their phone or computer.',
    highlights: ['Real-time progress updates', 'Attendance alerts', 'Teacher messaging'],
  },
  {
    icon: Bell,
    title: 'Notifications & Alerts',
    description: 'Automated alerts for attendance issues, upcoming assessments, and report deadlines. Keep teachers, parents, and admin informed.',
    highlights: ['SMS & email alerts', 'Deadline reminders', 'Custom triggers'],
  },
  {
    icon: Shield,
    title: 'Admin Control Panel',
    description: 'Manage users, classes, terms, and school settings. Role-based access ensures teachers, parents, and admins see only what they need.',
    highlights: ['Role-based access', 'Multi-term management', 'Data export'],
  },
];

const workflowSteps = [
  { step: '01', title: 'Sign Up & Configure', description: 'Create your school account, set up classes, terms, and learning areas in under 30 minutes.' },
  { step: '02', title: 'Add Teachers & Students', description: 'Import your student roster via CSV or add them manually. Invite teachers to their dashboards.' },
  { step: '03', title: 'Track Competencies', description: 'Teachers record assessments daily or weekly. The platform auto-calculates competency levels.' },
  { step: '04', title: 'Generate Reports', description: 'At term end, generate CBC-compliant reports with one click. Share with parents instantly.' },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#e8edf5]">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-sm font-semibold text-blue-300 uppercase tracking-wider mb-3">
                Product Tour
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-5">
                See Noneaa in Action
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed mb-8">
                Explore the platform that 150+ schools trust for CBE management. From daily assessments to automated term reports — see how Noneaa simplifies every step.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/get-started"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
                >
                  <Play className="w-4 h-4" />
                  Request Live Demo
                </a>
              </div>
            </motion.div>

            {/* Placeholder for product screenshot */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="bg-slate-700/50 rounded-2xl border border-slate-600 p-4"
            >
              <div className="bg-slate-800 rounded-xl aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-slate-400 text-sm">Platform Preview</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How It Works</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Get your school up and running in 4 simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative p-6 rounded-xl border border-slate-200 hover:border-blue-200 transition-colors"
              >
                <div className="text-3xl font-bold text-blue-100 mb-3">{item.step}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Platform Features</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Everything you need to manage competency-based education effectively.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{feature.description}</p>
                  <div className="space-y-2">
                    {feature.highlights.map((highlight) => (
                      <div key={highlight} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        {highlight}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Ready to Simplify CBE at Your School?
          </h2>
          <p className="text-slate-600 mb-8">
            Start your 14-day free trial — no credit card required. Or schedule a live demo with our team to see Noneaa tailored to your school's needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/get-started"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Schedule Live Demo
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
