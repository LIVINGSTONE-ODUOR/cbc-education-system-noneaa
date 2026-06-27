import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CircuitBoard, Database, Mail, Phone,
  Facebook, Twitter, Linkedin, Instagram,
  LineChart, ClipboardCheck, BookOpen, Users,
  ShieldCheck, Globe,
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
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const handleSubscribe = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setEmailError(true);
      return;
    }

    setEmailError(false);
    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('subscribers')
        .insert({ email: email.trim() });

      if (insertError) {
        if (insertError.code === '23505') {
          setAlreadySubscribed(true);
          return;
        }
        throw insertError;
      }

      const { data, error: functionError } = await supabase.functions.invoke(
        'send-subscription-email',
        { body: { email: email.trim() } }
      );

      console.log('Edge Function Response:', data);
      console.log('Edge Function Error:', functionError);

      if (functionError) throw functionError;

      setSuccess(true);
      setEmail('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-300">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="relative max-w-7xl mx-auto px-6 py-16 lg:py-20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand & Description */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-white font-semibold text-lg">
              <span className="text-blue-500">NONEAA</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed">
              Empowering Kenyan educators with the next generation of Competency-Based infrastructure.
            </p>

            {/* Social Matrix */}
            <div className="mt-6 flex items-center gap-3">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 hover:text-white transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Navigation Matrix */}
          <motion.div variants={itemVariants} className="lg:col-span-2 grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-3">
                {platformLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="group flex items-center gap-2 text-sm hover:text-blue-400 transition-colors"
                    >
                      <link.icon size={16} className="text-slate-500 group-hover:text-blue-400" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-3">
                {resourceLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="group flex items-center gap-2 text-sm hover:text-blue-400 transition-colors"
                    >
                      <link.icon size={16} className="text-slate-500 group-hover:text-blue-400" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Newsletter / CTA Card */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
              <h4 className="text-white font-semibold text-lg">Join the Movement</h4>
              <p className="mt-2 text-sm text-slate-400">
                Weekly insights on CBE digital transformation.
              </p>

              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(false);
                    }}
                    placeholder="email@school.ke"
                    className={`pl-11 h-11 bg-slate-900/50 rounded-xl focus-visible:ring-blue-500 text-sm transition-colors ${
                      emailError
                        ? 'border-red-500 focus-visible:ring-red-500'
                        : 'border-slate-700/50'
                    }`}
                  />
                </div>

                <Button
                  onClick={handleSubscribe}
                  disabled={loading || success || alreadySubscribed}
                  className={`w-full h-11 rounded-xl font-medium text-white transition-colors ${
                    success
                      ? 'bg-emerald-600 hover:bg-emerald-600 cursor-default text-xs'
                      : alreadySubscribed
                      ? 'bg-amber-600 hover:bg-amber-600 cursor-default'
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {success
                    ? 'Thank you for subscribing! Please check your email.'
                    : alreadySubscribed
                    ? 'Already subscribed'
                    : loading
                    ? 'Subscribing...'
                    : 'Subscribe'}
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Phone size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Priority Support</p>
                    <p className="text-sm text-slate-400">+254 111 276 271</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer Bottom */}
      <div className="relative border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Noneaa Africa. | Innovation for The Kenyan Classroom.
          </p>

          <div className="flex items-center gap-6">
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Security', href: '/security' },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-sm text-slate-500 hover:text-white transition-colors"
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
