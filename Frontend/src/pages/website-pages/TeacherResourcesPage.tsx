import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Users, BookOpen, FileText, Download, Video,
  ArrowRight, CheckCircle, Layers, Award,
  Calendar, MessageSquare, Zap, GraduationCap,
  Lightbulb, Target, Clock, Star,
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

const resources = [
  {
    category: 'Lesson Planning',
    items: [
      { title: 'CBC Lesson Plan Templates', desc: 'Ready-to-use templates for all grades and subjects, aligned with KICD guidelines.', icon: FileText, downloads: '2,450+' },
      { title: 'Scheme of Work Generator', desc: 'Auto-generate schemes of work from the official curriculum designs.', icon: Calendar, downloads: '1,800+' },
      { title: 'Activity Ideas Library', desc: 'Hundreds of classroom activities mapped to strands and sub-strands.', icon: Lightbulb, downloads: '3,200+' },
    ],
  },
  {
    category: 'Assessment Resources',
    items: [
      { title: 'Rubric Templates', desc: 'Pre-built rubrics for formative and summative assessments across all competency levels.', icon: Target, downloads: '1,950+' },
      { title: 'Assessment Recording Sheets', desc: 'Printable and digital sheets for tracking daily learner observations.', icon: Layers, downloads: '2,100+' },
      { title: 'Report Card Samples', desc: 'Sample CBE report cards showing best practices for competency-based reporting.', icon: Award, downloads: '1,200+' },
    ],
  },
  {
    category: 'Professional Development',
    items: [
      { title: 'CBC Training Videos', desc: 'Step-by-step video guides on implementing CBC in your classroom.', icon: Video, downloads: '4,500+' },
      { title: 'Webinar Recordings', desc: 'Recorded sessions from CBC experts on curriculum delivery and assessment.', icon: MessageSquare, downloads: '890+' },
      { title: 'Teacher Community Forum', desc: 'Connect with other CBC educators, share experiences, and get support.', icon: Users, downloads: '5,000+ members' },
    ],
  },
];

const testimonials = [
  { name: 'Mrs. Jane Njeri', role: 'Grade 4 Teacher, Nairobi', quote: 'The lesson plan templates saved me hours every week. I can now focus on actual teaching instead of paperwork.', rating: 5 },
  { name: 'Mr. Peter Ochieng', role: 'Head Teacher, Kisumu', quote: 'The assessment rubrics made CBC implementation so much easier for our entire staff. Highly recommend.', rating: 5 },
  { name: 'Ms. Faith Akinyi', role: 'PP2 Teacher, Mombasa', quote: 'The activity ideas library is a goldmine! My learners are more engaged than ever before.', rating: 5 },
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

export default function TeacherResourcesPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900 via-amber-900 to-yellow-900" />
        <motion.div
          className="absolute top-20 right-20 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-10 left-16 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, delay: 1 }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <motion.div initial="hidden" animate="visible">
              <motion.p variants={fadeUp} custom={0} className="text-amber-300 font-semibold uppercase tracking-wider text-sm mb-4">
                Teacher Resources
              </motion.p>
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Everything You Need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Teach with Confidence</span>
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-amber-100 mb-8 max-w-2xl">
                Lesson plans, assessment templates, training videos, and a community of CBC educators — all in one place. Free for all registered teachers.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-slate-800 text-amber-900 hover:bg-amber-50" asChild>
                  <Link to="/get-started">Access Resources <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link to="/demo">Watch Demo</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-800/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Resource Downloads', value: '25,000+', icon: Download },
              { label: 'Teachers Using NONEAA', value: '3,500+', icon: Users },
              { label: 'Training Videos', value: '120+', icon: Video },
              { label: 'Template Categories', value: '50+', icon: FileText },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center p-6 rounded-xl bg-slate-800 shadow-sm"
              >
                <stat.icon className="w-8 h-8 text-amber-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Sections */}
      {resources.map((section, sectionIdx) => (
        <AnimatedSection key={section.category} className={sectionIdx % 2 === 0 ? 'py-20' : 'py-20 bg-slate-800/50'}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeUp} custom={0} className="mb-12">
              <p className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-2">{section.category}</p>
              <h2 className="text-3xl font-bold text-white">{section.category} Resources</h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              {section.items.map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  custom={i + 1}
                  className="bg-slate-800 rounded-2xl p-6 shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-900/30 text-amber-600 group-hover:scale-110 transition-transform">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{item.downloads}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-300 mb-4">{item.desc}</p>
                  <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 p-0">
                    Learn more <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      ))}

      {/* How It Helps */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3">Why Teachers Love Us</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Save Time. Teach Better. Grow Together.</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Save 10+ Hours/Week', desc: 'Pre-made lesson plans and auto-generated schemes of work free up time for actual teaching.', icon: Clock, color: 'bg-blue-900/30 text-blue-600' },
              { title: 'KICD Aligned', desc: 'All resources are aligned to the official KICD curriculum designs — no guessing.', icon: CheckCircle, color: 'bg-green-900/30 text-green-600' },
              { title: 'Always Updated', desc: 'Resources are updated whenever KICD issues new guidelines or curriculum changes.', icon: Zap, color: 'bg-purple-900/30 text-purple-600' },
              { title: 'Peer Support', desc: 'Join a community of 3,500+ teachers sharing strategies and success stories.', icon: Users, color: 'bg-rose-900/30 text-rose-600' },
            ].map((feature, i) => (
              <motion.div key={feature.title} variants={fadeUp} custom={i} className="p-6 rounded-2xl border bg-slate-800 text-center hover:shadow-lg transition-shadow group">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl mx-auto mb-4 ${feature.color} group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-300">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Testimonials */}
      <AnimatedSection className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3">Teacher Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Hear From Fellow Educators</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} custom={i + 1} className="bg-slate-800 rounded-2xl p-6 shadow-sm border">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-200 mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-900/30 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-amber-600 to-orange-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <BookOpen className="w-12 h-12 text-amber-200 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Start Teaching Smarter Today
            </h2>
            <p className="text-lg text-amber-100 mb-8 max-w-2xl mx-auto">
              Access all resources for free when you sign up. Join thousands of teachers already making CBC work.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-slate-800 text-amber-700 hover:bg-amber-50" asChild>
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
