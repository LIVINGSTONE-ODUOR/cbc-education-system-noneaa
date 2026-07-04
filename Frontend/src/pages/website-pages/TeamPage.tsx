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
    { icon: CheckCircle, title: 'Excellence', desc: 'Delivering the highest quality in every feature we ship', color: 'from-blue-500 to-blue-600' },
    { icon: Users, title: 'Collaboration', desc: 'Working as one team to build tools that empower schools', color: 'from-cyan-500 to-teal-500' },
    { icon: Lightbulb, title: 'Innovation', desc: 'Embracing new ideas to solve real education challenges', color: 'from-amber-500 to-orange-500' },
    { icon: Heart, title: 'Integrity', desc: 'Acting with honesty and putting educators first', color: 'from-rose-500 to-pink-500' },
  ];

  const departments = [
    { icon: Code, title: 'Technology', desc: 'Building the platform with cutting-edge tools', items: ['Software Development', 'Infrastructure & DevOps', 'Data Analytics'], color: 'blue' },
    { icon: BarChart3, title: 'Operations', desc: 'Optimizing processes for maximum efficiency', items: ['Project Management', 'Process Optimization', 'Quality Assurance'], color: 'cyan' },
    { icon: DollarSign, title: 'Finance', desc: 'Managing resources for sustainable growth', items: ['Financial Planning', 'Budget Management', 'Compliance & Reporting'], color: 'emerald' },
    { icon: Briefcase, title: 'Business Development', desc: 'Building partnerships and expanding reach', items: ['Strategic Partnerships', 'Market Expansion', 'Client Relations'], color: 'violet' },
    { icon: Headphones, title: 'Customer Service', desc: 'Providing exceptional support to every school', items: ['Customer Support', 'Client Success', 'Feedback Management'], color: 'amber' },
    { icon: BookOpen, title: 'Accounting', desc: 'Ensuring transparent and accurate reporting', items: ['Financial Reporting', 'Audit & Compliance', 'Tax Management'], color: 'rose' },
  ];

  const colorMap: Record<string, { bg: string; border: string; dot: string; iconBg: string }> = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', iconBg: 'bg-blue-100 text-blue-600' },
    cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', dot: 'bg-cyan-500', iconBg: 'bg-cyan-100 text-cyan-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', iconBg: 'bg-emerald-100 text-emerald-600' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500', iconBg: 'bg-violet-100 text-violet-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', iconBg: 'bg-amber-100 text-amber-600' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500', iconBg: 'bg-rose-100 text-rose-600' },
  };

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden bg-gray-950">
        <img
          src="/Gemini_Generated_Image_wxwqyiwxwqyiwxwq.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-gray-950/40 to-gray-950/80" />
        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-blue-200 font-medium mb-6">
            <Users className="w-4 h-4" />
            Our Team
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Meet the People Behind{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              NONEAA
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {displayText}
            <span className="inline-block w-0.5 h-5 bg-blue-400 ml-1 align-middle animate-pulse" />
          </p>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Leadership Team</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Experienced leaders guiding our vision and strategy
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="group relative bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-xl hover:border-gray-200 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Photo */}
                <div className="relative w-28 h-28 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-28 h-28 rounded-full object-cover ring-4 ring-gray-100 group-hover:ring-blue-100 transition-all duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center ring-4 ring-gray-100 ${member.image ? 'hidden' : ''}`}>
                    <span className="text-2xl font-bold text-white">
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-sm text-blue-600 font-medium mb-4">{member.role}</p>

                {/* Socials */}
                <div className="flex justify-center gap-2">
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {member.github && (
                    <a href={member.github} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-cyan-50 flex items-center justify-center text-gray-400 hover:text-cyan-600 transition-colors">
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Our Values</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              The principles that guide our work every day
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${v.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
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
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Our Departments</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{dept.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{dept.desc}</p>
                  <ul className="space-y-2">
                    {dept.items.map((item) => (
                      <li key={item} className="flex items-center text-sm text-gray-500">
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
      <section className="py-20 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Join Our Team</h2>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed">
            We're looking for talented, passionate individuals who want to make a difference in Kenya's education system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/careers"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-8 rounded-xl transition-colors shadow-lg shadow-blue-600/25"
            >
              View Open Positions
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-semibold py-3.5 px-8 rounded-xl transition-colors"
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
