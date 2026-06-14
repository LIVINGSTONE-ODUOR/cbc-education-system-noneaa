import React, { useState, useEffect } from 'react';
import SectionTitle from '@/components/SectionTitle';
import { teamMembers } from '@/data/teamMembers';
import TeamMemberCard from '@/components/TeamMemberCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TeamPage = () => {
  const [displayText, setDisplayText] = useState('');
  const fullText = "Dedicated professionals driving innovation and excellence in everything we do.";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayText(fullText.slice(0, index + 1));
      index++;
      if (index === fullText.length) {
        index = 0;
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Header/>
      {/* Hero Section - Dark navy with accent */}
      <section
  className="relative text-white min-h-[70vh] flex items-center overflow-hidden"
  style={{
    backgroundImage: "url('/Gemini_Generated_Image_wxwqyiwxwqyiwxwq.png')",
    backgroundSize: "cover",
    backgroundPosition: "center"
  }}
>
  {/* Overlay */}
  <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[1px]" />

  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="max-w-3xl">

      <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight 
        bg-gradient-to-r from-white via-cyan-200 to-indigo-300 
        bg-clip-text text-transparent drop-shadow-lg">
        Meet Our Team
      </h1>

      <p className="text-xl md:text-2xl text-cyan-200 leading-relaxed font-medium drop-shadow-md">
        {displayText}
        <span className="animate-pulse">|</span>
      </p>

    </div>
  </div>
</section>

      {/* Team Members Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0f1729] mb-4">Leadership Team</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our experienced leadership team brings together diverse expertise to guide our organization's vision and strategy.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map(member => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* Values Section - Dark background */}
      <section className="py-20 bg-gradient-to-b from-[#0f1729] to-[#1a2332]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our Values</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              The principles that guide our work and shape our culture
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 group hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Excellence</h3>
              <p className="text-gray-400">Committed to delivering the highest quality in everything we do</p>
            </div>

            <div className="text-center p-6 group hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0891b2] to-[#06b6d4] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:shadow-cyan-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Collaboration</h3>
              <p className="text-gray-400">Working together to achieve shared goals and success</p>
            </div>

            <div className="text-center p-6 group hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-[#2563eb] to-[#0891b2] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Innovation</h3>
              <p className="text-gray-400">Embracing new ideas and creative solutions to challenges</p>
            </div>

            <div className="text-center p-6 group hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0891b2] to-[#1e3a8a] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:shadow-cyan-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Integrity</h3>
              <p className="text-gray-400">Acting with honesty and strong moral principles</p>
            </div>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0f1729] mb-4">Our Departments</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Specialized teams working together to drive our mission forward
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Technology */}
            <div className="bg-gradient-to-br from-[#0f1729] to-[#1a2332] rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-t-4 border-[#2563eb] hover:transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-[#2563eb] to-[#3b82f6] rounded-lg flex items-center justify-center mb-4 shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Technology</h3>
              <p className="text-gray-300 mb-4">
                Building innovative solutions and maintaining our technical infrastructure with cutting-edge technologies.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#0891b2] rounded-full mr-2"></span>
                  Software Development
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#0891b2] rounded-full mr-2"></span>
                  Infrastructure & DevOps
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#0891b2] rounded-full mr-2"></span>
                  Data Analytics
                </li>
              </ul>
            </div>

            {/* Operations */}
            <div className="bg-gradient-to-br from-[#0f1729] to-[#1a2332] rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-t-4 border-[#0891b2] hover:transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-[#0891b2] to-[#06b6d4] rounded-lg flex items-center justify-center mb-4 shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Operations</h3>
              <p className="text-gray-300 mb-4">
                Ensuring smooth day-to-day operations and optimizing our processes for maximum efficiency.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#2563eb] rounded-full mr-2"></span>
                  Project Management
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#2563eb] rounded-full mr-2"></span>
                  Process Optimization
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#2563eb] rounded-full mr-2"></span>
                  Quality Assurance
                </li>
              </ul>
            </div>

            {/* Finance */}
            <div className="bg-gradient-to-br from-[#0f1729] to-[#1a2332] rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-t-4 border-[#3b82f6] hover:transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-[#2563eb] to-[#0891b2] rounded-lg flex items-center justify-center mb-4 shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Finance</h3>
              <p className="text-gray-300 mb-4">
                Managing financial resources responsibly and ensuring sustainable growth for the organization.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#0891b2] rounded-full mr-2"></span>
                  Financial Planning
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#0891b2] rounded-full mr-2"></span>
                  Budget Management
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#0891b2] rounded-full mr-2"></span>
                  Compliance & Reporting
                </li>
              </ul>
            </div>

            {/* Business Development */}
            <div className="bg-gradient-to-br from-[#0f1729] to-[#1a2332] rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-t-4 border-[#2563eb] hover:transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-[#1e3a8a] to-[#0891b2] rounded-lg flex items-center justify-center mb-4 shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Business Development</h3>
              <p className="text-gray-300 mb-4">
                Identifying growth opportunities and building strategic partnerships to expand our reach.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#3b82f6] rounded-full mr-2"></span>
                  Strategic Partnerships
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#3b82f6] rounded-full mr-2"></span>
                  Market Expansion
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#3b82f6] rounded-full mr-2"></span>
                  Client Relations
                </li>
              </ul>
            </div>

            {/* Customer Service */}
            <div className="bg-gradient-to-br from-[#0f1729] to-[#1a2332] rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-t-4 border-[#06b6d4] hover:transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-[#06b6d4] to-[#0891b2] rounded-lg flex items-center justify-center mb-4 shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Customer Service</h3>
              <p className="text-gray-300 mb-4">
                Providing exceptional support and building lasting relationships with our customers.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#0891b2] rounded-full mr-2"></span>
                  Customer Support
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#0891b2] rounded-full mr-2"></span>
                  Client Success
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#0891b2] rounded-full mr-2"></span>
                  Feedback Management
                </li>
              </ul>
            </div>

            {/* Accounting */}
            <div className="bg-gradient-to-br from-[#0f1729] to-[#1a2332] rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-t-4 border-[#0891b2] hover:transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-[#0891b2] to-[#2563eb] rounded-lg flex items-center justify-center mb-4 shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Accounting</h3>
              <p className="text-gray-300 mb-4">
                Maintaining accurate financial records and ensuring transparent reporting practices.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#2563eb] rounded-full mr-2"></span>
                  Financial Reporting
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#2563eb] rounded-full mr-2"></span>
                  Audit & Compliance
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#2563eb] rounded-full mr-2"></span>
                  Tax Management
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Join the Team CTA - Matching footer style */}
      <section className="bg-[#0f1729] text-white py-20 relative overflow-hidden border-t border-gray-800">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Join Our Team</h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto text-gray-300">
            We're always looking for talented, passionate individuals who want to make a difference. 
            If you're ready to take your career to the next level, we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/careers" 
              className="inline-block bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white font-semibold py-4 px-10 rounded-lg hover:from-[#3b82f6] hover:to-[#2563eb] transition-all duration-300 shadow-xl hover:shadow-2xl hover:transform hover:-translate-y-1"
            >
              View Open Positions
            </a>
            <a 
              href="/contact" 
              className="inline-block bg-transparent border-2 border-[#0891b2] text-[#0891b2] font-semibold py-4 px-10 rounded-lg hover:bg-[#0891b2] hover:text-white transition-all duration-300 hover:transform hover:-translate-y-1"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
      <Footer/>
    </>
  );
};

export default TeamPage;