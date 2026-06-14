import React, { useRef, useState, useEffect } from 'react';
import { 
  GraduationCap, Users, Award, Globe, Target, Heart, Sparkles, 
  Rocket, TrendingUp, Brain, Trophy, CheckCircle2, ArrowRight,
  Linkedin, Twitter, BookOpen, Eye, ChevronRight, Clock,
  Users2, Zap
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTypewriter } from '@/hooks/use-typewriter';
/**
 * DESIGN SYSTEM:
 * Primary: Blue (#2563eb)
 * Secondary: Light Gray (#f3f4f6)
 * Text: Dark Gray (#1f2937)
 * Accent: Emerald (#10b981)
 */



// Reusable Card Component
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
    {children}
  </div>
);

// Section Header Component
const SectionHeader = ({ badge, title, subtitle, icon: Icon }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="text-center mb-16"
  >
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 mb-6">
      <Icon className="w-4 h-4 text-blue-600" />
      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider text-muted-foreground">
        {badge}
      </span>
    </div>
    <h2 className="text-2xl font-bold text-foreground mb-4">
      {title}
    </h2>
    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
      {subtitle}
    </p>
  </motion.div>
);

// Fade In Animation
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

// Enhanced Hero Section Component
const HeroSection = () => {
  const headingText = "Empowering Education Through Competency-Based Learning";
  const typedHeading = useTypewriter({
    text: headingText,
    speed: 25,
    delay: 200,
    repeat: false,
  });

  const descriptionText = "We're building the digital infrastructure for competency-based education where every student's potential is unlocked through data-driven mastery, not just traditional assessment.";
  const typedDescription = useTypewriter({
    text: descriptionText,
    speed: 15,
    delay: 1500,
    repeat: true,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  return (
    <section
      className="relative min-h-[70vh] flex items-center overflow-hidden text-white"
      style={{
        backgroundImage: "url('/Gemini_Generated_Image_wxwqyiwxwqyiwxwq.png')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-slate-900/75 backdrop-blur-[1px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Animated background elements */}
      <motion.div
        className="absolute top-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 left-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.4, 0.2, 0.4],
        }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-3 mb-6"
          >
            <motion.div
              className="h-px w-10 bg-blue-400"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            <motion.span
              className="text-xs font-semibold text-blue-400 uppercase tracking-wider text-muted-foreground"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              About Noneaa
            </motion.span>
          </motion.div>

          {/* Animated Heading with Typewriter Effect */}
          <motion.div variants={itemVariants} className="mb-6">
            <h1 className="text-xl font-bold leading-tight">
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {typedHeading}
              </motion.span>
              <motion.span
                className="inline-block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <span className="animate-pulse text-cyan-400 ml-1">|</span>
              </motion.span>
            </h1>
          </motion.div>

          {/* Description with staggered animation */}
          <motion.p
            variants={itemVariants}
            className="text-lg text-slate-300 mb-8 max-w-2xl leading-relaxed"
          >
            {typedDescription}
            <motion.span
              className="inline-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="animate-pulse text-cyan-400 ml-1">|</span>
            </motion.span>
          </motion.p>

          {/* Animated Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(37, 99, 235, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all inline-flex items-center gap-2 w-fit shadow-lg"
            >
              Our Mission
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </motion.button>

            <motion.button
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(30, 58, 138, 0.4)",
                boxShadow: "0 0 20px rgba(96, 165, 250, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 border-2 border-blue-400 text-blue-300 font-semibold rounded-lg hover:bg-blue-900/20 transition-all"
            >
              Contact Us
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default function AboutPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#e8edf5] text-slate-900">
      {/* Header */}
    <Header/>

      {/* ===== HERO SECTION ===== */}
     <HeroSection />

      {/* ===== MISSION & VISION SECTION ===== */}
      <section className="py-20 md:py-32 bg-[#dfe5f0] border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader
            badge="Our Purpose"
            icon={Target}
            title="Mission & Vision"
            subtitle="Guiding principles that drive everything we do"
          />

          <div className="grid md:grid-cols-2 gap-12">
            {/* Mission Card */}
            <motion.div {...fadeInUp} className="md:col-span-1">
              <Card className="p-8 h-full">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Our Mission
                </h3>
                <p className="text-base text-slate-600 leading-relaxed mb-6">
                  To empower educators with intelligent tools that facilitate personalized, mastery-based learning 
                  at scale. We believe the CBE curriculum is the bridge to building a more skilled, innovative workforce for Africa.
                </p>
                <ul className="space-y-3">
                  {[
                    'Real-time competency tracking',
                    'AI-powered personalization',
                    'Teacher empowerment through data'
                  ].map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 text-slate-700"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            {/* Vision Card */}
            <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="md:col-span-1">
              <Card className="p-8 h-full">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Our Vision
                </h3>
                <p className="text-base text-slate-600 leading-relaxed mb-6">
                  A future where every African student has access to world-class, personalized education that 
                  recognizes and develops their unique competencies and potential, regardless of socioeconomic background.
                </p>
                <ul className="space-y-3">
                  {[
                    'Accessible to all schools',
                    'Equitable educational outcomes',
                    'Technology serving pedagogy'
                  ].map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 text-slate-700"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== JOURNEY TIMELINE ===== */}
      <section className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader
            badge="Milestones"
            icon={Clock}
            title="Our Journey"
            subtitle="From a small pilot to transforming education across Kenya"
          />

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-600 to-emerald-600 opacity-20" />

            <div className="space-y-12">
              {[
                {
                  year: '2023',
                  title: 'The Beginning',
                  description: 'Started with 5 pilot schools in Nairobi to test CBE assessment tools.',
                  icon: Rocket
                },
                {
                  year: '2024',
                  title: 'Rapid Growth',
                  description: 'Expanded to 30+ schools across Nairobi, Mombasa, and Kisumu.',
                  icon: TrendingUp
                },
                {
                  year: '2025',
                  title: 'Regional Expansion',
                  description: 'Reached 100+ schools with integrated reporting and analytics platform.',
                  icon: Globe
                },
                {
                  year: '2026',
                  title: 'AI Innovation',
                  description: 'Launched AI-powered assessment tools and predictive analytics for student success.',
                  icon: Brain
                }
              ].map((milestone, index) => {
                const Icon = milestone.icon;
                const isLeft = index % 2 === 0;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex gap-8 ${isLeft ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Content */}
                    <div className={`w-5/12 ${isLeft ? 'text-right' : 'text-left'}`}>
                      <Card className="p-6">
                        <span className="text-blue-600 font-bold text-xl">{milestone.year}</span>
                        <h3 className="text-xl font-bold text-slate-900 mt-2 mb-2">
                          {milestone.title}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {milestone.description}
                        </p>
                      </Card>
                    </div>

                    {/* Timeline dot */}
                    <div className="w-2/12 flex justify-center">
                      <motion.div
                        whileInView={{ scale: 1.2 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="w-12 h-12 rounded-full bg-blue-600 border-4 border-white shadow-md flex items-center justify-center flex-shrink-0 z-10"
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </motion.div>
                    </div>

                    {/* Spacer */}
                    <div className="w-5/12" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CORE VALUES ===== */}
      <section className="py-20 md:py-32 bg-[#dfe5f0] border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader
            badge="Philosophy"
            icon={Heart}
            title="Our Core Values"
            subtitle="The principles that guide every decision we make"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'Innovation',
                description: 'Constantly pushing boundaries to create better solutions for education.'
              },
              {
                icon: Trophy,
                title: 'Excellence',
                description: 'Committed to the highest standards in product quality and support.'
              },
              {
                icon: Users,
                title: 'Collaboration',
                description: 'Working closely with educators, schools, and communities.'
              },
              {
                icon: Globe,
                title: 'Impact',
                description: 'Measured by the success and growth of every student we serve.'
              }
            ].map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="p-6 h-full text-center">
                    <motion.div
                      whileHover={{ rotate: 10 }}
                      className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4"
                    >
                      <Icon className="w-6 h-6 text-blue-600" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {value.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {value.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== TEAM SECTION ===== */}


      {/* ===== IMPACT METRICS ===== */}
      <section className="py-20 md:py-32 bg-blue-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            {[
              { number: '10+', label: 'Schools Transformed' },
              { number: '10K+', label: 'Students Impacted' },
              { number: '98%', label: 'Teacher Satisfaction' },
              { number: '24/7', label: 'System Uptime' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <p className="text-base text-blue-100">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-12 text-center text-white"
          >
            <h2 className="text-4xl font-bold mb-4">
              Ready to Transform Your School?
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Join 10+ schools across Kenya already using Noneaa to improve CBE implementation 
              and student outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Get Started
              </motion.button>
              <button className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
                Contact Sales
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
            <Footer/>
    </div>
  );
}
