import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  FileText, Scale, Shield, AlertTriangle, ArrowRight,
  CheckCircle, Users, BookOpen, CreditCard, Lock,
  Globe, Gavel, Ban, RefreshCw, Mail,
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

const highlights = [
  { title: 'Fair & Transparent', desc: 'Our terms are written in plain language — no hidden clauses or legal tricks.', icon: Scale, color: 'from-blue-500 to-blue-600' },
  { title: 'Education First', desc: 'Every policy is designed to support schools, teachers, parents, and learners.', icon: BookOpen, color: 'from-purple-500 to-purple-600' },
  { title: 'Data Ownership', desc: 'Schools and users retain ownership of all educational data they create.', icon: Shield, color: 'from-emerald-500 to-emerald-600' },
  { title: 'Flexible Plans', desc: 'Upgrade, downgrade, or cancel your subscription at any time without penalty.', icon: RefreshCw, color: 'from-amber-500 to-amber-600' },
];

const sections = [
  {
    icon: Scale,
    title: '1. Acceptance of Terms',
    color: 'border-l-blue-500',
    content: [
      'By accessing and using the NONEAA platform ("Service"), you accept and agree to be bound by the terms and provisions of this agreement.',
      'These Terms of Service apply to all users of the Service, including school administrators, teachers, parents, students, and any other visitors or contributors.',
      'If you do not agree to these terms, please do not use this Service. Continued use constitutes acceptance of any updates to these terms.',
    ],
  },
  {
    icon: BookOpen,
    title: '2. Description of Service',
    color: 'border-l-purple-500',
    content: [
      'Noneaa Africa provides a comprehensive Competency-Based Curriculum (CBE) management platform that includes:',
    ],
    items: [
      'Student progress tracking and competency-based assessment',
      'Curriculum management aligned with KICD standards',
      'Teacher evaluation and classroom management tools',
      'Parent communication portal and progress monitoring',
      'Administrative dashboards, fee management, and reporting',
      'Data analytics and performance insights',
    ],
  },
  {
    icon: Users,
    title: '3. User Accounts',
    color: 'border-l-green-500',
    subsections: [
      { subtitle: 'Account Creation', text: 'To access certain features, you must create an account through your school administrator. You are responsible for maintaining the confidentiality of your credentials and all activities under your account.' },
      { subtitle: 'Account Responsibilities', text: 'You agree to provide accurate, current, and complete information during registration and keep it updated. Notify us immediately of any unauthorized access to your account.' },
      { subtitle: 'Account Termination', text: 'We reserve the right to suspend or terminate accounts that violate these terms. Schools may request account closure at any time, and we will export data before deletion upon request.' },
    ],
  },
  {
    icon: Ban,
    title: '4. Acceptable Use Policy',
    color: 'border-l-amber-500',
    content: ['You agree not to use the Service to:'],
    items: [
      'Violate any applicable laws or regulations',
      'Infringe on the rights of others',
      'Transmit harmful, offensive, or inappropriate content',
      'Attempt to gain unauthorized access to our systems',
      'Interfere with the proper functioning of the Service',
      'Use the Service for any unauthorized commercial purpose',
      'Share account credentials or allow unauthorized access',
      'Scrape, crawl, or extract data in bulk from the platform',
    ],
  },
  {
    icon: Lock,
    title: '5. Intellectual Property',
    color: 'border-l-indigo-500',
    content: [
      'The Service and its original content, features, and functionality are the exclusive property of Noneaa Africa and its licensors, protected by copyright, trademark, and other laws.',
      'Educational content created by users (lesson plans, assessments, reports) remains the intellectual property of the creating school or teacher. Noneaa Africa does not claim ownership of user-generated educational content.',
    ],
  },
  {
    icon: CreditCard,
    title: '6. Payment & Subscription',
    color: 'border-l-emerald-500',
    subsections: [
      { subtitle: 'Billing', text: 'Paid plans are billed on a per-term or annual basis. Prices are displayed in KES and are inclusive of applicable taxes unless stated otherwise.' },
      { subtitle: 'Refunds', text: 'We offer a 14-day refund window from the start of a new subscription. After 14 days, the current billing period is non-refundable, but you may cancel to prevent future charges.' },
      { subtitle: 'Free Tier', text: 'We offer a free tier with limited features. Schools can upgrade at any time. No credit card is required for the free tier.' },
    ],
  },
  {
    icon: AlertTriangle,
    title: '7. Limitation of Liability',
    color: 'border-l-rose-500',
    content: [
      'To the maximum extent permitted by Kenyan law, Noneaa Africa shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.',
      'Our total liability for any claim related to the Service shall not exceed the amount you paid us in the 12 months preceding the claim.',
      'We do not guarantee uninterrupted access to the Service. Planned maintenance windows will be communicated in advance.',
    ],
  },
  {
    icon: Gavel,
    title: '8. Governing Law',
    color: 'border-l-gray-500',
    content: [
      'These Terms shall be governed by and construed in accordance with the laws of the Republic of Kenya, without regard to its conflict of law provisions.',
      'Any disputes arising from these Terms shall be resolved through arbitration in Nairobi, Kenya, under the Arbitration Act of Kenya, before resorting to court proceedings.',
    ],
  },
  {
    icon: RefreshCw,
    title: '9. Changes to Terms',
    color: 'border-l-cyan-500',
    content: [
      'We may update these Terms from time to time. When we make significant changes, we will notify users via email and display a prominent notice on the platform at least 30 days before the changes take effect.',
      'Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.',
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

export default function TermsPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950" />
        <motion.div className="absolute top-20 left-16 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl" animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 6, repeat: Infinity }} />
        <motion.div className="absolute bottom-10 right-10 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl" animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 5, repeat: Infinity, delay: 1.5 }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-400/30">
                <FileText className="w-8 h-8 text-purple-400" />
              </div>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Terms of Service
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-purple-200 mb-6 max-w-2xl mx-auto">
              Please read these terms carefully before using our Competency-Based Education platform. We&apos;ve written them in plain language so you know exactly what to expect.
            </motion.p>
            <motion.p variants={fadeUp} custom={3} className="text-sm text-purple-300/70">
              Last updated: June 2026
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {highlights.map((h, i) => (
              <motion.div key={h.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} className="text-center p-6 rounded-xl bg-white shadow-sm">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${h.color} text-white mx-auto mb-3`}>
                  <h.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{h.title}</h3>
                <p className="text-xs text-muted-foreground">{h.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Terms Sections */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {sections.map((section) => (
            <AnimatedSection key={section.title}>
              <motion.div variants={fadeUp} custom={0} className={`bg-white rounded-2xl border-l-4 ${section.color} border shadow-sm p-8`}>
                <div className="flex items-center gap-3 mb-5">
                  <section.icon className="w-6 h-6 text-gray-700" />
                  <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                </div>

                {section.content && (
                  <div className="space-y-3 mb-4">
                    {section.content.map((para, idx) => (
                      <p key={idx} className="text-sm text-gray-600 leading-relaxed">{para}</p>
                    ))}
                  </div>
                )}

                {section.items && (
                  <ul className="space-y-2 mb-4">
                    {section.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {section.subsections && (
                  <div className="space-y-4">
                    {section.subsections.map((sub) => (
                      <div key={sub.subtitle}>
                        <h4 className="font-semibold text-gray-900 mb-1">{sub.subtitle}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{sub.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>

      {/* Contact */}
      <AnimatedSection className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Have Questions About Our Terms?</h3>
                <p className="text-gray-600 mb-6">
                  We believe in clarity. If anything in these terms is unclear, reach out and we&apos;ll explain it in plain language.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <Mail className="w-4 h-4 text-purple-600" /> legal@noneaa.com
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <Globe className="w-4 h-4 text-purple-600" /> www.noneaa.com/terms
                  </div>
                </div>
              </div>
              <div className="text-center md:text-right">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white" asChild>
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
