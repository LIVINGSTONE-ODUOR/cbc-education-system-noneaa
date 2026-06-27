import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  CircuitBoard, Database, Mail, Phone, ArrowRight,
  Facebook, Twitter, Linkedin, Instagram,
  LineChart, ClipboardCheck, BookOpen, Users,
  ShieldCheck, Globe, ChevronRight, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const platformLinks = [
  { label: 'Curriculum Management', href: '/curriculum', icon: CircuitBoard },
  { label: 'Progress Tracking', href: '/progress', icon: LineChart },
  { label: 'Assessment Tools', href: '/assessments', icon: ClipboardCheck },
  { label: 'Analytics Dashboard', href: '/analytics', icon: Database },
];

const resourceLinks = [
  { label: 'CBE Methodology', href: '/methodology', icon: BookOpen },
  { label: 'Teacher Resources', href: '/teacher/resources', icon: Users },
  { label: 'System Status', href: '/status', icon: ShieldCheck },
  { label: 'Global Standards', href: '/standards', icon: Globe },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function Footer() {

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      alert("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {

      // Save subscriber
      const { error: insertError } = await supabase
        .from("subscribers")
        .insert({
          email: email.trim(),
        });

      if (insertError) {

        // Duplicate email
        if (insertError.code === "23505") {
          alert("You're already subscribed.");
          return;
        }

        throw insertError;
      }

      // Send confirmation email
      const { data, error: functionError } =
       await supabase.functions.invoke(
         "subscribe-confirmation",
         {
           body: {
             email: email.trim(),
             },
           }
         );
      console.log("Edge Function Response:", data);
      console.log("Edge Function Error:", functionError);

      if (functionError) {
        throw functionError;
      }

      alert(" Thank you for subscribing! Please check your email.");

      setEmail("");

    } catch (error) {
      console.error(error);
      alert("Unable to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="relative bg-[#0b0f1a] text-slate-300 overflow-hidden border-t border-slate-800/50">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-indigo-600/5 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="container mx-auto px-6 lg:px-12 py-16"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand & Description */}
          <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
            <Link to="/" className="inline-block group">
              <img
                src="/Noneea-logo.jpg" 
                alt="Noneea Logo"
                className="h-16 w-16 object-cover rounded-full transition-transform group-hover:scale-105"
              />
            </Link>
            
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Empowering Kenyan educators with the next generation of <span className="text-white font-medium">Competency-Based</span> infrastructure. 
            </p>

            {/* Social Matrix */}
            <div className="flex gap-2">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all duration-300"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Navigation Matrix */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8">
            <motion.div variants={itemVariants} className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/90">Platform</h4>
              <nav className="flex flex-col gap-3">
                {platformLinks.map((link) => (
                  <Link 
                    key={link.label} 
                    to={link.href} 
                    className="group flex items-center gap-3 text-slate-400 hover:text-blue-400 transition-all"
                  >
                    <link.icon size={14} className="text-slate-600 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                ))}
              </nav>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/90">Resources</h4>
              <nav className="flex flex-col gap-3">
                {resourceLinks.map((link) => (
                  <Link 
                    key={link.label} 
                    to={link.href} 
                    className="group flex items-center gap-3 text-slate-400 hover:text-blue-400 transition-all"
                  >
                    <link.icon size={14} className="text-slate-600 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                ))}
              </nav>
            </motion.div>
          </div>

          {/* Newsletter / CTA Card */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 backdrop-blur-sm">
              <h4 className="text-lg font-bold text-white mb-2">Join the Movement</h4>
              <p className="text-xs text-slate-400 mb-6">Weekly insights on CBE digital transformation.</p>
              
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@school.ke"
                    className="pl-11 h-11 bg-slate-900/50 border-slate-700/50 rounded-xl focus-visible:ring-blue-500 text-sm"
                  />
                </div>
                <Button 
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
                >
                  {loading ? "Subscribing..." : "Subscribe"}
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority Support</p>
                  <p className="text-sm font-bold text-white tracking-tight">+254 111 276 271</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer Bottom */}
      <div className="bg-[#080b14] border-t border-slate-800/50">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-xs font-bold text-slate-400">
              © {new Date().getFullYear()} Noneaa Africa. <span className="text-slate-600 ml-2 hidden md:inline">|</span> 
              <span className="block md:inline mt-1 md:mt-0 md:ml-2 text-slate-500 font-normal italic">Innovation for The Kenyan Classroom.</span>
            </p>
          </div>
          
          <div className="flex gap-6">
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Security', href: '/security' },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-blue-500 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
