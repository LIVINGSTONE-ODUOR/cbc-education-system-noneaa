import React, { useState, useMemo, useEffect } from 'react';
import { clients, clientStats } from '@/data/clients';
import ClientCard from '@/components/ClientCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Star, School, Users, MapPin, CheckCircle } from 'lucide-react';
import Stats from '@/components/Stats';

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  initials: string;
}

// Sub-component for Testimonials to reduce redundancy
const TestimonialCard = ({ quote, author, role, initials }: TestimonialCardProps) => (
  <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-8 border border-slate-700 hover:border-indigo-500/50 transition-colors">
    <div className="flex items-center gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    <p className="text-slate-300 mb-6 italic leading-relaxed">"{quote}"</p>
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-inner">
        {initials}
      </div>
      <div>
        <div className="text-white font-semibold">{author}</div>
        <div className="text-slate-400 text-sm">{role}</div>
      </div>
    </div>
  </div>
);

const ClientsPage = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [typedText, setTypedText] = useState('');
  const fullText = "Partnering with Kenya's leading educational institutions to transform learning through technology.";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1));
        index++;
      } else {
        // Reset and start over
        setTypedText('');
        index = 0;
      }
    }, 100); // Adjust speed as needed

    return () => clearInterval(interval);
  }, [fullText]);

  // Centralized Category Logic
  const categories = useMemo(() => [
    { id: 'all', name: 'All Schools', count: clientStats.totalSchools, icon: <School className="w-4 h-4" /> },
    { id: 'primary', name: 'Primary', count: clientStats.primarySchools },
    { id: 'secondary', name: 'Secondary', count: clientStats.secondarySchools },
    { id: 'international', name: 'International', count: clientStats.internationalSchools },
    { id: 'private', name: 'Private', count: clientStats.privateSchools },
  ], []);

  const filteredClients = useMemo(() => 
    activeCategory === 'all' 
      ? clients 
      : clients.filter(client => client.category === activeCategory),
  [activeCategory]);

  return (
    <div className="min-h-screen bg-[#e8edf5]">
      <Header />

      {/* Hero Section: Refined Gradient & Typography */}
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">

  {/* Background Image */}
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{
      backgroundImage: "url('/Gemini_Generated_Image_jrstonjrstonjrst.png')"
    }}
  />

  {/* Dark Overlay */}
  <div className="absolute inset-0 bg-slate-900/80" />

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">
        Our{" "}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          Trusted Partners
        </span>
      </h1>

      <p className="text-xl text-slate-300 leading-relaxed">
        {typedText}
        <span className="animate-pulse">|</span>
      </p>
    </div>
  </div>
</section>


      {/* Stats Section: Animated Count-Up */}
      <Stats
        metrics={[
          { label: 'Partner Schools', end: clientStats.totalSchools, format: 'raw', suffix: '+' , Icon: School},
          { label: 'Students Reached', end: Math.round(clientStats.totalStudents), format: 'compact', suffix: '+', Icon: Users },
          { label: 'Counties', end: 8, format: 'raw', suffix: '+', Icon: MapPin },
          { label: 'CBE Compliant', end: 100, format: 'percent', suffix: '', Icon: CheckCircle }
        ]}
      />

      {/* Category Filter Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Explore our Network</h2>
              <p className="text-slate-600">Filter by institution type to see how we tailor CBE solutions for different learning environments.</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    activeCategory === cat.id
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat.name} <span className="ml-1 opacity-60 font-normal">({cat.count})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section: Dark Mode Aesthetic */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Voice of the Educators</h2>
            <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="Noneaa has transformed how we implement CBE. The curriculum management tools are exceptional."
              author="Dr. Mary Kamau" role="Principal, Makini School" initials="MK"
            />
            <TestimonialCard 
              quote="Outstanding platform! Progress tracking and analytics have made assessment so much easier."
              author="John Omondi" role="Head Teacher, Alliance High" initials="JO"
            />
            <TestimonialCard 
              quote="The perfect solution for CBE implementation. Highly recommend to any school in Kenya."
              author="Sarah Wanjiru" role="Director, ISK Nairobi" initials="SW"
            />
          </div>
        </div>
      </section>

      {/* CTA Section: Clean & Professional */}
      <section className="py-20 bg-[#e8edf5]">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative z-10">Ready to modernize your school?</h2>
            <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto relative z-10">
              Join 150+ Kenyan institutions. Get your CBE assessments and student tracking under one roof.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <a href="/contact" className="bg-white text-indigo-700 font-bold py-4 px-8 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
                Request a Free Demo
              </a>
              <a href="/pricing" className="bg-indigo-500/30 text-white border border-indigo-400 font-bold py-4 px-8 rounded-xl hover:bg-indigo-500/50 transition-colors">
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ClientsPage;
