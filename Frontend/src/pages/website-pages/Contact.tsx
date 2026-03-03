import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Phone, Mail, Building2, ChevronDown, CreditCard
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Refined Card Component
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

// Contact Info Items
const contactInfo = [
  {
    icon: Phone,
    label: "Phone Support",
    value: "+254 111 276 271",
    subtext: "Mon-Fri, 8AM-6PM EAT",
    href: "tel:+254111276271"
  },
  {
    icon: Mail,
    label: "Email Support",
    value: "hello@noneaa.ke",
    subtext: "24/7 response",
    href: "mailto:hello@noneaa.ke"
  },
  {
    icon: MapPin,
    label: "Headquarters",
    value: "Westlands, Nairobi",
    subtext: "Visit our office",
    href: "#"
  },
  {
    icon: Building2,
    label: "Regional Offices",
    value: "3 locations across Kenya",
    subtext: "Mombasa, Kisumu, Nakuru",
    href: "#"
  }
];

const faqs = [
  {
    question: "How does Noneaa help with CBC assessment?",
    answer: "Noneaa provides comprehensive CBC assessment analysis tools that track learner competencies, generate detailed reports, and help teachers identify areas where students need additional support. Our platform aligns with Kenya's CBC curriculum requirements."
  },
  {
    question: "Is Noneaa available on mobile devices?",
    answer: "Yes, Noneaa is fully responsive and works seamlessly on mobile devices, tablets, and desktops. Teachers can access student data and manage assessments from anywhere."
  },
  {
    question: "How much does Noneaa cost?",
    answer: "Noneaa offers flexible pricing plans tailored to schools of all sizes. Contact our sales team for a custom quote based on your institution's needs and student count."
  },
  {
    question: "Do you provide training for teachers?",
    answer: "Absolutely! We provide comprehensive training programs, workshops, and ongoing support to ensure your teachers get the most out of Noneaa. Training can be conducted online or in-person."
  },
  {
    question: "Is my school data secure?",
    answer: "Yes, we use enterprise-grade encryption and comply with Kenya's Data Protection Act. All data is securely stored with regular backups and access controls."
  }
];

const paymentMethods = [
  { name: "Visa", color: "bg-blue-50" },
  { name: "Mastercard", color: "bg-red-50" },
  { name: "M-Pesa", color: "bg-green-50" },
  { name: "PayPal", color: "bg-blue-50" },
  { name: "Bank Transfer", color: "bg-slate-50" }
];

const subHeadingLines1 = [
  "We'd love to hear from you.",
  "Whether you're a school looking to implement the CBC system,",
  "a partner interested in collaboration, or a user needing support,",
  "the Noneaa team is ready to help."
];

const subHeadingLines2 = [
  "Reach out to us for inquiries, technical assistance,",
  "or partnership opportunities.",
  "Our mission is to simplify CBC management and empower",
  "schools across Kenya with reliable digital solutions."
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    school: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(0);

  const [typedMainText, setTypedMainText] = useState('');
  const fullMainText = 'Get in Touch';

  const [currentLine1, setCurrentLine1] = useState(0);
  const [typedSubText1, setTypedSubText1] = useState('');

  const [currentLine2, setCurrentLine2] = useState(0);
  const [typedSubText2, setTypedSubText2] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullMainText.length) {
        setTypedMainText(fullMainText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentLine1 >= subHeadingLines1.length) {
      setTimeout(() => setCurrentLine1(0), 2000);
      return;
    }

    let index = 0;
    const currentText = subHeadingLines1[currentLine1];
    const interval = setInterval(() => {
      if (index < currentText.length) {
        setTypedSubText1(currentText.slice(0, index + 1));
        index++;
      } else {
        setTimeout(() => {
          setCurrentLine1(currentLine1 + 1);
          setTypedSubText1('');
        }, 800);
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [currentLine1]);

  useEffect(() => {
    if (currentLine2 >= subHeadingLines2.length) {
      setTimeout(() => setCurrentLine2(0), 2000);
      return;
    }

    let index = 0;
    const currentText = subHeadingLines2[currentLine2];
    const interval = setInterval(() => {
      if (index < currentText.length) {
        setTypedSubText2(currentText.slice(0, index + 1));
        index++;
      } else {
        setTimeout(() => {
          setCurrentLine2(currentLine2 + 1);
          setTypedSubText2('');
        }, 800);
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [currentLine2]);

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.6,
      },
    }),
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const accessKey = import.meta.env.VITE_WEB3FORMS_KEY?.trim();

    if (!accessKey) {
      setStatus({
        type: 'error',
        message: 'Configuration error. Please email hello@noneaa.ke directly.'
      });
      setIsSubmitting(false);
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
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
          message: 'Your inquiry has been received. We\'ll respond within 24 hours.'
        });
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          school: '',
          message: ''
        });
      } else {
        setStatus({
          type: 'error',
          message: 'Something went wrong. Please try again.'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Network error. Please check your connection.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header/>
      <section className="relative pt-60 pb-32 overflow-hidden">
        {/* Animated Background Orbs */}
        <motion.div
          className="absolute top-10 right-10 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 4.5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-10 left-20 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{ duration: 5.5, repeat: Infinity, delay: 1.5 }}
        />

        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/Gemini_Generated_Image_jrstonjrstonjrst.png')"
          }}
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-slate-900/75" />

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-16 relative z-10">
          <div className="max-w-3xl">

            {/* Heading with Typewriter */}
            <motion.h1
              variants={textVariants}
              custom={0}
              initial="hidden"
              animate="visible"
              className="text-5xl font-bold text-white leading-tight mb-6"
            >
              {typedMainText}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 animate-pulse">|</span>
            </motion.h1>

            {/* Subheading - Line by Line */}
            <motion.div
              variants={textVariants}
              custom={1}
              initial="hidden"
              animate="visible"
              className="text-lg text-slate-300 mb-6 max-w-2xl leading-relaxed"
            >
              {subHeadingLines1.slice(0, currentLine1).map((line, i) => (
                <div key={i}>{line}</div>
              ))}
              <div>
                {typedSubText1}
                <span className="animate-pulse">|</span>
              </div>
            </motion.div>

            <motion.div
              variants={textVariants}
              custom={2}
              initial="hidden"
              animate="visible"
              className="text-lg text-slate-400 leading-relaxed"
            >
              {subHeadingLines2.slice(0, currentLine2).map((line, i) => (
                <div key={i}>{line}</div>
              ))}
              <div>
                {typedSubText2}
                <span className="animate-pulse">|</span>
              </div>
            </motion.div>

          </div>
        </div>

      </section>


      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-18 py-10">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Left - Form */}
          <div className="lg:col-span-7">
            <Card className="p-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Get in Touch</h1>
              <p className="text-slate-600 mb-8">
                Send us your inquiry and our team will respond within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    School Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="principal@school.ke"
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>

                {/* Phone & School */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+254 700 000 000"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      School Name
                    </label>
                    <input
                      type="text"
                      name="school"
                      value={formData.school}
                      onChange={handleChange}
                      placeholder="Your school name"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell us how we can help..."
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>

                {/* Status Messages */}
                {status && (
                  <div
                    className={`p-4 rounded-lg text-sm font-medium ${
                      status.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {status.message}
                  </div>
                )}
              </form>
            </Card>
          </div>

          {/* Right - Contact Info */}
          <div className="lg:col-span-5 space-y-5">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <a key={index} href={info.href} className="block group">
                  <Card className="p-5 hover:shadow-md transition-shadow h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-600 font-medium">{info.label}</div>
                        <div className="font-semibold text-slate-900 text-sm mt-1">{info.value}</div>
                        <div className="text-xs text-slate-500 mt-1">{info.subtext}</div>
                      </div>
                    </div>
                  </Card>
                </a>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-20 pt-12 border-t border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? -1 : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-600 transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Payment Methods Section */}
        <section className="mt-20 pt-12 border-t border-slate-200">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Accepted Payment Methods</h2>
            <p className="text-slate-600">We accept various payment methods for your convenience</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {paymentMethods.map((method, index) => (
                <div
                  key={index}
                  className={`${method.color} border border-slate-200 rounded-lg p-6 text-center hover:shadow-md transition-shadow`}
                >
                  <CreditCard className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="font-semibold text-slate-900 text-sm">{method.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
  
      </main>
      <Footer/>
    </div>
    
  );
}
