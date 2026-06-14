import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, School, UserPlus, Settings, BookOpen,
  BarChart3, Headphones
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const steps = [
  {
    number: '1',
    icon: School,
    title: 'Create Your School Account',
    description: 'Sign up with your school email and verify your institution. You\'ll get immediate access to set up your school profile, including school name, code, level (Primary, Junior Secondary, Senior Secondary), and term dates.',
    timeEstimate: '5 minutes',
    details: [
      'Enter school details and KNEC code',
      'Choose your subscription plan',
      'Set up academic year and term structure',
      'Configure school branding (logo, colours)',
    ],
  },
  {
    number: '2',
    icon: UserPlus,
    title: 'Add Your Team',
    description: 'Invite teachers and administrators to the platform. You can add them manually or import an entire staff list from a CSV file. Each user gets role-based access — teachers see their classes, admins see everything.',
    timeEstimate: '10 minutes',
    details: [
      'Invite teachers via email',
      'Import staff list from CSV/Excel',
      'Assign roles: Teacher, Admin, or School Admin',
      'Teachers receive login credentials automatically',
    ],
  },
  {
    number: '3',
    icon: Settings,
    title: 'Set Up Classes & Students',
    description: 'Create your class structure and add students. Import student data in bulk or add them one by one. Assign students to classes and set up subject/learning area allocations for each teacher.',
    timeEstimate: '15–30 minutes',
    details: [
      'Create classes (e.g., Grade 4 East, Grade 5 West)',
      'Import student data via CSV or manual entry',
      'Assign class teachers and subject teachers',
      'Configure learning areas per grade level',
    ],
  },
  {
    number: '4',
    icon: BookOpen,
    title: 'Configure Assessments',
    description: 'Set up your assessment framework aligned with the CBC curriculum. Define strands, sub-strands, and competency indicators for each learning area. Use our pre-built templates or customize your own rubrics.',
    timeEstimate: '20 minutes',
    details: [
      'Choose from KICD-aligned assessment templates',
      'Customize rubrics for your school\'s needs',
      'Set up formative and summative assessment categories',
      'Define competency levels and descriptors',
    ],
  },
  {
    number: '5',
    icon: BarChart3,
    title: 'Start Tracking & Reporting',
    description: 'You\'re ready to go! Teachers can begin recording assessments, and the platform automatically tracks competency development. Generate beautiful term reports with one click at the end of each term.',
    timeEstimate: 'Ongoing',
    details: [
      'Teachers record daily/weekly assessments',
      'Real-time progress tracking per learner',
      'Automated competency calculations',
      'One-click term report generation',
    ],
  },
];

const supportResources = [
  {
    title: 'Video Tutorials',
    description: 'Step-by-step video guides covering every feature of the platform.',
    link: '#',
  },
  {
    title: 'Help Documentation',
    description: 'Detailed articles and how-to guides for common tasks.',
    link: '#',
  },
  {
    title: 'Live Training Sessions',
    description: 'Book a free training session for your teaching staff.',
    link: '/contact',
  },
];

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="inline-block text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
              Getting Started
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Set Up Your School in Under an Hour
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Follow these 5 steps to get Noneaa fully configured for your school. Most institutions complete setup in 30–60 minutes. Our team is available to help at every step.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="border border-slate-200 rounded-xl p-6 md:p-8 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {step.number}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full w-fit">
                          <Icon className="w-3 h-3" />
                          {step.timeEstimate}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        {step.description}
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {step.details.map((detail, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Support Resources */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Need Help Along the Way?</h2>
            <p className="text-slate-600 text-sm">Our support team and resources are available whenever you need them.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {supportResources.map((resource, index) => (
              <a
                key={index}
                href={resource.link}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow block"
              >
                <Headphones className="w-6 h-6 text-blue-600 mb-3" />
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{resource.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{resource.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-slate-600 mb-8">
            Create your school account today. Our onboarding team will reach out within 24 hours to help you through the setup process.
          </p>
          <a
            href="/get-started"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
          >
            Create School Account
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
