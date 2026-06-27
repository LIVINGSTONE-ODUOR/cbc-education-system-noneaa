import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Phone, Mail, Building2, ChevronDown, CreditCard,
  Clock, Users, GraduationCap, HeadphonesIcon, MessageSquare, Shield,
  ArrowRight, Send, CheckCircle2, Sparkles, Globe, Zap, Star
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

/* ─────────── Data ─────────── */
const contactInfo = [ /* ... your original contactInfo array ... */ ];
const supportOptions = [ /* ... your original supportOptions ... */ ];
const faqs = [ /* ... your original faqs ... */ ];
const paymentMethods = [ /* ... your original paymentMethods ... */ ];

const colorMap: Record<string, { bg: string; iconBg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  purple: { bg: 'bg-purple-50', iconBg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  rose: { bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
};

type ContactErrors = {
  fullName?: string;
  email?: string;
  message?: string;
};

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    school: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: string; message: string } | null>(null);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [expandedFaq, setExpandedFaq] = useState<number>(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    const field = name as keyof ContactErrors;
    if (Object.prototype.hasOwnProperty.call(errors, field)) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): ContactErrors => {
    const newErrors: ContactErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.message.trim()) newErrors.message = 'Message is required.';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch('https://your-project-ref.supabase.co/functions/v1/contact-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          institution: formData.school,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus({
          type: 'success',
          message: "Thank you! Your message has been received. We'll get back to you within 24 hours."
        });
        setFormData({ fullName: '', email: '', phone: '', school: '', subject: '', message: '' });
        setErrors({});
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error(error);
      setStatus({
        type: 'error',
        message: 'Something went wrong. Please try again or contact us directly at contact@noneaa.com',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8edf5]">
      <Header />

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden text-white">
        {/* ... Your entire hero section (unchanged) ... */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />
        {/* Animated orbs and all content remain exactly as you had */}
        {/* ... (keeping your full hero code) ... */}
      </section>

      {/* ===== CONTACT INFO BAR (mobile) ===== */}
      {/* ... your mobile contact bar (unchanged) ... */}

      {/* ===== MAIN CONTENT: FORM + SUPPORT ===== */}
      <section className="py-20 bg-[#e8edf5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left — Form */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 md:p-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Send className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Send Us a Message</h2>
                </div>
                <p className="text-slate-500 mb-8 ml-13">
                  Fill out the form below and our team will get back to you within one business day.
                </p>

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* All your form fields remain exactly the same */}
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Ochieng"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-slate-50 ${errors.fullName ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                      />
                      {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@school.ac.ke"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-slate-50 ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Phone, School, Subject, Message fields remain unchanged */}

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+254 712 345 678" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">School / Institution</label>
                      <input type="text" name="school" value={formData.school} onChange={handleChange} placeholder="Nairobi Academy" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-slate-50" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                    <select name="subject" value={formData.subject} onChange={handleChange} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm text-slate-700 bg-slate-50">
                      <option value="">Select a topic</option>
                      <option value="demo">Request a Demo</option>
                      <option value="pricing">Pricing & Plans</option>
                      <option value="technical">Technical Support</option>
                      <option value="partnership">Partnership Inquiry</option>
                      <option value="feedback">Feedback & Suggestions</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Tell us how we can help your institution..."
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none text-sm bg-slate-50 ${errors.message ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                    />
                    {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {status && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
                          status.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                        {status.message}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            </motion.div>

            {/* Right — Support Options (unchanged) */}
            {/* ... rest of your right column ... */}
          </div>
        </div>
      </section>

      {/* All remaining sections (WHY CONTACT US, FAQ, PAYMENT, CTA) remain exactly as you wrote them */}

      <Footer />
    </div>
  );
}
