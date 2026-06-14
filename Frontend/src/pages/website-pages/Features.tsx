import React, { useState, useEffect } from 'react';
import { GraduationCap, DollarSign, Users, ClipboardCheck, MessageCircle, CheckCircle, Menu, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-white">
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

      {/* Feature 1: Comprehensive CBE Performance & School Administration */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Text Side */}
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
                COMPREHENSIVE SYSTEM
              </p>

              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                NONEAA: Comprehensive CBE Performance & School Administration
              </h2>

              <p className="text-lg text-gray-600 mb-8">
                Efficiently manage all school operations through NONEAA's integrated dashboards. 
                Monitor fees, attendance, academic progress, and administrative tasks in one centralized platform.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    <strong>Admin Dashboard:</strong> Track fee collections, student and teacher activity, and subscription details.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    <strong>Parent Dashboard:</strong> View grades, disciplinary records, and student progress reports.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    <strong>Complete Management:</strong> Oversee students, teachers, classes, and performance analytics in real time.
                  </p>
                </div>
              </div>
            </div>

            {/* Image Side */}
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

          </div>

        </div>
      </section>


      {/* Feature 2: Accounting System */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Image Side (LEFT) */}
            <div className="relative order-2 md:order-1">
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl p-4 shadow-xl">

                <div className="overflow-hidden rounded-2xl shadow-lg">
                  <img
                    src="/public/Gemini_Generated_Image_5siqxp5siqxp5siq.png"
                    alt="Accounting System Preview"
                    className="w-full h-full object-cover rounded-2xl hover:scale-105 transition duration-500"
                  />
                </div>

              </div>
            </div>

            {/* Text Side (RIGHT) */}
            <div className="order-1 md:order-2">

              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
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
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    Customizable fee structures per student, class, or group
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    Automated invoice generation with bulk download support
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    Real-time payment tracking and bulk receipt downloads
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Feature 3: User Roles & Permissions */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-3">
                USER & ROLES
              </p>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Manage Roles & Permissions Across the System
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our platform provides robust role-based access control to ensure secure and structured interactions for administrators, teachers, parents, and staff.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">Separate portals for Admin, Teachers, Parents, and Staff</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">Role assignment and permission customization</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">Secure and limited access per user type</p>
                </div>
              </div>
            </div>
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
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Admin</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Teacher</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Users className="w-8 h-8 text-orange-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Parent</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Staff</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your School Management?
          </h2>
          <p className="text-xl mb-8 text-green-50">
            Join hundreds of schools across Kenya using NONEAA to streamline operations and improve student outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg">
              Start Your Free Trial
            </button>
            <button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-green-600 transition">
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

