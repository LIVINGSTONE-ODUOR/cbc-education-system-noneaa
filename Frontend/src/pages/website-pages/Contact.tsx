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
const contactInfo = [
  {
    icon: Phone,
    label: "Phone Support",
    value: "+254 111 276 271",
    subtext: "Mon–Fri, 8AM–6PM EAT",
    href: "tel:+254111276271",
    color: 'blue',
  },
  {
    icon: Mail,
    label: "Email Support",
    value: "contact@noneaa.com",
    subtext: "We respond within 24 hours",
    href: "mailto:contact@noneaa.com",
    color: 'emerald',
  },
  {
    icon: MapPin,
    label: "Headquarters",
    value: "Westlands, Nairobi",
    subtext: "Kenya",
    href: "#",
    color: 'purple',
  },
  {
    icon: Building2,
    label: "Regional Offices",
    value: "Mombasa, Kisumu, Nakuru",
    subtext: "3 locations across Kenya",
    href: "#",
    color: 'amber',
  }
];

const supportOptions = [
  {
    icon: GraduationCap,
    title: "Schools & Institutions",
    description: "Looking to implement CBE in your school? We'll walk you through onboarding, training, and setup.",
    color: 'blue',
  },
  {
    icon: HeadphonesIcon,
    title: "Technical Support",
    description: "Experiencing issues with the platform? Our technical team can help troubleshoot and resolve problems quickly.",
    color: 'rose',
  },
  {
    icon: Users,
    title: "Partnership Inquiries",
    description: "Interested in collaborating? We work with NGOs, government bodies, and education partners across East Africa.",
    color: 'emerald',
  },
  {
    icon: MessageSquare,
    title: "General Inquiries",
    description: "Have questions about our pricing, features, or how NONEAA works? We're happy to help.",
    color: 'purple',
  }
];

const faqs = [
  {
    question: "How does NONEAA help with CBE assessment?",
    answer: "NONEAA provides comprehensive CBE assessment tools that track learner competencies across all 7 CBC areas, generate detailed reports, and help teachers identify where students need additional support. Our platform aligns fully with Kenya's KICD curriculum framework."
  },
  {
    question: "Is NONEAA available on mobile devices?",
    answer: "Yes. NONEAA is fully responsive and works on mobile devices, tablets, and desktops. It also works offline and syncs when internet is available — designed for Kenyan school realities."
  },
  {
    question: "How much does NONEAA cost?",
    answer: "We offer flexible pricing plans tailored to schools of all sizes — from single-stream primary schools to large multi-campus institutions. Contact our sales team for a custom quote based on your student count and feature needs."
  },
  {
    question: "Do you provide training for teachers?",
    answer: "Yes. Every onboarding includes comprehensive training for administrators and teachers. We offer both in-person workshops and virtual training sessions, plus ongoing support via WhatsApp, documentation, and video guides."
  },
  {
    question: "Is my school data secure?",
    answer: "Absolutely. We use enterprise-grade encryption, comply with Kenya's Data Protection Act (KDPA), and maintain SOC 2 aligned practices. All data is stored in secure cloud infrastructure with regular backups and strict access controls."
  },
  {
    question: "How long does it take to set up NONEAA for my school?",
    answer: "Most schools are fully onboarded within 1–2 weeks. This includes data migration, staff training, and curriculum configuration. Larger institutions with complex requirements may take 3–4 weeks."
  }
];

const paymentMethods = [
  { name: "M-Pesa", color: "from-green-500 to-green-600" },
  { name: "Visa", color: "from-blue-500 to-blue-600" },
  { name: "Mastercard", color: "from-red-500 to-orange-500" },
  { name: "PayPal", color: "from-indigo-500 to-indigo-600" },
  { name: "Bank Transfer", color: "from-slate-500 to-slate-600" }
];

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
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required.';
    }
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

    const accessKey = import.meta.env.VITE_WEB3FORMS_KEY?.trim();

    if (!accessKey) {
      setStatus({
        type: 'error',
        message: 'Configuration error. Please email contact@noneaa.com directly.'
      });
      setIsSubmitting(false);
      return;
    }

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });
    formDataToSend.append('access_key', accessKey);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formDataToSend
      });

      const json = await response.json();

      if (json.success) {
        setStatus({
          type: 'success',
          message: "Thank you! Your message has been received. We'll get back to you within 24 hours."
        });
        setFormData({ fullName: '', email: '', phone: '', school: '', subject: '', message: '' });
      } else {
        setStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8edf5]">
      <Header />

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />

        {/* Animated orbs */}
        <motion.div className="absolute top-10 right-20 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl" animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 8, repeat: Infinity }} />
        <motion.div className="absolute bottom-10 left-10 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl" animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.15, 0.3] }} transition={{ duration: 10, repeat: Infinity, delay: 1 }} />
        <motion.div className="absolute top-1/2 left-1/3 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl" animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 12, repeat: Infinity, delay: 2 }} />

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <div className="h-px w-10 bg-blue-400" />
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Get in Touch</span>
              </motion.div>

              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Let's Build Better<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Education Together</span>
              </h1>

              <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-xl">
                Whether you're a school looking to implement CBC, a partner interested in collaboration, or a user needing support — the NONEAA team is here to help you succeed.
              </p>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-6">
                {[
                  { num: '<24hrs', label: 'Email Response' },
                  { num: '24/7', label: 'System Uptime' },
                  { num: '98%', label: 'Satisfaction' },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.15 }} className="text-center">
                    <div className="text-2xl font-bold text-white">{s.num}</div>
                    <div className="text-sm text-slate-400">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right side — contact cards */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="hidden lg:grid grid-cols-2 gap-4">
              {contactInfo.map((info, i) => {
                const Icon = info.icon;
                return (
                  <motion.a
                    key={i}
                    href={info.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-3 group-hover:bg-white/20 transition-colors">
                      <Icon className="w-5 h-5 text-blue-300" />
                    </div>
                    <div className="font-semibold text-white text-sm">{info.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{info.subtext}</div>
                  </motion.a>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT INFO BAR (mobile) ===== */}
      <section className="lg:hidden bg-[#dfe5f0] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 gap-4">
            {contactInfo.map((info, i) => {
              const Icon = info.icon;
              const c = colorMap[info.color];
              return (
                <motion.a
                  key={i}
                  href={info.href}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${c.border} bg-white hover:shadow-md transition-all`}
                >
                  <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{info.value}</div>
                    <div className="text-xs text-slate-500">{info.subtext}</div>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

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

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+254 712 345 678"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">School / Institution</label>
                      <input
                        type="text"
                        name="school"
                        value={formData.school}
                        onChange={handleChange}
                        placeholder="Nairobi Academy"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm text-slate-700 bg-slate-50"
                    >
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
                        {status.type === 'success' ? (
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        )}
                        {status.message}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            </motion.div>

            {/* Right — Support Options */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="lg:col-span-2 space-y-5">
              <motion.div variants={fadeUp}>
                <h3 className="text-xl font-bold text-slate-900 mb-1">How Can We Help?</h3>
                <p className="text-sm text-slate-500 mb-6">Choose the category that best describes your inquiry.</p>
              </motion.div>

              {supportOptions.map((option, i) => {
                const Icon = option.icon;
                const c = colorMap[option.color];
                return (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    whileHover={{ x: 4 }}
                    className={`flex items-start gap-4 p-5 rounded-xl border ${c.border} bg-white hover:shadow-md transition-all cursor-pointer group`}
                  >
                    <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{option.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{option.description}</p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Response Time Card */}
              <motion.div variants={fadeUp}>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white relative overflow-hidden">
                  <motion.div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-200" />
                      </div>
                      <span className="font-bold text-sm">Average Response Times</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Email inquiries', time: 'Within 24 hours', bar: 'w-3/4' },
                        { label: 'Phone support', time: 'Immediate', bar: 'w-full' },
                        { label: 'Technical issues', time: 'Within 4 hours', bar: 'w-5/6' },
                        { label: 'Partnership inquiries', time: '2–3 business days', bar: 'w-1/2' },
                      ].map((r, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-blue-100">{r.label}</span>
                            <span className="font-medium">{r.time}</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-cyan-400 to-blue-300 rounded-full"
                              initial={{ width: 0 }}
                              whileInView={{ width: '100%' }}
                              viewport={{ once: true }}
                              transition={{ delay: i * 0.15, duration: 0.8 }}
                              style={{ maxWidth: r.bar === 'w-full' ? '100%' : r.bar === 'w-5/6' ? '83%' : r.bar === 'w-3/4' ? '75%' : '50%' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== WHY CONTACT US ===== */}
      <section className="py-16 bg-[#dfe5f0]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 mb-6">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Why Choose NONEAA</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">We're More Than Just Software</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">Every school gets a dedicated team committed to their success</motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: 'Fast Onboarding', desc: 'Get your school up and running in under 2 weeks with our guided setup process.', gradient: 'from-amber-500 to-orange-500' },
              { icon: Users, title: 'Dedicated Support', desc: 'Every school gets a named account manager and WhatsApp support channel.', gradient: 'from-blue-500 to-cyan-500' },
              { icon: GraduationCap, title: 'Teacher Training', desc: 'Comprehensive in-person and virtual training for all staff members.', gradient: 'from-emerald-500 to-teal-500' },
              { icon: Globe, title: 'Growing Network', desc: 'Join 120+ schools across Kenya transforming education together.', gradient: 'from-purple-500 to-pink-500' },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }} whileHover={{ y: -5 }}>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center h-full hover:shadow-lg transition-all group">
                  <motion.div whileHover={{ rotate: 10, scale: 1.1 }} className={`w-14 h-14 rounded-xl bg-gradient-to-r ${item.gradient} flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="py-20 bg-[#e8edf5]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 mb-6">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">FAQ</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">Frequently Asked Questions</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">Find quick answers to common questions about NONEAA and getting started</motion.p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? -1 : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 text-sm pr-4">{faq.question}</span>
                  <motion.div animate={{ rotate: expandedFaq === index ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expandedFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 py-4 bg-blue-50/30 border-t border-gray-100">
                        <p className="text-sm text-slate-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PAYMENT & TRUST ===== */}
      <section className="py-20 bg-[#dfe5f0]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-200 mb-6">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Payments</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">Flexible Payment Options</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">We accept multiple payment methods to make it easy for schools across Kenya to get started</motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
            {/* Payment methods */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {paymentMethods.map((method, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -3, scale: 1.05 }}
                    className={`bg-gradient-to-r ${method.color} rounded-xl px-6 py-4 flex items-center gap-3 shadow-lg text-white`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="font-bold text-sm">{method.name}</span>
                  </motion.div>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-6 text-center md:text-left">
                All transactions are processed securely with 256-bit SSL encryption.
              </p>
            </motion.div>

            {/* Trust badges */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, title: 'Secure Payments', desc: '256-bit SSL encryption', color: 'blue' },
                { icon: Zap, title: 'Instant Activation', desc: 'Access within minutes', color: 'amber' },
                { icon: Star, title: '120+ Schools', desc: 'Trusted nationwide', color: 'emerald' },
                { icon: GraduationCap, title: '19K+ Students', desc: 'Actively using NONEAA', color: 'purple' },
              ].map((badge, i) => {
                const c = colorMap[badge.color];
                return (
                  <motion.div key={i} variants={fadeUp} whileHover={{ y: -3 }}>
                    <div className={`bg-white p-5 rounded-xl border ${c.border} text-center hover:shadow-md transition-all`}>
                      <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center mx-auto mb-3`}>
                        <badge.icon className={`w-5 h-5 ${c.text}`} />
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{badge.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{badge.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 bg-[#e8edf5]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}>
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden">
              <motion.div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <motion.div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
                <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                  Schedule a free demo with our team and see how NONEAA can transform your school's CBC implementation.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.a href="/demo" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-lg inline-flex items-center justify-center gap-2">
                    Request a Demo <ArrowRight className="w-5 h-5" />
                  </motion.a>
                  <motion.a href="/getting-started" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-4 border-2 border-white/50 text-white font-bold rounded-xl hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2">
                    Get Started Free
                  </motion.a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
