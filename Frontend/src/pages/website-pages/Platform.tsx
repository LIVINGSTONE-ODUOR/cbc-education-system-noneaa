import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTypewriter } from '@/hooks/use-typewriter';
import { 
  Check, 
  MessageCircle,
  Play,
  ArrowRight,
  Award,
  Shield,
  Zap,
  BrainCircuit,
  GraduationCap,
  LineChart,
  BookMarked,
  Star,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  FileText,
  Calendar,
  Bell,
  BarChart3,
  Video,
  Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

// Constants & Data
const FEATURES = [
  { icon: BookMarked, text: 'CBC Curriculum Tools', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: BrainCircuit, text: 'Mastery Tracking', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Users, text: 'Multi-Portal Access', color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: LineChart, text: 'Real-time Analytics', color: 'text-orange-600', bg: 'bg-orange-50' },
];

const BENEFITS = [
  { icon: Check, text: 'CBC competency tracking' },
  { icon: Check, text: 'Automated progress reports' },
  { icon: Check, text: 'Parent-teacher communication portal' },
  { icon: Check, text: 'Student mastery analytics' },
  { icon: Check, text: 'Digital portfolio management' },
  { icon: Check, text: 'Strand and sub-strand monitoring' },
];

const CORE_CAPABILITIES = [
  {
    icon: Calendar,
    title: 'Smart Timetabling',
    description: 'AI-powered automated timetable generation that respects teacher availability and resource constraints.'
  },
  {
    icon: FileText,
    title: 'Assessment Management',
    description: 'Create, distribute, and grade assessments aligned with CBC competency framework.'
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Deep insights into student performance with strand-level analytics and predictive insights.'
  },
  {
    icon: Bell,
    title: 'Communication Hub',
    description: 'Bulk SMS, email notifications, and in-app messaging to keep all stakeholders connected.'
  },
  {
    icon: Users,
    title: 'Multi-Role Portals',
    description: 'Dedicated dashboards for teachers, students, parents, and administrators with role-based access.'
  },
  {
    icon: TrendingUp,
    title: 'Learning Progress Tracking',
    description: 'Monitor individual and class-wide progress on learning outcomes and competencies in real-time.'
  }
];

const PRICING_PLANS = {
  starter: {
    name: 'Starter Plan',
    subtitle: 'Perfect for small to medium schools',
    features: [
      'Up to 500 students',
      'CBC Assessment Analysis',
      'Smart Timetable Generation',
      'Bulk SMS (500 messages/month)',
      'Parent Portal Access',
      'Mobile App Access',
      'Email Support'
    ]
  },
  growth: {
    name: 'Growth Plan',
    subtitle: 'For growing schools and institutions',
    popular: true,
    features: [
      'Up to 2000 students',
      'Advanced CBC Analytics',
      'AI-Powered Timetabling',
      'Unlimited Bulk SMS',
      'Advanced Parent Portal',
      'Priority Mobile App Features',
      '24/7 Phone Support',
      'Custom Integrations',
      'Data Export & Backup'
    ]
  },
  enterprise: {
    name: 'Enterprise Plan',
    subtitle: 'For large schools and education networks',
    features: [
      'Unlimited students',
      'Advanced CBC Analytics',
      'AI-Powered Timetabling',
      'Unlimited Bulk SMS',
      'Advanced Parent Portal',
      'Priority Mobile App Features',
      '24/7 Dedicated Support',
      'Custom Integrations',
      'Data Export & Backup',
      'Multi-school Management',
      'API Access'
    ]
  }
};

const PARTNER_SCHOOLS = [
  { name: "Shema School", logo: "https://images.unsplash.com/photo-1562774053-701939374585?w=200&h=200&fit=crop" },
  { name: "Darnen House", logo: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=200&h=200&fit=crop" },
  { name: "Royal Academy", logo: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=200&h=200&fit=crop" },
  { name: "Ridges Academy", logo: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop" },
  { name: "Mwiki High School", logo: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&h=200&fit=crop" },
  { name: "Shimba Hills School", logo: "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=200&h=200&fit=crop" },
  { name: "Hope Academy", logo: "https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?w=200&h=200&fit=crop" },
  { name: "Heri School", logo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop" },
  { name: "Nexa International", logo: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=200&h=200&fit=crop" },
  { name: "Green Valley School", logo: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop" },
  { name: "St. Mary's Academy", logo: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=200&h=200&fit=crop" },
  { name: "Brighten Academy", logo: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=200&h=200&fit=crop" },
];

const STATS = {
  hero: [
    { number: '250+', label: 'Schools' },
    { number: '45K+', label: 'Students' },
    { number: '98%', label: 'Satisfaction' },
  ],
  trust: [
    { number: '250+', label: 'Partner Schools', gradient: 'from-blue-600 to-blue-700' },
    { number: '47+', label: 'Counties', gradient: 'from-teal-600 to-teal-700' },
    { number: '45K+', label: 'Active Students', gradient: 'from-emerald-600 to-emerald-700' },
    { number: '5+', label: 'Years Experience', gradient: 'from-blue-600 to-teal-600' },
  ]
};

const TESTIMONIALS = [
  {
    quote: "Noneaa has transformed how we track CBC competencies. The platform is intuitive and saves us countless hours.",
    author: "Mrs. Jane Kamau",
    role: "Headteacher, Green Valley Academy",
    rating: 5
  },
  {
    quote: "Parent engagement has increased by 70% since we started using Noneaa's communication features.",
    author: "Mr. David Otieno",
    role: "Principal, Hope International School",
    rating: 5
  },
  {
    quote: "The analytics dashboard gives us insights we never had before. We can now intervene early when students struggle.",
    author: "Dr. Sarah Mwangi",
    role: "Academic Director, Royal Academy",
    rating: 5
  }
];

// Reusable Components
const PlatformHeroContent = () => {
  const headingText = "Kenya's Leading CBC Management Platform";
  const typedHeading = useTypewriter({
    text: headingText,
    speed: 30,
    delay: 300,
    repeat: false,
  });

  const descriptionText = "Noneaa is an all-in-one Competency-Based Curriculum platform designed to streamline CBC implementation, enhance learning outcomes, and simplify competency tracking for Kenyan schools.";
  const typedDescription = useTypewriter({
    text: descriptionText,
    speed: 15,
    delay: 1600,
    repeat: true,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative z-10"
    >
      {/* Badge */}
      <motion.div
        variants={itemVariants}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg mb-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-4 h-4" />
        </motion.div>
        <span className="text-sm font-bold">Why Choose Noneaa</span>
      </motion.div>

      {/* Animated Heading with Typewriter Effect */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {typedHeading}
          </motion.span>
          <motion.span
            className="inline-block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <span className="animate-pulse text-emerald-400 ml-1">|</span>
          </motion.span>
        </h1>
      </motion.div>

      {/* Description with typing effect */}
      <motion.div variants={itemVariants} className="mb-8">
        <p className="text-lg text-slate-200 leading-relaxed">
          {typedDescription}
          <motion.span
            className="inline-block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="animate-pulse text-cyan-400 ml-1">|</span>
          </motion.span>
        </p>
      </motion.div>

      {/* Animated Buttons */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap gap-4"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/50 transition-all"
          >
            Get Started Free
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="ml-2"
            >
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </Button>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            size="lg" 
            variant="outline" 
            className="border-2 border-white text-white hover:bg-white/10 hover:border-cyan-400 transition-all"
          >
            <Play className="w-4 h-4 mr-2" />
            Watch Demo
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const SchoolNode = ({ logo, name, delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, type: "spring", stiffness: 150 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group cursor-pointer"
    >
      <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-white dark:bg-slate-800 shadow-xl border-4 border-white dark:border-slate-700 flex items-center justify-center transform transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
        {logo ? (
          <img src={logo} alt={name || "School badge"} className="w-full h-full object-contain p-2" />
        ) : (
          <GraduationCap className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-blue-600 dark:text-blue-400" />
        )}
      </div>
      
      <div className="absolute inset-0 rounded-full bg-blue-400/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
      
      {name && (
        <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 transition-all duration-200 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
          <div className="bg-slate-900 dark:bg-slate-700 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
            <div className="font-semibold">{name}</div>
          </div>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45"></div>
        </div>
      )}
    </motion.div>
  );
};

const FeatureCard = ({ icon: Icon, text, color, bg, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.6 + index * 0.1 }}
    className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-md hover:shadow-xl transition-all group cursor-pointer border border-border/50"
  >
    <div className={`p-2 rounded-lg ${bg} group-hover:scale-110 transition-transform`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <span className="font-semibold text-slate-900 dark:text-white text-sm">{text}</span>
  </motion.div>
);

const StatCard = ({ stat, index, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: delay + index * 0.1 }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="group"
  >
    <div className="relative p-6 md:p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      <div className="relative">
        <div className={`text-4xl md:text-5xl font-extrabold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2`}>
          {stat.number}
        </div>
        <div className="text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium">
          {stat.label}
        </div>
      </div>
    </div>
  </motion.div>
);

const PricingCard = ({ plan, planKey, hoveredCard, setHoveredCard, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg ${plan.popular ? 'border-3 border-orange-400' : 'border-2 border-slate-200 dark:border-slate-700'} p-8 relative transition-all duration-300 transform ${
      hoveredCard === planKey ? 'scale-105 shadow-2xl' : ''
    }`}
    onMouseEnter={() => setHoveredCard(planKey)}
    onMouseLeave={() => setHoveredCard(null)}
  >
    {plan.popular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <span className="bg-gradient-to-r from-orange-400 to-red-400 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2">
          <Star className="w-4 h-4 fill-white" />
          Most Popular
        </span>
      </div>
    )}

    <div className={`mb-6 ${plan.popular ? 'mt-2' : ''}`}>
      <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
      <p className="text-slate-600 dark:text-slate-400">{plan.subtitle}</p>
    </div>

    <div className="mb-8">
      <div className="text-5xl font-bold text-emerald-500 mb-1">Get A Quote</div>
      <p className="text-slate-500 dark:text-slate-400">per term</p>
    </div>

    <ul className="space-y-4 mb-8">
      {plan.features.map((feature, index) => (
        <motion.li 
          key={index} 
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.1 + index * 0.05 }}
          className="flex items-start gap-3"
        >
          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <span className="text-slate-700 dark:text-slate-300">{feature}</span>
        </motion.li>
      ))}
    </ul>

    <Button className={`w-full ${plan.popular ? 'bg-gradient-to-r from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500' : 'bg-emerald-500 hover:bg-emerald-600'} text-white font-semibold py-6 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-lg`}>
      Get a Quote
    </Button>
  </motion.div>
);

// Main Component
export default function NoneaaPlatformPage() {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
      <Header/>
      
      {/* Hero Section */}
<section className="relative pt-60 pb-32 overflow-hidden">

  {/* Background Image */}
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{
      backgroundImage: "url('/Gemini_Generated_Image_jrstonjrstonjrst.png')"
    }}
  />

  {/* Animated gradient overlay */}
  <motion.div
    className="absolute inset-0 bg-slate-900/75"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1 }}
  />

  {/* Animated Decorative elements */}
  <motion.div
    className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.6, 0.3],
    }}
    transition={{ duration: 8, repeat: Infinity }}
  />
  <motion.div
    className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"
    animate={{
      scale: [1.2, 1, 1.2],
      opacity: [0.4, 0.2, 0.4],
    }}
    transition={{ duration: 10, repeat: Infinity, delay: 1 }}
  />

  {/* Main Content */}
  <div className="container mx-auto px-6 lg:px-16 relative z-10">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      
      {/* LEFT SIDE CONTENT */}
      <PlatformHeroContent />

      {/* RIGHT SIDE IMAGE */}
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="relative">
        <img src="/anoter.png" alt="Dashboard Preview" className="rounded-xl shadow-2xl" />
      </motion.div>

    </div>
  </div>
</section>


      {/* Core Capabilities Section - NEW */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Comprehensive{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                School Management Tools
              </span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Everything you need to run a modern, efficient school in one integrated platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CORE_CAPABILITIES.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{capability.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{capability.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ministry Approved CTA Section */}
      <section className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-400 to-emerald-500 dark:from-blue-600 dark:to-emerald-700 p-12 lg:p-20 flex flex-col justify-center relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32 blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-32 translate-y-32 blur-3xl"></div>
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30 mb-6"
              >
                <Award className="w-4 h-4" />
                <span className="text-sm font-bold">Ministry Approved</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight"
              >
                Designed for Kenya's CBC Implementation
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-lg text-white/90 mb-8 leading-relaxed"
              >
                Rated as the top CBC management system in Kenya, we've earned our reputation through successful implementation in schools nationwide and positive feedback from educators, parents, and education officials.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50 border-2 border-white shadow-xl hover:shadow-2xl transition-all text-lg px-8 py-6 group">
                  Book A Demo
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-white/20"
              >
                {STATS.hero.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-extrabold text-white mb-1">{stat.number}</div>
                    <div className="text-sm text-white/80">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[600px] lg:h-auto"
          >
            <img src="/Gemini_Generated_Image_jrstonjrstonjrst.png" alt="Kenyan students learning" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent"></div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[600px] lg:h-auto"
          >
            <img src="/Gemini_Generated_Image_2iv0jt2iv0jt2iv0.png" alt="African students in classroom" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-l from-emerald-500/20 to-transparent"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 p-12 lg:p-20 flex flex-col justify-center relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 translate-y-32 blur-3xl"></div>
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30 mb-6"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-bold">Trusted Platform</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight"
              >
                Complete CBC Management Solution
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-lg text-white/90 mb-8 leading-relaxed"
              >
                From competency tracking to portfolio management, handle every aspect of CBC implementation efficiently with our comprehensive suite of tools designed specifically for Kenyan schools.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="space-y-4 mb-8"
              >
                {BENEFITS.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-3 text-white"
                  >
                    <div className="p-1 bg-white/20 rounded-full">
                      <Check className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-medium">{benefit.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.2 }}
              >
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-xl hover:shadow-2xl transition-all text-lg px-8 py-6 group">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section - NEW */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Loved by{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Educators Nationwide
              </span>
            </h2>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">
              See what school leaders have to say about their experience with Noneaa
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/90 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                <div className="border-t border-white/20 pt-4">
                  <p className="text-white font-semibold">{testimonial.author}</p>
                  <p className="text-slate-300 text-sm">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By Schools Section */}


      {/* Pricing Section - NOW WITH 3 TIERS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg mb-6"
            >
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-bold">Simple Pricing</span>
            </motion.div>

            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 tracking-tight">
              Affordable Pricing for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Kenyan Schools
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choose the plan that works best for your school's needs and budget
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
            <PricingCard plan={PRICING_PLANS.starter} planKey="starter" hoveredCard={hoveredCard} setHoveredCard={setHoveredCard} delay={0.2} />
            <PricingCard plan={PRICING_PLANS.growth} planKey="growth" hoveredCard={hoveredCard} setHoveredCard={setHoveredCard} delay={0.3} />
            <PricingCard plan={PRICING_PLANS.enterprise} planKey="enterprise" hoveredCard={hoveredCard} setHoveredCard={setHoveredCard} delay={0.4} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <p className="text-slate-600 text-lg">
              All plans include M-Pesa payment options and free setup assistance
            </p>
          </motion.div>
        </div>
      </section>
      
      <Footer/>
    </div>
  );
}