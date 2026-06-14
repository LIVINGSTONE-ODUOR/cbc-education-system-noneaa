import { motion } from 'framer-motion';
import { Star, Quote, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const testimonials = [
  {
    name: 'Mary Wanjiku',
    role: 'Principal',
    school: 'Greenfield Academy, Nairobi',
    quote: "Noneaa transformed how we track student competencies. Our teachers spend 60% less time on manual reporting and can focus on what matters — teaching. The parent portal has also improved communication significantly.",
    rating: 5,
    metric: { value: '60%', label: 'Less time on reports' },
  },
  {
    name: 'James Odhiambo',
    role: 'Head Teacher',
    school: 'Lakeview Primary, Kisumu',
    quote: "Transitioning to CBC was overwhelming until we found Noneaa. The platform made it straightforward — from setting up learning areas to generating term reports. Our teachers adapted within the first week of training.",
    rating: 5,
    metric: { value: '1 week', label: 'Teacher onboarding time' },
  },
  {
    name: 'Amina Hassan',
    role: 'School Administrator',
    school: 'Coastal Junior School, Mombasa',
    quote: "We manage 800+ students across three streams and Noneaa handles it effortlessly. The analytics dashboard helps us identify students who need extra support before they fall behind. It's been a game-changer.",
    rating: 5,
    metric: { value: '800+', label: 'Students managed seamlessly' },
  },
  {
    name: 'Peter Kamau',
    role: 'ICT Director',
    school: 'Highlands School Group, Nakuru',
    quote: "As a multi-campus institution, we needed a platform that could unify our data across 4 branches. Noneaa's enterprise plan gave us exactly that — centralized reporting with per-campus breakdowns. The API integration with our existing systems was smooth.",
    rating: 5,
    metric: { value: '4', label: 'Campuses unified' },
  },
  {
    name: 'Grace Muthoni',
    role: 'Grade 4 Teacher',
    school: 'Sunrise Academy, Thika',
    quote: "I used to dread end-of-term reporting. Now I update competencies as I teach, and the reports generate themselves. The formative assessment tools help me understand each child's progress in real time.",
    rating: 5,
    metric: { value: '98%', label: 'Teacher satisfaction' },
  },
  {
    name: 'David Kiprop',
    role: 'Education Officer',
    school: 'Rift Valley County Education Board',
    quote: "We recommended Noneaa to schools in our county after seeing the impact at pilot institutions. The platform aligns perfectly with KICD guidelines and makes compliance reporting straightforward for school heads.",
    rating: 5,
    metric: { value: '35', label: 'Schools recommended' },
  },
];

const stats = [
  { value: '150+', label: 'Schools Using Noneaa' },
  { value: '50,000+', label: 'Students Tracked' },
  { value: '98%', label: 'Teacher Satisfaction' },
  { value: '4.9/5', label: 'Average Rating' },
];

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-white">
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
              Testimonials
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Trusted by Schools Across Kenya
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Hear from principals, teachers, and administrators who are using Noneaa to simplify competency-based education management.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-10 bg-blue-600">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold">{stat.value}</div>
                <div className="text-sm text-blue-100 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="border border-slate-200 rounded-xl p-6 flex flex-col hover:shadow-md transition-shadow"
              >
                <Quote className="w-8 h-8 text-blue-100 mb-4" />
                <p className="text-sm text-slate-700 leading-relaxed flex-1 mb-5">
                  "{testimonial.quote}"
                </p>

                {/* Metric */}
                <div className="bg-blue-50 rounded-lg px-4 py-3 mb-5">
                  <div className="text-xl font-bold text-blue-700">{testimonial.metric.value}</div>
                  <div className="text-xs text-blue-600">{testimonial.metric.label}</div>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{testimonial.name}</div>
                    <div className="text-xs text-slate-500">{testimonial.role}, {testimonial.school}</div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex gap-0.5 mt-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Ready to Join 150+ Schools?
          </h2>
          <p className="text-slate-600 mb-8">
            Start your free trial today and see why schools across Kenya trust Noneaa for CBE management.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/get-started"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
