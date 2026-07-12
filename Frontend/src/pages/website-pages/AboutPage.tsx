import React, { useRef } from 'react';
import {
  GraduationCap, Users, Award, Globe, Target, Heart, Sparkles,
  Rocket, TrendingUp, Brain, Trophy, CheckCircle2, ArrowRight,
  BookOpen, Eye, Clock, Shield, Lightbulb, BarChart3,
  School, MapPin, Star, Laptop, HandshakeIcon, ChevronRight
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTypewriter } from '@/hooks/use-typewriter';

/* ─────────── Animation Variants ─────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ─────────── Chart Data ─────────── */
const growthData = [
  { year: '2023', schools: 5, students: 800, teachers: 40 },
  { year: '2024 Q1', schools: 15, students: 2400, teachers: 120 },
  { year: '2024 Q3', schools: 35, students: 5600, teachers: 280 },
  { year: '2025 Q1', schools: 60, students: 9600, teachers: 480 },
  { year: '2025 Q3', schools: 85, students: 13600, teachers: 680 },
  { year: '2026', schools: 120, students: 19200, teachers: 960 },
];

const impactData = [
  { subject: 'Maths', before: 52, after: 78 },
  { subject: 'Science', before: 48, after: 74 },
  { subject: 'English', before: 61, after: 82 },
  { subject: 'Kiswahili', before: 58, after: 79 },
  { subject: 'Social Studies', before: 55, after: 76 },
];

const competencyData = [
  { competency: 'Communication', score: 85 },
  { competency: 'Critical Thinking', score: 78 },
  { competency: 'Creativity', score: 82 },
  { competency: 'Digital Literacy', score: 90 },
  { competency: 'Citizenship', score: 75 },
  { competency: 'Self-Efficacy', score: 80 },
  { competency: 'Learning to Learn', score: 88 },
];

const regionData = [
  { name: 'Nairobi', value: 45, color: '#1E3A28' },
  { name: 'Mombasa', value: 20, color: '#9C7A3C' },
  { name: 'Kisumu', value: 15, color: '#2F5233' },
  { name: 'Nakuru', value: 12, color: '#B8934D' },
  { name: 'Other', value: 8, color: '#B85C38' },
];

/* ─────────── Custom Tooltip ─────────── */
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="capitalize">
          {entry.name}: <span className="font-bold">{entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

/* ─────────── Hero Section ─────────── */
const HeroSection = () => {
  const headingText = "Transforming Education, One Competency at a Time";
  const typedHeading = useTypewriter({ text: headingText, speed: 25, delay: 200, repeat: false });

  const descriptionText = "NONEAA is Kenya's leading competency-based education platform — empowering schools, teachers, and students with intelligent tools that make mastery-based learning achievable at scale.";
  const typedDescription = useTypewriter({ text: descriptionText, speed: 15, delay: 1500, repeat: true });

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden text-[#1C1C1C]">
      {/* Background */}
      <div className="absolute inset-0 bg-[#F6F1E7]" />

      {/* Animated orbs */}
      <motion.div className="absolute top-10 right-10 w-96 h-96 bg-[#1E3A28]/10 rounded-full blur-3xl" animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute bottom-10 left-10 w-80 h-80 bg-[#9C7A3C]/10 rounded-full blur-3xl" animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.15, 0.3] }} transition={{ duration: 10, repeat: Infinity, delay: 1 }} />
      <motion.div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#2F5233]/10 rounded-full blur-3xl" animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 12, repeat: Infinity, delay: 2 }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <div className="h-px w-10 bg-[#9C7A3C]" />
              <span className="text-3xl text-[#9C7A3C] mb-3" style={{ fontFamily: "'Italianno', cursive" }}>About NONEAA</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              {typedHeading}
              <span className="animate-pulse text-[#1E3A28] ml-1">|</span>
            </h1>

            <p className="text-lg text-[#4A4A44] mb-8 leading-relaxed max-w-xl">
              {typedDescription}
              <span className="animate-pulse text-[#1E3A28] ml-1">|</span>
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <motion.a href="/features" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-3 bg-gradient-to-r from-[#1E3A28] to-[#173420] text-white font-semibold rounded-lg inline-flex items-center gap-2 shadow-lg hover:shadow-[#1E3A28]/25">
                Explore Features <ArrowRight className="w-4 h-4" />
              </motion.a>
              <motion.a href="/contact" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-3 border-2 border-[#1E3A28]/30 text-[#1E3A28] font-semibold rounded-lg hover:bg-[#1E3A28]/5 transition-all">
                Talk to Us
              </motion.a>
            </div>

            {/* Quick stats in hero */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { num: '120+', label: 'Schools' },
                { num: '19K+', label: 'Students' },
                { num: '960+', label: 'Teachers' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 + i * 0.15 }} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-[#1C1C1C]">{s.num}</div>
                  <div className="text-sm text-[#4A4A44]/70">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — illustrative graphic */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="hidden lg:block">
            <div className="relative">
              {/* Floating cards */}
              {[
                { icon: GraduationCap, label: 'CBC Aligned', color: 'from-[#1E3A28] to-[#173420]', x: 0, y: 0 },
                { icon: BarChart3, label: 'Real-time Analytics', color: 'from-[#2F5233] to-[#1E3A28]', x: 180, y: 60 },
                { icon: Brain, label: 'AI-Powered', color: 'from-[#9C7A3C] to-[#7d6230]', x: 40, y: 140 },
                { icon: Shield, label: 'Data Secure', color: 'from-[#B8934D] to-[#9C7A3C]', x: 220, y: 200 },
                { icon: Users, label: 'Teacher Tools', color: 'from-[#173420] to-[#1E3A28]', x: 100, y: 280 },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  className={`absolute bg-gradient-to-r ${card.color} rounded-xl p-4 shadow-xl flex items-center gap-3 backdrop-blur-sm`}
                  style={{ left: card.x, top: card.y }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.2, type: 'spring', stiffness: 200 }}
                  whileHover={{ scale: 1.1, y: -5 }}
                >
                  <card.icon className="w-5 h-5 text-white" />
                  <span className="text-white font-medium text-sm">{card.label}</span>
                </motion.div>
              ))}
              <div className="w-96 h-96" /> {/* Spacer */}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ─────────── Main Page ─────────── */
export default function AboutPage() {
  const containerRef = useRef(null);
  useScroll({ target: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen bg-white text-[#1C1C1C]">
      <Header />

      {/* ===== HERO ===== */}
      <HeroSection />

      {/* ===== WHO WE ARE ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F6F1E7] border border-[#1E3A28]/20 mb-6">
              <BookOpen className="w-4 h-4 text-[#1E3A28]" />
              <span className="text-3xl text-[#9C7A3C] mb-3" style={{ fontFamily: "'Italianno', cursive" }}>Who We Are</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">Building the Future of Education in Kenya</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              NONEAA was born from a simple observation: Kenya's Competency-Based Curriculum (CBC) is revolutionary, but schools need better digital tools to implement it effectively. We bridge that gap.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Eye,
                title: 'The Problem',
                description: 'Schools across Kenya struggle with manual CBC assessment tracking, inconsistent reporting, and lack of data-driven insights — leaving teachers overwhelmed and students underserved.',
                color: 'bg-[#fbeee7] text-[#B85C38] border-[#B85C38]/25',
                iconBg: 'bg-[#f3ded4]',
              },
              {
                icon: Lightbulb,
                title: 'Our Solution',
                description: 'A comprehensive digital platform that automates competency tracking, generates real-time analytics, and provides AI-powered recommendations — making CBC implementation seamless.',
                color: 'bg-[#F6F1E7] text-[#9C7A3C] border-[#9C7A3C]/25',
                iconBg: 'bg-[#eee0c4]',
              },
              {
                icon: TrendingUp,
                title: 'The Impact',
                description: 'Schools using NONEAA see 32% improvement in student competency scores, 4.5 hours saved per teacher weekly, and 98% teacher satisfaction with our assessment tools.',
                color: 'bg-[#eaf0ea] text-[#1E3A28] border-[#1E3A28]/20',
                iconBg: 'bg-[#dbe6db]',
              },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} transition={{ delay: i * 0.15 }}>
                <div className={`bg-white rounded-2xl border ${item.color.split(' ')[2]} p-8 h-full hover:shadow-lg transition-shadow`}>
                  <div className={`w-14 h-14 rounded-xl ${item.iconBg} flex items-center justify-center mb-6`}>
                    <item.icon className={`w-7 h-7 ${item.color.split(' ')[1]}`} />
                  </div>
                  <h3 className="text-xl font-bold text-[#1C1C1C] mb-3">{item.title}</h3>
                  <p className="text-[#4A4A44] leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MISSION & VISION ===== */}
      <section className="py-20 bg-[#F6F1E7]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#1E3A28]/20 mb-6">
              <Target className="w-4 h-4 text-[#1E3A28]" />
              <span className="text-3xl text-[#9C7A3C] mb-3" style={{ fontFamily: "'Italianno', cursive" }}>Our Purpose</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">Mission & Vision</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">Guiding principles that drive everything we build</motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Mission */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}>
              <div className="bg-white rounded-2xl border border-[#1E3A28]/20 p-8 h-full hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-[#F6F1E7] flex items-center justify-center">
                    <Target className="w-7 h-7 text-[#1E3A28]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1C1C1C]">Our Mission</h3>
                </div>
                <p className="text-[#4A4A44] leading-relaxed mb-6 text-lg">
                  To empower every Kenyan school with intelligent digital tools that make competency-based education achievable, measurable, and impactful — ensuring no student is left behind.
                </p>
                <div className="space-y-4">
                  {[
                    { text: 'Real-time competency tracking across all 7 CBC competencies', icon: BarChart3 },
                    { text: 'AI-powered personalized learning recommendations', icon: Brain },
                    { text: 'Teacher empowerment through actionable data insights', icon: Sparkles },
                    { text: 'Seamless KICD curriculum alignment and reporting', icon: BookOpen },
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F6F1E7] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-[#1E3A28]" />
                      </div>
                      <span className="text-[#4A4A44]">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Vision */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} transition={{ delay: 0.15 }}>
              <div className="bg-white rounded-2xl border border-[#9C7A3C]/25 p-8 h-full hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-[#F6F1E7] flex items-center justify-center">
                    <Eye className="w-7 h-7 text-[#9C7A3C]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1C1C1C]">Our Vision</h3>
                </div>
                <p className="text-[#4A4A44] leading-relaxed mb-6 text-lg">
                  A future where every African student accesses world-class, personalized education that recognizes and develops their unique competencies — regardless of location or background.
                </p>
                <div className="space-y-4">
                  {[
                    { text: 'Accessible and affordable for all school types', icon: School },
                    { text: 'Equitable educational outcomes nationwide', icon: Heart },
                    { text: 'Technology that amplifies teacher expertise', icon: Laptop },
                    { text: 'Pan-African expansion with local curriculum support', icon: Globe },
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F6F1E7] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-[#9C7A3C]" />
                      </div>
                      <span className="text-[#4A4A44]">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== GROWTH CHARTS ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F6F1E7] border border-[#1E3A28]/20 mb-6">
              <TrendingUp className="w-4 h-4 text-[#1E3A28]" />
              <span className="text-3xl text-[#9C7A3C] mb-3" style={{ fontFamily: "'Italianno', cursive" }}>Our Growth</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">Growing Across Kenya</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">From 5 pilot schools in 2023 to 120+ schools transforming education today</motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Growth Area Chart */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-[#1C1C1C] mb-1">Platform Adoption</h3>
                <p className="text-sm text-[#4A4A44] mb-4">Schools, students, and teachers over time</p>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="gSchools" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E3A28" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1E3A28" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9C7A3C" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#9C7A3C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="schools" stroke="#1E3A28" fill="url(#gSchools)" strokeWidth={2} name="Schools" />
                    <Area type="monotone" dataKey="students" stroke="#9C7A3C" fill="url(#gStudents)" strokeWidth={2} name="Students" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Regional Distribution Pie */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} transition={{ delay: 0.15 }}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-[#1C1C1C] mb-1">Regional Presence</h3>
                <p className="text-sm text-[#4A4A44] mb-4">Distribution of partner schools across Kenya</p>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="55%" height={280}>
                    <PieChart>
                      <Pie data={regionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                        {regionData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {regionData.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                        <span className="text-sm text-[#4A4A44]">{r.name}</span>
                        <span className="text-sm font-bold text-[#1C1C1C] ml-auto">{r.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== IMPACT METRICS BANNER ===== */}
      <section className="py-16 bg-gradient-to-r from-[#1E3A28] via-[#173420] to-[#2F5233] relative overflow-hidden">
        <motion.div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDE4YzMuMzEzIDAgNi0yLjY4NyA2LTZzLTIuNjg3LTYtNi02LTYgMi42ODctNiA2IDIuNjg3IDYgNiA2em0wIDJjLTQuNDE4IDAtOC0zLjU4Mi04LThzMy41ODItOCA4LTggOCAzLjU4MiA4IDgtMy41ODIgOC04IDh6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { number: '120+', label: 'Schools Transformed', icon: School },
              { number: '19,200+', label: 'Students Impacted', icon: GraduationCap },
              { number: '960+', label: 'Teachers Empowered', icon: Users },
              { number: '98%', label: 'Satisfaction Rate', icon: Heart },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-1">{stat.number}</div>
                <p className="text-[#F6F1E7]/80 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STUDENT OUTCOMES ===== */}
      <section className="py-20 bg-[#F6F1E7]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#9C7A3C]/25 mb-6">
              <Award className="w-4 h-4 text-[#9C7A3C]" />
              <span className="text-3xl text-[#9C7A3C] mb-3" style={{ fontFamily: "'Italianno', cursive" }}>Proven Results</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">Measurable Student Improvement</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">Data-driven evidence of how NONEAA transforms learning outcomes</motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Before/After Bar Chart */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-[#1C1C1C] mb-1">Average Scores: Before vs After NONEAA</h3>
                <p className="text-sm text-[#4A4A44] mb-4">Percentage improvement across subjects</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={impactData} barGap={4}>
                    <XAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="before" fill="#c9c2b4" name="Before" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="after" fill="#1E3A28" name="After NONEAA" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Competency Radar */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} transition={{ delay: 0.15 }}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-[#1C1C1C] mb-1">CBC Competency Development</h3>
                <p className="text-sm text-[#4A4A44] mb-4">Average student scores across 7 core competencies</p>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={competencyData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="competency" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Radar name="Score" dataKey="score" stroke="#1E3A28" fill="#1E3A28" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== WHY NONEAA ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F6F1E7] border border-[#1E3A28]/20 mb-6">
              <Sparkles className="w-4 h-4 text-[#1E3A28]" />
              <span className="text-3xl text-[#9C7A3C] mb-3" style={{ fontFamily: "'Italianno', cursive" }}>Why Choose Us</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">What Makes NONEAA Different</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">Purpose-built for Kenya's CBC — not a generic tool adapted to fit</motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: GraduationCap, title: 'CBC-Native Design', desc: 'Built from the ground up for Kenya\'s 2-6-3-3-3 education structure and KICD standards — not a foreign platform retrofitted.', color: 'blue' },
              { icon: BarChart3, title: '7 Competency Tracking', desc: 'Track all 7 CBC competencies (Communication, Critical Thinking, Creativity, Digital Literacy, Citizenship, Self-Efficacy, Learning to Learn) in real time.', color: 'emerald' },
              { icon: Brain, title: 'AI-Powered Insights', desc: 'Machine learning algorithms identify struggling students early, recommend interventions, and predict competency trajectories.', color: 'purple' },
              { icon: Laptop, title: 'Works Offline', desc: 'Designed for Kenyan realities — works on low-bandwidth connections and syncs data when internet is available.', color: 'amber' },
              { icon: Shield, title: 'KDPA Compliant', desc: 'Full compliance with Kenya Data Protection Act. Student data is encrypted, anonymized, and stored on local servers.', color: 'rose' },
              { icon: HandshakeIcon, title: 'Dedicated Support', desc: 'Every school gets a dedicated onboarding specialist, training sessions, and 24/7 WhatsApp support from our team.', color: 'cyan' },
            ].map((item, i) => {
              const colorMap: Record<string, { bg: string; iconBg: string; text: string }> = {
                blue: { bg: 'border-[#1E3A28]/20', iconBg: 'bg-[#F6F1E7]', text: 'text-[#1E3A28]' },
                emerald: { bg: 'border-[#9C7A3C]/25', iconBg: 'bg-[#F6F1E7]', text: 'text-[#9C7A3C]' },
                purple: { bg: 'border-[#2F5233]/25', iconBg: 'bg-[#eaf0ea]', text: 'text-[#2F5233]' },
                amber: { bg: 'border-[#9C7A3C]/25', iconBg: 'bg-[#F6F1E7]', text: 'text-[#9C7A3C]' },
                rose: { bg: 'border-[#B85C38]/25', iconBg: 'bg-[#f3ded4]', text: 'text-[#B85C38]' },
                cyan: { bg: 'border-[#1E3A28]/20', iconBg: 'bg-[#eaf0ea]', text: 'text-[#1E3A28]' },
              };
              const c = colorMap[item.color];
              return (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}>
                  <div className={`bg-white rounded-2xl border ${c.bg} p-6 h-full hover:shadow-lg transition-all`}>
                    <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center mb-4`}>
                      <item.icon className={`w-6 h-6 ${c.text}`} />
                    </div>
                    <h3 className="text-lg font-bold text-[#1C1C1C] mb-2">{item.title}</h3>
                    <p className="text-sm text-[#4A4A44] leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== JOURNEY TIMELINE ===== */}
      <section className="py-20 bg-[#F6F1E7]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#1E3A28]/20 mb-6">
              <Clock className="w-4 h-4 text-[#1E3A28]" />
              <span className="text-3xl text-[#9C7A3C] mb-3" style={{ fontFamily: "'Italianno', cursive" }}>Our Journey</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">From Idea to Impact</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">Key milestones in our journey to transform education</motion.p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-6 md:left-1/2 md:-translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-[#1E3A28] via-[#9C7A3C] to-[#2F5233] opacity-30" />

            <div className="space-y-10">
              {[
                { year: '2023 Q1', title: 'The Spark', desc: 'Identified the gap between CBC curriculum goals and available digital tools. Started research with 10 teachers in Nairobi.', icon: Lightbulb, color: 'blue' },
                { year: '2023 Q3', title: 'Pilot Launch', desc: 'Deployed v1 in 5 pilot schools in Nairobi. Tracked 800 students across 40 classes, collecting critical feedback.', icon: Rocket, color: 'emerald' },
                { year: '2024 Q1', title: 'Product-Market Fit', desc: 'Expanded to 15 schools after 95% teacher approval. Added strand-level assessment tracking and parent report cards.', icon: Target, color: 'amber' },
                { year: '2024 Q3', title: 'Regional Expansion', desc: 'Grew to 35 schools across Nairobi, Mombasa, and Kisumu. Launched mobile app for offline assessment capture.', icon: MapPin, color: 'purple' },
                { year: '2025 Q2', title: 'AI Integration', desc: 'Introduced AI-powered predictive analytics, identifying at-risk students 6 weeks before traditional methods. Reached 85 schools.', icon: Brain, color: 'blue' },
                { year: '2026', title: 'Nationwide Scale', desc: 'Now serving 120+ schools, 19,200+ students, and 960+ teachers. Preparing for East Africa expansion into Uganda and Tanzania.', icon: Globe, color: 'emerald' },
              ].map((milestone, i) => {
                const isLeft = i % 2 === 0;
                const colorMap: Record<string, string> = { blue: 'bg-[#1E3A28]', emerald: 'bg-[#2F5233]', amber: 'bg-[#9C7A3C]', purple: 'bg-[#173420]' };
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`relative flex flex-col md:flex-row gap-6 md:gap-8 pl-16 md:pl-0 ${isLeft ? 'md:flex-row-reverse' : ''}`}
                  >
                    {/* Content */}
                    <div className={`md:w-5/12 ${isLeft ? 'md:text-right' : ''}`}>
                      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-[#9C7A3C] font-bold text-sm">{milestone.year}</span>
                        <h3 className="text-xl font-bold text-[#1C1C1C] mt-1 mb-2">{milestone.title}</h3>
                        <p className="text-sm text-[#4A4A44] leading-relaxed">{milestone.desc}</p>
                      </div>
                    </div>

                    {/* Dot */}
                    <div className="absolute left-0 md:relative md:w-2/12 flex md:justify-center">
                      <motion.div whileInView={{ scale: [0.8, 1.2, 1] }} transition={{ duration: 0.5 }} className={`w-12 h-12 rounded-full ${colorMap[milestone.color]} border-4 border-white shadow-md flex items-center justify-center z-10`}>
                        <milestone.icon className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>

                    {/* Spacer */}
                    <div className="hidden md:block md:w-5/12" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CORE VALUES ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F6F1E7] border border-[#9C7A3C]/25 mb-6">
              <Heart className="w-4 h-4 text-[#9C7A3C]" />
              <span className="text-3xl text-[#9C7A3C] mb-3" style={{ fontFamily: "'Italianno', cursive" }}>Our Values</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">What We Stand For</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">The principles behind every line of code we write and every school we serve</motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Sparkles, title: 'Innovation First', desc: 'We challenge conventional edtech norms to build solutions that truly work in African classrooms.', gradient: 'from-[#1E3A28] to-[#2F5233]' },
              { icon: Trophy, title: 'Excellence Always', desc: 'Every feature is tested with real teachers, iterated on real feedback, and held to the highest quality bar.', gradient: 'from-[#9C7A3C] to-[#B8934D]' },
              { icon: Users, title: 'Community Driven', desc: 'We co-create with educators, parents, and education officials — our roadmap is shaped by the people we serve.', gradient: 'from-[#2F5233] to-[#173420]' },
              { icon: Globe, title: 'Impact at Scale', desc: 'Our success is measured not by revenue, but by the number of students whose lives are transformed.', gradient: 'from-[#7d6230] to-[#9C7A3C]' },
            ].map((value, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }} whileHover={{ y: -5 }}>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full text-center hover:shadow-lg transition-all group">
                  <motion.div whileHover={{ rotate: 10, scale: 1.1 }} className={`w-14 h-14 rounded-xl bg-gradient-to-r ${value.gradient} flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                    <value.icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-[#1C1C1C] mb-2">{value.title}</h3>
                  <p className="text-sm text-[#4A4A44] leading-relaxed">{value.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 bg-[#F6F1E7]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#9C7A3C]/25 mb-6">
              <Star className="w-4 h-4 text-[#9C7A3C]" />
              <span className="text-3xl text-[#9C7A3C] mb-3" style={{ fontFamily: "'Italianno', cursive" }}>Testimonials</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">What Educators Say</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">Real stories from schools transforming education with NONEAA</motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "NONEAA has completely changed how we track student competencies. Before, I spent 3 hours every week on manual records. Now it takes 20 minutes, and I can actually see which students need help.",
                name: 'Jane Wanjiku',
                role: 'Grade 4 Teacher',
                school: 'Sunrise Academy, Nairobi',
              },
              {
                quote: "The parent report cards generated by NONEAA are incredible. Parents finally understand what CBC means for their children. Our parent engagement has gone up by 60% since we started using the platform.",
                name: 'David Ochieng',
                role: 'School Principal',
                school: 'Lakeside Primary, Kisumu',
              },
              {
                quote: "As a county education officer, I can now see real-time data from 15 schools in my jurisdiction. The analytics dashboard helps me allocate resources where they are needed most.",
                name: 'Mary Kiptoo',
                role: 'County Education Officer',
                school: 'Nakuru County',
              },
            ].map((t, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }}>
                <div className="bg-white rounded-2xl border border-gray-200 p-8 h-full hover:shadow-lg transition-shadow relative">
                  <div className="text-4xl text-[#9C7A3C]/30 font-serif absolute top-4 left-6">"</div>
                  <p className="text-[#4A4A44] leading-relaxed mb-6 pt-6 italic">{t.quote}</p>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1E3A28] to-[#2F5233] flex items-center justify-center text-white font-bold text-sm">
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1C1C1C] text-sm">{t.name}</p>
                        <p className="text-xs text-[#4A4A44]/70">{t.role} · {t.school}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PARTNERS ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F6F1E7] border border-[#1E3A28]/20 mb-6">
              <HandshakeIcon className="w-4 h-4 text-[#1E3A28]" />
              <span className="text-3xl text-[#9C7A3C] mb-3" style={{ fontFamily: "'Italianno', cursive" }}>Partners & Alignment</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">Trusted & Aligned</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">Working with Kenya's leading education bodies and standards</motion.p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'KICD', desc: 'Kenya Institute of Curriculum Development', icon: BookOpen },
              { name: 'TSC', desc: 'Teachers Service Commission', icon: Award },
              { name: 'KNEC', desc: 'Kenya National Examinations Council', icon: GraduationCap },
              { name: 'MoE', desc: 'Ministry of Education', icon: Globe },
            ].map((p, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }}>
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-[#F6F1E7] flex items-center justify-center mx-auto mb-3">
                    <p.icon className="w-6 h-6 text-[#1E3A28]" />
                  </div>
                  <h4 className="font-bold text-[#1C1C1C] text-lg">{p.name}</h4>
                  <p className="text-xs text-[#4A4A44]/70 mt-1">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}>
            <div className="bg-gradient-to-br from-[#1E3A28] via-[#173420] to-[#2F5233] rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden">
              <motion.div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <motion.div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <h2
                  className="text-4xl md:text-5xl font-bold mb-4"
                  style={{ fontFamily: "'Tangerine', cursive" }}
                >
                  Ready to Transform Your School?
                </h2>
                <p className="text-lg text-[#F6F1E7]/85 mb-8 max-w-2xl mx-auto">
                  Join 120+ schools across Kenya already using NONEAA to improve CBC implementation, teacher productivity, and student outcomes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.a href="/getting-started" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-4 bg-white text-[#1E3A28] font-bold rounded-xl hover:bg-[#F6F1E7] transition-colors shadow-lg inline-flex items-center justify-center gap-2">
                    Get Started Free <ChevronRight className="w-5 h-5" />
                  </motion.a>
                  <motion.a href="/demo" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-4 border-2 border-white/50 text-white font-bold rounded-xl hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2">
                    Request a Demo
                  </motion.a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
