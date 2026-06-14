import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Phone, Mail, Building2, ChevronDown, CreditCard,
  Clock, Users, GraduationCap, HeadphonesIcon, MessageSquare, Shield
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const contactInfo = [
  {
    icon: Phone,
    label: "Phone Support",
    value: "+254 111 276 271",
    subtext: "Mon–Fri, 8AM–6PM EAT",
    href: "tel:+254111276271"
  },
  {
    icon: Mail,
    label: "Email Support",
    value: "contact@noneaa.com",
    subtext: "We respond within 24 hours",
    href: "mailto:contact@noneaa.com"
  },
  {
    icon: MapPin,
    label: "Headquarters",
    value: "Westlands, Nairobi",
    subtext: "Kenya",
    href: "#"
  },
  {
    icon: Building2,
    label: "Regional Offices",
    value: "Mombasa, Kisumu, Nakuru",
    subtext: "3 locations across Kenya",
    href: "#"
  }
];

const supportOptions = [
  {
    icon: GraduationCap,
    title: "Schools & Institutions",
    description: "Looking to implement CBE in your school? We'll walk you through onboarding, training, and setup."
  },
  {
    icon: HeadphonesIcon,
    title: "Technical Support",
    description: "Experiencing issues with the platform? Our technical team can help troubleshoot and resolve problems quickly."
  },
  {
    icon: Users,
    title: "Partnership Inquiries",
    description: "Interested in collaborating? We work with NGOs, government bodies, and education partners across East Africa."
  },
  {
    icon: MessageSquare,
    title: "General Inquiries",
    description: "Have questions about our pricing, features, or how Noneaa works? We're happy to help."
  }
];

const faqs = [
  {
    question: "How does Noneaa help with CBE assessment?",
    answer: "Noneaa provides comprehensive CBE assessment tools that track learner competencies, generate detailed reports, and help teachers identify areas where students need additional support. Our platform aligns with Kenya's CBC curriculum framework."
  },
  {
    question: "Is Noneaa available on mobile devices?",
    answer: "Yes. Noneaa is fully responsive and works on mobile devices, tablets, and desktops. Teachers and parents can access student data and manage assessments from anywhere with an internet connection."
  },
  {
    question: "How much does Noneaa cost?",
    answer: "We offer flexible pricing plans tailored to schools of all sizes — from single-stream primary schools to large multi-campus institutions. Contact our sales team for a custom quote based on your student count and feature needs."
  },
  {
    question: "Do you provide training for teachers?",
    answer: "Yes. Every onboarding includes comprehensive training for administrators and teachers. We offer both in-person workshops and virtual training sessions, plus ongoing support documentation and video guides."
  },
  {
    question: "Is my school data secure?",
    answer: "Absolutely. We use enterprise-grade encryption, comply with Kenya's Data Protection Act (2019), and maintain SOC 2 aligned practices. All data is stored in secure cloud infrastructure with regular backups and strict access controls."
  },
  {
    question: "How long does it take to set up Noneaa for my school?",
    answer: "Most schools are fully onboarded within 1–2 weeks. This includes data migration, staff training, and curriculum configuration. Larger institutions with complex requirements may take 3–4 weeks."
  }
];

const paymentMethods = [
  { name: "M-Pesa", color: "bg-green-50 border-green-200" },
  { name: "Visa", color: "bg-blue-50 border-blue-200" },
  { name: "Mastercard", color: "bg-red-50 border-red-200" },
  { name: "PayPal", color: "bg-indigo-50 border-indigo-200" },
  { name: "Bank Transfer", color: "bg-slate-50 border-slate-200" }
];

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

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/Gemini_Generated_Image_jrstonjrstonjrst.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/80 to-blue-900/75" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <span className="inline-block text-sm font-semibold text-blue-300 uppercase tracking-wider mb-4">
              Contact Us
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
              Let's Build Better Education Together
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Whether you're a school looking to implement competency-based education, a partner interested in collaboration, or a user needing support — the Noneaa team is here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Bar */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <a
                  key={index}
                  href={info.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{info.value}</div>
                    <div className="text-xs text-slate-500">{info.subtext}</div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content: Form + Support Options */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid lg:grid-cols-5 gap-16">

          {/* Left Column — Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 md:p-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Send Us a Message</h2>
              <p className="text-slate-600 mb-8">
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
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm ${errors.fullName ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                    )}
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
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+254 712 345 678"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      School / Institution
                    </label>
                    <input
                      type="text"
                      name="school"
                      value={formData.school}
                      onChange={handleChange}
                      placeholder="Nairobi Academy"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm text-slate-700"
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
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none text-sm ${errors.message ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-red-600">{errors.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>

                {status && (
                  <div
                    className={`p-4 rounded-lg text-sm ${
                      status.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {status.message}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right Column — Support Options */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">How Can We Help?</h3>
              <p className="text-sm text-slate-500 mb-5">Choose the category that best describes your inquiry.</p>
            </div>

            {supportOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-5 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{option.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{option.description}</p>
                  </div>
                </div>
              );
            })}

            {/* Response Time */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-blue-200" />
                <span className="font-semibold text-sm">Average Response Times</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-100">Email inquiries</span>
                  <span className="font-medium">Within 24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">Phone support</span>
                  <span className="font-medium">Immediate</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">Technical issues</span>
                  <span className="font-medium">Within 4 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">Partnership inquiries</span>
                  <span className="font-medium">2–3 business days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Frequently Asked Questions</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Find quick answers to common questions about Noneaa, our platform features, and getting started.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? -1 : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span className="font-medium text-slate-900 text-sm pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <p className="text-sm text-slate-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Payment & Trust Section */}
        <section className="mt-24 pb-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Flexible Payment Options</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                We accept a variety of payment methods to make it easy for schools across Kenya and East Africa to get started with Noneaa. All transactions are processed securely.
              </p>
              <div className="flex flex-wrap gap-3">
                {paymentMethods.map((method, index) => (
                  <div
                    key={index}
                    className={`${method.color} border rounded-lg px-4 py-3 flex items-center gap-2`}
                  >
                    <CreditCard className="w-4 h-4 text-slate-600" />
                    <span className="font-medium text-slate-800 text-sm">{method.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <Shield className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-900 text-sm">Secure Payments</p>
                <p className="text-xs text-slate-500 mt-1">256-bit SSL encryption</p>
              </div>
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-900 text-sm">Instant Activation</p>
                <p className="text-xs text-slate-500 mt-1">Access within minutes</p>
              </div>
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-900 text-sm">150+ Schools</p>
                <p className="text-xs text-slate-500 mt-1">Trusted nationwide</p>
              </div>
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <GraduationCap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-900 text-sm">50K+ Students</p>
                <p className="text-xs text-slate-500 mt-1">Actively using Noneaa</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
