import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Shield, Users, Zap } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const plans = [
  {
    name: 'Starter',
    description: 'For small schools getting started with CBE tracking',
    monthlyPrice: 2500,
    annualPrice: 25000,
    studentLimit: 'Up to 200 students',
    features: [
      { name: 'Student progress tracking', included: true },
      { name: 'Basic competency reports', included: true },
      { name: 'Teacher dashboard', included: true },
      { name: 'Parent portal access', included: true },
      { name: 'Email support', included: true },
      { name: 'Custom branding', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'API access', included: false },
      { name: 'Priority support', included: false },
      { name: 'Multi-campus management', included: false },
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Professional',
    description: 'For growing schools that need advanced CBE tools',
    monthlyPrice: 7500,
    annualPrice: 75000,
    studentLimit: 'Up to 1,000 students',
    features: [
      { name: 'Student progress tracking', included: true },
      { name: 'Advanced competency reports', included: true },
      { name: 'Teacher dashboard', included: true },
      { name: 'Parent portal access', included: true },
      { name: 'Email & phone support', included: true },
      { name: 'Custom branding', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'API access', included: true },
      { name: 'Priority support', included: false },
      { name: 'Multi-campus management', included: false },
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'For large institutions and school groups',
    monthlyPrice: null,
    annualPrice: null,
    studentLimit: 'Unlimited students',
    features: [
      { name: 'Student progress tracking', included: true },
      { name: 'Advanced competency reports', included: true },
      { name: 'Teacher dashboard', included: true },
      { name: 'Parent portal access', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom branding', included: true },
      { name: 'Advanced analytics & BI', included: true },
      { name: 'Full API access', included: true },
      { name: 'Priority 24/7 support', included: true },
      { name: 'Multi-campus management', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const guarantees = [
  { icon: Shield, title: '30-Day Money Back', description: 'Not satisfied? Full refund within 30 days, no questions asked.' },
  { icon: Users, title: 'Free Onboarding', description: 'Every plan includes teacher training and data migration support.' },
  { icon: Zap, title: 'No Lock-In', description: 'Cancel anytime. Export your data in standard formats whenever you need.' },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
              Pricing
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              Choose the plan that fits your school. All plans include core CBE tracking features, free onboarding, and ongoing support.
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isAnnual ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-slate-800 rounded-full shadow transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
              <span className={`text-sm font-medium ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
                Annual <span className="text-emerald-600 font-semibold">(Save 17%)</span>
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  plan.popular
                    ? 'border-blue-600 shadow-lg shadow-blue-100 scale-[1.02]'
                    : 'border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  {plan.monthlyPrice !== null ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-slate-900">
                          KES {isAnnual ? Math.round(plan.annualPrice! / 12).toLocaleString() : plan.monthlyPrice.toLocaleString()}
                        </span>
                        <span className="text-slate-500 text-sm">/month</span>
                      </div>
                      {isAnnual && (
                        <p className="text-xs text-slate-500 mt-1">
                          Billed KES {plan.annualPrice!.toLocaleString()} annually
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-4xl font-bold text-slate-900">Custom</div>
                  )}
                  <p className="text-sm text-slate-600 mt-2">{plan.studentLimit}</p>
                </div>

                <button
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors mb-6 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="border-t border-slate-100 pt-6 space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature.name} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-slate-700' : 'text-slate-400'}`}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantees */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-8">
            {guarantees.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="text-center">
                  <div className="w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Not sure which plan is right for you?
          </h2>
          <p className="text-slate-600 mb-8">
            Book a free 15-minute consultation with our team. We'll help you choose the best plan based on your school's size, needs, and goals.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
          >
            Talk to Our Team
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
