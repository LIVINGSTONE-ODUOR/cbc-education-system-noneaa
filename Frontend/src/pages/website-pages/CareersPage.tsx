import { motion } from 'framer-motion';
import { Briefcase, MapPin, Clock, ArrowRight, Users, Heart, Zap, Globe } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const openings = [
  {
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    description:
      'Build and refine the React-based interfaces that thousands of teachers and learners use every day.',
  },
  {
    title: 'Backend Engineer (NestJS)',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    description:
      'Design scalable APIs and services that power competency tracking, assessments, and reporting.',
  },
  {
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    description:
      'Shape intuitive experiences for schools, parents, and students across our education platform.',
  },
  {
    title: 'Education Specialist',
    department: 'Curriculum',
    location: 'Nairobi, Kenya',
    type: 'Full-time',
    description:
      'Collaborate with engineers and educators to ensure our platform reflects best practices in competency-based education.',
  },
];

const values = [
  {
    icon: Heart,
    title: 'Mission-Driven',
    description: 'Every feature we build directly impacts how students learn and grow.',
  },
  {
    icon: Users,
    title: 'Collaborative',
    description: 'We work across disciplines — engineering, education, and design — as one team.',
  },
  {
    icon: Zap,
    title: 'Growth-Focused',
    description: 'Continuous learning is not just for students — we invest in your development too.',
  },
  {
    icon: Globe,
    title: 'Global Impact',
    description: 'Our platform is built for national scale, shaping education systems across regions.',
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#F6F1E7]">
      <Header />

      {/* Hero */}
      <section
        className="relative min-h-[60vh] flex items-center overflow-hidden text-white"
        style={{
          backgroundImage: "url('/Gemini_Generated_Image_wxwqyiwxwqyiwxwq.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <motion.div
          className="absolute inset-0 bg-[#1E3A28]/80 backdrop-blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#9C7A3C]/20 border border-[#9C7A3C]/40 mb-6">
              <Briefcase className="w-4 h-4 text-[#E4C68A]" />
              <span className="text-3xl text-[#E4C68A] mb-3" style={{ fontFamily: "'Italianno', cursive" }}>
                Careers
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Help us transform education for every learner
            </h1>
            <p className="text-lg text-white/80 max-w-2xl leading-relaxed">
              Join a passionate team building the digital infrastructure for
              competency-based education — where data-driven mastery replaces
              one-size-fits-all assessment.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-[#F6F1E7]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-2xl font-bold text-[#1C1C1C] mb-4">Why work with us</h2>
            <p className="text-lg text-[#4A4A44]/90 max-w-2xl mx-auto">
              We believe great products come from great teams — here's what makes ours special.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-xl border border-[#1E3A28]/10 p-6 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-[#1E3A28]/10 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-6 h-6 text-[#1E3A28]" />
                </div>
                <h3 className="font-semibold text-[#1C1C1C] mb-2">{v.title}</h3>
                <p className="text-sm text-[#4A4A44]/90">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-2xl font-bold text-[#1C1C1C] mb-4">Open positions</h2>
            <p className="text-lg text-[#4A4A44]/90 max-w-2xl mx-auto">
              We're looking for people who are excited about education and technology.
            </p>
          </motion.div>

          <div className="grid gap-6">
            {openings.map((job, i) => (
              <motion.div
                key={job.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-[#F6F1E7] rounded-xl border border-[#1E3A28]/10 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#1C1C1C] mb-1">{job.title}</h3>
                  <p className="text-sm text-[#4A4A44]/90 mb-3">{job.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-[#4A4A44]/80">
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" /> {job.department}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {job.type}
                    </span>
                  </div>
                </div>
                <a
                  href={`mailto:careers@noneaa.com?subject=Application: ${job.title}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1E3A28] text-white text-sm font-medium hover:bg-[#173420] transition shrink-0"
                >
                  Apply <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
