import { useState, useEffect } from 'react';
/*import { teamMembers } from '@/data/teamMembers';*/
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Linkedin, Mail, Github, Users, Lightbulb, Heart, CheckCircle, Code, BarChart3, DollarSign, Briefcase, Headphones, BookOpen, ArrowRight } from 'lucide-react';

const TeamPage = () => {
  const [displayText, setDisplayText] = useState('');
  const fullText = "The passionate people behind Kenya's leading CBC education platform.";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayText(fullText.slice(0, index + 1));
      index++;
      if (index === fullText.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const values = [
    { icon: CheckCircle, title: 'Excellence', desc: 'Delivering the highest quality in every feature we ship', color: 'from-[#1E3A28] to-[#173420]' },
    { icon: Users, title: 'Collaboration', desc: 'Working as one team to build tools that empower schools', color: 'from-[#2F5233] to-[#1E3A28]' },
    { icon: Lightbulb, title: 'Innovation', desc: 'Embracing new ideas to solve real education challenges', color: 'from-[#9C7A3C] to-[#7d6230]' },
    { icon: Heart, title: 'Integrity', desc: 'Acting with honesty and putting educators first', color: 'from-[#2F5233] to-[#9C7A3C]' },
  ];

  const departments = [
    { icon: Code, title: 'Technology', desc: 'Building the platform with cutting-edge tools', items: ['Software Development', 'Infrastructure & DevOps', 'Data Analytics'], color: 'green' },
    { icon: BarChart3, title: 'Operations', desc: 'Optimizing processes for maximum efficiency', items: ['Project Management', 'Process Optimization', 'Quality Assurance'], color: 'gold' },
    { icon: DollarSign, title: 'Finance', desc: 'Managing resources for sustainable growth', items: ['Financial Planning', 'Budget Management', 'Compliance & Reporting'], color: 'sage' },
    { icon: Briefcase, title: 'Business Development', desc: 'Building partnerships and expanding reach', items: ['Strategic Partnerships', 'Market Expansion', 'Client Relations'], color: 'green' },
    { icon: Headphones, title: 'Customer Service', desc: 'Providing exceptional support to every school', items: ['Customer Support', 'Client Success', 'Feedback Management'], color: 'gold' },
    { icon: BookOpen, title: 'Accounting', desc: 'Ensuring transparent and accurate reporting', items: ['Financial Reporting', 'Audit & Compliance', 'Tax Management'], color: 'sage' },
  ];

  const colorMap: Record<string, { bg: string; border: string; dot: string; iconBg: string }> = {
    green: { bg: 'bg-[#1E3A28]/[0.05]', border: 'border-[#1E3A28]/15', dot: 'bg-[#1E3A28]', iconBg: 'bg-[#1E3A28]/10 text-[#1E3A28]' },
    gold: { bg: 'bg-[#9C7A3C]/[0.07]', border: 'border-[#9C7A3C]/25', dot: 'bg-[#9C7A3C]', iconBg: 'bg-[#9C7A3C]/15 text-[#9C7A3C]' },
    sage: { bg: 'bg-[#2F5233]/[0.05]', border: 'border-[#2F5233]/15', dot: 'bg-[#2F5233]', iconBg: 'bg-[#2F5233]/10 text-[#2F5233]' },
  };

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden bg-[#1E3A28]">
        <img
          src="/Gemini_Generated_Image_wxwqyiwxwqyiwxwq.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E3A28]/70 via-[#1E3A28]/50 to-[#1E3A28]/85" />
        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-[#E4C68A] font-medium mb-6">
            <Users className="w-4 h-4" />
            Our Team
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Meet the People Behind{' '}
            <span className="bg-gradient-to-r from-[#E4C68A] to-[#9C7A3C] bg-clip-text text-transparent">
              NONEAA
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            {displayText}
            <span className="inline-block w-0.5 h-5 bg-[#E4C68A] ml-1 align-middle animate-pulse" />
          </p>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1C1C] mb-3">Leadership Team</h2>
            <p className="text-[#4A4A44]/80 max-w-xl mx-auto">
              Experienced leaders guiding our vision and strategy
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="group relative bg-white rounded-2xl border border-[#1E3A28]/10 p-6 text-center hover:shadow-xl hover:border-[#1E3A28]/20 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Photo */}
                <div className="relative w-28 h-28 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1E3A28] to-[#9C7A3C] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-28 h-28 rounded-full object-cover ring-4 ring-[#F6F1E7] group-hover:ring-[#1E3A28]/15 transition-all duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-28 h-28 rounded-full bg-gradient-to-br from-[#1E3A28] to-[#2F5233] flex items-center justify-center ring-4 ring-[#F6F1E7] ${member.image ? 'hidden' : ''}`}>
                    <span className="text-2xl font-bold text-white">
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <h3 className="text-lg font-semibold text-[#1C1C1C] mb-1">{member.name}</h3>
                <p className="text-sm text-[#9C7A3C] font-medium mb-4">{member.role}</p>

                {/* Socials */}
                <div className="flex justify-center gap-2">
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-[#F6F1E7] hover:bg-[#1E3A28]/10 flex items-center justify-center text-[#4A4A44]/60 hover:text-[#1E3A28] transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {member.github && (
                    <a href={member.github} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-[#F6F1E7] hover:bg-[#1E3A28]/10 flex items-center justify-center text-[#4A4A44]/60 hover:text-[#1E3A28] transition-colors">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="w-8 h-8 rounded-lg bg-[#F6F1E7] hover:bg-[#9C7A3C]/15 flex items-center justify-center text-[#4A4A44]/60 hover:text-[#9C7A3C] transition-colors">
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-[#F6F1E7]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1C1C] mb-3">Our Values</h2>
            <p className="text-[#4A4A44]/80 max-w-xl mx-auto">
              The principles that guide our work every day
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="bg-white rounded-2xl p-6 border border-[#1E3A28]/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${v.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1C1C1C] mb-2">{v.title}</h3>
                  <p className="text-sm text-[#4A4A44]/80 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1C1C] mb-3">Our Departments</h2>
            <p className="text-[#4A4A44]/80 max-w-xl mx-auto">
              Specialized teams working together to drive our mission
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => {
              const Icon = dept.icon;
              const c = colorMap[dept.color];
              return (
                <div key={dept.title} className={`rounded-2xl border ${c.border} ${c.bg} p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
                  <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1C1C1C] mb-2">{dept.title}</h3>
                  <p className="text-sm text-[#4A4A44]/90 mb-4">{dept.desc}</p>
                  <ul className="space-y-2">
                    {dept.items.map((item) => (
                      <li key={item} className="flex items-center text-sm text-[#4A4A44]/80">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot} mr-2.5 flex-shrink-0`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-20 bg-[#1E3A28] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#9C7A3C]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#2F5233]/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Join Our Team</h2>
          <p className="text-white/70 text-lg mb-10 leading-relaxed">
            We're looking for talented, passionate individuals who want to make a difference in Kenya's education system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/careers"
              className="inline-flex items-center justify-center gap-2 bg-[#9C7A3C] hover:bg-[#87692f] text-white font-semibold py-3.5 px-8 rounded-xl transition-colors shadow-lg shadow-black/20"
            >
              View Open Positions
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border border-white/25 text-white/80 hover:text-white hover:border-white/50 font-semibold py-3.5 px-8 rounded-xl transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default TeamPage;
