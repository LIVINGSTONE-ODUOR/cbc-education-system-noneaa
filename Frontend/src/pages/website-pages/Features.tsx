import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap, DollarSign, Users, ClipboardCheck, MessageCircle, CheckCircle, Menu, ChevronRight, BarChart3, TrendingUp, Shield, BookOpen, Award, Globe, Zap, LineChart } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, useInView, useAnimation } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend } from 'recharts';

// --- Data for Charts ---
const performanceData = [
  { month: 'Jan', students: 320, teachers: 45, performance: 72 },
  { month: 'Feb', students: 380, teachers: 48, performance: 75 },
  { month: 'Mar', students: 450, teachers: 52, performance: 78 },
  { month: 'Apr', students: 520, teachers: 55, performance: 82 },
  { month: 'May', students: 610, teachers: 60, performance: 85 },
  { month: 'Jun', students: 720, teachers: 65, performance: 88 },
];

const subjectData = [
  { name: 'Mathematics', score: 85, color: '#3B82F6' },
  { name: 'English', score: 78, color: '#10B981' },
  { name: 'Science', score: 82, color: '#8B5CF6' },
  { name: 'Social Studies', score: 76, color: '#F59E0B' },
  { name: 'Creative Arts', score: 90, color: '#EF4444' },
];

const enrollmentPieData = [
  { name: 'Grade 1-3', value: 35, color: '#3B82F6' },
  { name: 'Grade 4-6', value: 30, color: '#10B981' },
  { name: 'Grade 7-9', value: 25, color: '#8B5CF6' },
  { name: 'Grade 10-12', value: 10, color: '#F59E0B' },
];

const radialData = [
  { name: 'Attendance', value: 94, fill: '#3B82F6' },
  { name: 'Completion', value: 87, fill: '#10B981' },
  { name: 'Satisfaction', value: 91, fill: '#8B5CF6' },
];

// --- Animated Counter Component ---
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// --- Section Wrapper with Scroll Reveal ---
function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// --- Floating Card Component ---
function FloatingCard({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
      className={`transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}

const subHeadingLines = [
  "NONEAA equips schools with modern digital tools",
  "designed for Kenya's Competency-Based Curriculum -",
  "helping administrators, teachers, and students",
  "work smarter, faster, and more efficiently."
];

const supportLines = [
  "Built for Schools - Designed for CBE",
  "- Powered by Modern Technology"
];

export default function CBETrackLanding() {
  const [typedMainText, setTypedMainText] = useState('');
  const fullMainText = 'Powerful Features for Modern Education';
  

  const [currentSubLine, setCurrentSubLine] = useState(0);
  const [typedSubText, setTypedSubText] = useState('');

  const [currentSupportLine, setCurrentSupportLine] = useState(0);
  const [typedSupportText, setTypedSupportText] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullMainText.length) {
        setTypedMainText(fullMainText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentSubLine >= subHeadingLines.length) {
      setTimeout(() => setCurrentSubLine(0), 2000);
      return;
    }

    let index = 0;
    const currentText = subHeadingLines[currentSubLine];
    const interval = setInterval(() => {
      if (index < currentText.length) {
        setTypedSubText(currentText.slice(0, index + 1));
        index++;
      } else {
        setTimeout(() => {
          setCurrentSubLine(currentSubLine + 1);
          setTypedSubText('');
        }, 600);
        clearInterval(interval);
      }
    }, 35);
    return () => clearInterval(interval);
  }, [currentSubLine]);

  useEffect(() => {
    if (currentSupportLine >= supportLines.length) {
      setTimeout(() => setCurrentSupportLine(0), 2000);
      return;
    }

    let index = 0;
    const currentText = supportLines[currentSupportLine];
    const interval = setInterval(() => {
      if (index < currentText.length) {
        setTypedSupportText(currentText.slice(0, index + 1));
        index++;
      } else {
        setTimeout(() => {
          setCurrentSupportLine(currentSupportLine + 1);
          setTypedSupportText('');
        }, 600);
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [currentSupportLine]);

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
      },
    }),
  };

  return (
    <div className="min-h-screen bg-[#e8edf5]">
      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background Orbs */}
        <motion.div
          className="absolute top-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />

        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/Gemini_Generated_Image_wxwqyiwxwqyiwxwq.png"
            alt="Features Background"
            className="w-full h-full object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/75 via-black/60 to-indigo-900/70"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">

            {/* Heading with Typewriter */}
            <motion.h1
              variants={textVariants}
              custom={0}
              initial="hidden"
              animate="visible"
              className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight"
            >
              {typedMainText}
              <span className="animate-pulse">|</span>
            </motion.h1>

            {/* Sub-heading - Line by Line */}
            <motion.div
              variants={textVariants}
              custom={1}
              initial="hidden"
              animate="visible"
              className="text-xl text-gray-200 leading-relaxed"
            >
              {subHeadingLines.slice(0, currentSubLine).map((line, i) => (
                <div key={i}>{line}</div>
              ))}
              <div>
                {typedSubText}
                <span className="animate-pulse">|</span>
              </div>
            </motion.div>

            {/* Supporting line - Line by Line */}
            <motion.div
              variants={textVariants}
              custom={2}
              initial="hidden"
              animate="visible"
              className="mt-6 text-sm text-gray-300 tracking-wide uppercase"
            >
              {supportLines.slice(0, currentSupportLine).map((line, i) => (
                <div key={i}>{line}</div>
              ))}
              <div>
                {typedSupportText}
                <span className="animate-pulse">|</span>
              </div>
            </motion.div>

          </div>
        </div>

      </section>

      {/* === NEW: Animated Statistics Counter Section === */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Trusted by Schools Across Kenya</h2>
              <p className="text-blue-100 text-lg">Powering competency-based education at scale</p>
            </div>
          </RevealSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Schools Enrolled', value: 520, suffix: '+', icon: GraduationCap },
              { label: 'Active Students', value: 48000, suffix: '+', icon: Users },
              { label: 'Teachers on Platform', value: 3200, suffix: '+', icon: BookOpen },
              { label: 'Reports Generated', value: 150000, suffix: '+', icon: BarChart3 },
            ].map((stat, i) => (
              <FloatingCard key={i} delay={i * 0.1}>
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <stat.icon className="w-8 h-8 text-blue-200 mx-auto mb-3" />
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-blue-100 text-sm font-medium">{stat.label}</p>
                </div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* Feature 1: Comprehensive CBE Performance & School Administration */}
      <section className="py-20 bg-[#e8edf5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Text Side */}
            <RevealSection>
              <div>
                <p
                  className="text-3xl text-blue-600 mb-3"
                  style={{ fontFamily: "'Italianno', cursive" }}
                >
                  Comprehensive System
                </p>

                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  NONEAA: Comprehensive CBE Performance & School Administration
                </h2>

                <p className="text-lg text-gray-600 mb-8">
                  Efficiently manage all school operations through NONEAA's integrated dashboards. 
                  Monitor fees, attendance, academic progress, and administrative tasks in one centralized platform.
                </p>

                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">
                      <strong>Admin Dashboard:</strong> Track fee collections, student and teacher activity, and subscription details.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">
                      <strong>Parent Dashboard:</strong> View grades, disciplinary records, and student progress reports.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">
                      <strong>Complete Management:</strong> Oversee students, teachers, classes, and performance analytics in real time.
                    </p>
                  </motion.div>
                </div>
              </div>
            </RevealSection>

            {/* Image Side */}
            <RevealSection delay={0.2}>
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl p-4 shadow-xl">

                  <div className="overflow-hidden rounded-2xl shadow-lg">
                    <img
                      src="/public/Gemini_Generated_Image_4n6fal4n6fal4n6f.png"
                      alt="NONEAA Dashboard Preview"
                      className="w-full h-full object-cover rounded-2xl hover:scale-105 transition duration-500"
                    />
                  </div>

                </div>
              </div>
            </RevealSection>

          </div>

        </div>
      </section>

      {/* === NEW: Performance Analytics Section with Charts === */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-16">
              <p
                className="text-3xl text-indigo-600 mb-3"
                style={{ fontFamily: "'Italianno', cursive" }}
              >
                Data-Driven Insights
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Real-Time Analytics & Performance Tracking
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Gain deep insights into student performance, school operations, and learning outcomes 
                with powerful dashboards and real-time reporting.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Student Growth Chart */}
            <FloatingCard delay={0.1} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Student Growth & Performance</h3>
                  <p className="text-sm text-gray-500">Monthly enrollment and academic score trends</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="students" stroke="#3B82F6" fillOpacity={1} fill="url(#colorStudents)" strokeWidth={2} />
                  <Area type="monotone" dataKey="performance" stroke="#10B981" fillOpacity={1} fill="url(#colorPerformance)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </FloatingCard>

            {/* Subject Performance Bar Chart */}
            <FloatingCard delay={0.2} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Subject-Wise Performance</h3>
                  <p className="text-sm text-gray-500">Average CBE scores across subjects</p>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={12} width={100} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                    {subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </FloatingCard>
          </div>

          {/* Second row of charts */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Enrollment Distribution Pie */}
            <FloatingCard delay={0.3} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">Enrollment Distribution</h3>
                <p className="text-sm text-gray-500">Students by grade level</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={enrollmentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {enrollmentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {enrollmentPieData.map((item, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </FloatingCard>

            {/* Key Metrics Radial */}
            <FloatingCard delay={0.4} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">Key Metrics</h3>
                <p className="text-sm text-gray-500">School performance indicators</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                  <RadialBar background dataKey="value" cornerRadius={10} />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-4 mt-2">
                {radialData.map((item, i) => (
                  <div key={i} className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-xs text-gray-600">{item.name}: {item.value}%</span>
                  </div>
                ))}
              </div>
            </FloatingCard>

            {/* Quick Stats Cards */}
            <FloatingCard delay={0.5} className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
              <h3 className="text-lg font-bold mb-6">Quick Insights</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                  <div className="flex items-center space-x-3">
                    <Award className="w-5 h-5" />
                    <span className="text-sm">Avg. CBE Score</span>
                  </div>
                  <span className="font-bold text-lg">82%</span>
                </div>
                <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm">Growth Rate</span>
                  </div>
                  <span className="font-bold text-lg text-green-300">+24%</span>
                </div>
                <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5" />
                    <span className="text-sm">Counties</span>
                  </div>
                  <span className="font-bold text-lg">32</span>
                </div>
                <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5" />
                    <span className="text-sm">Uptime</span>
                  </div>
                  <span className="font-bold text-lg">99.9%</span>
                </div>
              </div>
            </FloatingCard>
          </div>
        </div>
      </section>


      {/* Feature 2: Accounting System */}
      <section className="py-20 bg-[#dfe5f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Image Side (LEFT) */}
            <RevealSection className="relative order-2 md:order-1">
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl p-4 shadow-xl">

                <div className="overflow-hidden rounded-2xl shadow-lg">
                  <img
                    src="/public/Gemini_Generated_Image_5siqxp5siqxp5siq.png"
                    alt="Accounting System Preview"
                    className="w-full h-full object-cover rounded-2xl hover:scale-105 transition duration-500"
                  />
                </div>

              </div>
            </RevealSection>

            {/* Text Side (RIGHT) */}
            <RevealSection delay={0.2} className="order-1 md:order-2">
              <div>

                <p className="text-3xl text-blue-600 mb-3" style={{ fontFamily: "'Italianno', cursive" }}>
                  ACCOUNTING SYSTEM
                </p>

                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Streamline Fees, Invoices & Receipts with Ease
                </h2>

                <p className="text-lg text-gray-600 mb-8">
                  Our comprehensive accounting suite simplifies fee structure creation, invoice generation, 
                  payment tracking, and bulk document handling—tailored for institutions of all sizes.
                </p>

                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">
                      Customizable fee structures per student, class, or group
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">
                      Automated invoice generation with bulk download support
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">
                      Real-time payment tracking and bulk receipt downloads
                    </p>
                  </motion.div>
                </div>

              </div>
            </RevealSection>

          </div>
        </div>
      </section>

      {/* === NEW: Platform Capabilities Showcase === */}
      <section className="py-20 bg-[#e8edf5] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-16">
              <p className="text-3xl text-green-600 mb-3" style={{ fontFamily: "'Italianno', cursive" }}>
                PLATFORM CAPABILITIES
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Everything You Need, All in One Place
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                From classroom management to parent communication, NONEAA covers every aspect 
                of modern school administration.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ClipboardCheck,
                title: 'CBE Assessment Engine',
                description: 'Create, assign, and grade competency-based assessments with rubric-linked scoring and automated report generation.',
                color: 'blue',
                gradient: 'from-blue-500 to-blue-600',
              },
              {
                icon: LineChart,
                title: 'Progress Tracking',
                description: 'Monitor student growth with strand-level analytics, competency maps, and visual progress dashboards.',
                color: 'green',
                gradient: 'from-green-500 to-emerald-600',
              },
              {
                icon: MessageCircle,
                title: 'Parent Communication',
                description: 'Real-time messaging, automated notifications, and parent portals for transparent school-home collaboration.',
                color: 'purple',
                gradient: 'from-purple-500 to-indigo-600',
              },
              {
                icon: Shield,
                title: 'Data Security',
                description: 'Enterprise-grade encryption, role-based access control, and GDPR-compliant data handling for all school records.',
                color: 'red',
                gradient: 'from-red-500 to-pink-600',
              },
              {
                icon: BookOpen,
                title: 'Curriculum Mapping',
                description: 'Align teaching plans with Kenya\'s CBC framework including learning areas, strands, sub-strands, and indicators.',
                color: 'amber',
                gradient: 'from-amber-500 to-orange-600',
              },
              {
                icon: Globe,
                title: 'Multi-School Network',
                description: 'Manage multiple campuses from a single dashboard with centralized reporting and school-level isolation.',
                color: 'teal',
                gradient: 'from-teal-500 to-cyan-600',
              },
            ].map((feature, i) => (
              <FloatingCard key={i} delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 h-full group">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* Feature 3: User Roles & Permissions */}
      <section className="py-20 bg-[#dfe5f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <RevealSection>
              <div>
                <p className="text-3xl text-green-600 mb-3" style={{ fontFamily: "'Italianno', cursive" }}>
                  USER & ROLES
                </p>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Manage Roles & Permissions Across the System
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Our platform provides robust role-based access control to ensure secure and structured interactions for administrators, teachers, parents, and staff.
                </p>
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Separate portals for Admin, Teachers, Parents, and Staff</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Role assignment and permission customization</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Secure and limited access per user type</p>
                  </motion.div>
                </div>
              </div>
            </RevealSection>
            <RevealSection delay={0.2}>
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl p-8 shadow-xl">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-lg font-bold text-gray-900">NONEAA</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                      { icon: Users, label: 'Admin', bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
                      { icon: GraduationCap, label: 'Teacher', bgColor: 'bg-green-100', iconColor: 'text-green-600' },
                      { icon: Users, label: 'Parent', bgColor: 'bg-orange-100', iconColor: 'text-orange-600' },
                      { icon: Users, label: 'Staff', bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
                    ].map((role, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        whileHover={{ scale: 1.1 }}
                        className="text-center cursor-pointer"
                      >
                        <div className={`w-16 h-16 ${role.bgColor} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                          <role.icon className={`w-8 h-8 ${role.iconColor}`} />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{role.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* === NEW: How It Works Timeline Section === */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-16">
              <p className="text-3xl text-blue-600 mb-3" style={{ fontFamily: "'Italianno', cursive" }}>
                GET STARTED
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Up and Running in Minutes
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Getting your school onto NONEAA is quick and seamless. Our team supports you every step of the way.
              </p>
            </div>
          </RevealSection>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 transform -translate-x-1/2" />

            <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-1 md:gap-16">
              {[
                { step: '01', title: 'Sign Up & Configure', description: 'Create your school account, set up classes, subjects, and term structures in just a few clicks.', side: 'left' },
                { step: '02', title: 'Onboard Your Team', description: 'Invite teachers, add students, and assign roles. Bulk import via CSV for large schools.', side: 'right' },
                { step: '03', title: 'Start Teaching & Tracking', description: 'Teachers begin assessments, parents access portals, and admins monitor everything in real time.', side: 'left' },
                { step: '04', title: 'Generate Reports & Insights', description: 'Pull CBE-compliant reports, track progress over terms, and make data-driven decisions.', side: 'right' },
              ].map((item, i) => (
                <RevealSection key={i} delay={i * 0.15}>
                  <div className={`flex items-center ${item.side === 'right' ? 'md:flex-row-reverse' : ''} gap-8`}>
                    <div className={`flex-1 ${item.side === 'right' ? 'md:text-right' : ''}`}>
                      <div className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 ${item.side === 'right' ? 'md:ml-auto' : 'md:mr-auto'} max-w-md`}>
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm mb-4`}>
                          {item.step}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center justify-center w-4 h-4 bg-white border-4 border-blue-500 rounded-full z-10" />
                    <div className="flex-1 hidden md:block" />
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === NEW: Testimonials / Social Proof === */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
        {/* Animated background particles */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-16">
              <p className="text-3xl text-blue-300 mb-3" style={{ fontFamily: "'Italianno', cursive" }}>
                TESTIMONIALS
              </p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                What Educators Are Saying
              </h2>
              <p className="text-lg text-blue-200 max-w-3xl mx-auto">
                Schools across Kenya trust NONEAA to deliver results for their students and staff.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "NONEAA transformed how we handle CBC assessments. Our teachers save 10+ hours per week on report generation alone.",
                name: "Mary Wanjiku",
                role: "Principal, Nairobi Academy",
                avatar: "MW",
              },
              {
                quote: "The parent portal has dramatically improved our communication. Parents feel more involved in their children's learning journey.",
                name: "James Ochieng",
                role: "Head Teacher, Kisumu Preparatory",
                avatar: "JO",
              },
              {
                quote: "Finally, an education system built for Kenya's CBC. The competency tracking and analytics are world-class.",
                name: "Dr. Sarah Kimani",
                role: "Education Director, Rift Valley Schools",
                avatar: "SK",
              },
            ].map((testimonial, i) => (
              <FloatingCard key={i} delay={i * 0.15}>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-full">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-blue-100 mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-sm font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{testimonial.name}</p>
                      <p className="text-blue-300 text-xs">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* === NEW: Integration Showcase === */}
      <section className="py-20 bg-[#e8edf5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <RevealSection>
              <div>
                <p className="text-3xl text-indigo-600 mb-3" style={{ fontFamily: "'Italianno', cursive" }}>
                  SEAMLESS INTEGRATIONS
                </p>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Connect with Tools You Already Use
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  NONEAA integrates seamlessly with popular payment gateways, communication tools, 
                  and educational resources to create a unified school management experience.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {['M-Pesa Payments', 'SMS Notifications', 'Email Alerts', 'PDF Reports', 'Excel Export', 'Google Classroom'].map((integration, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="flex items-center space-x-2 bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700">{integration}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </RevealSection>

            <RevealSection delay={0.2}>
              <div className="relative">
                {/* Animated integration visual */}
                <div className="bg-gradient-to-br from-indigo-100 to-blue-50 rounded-3xl p-8 shadow-xl">
                  <div className="relative w-full aspect-square max-w-sm mx-auto">
                    {/* Central logo */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg z-10">
                      <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    {/* Orbiting icons */}
                    {[
                      { icon: DollarSign, angle: 0, color: 'bg-green-500' },
                      { icon: MessageCircle, angle: 60, color: 'bg-blue-500' },
                      { icon: Users, angle: 120, color: 'bg-purple-500' },
                      { icon: BarChart3, angle: 180, color: 'bg-amber-500' },
                      { icon: Shield, angle: 240, color: 'bg-red-500' },
                      { icon: BookOpen, angle: 300, color: 'bg-teal-500' },
                    ].map((item, i) => {
                      const radius = 120;
                      const x = Math.cos((item.angle * Math.PI) / 180) * radius;
                      const y = Math.sin((item.angle * Math.PI) / 180) * radius;
                      return (
                        <motion.div
                          key={i}
                          className={`absolute top-1/2 left-1/2 w-12 h-12 ${item.color} rounded-xl flex items-center justify-center shadow-lg`}
                          style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        >
                          <item.icon className="w-6 h-6 text-white" />
                        </motion.div>
                      );
                    })}
                    {/* Connection lines (decorative) */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 300">
                      <circle cx="150" cy="150" r="120" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                      <circle cx="150" cy="150" r="80" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
                    </svg>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-blue-600 text-white relative overflow-hidden">
        {/* Animated background shapes */}
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], y: [0, -20, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <RevealSection>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your School Management?
            </h2>
            <p className="text-xl mb-8 text-green-50">
              Join hundreds of schools across Kenya using NONEAA to streamline operations and improve student outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
              >
                Start Your Free Trial
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-green-600 transition"
              >
                Schedule a Demo
              </motion.button>
            </div>
          </RevealSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
