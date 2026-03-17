import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EducationalResourcesPage from './Educationalresourcespage';
import {
  GraduationCap,
  ChevronDown,
  Menu,
  X,
  Users,
  TrendingUp,
  BookOpen,
  Clock,
  LayoutGrid,
  Target,
  ClipboardCheck,
  Upload,
  Quote,
  MapPin,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  ArrowRight,
  Sparkles,
  Star,
  CheckCircle,
  Play,
  Award,
  Target as TargetIcon,
  BarChart3,
  Lightbulb,
  Shield,
  Zap,
  Globe,
  Rocket,
  Heart,
  MousePointerClick,
  Brain,
  GitBranch,
  Network,
  LineChart,
  PieChart,
  Calendar,
  Bell,
  Search,
  Download,
  Cloud,
  Lock,
  Unlock,
  Eye,
  Users2,
  BookMarked,
  Notebook,
  School,
  BrainCircuit,
  Target as TargetVariant,
  CircuitBoard,
  Cpu,
  Database,
  Server,
  Workflow,
  GitPullRequest,
  Layers,
  Filter,
  Settings,
  UserPlus,
  FileText,
  Video,
  Music,
  Image,
  FileCode,
  FileSpreadsheet,
  Presentation,
  Code,
  Terminal,
  Palette,
  DollarSign,
} from 'lucide-react';
import heroVideo from '@/assets/teacher-teaching.mp4';
import heroBg from '@/assets/hero-bg.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, useAnimation, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

const roles = ['Student', 'Teacher', 'Parent', 'Admin'] as const;
type Role = typeof roles[number];

const stats = [
  {
    icon: Users,
    value: '150+',
    label: 'PARTNER SCHOOLS',
    change: '+12%',
    trend: 'up',
  },
  {
    icon: TrendingUp,
    value: '92%',
    label: 'MASTERY GROWTH RATE',
    change: '+8%',
    trend: 'up',
  },
  {
    icon: GraduationCap,
    value: '1.2M',
    label: 'SUBMISSIONS EVALUATED',
    change: '+23%',
    trend: 'up',
  },
  {
    icon: Clock,
    value: '4h',
    label: 'AVG. FEEDBACK TIME',
    change: '-35%',
    trend: 'down',
  },
];

const tools = [
  {
    icon: LayoutGrid,
    title: 'Personal Dashboard',
    description: 'Get a high-level overview of your current goals, notifications, and immediate tasks.',
    gradient: 'from-blue-500 to-cyan-500',
    features: ['Real-time updates', 'Custom widgets', 'Progress tracking'],
  },
  {
    icon: BookOpen,
    title: 'Curriculum Explorer',
    description: 'Navigate through strands and sub-strands to understand learning outcomes and mastery requirements.',
    gradient: 'from-emerald-500 to-teal-500',
    features: ['Interactive maps', 'Learning paths', 'Resource library'],
  },
  {
    icon: ClipboardCheck,
    title: 'Assessments',
    description: 'Review detailed rubrics, complete assignments, and receive actionable feedback from teachers.',
    gradient: 'from-purple-500 to-pink-500',
    features: ['AI-powered grading', 'Rubric builder', 'Peer review'],
  },
  {
    icon: Upload,
    title: 'Evidence Upload',
    description: 'Easily submit projects, videos, and documents to prove your mastery of specific competencies.',
    gradient: 'from-orange-500 to-red-500',
    features: ['Multi-format support', 'Cloud storage', 'Version control'],
  },
];

const steps = [
  {
    number: '01',
    title: 'Set Clear Outcomes',
    description: 'Every lesson is mapped to specific competencies, so students know exactly what they need to master.',
    icon: Target,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    number: '02',
    title: 'Personalized Pace',
    description: 'Students move forward when they prove mastery, ensuring no one is left behind or held back.',
    icon: Zap,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    number: '03',
    title: 'Evidence-Based Growth',
    description: 'Real-world projects and assessments provide a rich portfolio of what a student can actually do.',
    icon: Brain,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
];

const workflows = [
  {
    icon: Users,
    title: 'Identify Goals',
    description: 'Students view their competency map and select their next learning target.',
    link: { text: 'View Map', href: '/curriculum' },
    gradient: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    features: ['Competency mapping', 'Goal setting', 'Progress visualization'],
  },
  {
    icon: BookOpen,
    title: 'Engage & Submit',
    description: 'Access resources and upload evidence of mastery directly to the teacher.',
    link: { text: 'Upload Evidence', href: '/upload' },
    gradient: 'bg-gradient-to-br from-blue-400 to-blue-600',
    features: ['Resource library', 'Submission portal', 'File management'],
  },
  {
    icon: ClipboardCheck,
    title: 'Review Mastery',
    description: 'Teachers evaluate evidence against rubrics and update progress heatmaps.',
    link: { text: 'See Progress', href: '/progress' },
    gradient: 'bg-gradient-to-br from-purple-400 to-purple-600',
    features: ['Rubric scoring', 'Feedback tools', 'Progress tracking'],
  },
];

const testimonials = [
  {
    quote: "Nonea has completely transformed how we track student growth. The heatmaps give us a level of insight we never had with traditional grading.",
    author: 'Jere Jenkins',
    role: 'Principal, Oakwood Academy',
    avatar: 'SJ',
    rating: 5,
    schoolLogo: '🏫',
  },
  {
    quote: "As a parent, I finally understand exactly what my child is learning. The clarity provided by the sub-strands and outcomes is incredible.",
    author: 'John Johnte',
    role: 'Parent of 7th Grader',
    avatar: 'DM',
    rating: 5,
    schoolLogo: '👨‍👩‍👧',
  },
];

const platformLinks = [
  { label: 'Curriculum Management', href: '/curriculum', icon: BookMarked },
  { label: 'Progress Tracking', href: '/progress', icon: LineChart },
  { label: 'Assessment Tools', href: '/assessments', icon: ClipboardCheck },
  { label: 'Analytics Dashboard', href: '/analytics', icon: PieChart },
  { label: 'Resource Library', href: '/resources', icon: Database },
];

const resourceLinks = [
  { label: 'CBE Methodology', href: '/methodology', icon: BrainCircuit },
  { label: 'Teacher Resources', href: '/teacher/resources', icon: Users2 },
  { label: 'Parent Guides', href: '/guides', icon: Notebook },
  { label: 'Success Stories', href: '/stories', icon: Award },
  { label: 'System Status', href: '/status', icon: Server },
];

const AnimatedCounter = ({ value, duration = 2000 }: { value: string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
  const suffix = value.replace(/[0-9.]/g, '');

  useEffect(() => {
    let start = 0;
    const end = numericValue;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [numericValue, duration]);

  return (
    <span className="font-bold">
      {suffix === '%' ? count.toFixed(0) : count.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      {suffix}
    </span>
  );
};

const FloatingElement = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: [0, -10, 0], opacity: 1 }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    }}
  >
    {children}
  </motion.div>
);

const GlowingCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('relative group', className)}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-500 group-hover:duration-200 animate-pulse" />
    <div className="relative bg-card rounded-xl p-8 border border-border/50">
      {children}
    </div>
  </div>
);

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
    }> = [];

    const colors = ['#60a5fa', '#34d399', '#a855f7', '#f59e0b'];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.y < 0) particle.y = canvas.height;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-20"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role>('Student');
  const [videoError, setVideoError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const toolsRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const isStatsInView = useInView(statsRef, { once: true });
  const isToolsInView = useInView(toolsRef, { once: true });

  const handleRoleClick = (role: Role) => {
    if (role === 'Student') {
      navigate('/student/learning-materials');
    } else if (role === 'Teacher') {
      navigate('/teacher/resources');
    } else if (role === 'Admin') {
      navigate('/admin/register-school');
    } else {
      setSelectedRole(role);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
      <ParticleBackground />

      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Enhanced Navbar with Glass Morphism */}
      <Header/>
      
      {/* Hero Section with Enhanced Effects */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background with Gradient Overlay */}
        <div className="absolute inset-0">
          {!videoError ? (
            <motion.video
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 2 }}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setVideoError(true)}
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={heroVideo} type="video/mp4" />
            </motion.video>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-emerald-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-slate-900/70 to-emerald-900/70" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/20 to-background/80" />
        </div>

        {/* Floating Elements */}
        <FloatingElement delay={0}>
          <div className="absolute top-20 left-10 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30" />
        </FloatingElement>
        <FloatingElement delay={0.2}>
          <div className="absolute top-40 right-20 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
        </FloatingElement>
        <FloatingElement delay={0.4}>
          <div className="absolute bottom-40 left-1/4 w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30" />
        </FloatingElement>

        {/* Content */}
        <div className="relative container mx-auto px-4 lg:px-8 py-20">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={isHeroInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white/90">Leading CBE Platform</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.2] mb-6">
              National Optimized Network for Education{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-blue-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Achievement & Administration
                </span>
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 blur-xl" />
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl leading-relaxed">
              Track progress, manage curriculum, and achieve excellence through personalized pathways.
            </p>

            {/* Role Selector with Glow Effect */}
            <div className="mb-10">
              <p className="text-sm font-medium text-white/70 mb-4 tracking-wider flex items-center gap-2">
                <MousePointerClick className="w-4 h-4" />
                SELECT YOUR ROLE:
              </p>
              <div className="flex flex-wrap gap-3">
                {roles.map((role) => (
                  <motion.button
                    key={role}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRoleClick(role)}
                    className={cn(
                      "relative px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                      selectedRole === role
                        ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg shadow-blue-500/30"
                        : "bg-white/10 backdrop-blur-sm text-white/90 hover:bg-white/20"
                    )}
                  >
                    {role}
                    {selectedRole === role && (
                      <motion.div
                        layoutId="role-indicator"
                        className="absolute inset-0 rounded-xl border-2 border-white/30"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* CTA Buttons with Animation */}
            <div className="flex flex-wrap gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 shadow-xl"
                  asChild
                >
                  <Link to="/login" className="flex items-center gap-3">
                    <Rocket className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                    <span className="font-semibold">Explore Dashboard</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="group bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white px-8"
                  asChild
                >
                  <Link to="#demo" className="flex items-center gap-3">
                    <Play className="w-5 h-5" />
                    <span>Watch Demo</span>
                  </Link>
                </Button>
              </motion.div>
            </div>

            {/* Trust Badges */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={isHeroInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.6 }}
              className="mt-12 pt-8 border-t border-white/20"
            >
              <p className="text-sm text-white/70 mb-4">Trusted by leading educational institutions</p>
              <div className="flex flex-wrap items-center gap-6 opacity-70">
                {['Google for Education', 'Microsoft Education', 'Apple Distinguished Schools', 'IB World Schools'].map((name) => (
                  <div key={name} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-white/90 text-sm">{name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>

      </section>

      {/* Quick Access Tools - Enhanced */}
      <section ref={toolsRef} className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/10 to-transparent" />
        <div className="container mx-auto px-4 lg:px-8 relative">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={isToolsInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 mb-4">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-primary">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need in{' '}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                One Platform
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Streamline your competency-based education workflow with our comprehensive suite of tools.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ y: 50, opacity: 0 }}
                  animate={isToolsInView ? { y: 0, opacity: 1 } : {}}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="relative group"
                >
                  <GlowingCard>
                    <div className={`absolute top-0 right-0 w-16 h-16 rounded-full bg-gradient-to-br ${tool.gradient} blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`} />
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-6 relative`}>
                      <Icon className="w-8 h-8 text-white" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">{tool.description}</p>
                    <div className="space-y-2">
                      {tool.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full mt-6 group-hover:bg-secondary/50 transition-colors"
                      asChild
                    >
                      <Link to={`/${tool.title.toLowerCase().replace(' ', '-')}`}>
                        Explore
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </GlowingCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Animated Stats Section */}
              <section className="py-20 md:py-32 bg-blue-600">
                      <div className="max-w-6xl mx-auto px-6">
                        <div className="grid md:grid-cols-4 gap-8 text-center text-white">
                          {[
                            { number: '150+', label: 'Schools Transformed' },
                            { number: '50K+', label: 'Students Impacted' },
                            { number: '98%', label: 'Teacher Satisfaction' },
                            { number: '24/7', label: 'System Uptime' }
                          ].map((stat, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              viewport={{ once: true }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className="text-5xl font-bold mb-2">
                                {stat.number}
                              </div>
                              <p className="text-base text-blue-100">{stat.label}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </section>

      {/* Foundation Section with Interactive Cards */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-4">
              <Target className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-primary">Our Methodology</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              The Foundation of{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Mastery Learning
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our CBE system shifts the focus from "time spent in class" to "demonstrated mastery of skills."
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                  className="relative group"
                >
                  <div className={`absolute inset-0 ${step.bg} rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
                  <div className="relative bg-card rounded-2xl p-8 border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:border-primary/30">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-14 h-14 rounded-xl ${step.bg} flex items-center justify-center`}>
                        <Icon className={`w-7 h-7 ${step.color}`} />
                      </div>
                      <div className="text-6xl font-bold text-muted/30">{step.number}</div>
                    </div>
                    <h3 className={`text-2xl font-bold ${step.color} mb-4`}>{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                    <div className="mt-6 pt-6 border-t border-border/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ArrowRight className="w-4 h-4" />
                        <span>Learn more about this step</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      
      {/* Enhanced Testimonials Section */}
      <EducationalResourcesPage/>

      {/* Enhanced CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-emerald-500/5" />
        <div className="container mx-auto px-4 lg:px-8 relative">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto"
          >
            <div className="bg-gradient-to-br from-card via-card to-card/90 rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Left - Content */}
                <div className="p-12 md:p-16">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 mb-6">
                    <Rocket className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-primary">Get Started Today</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                    Ready to Transform{' '}
                    <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                      Your School?
                    </span>
                  </h2>
                  <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                    Join hundreds of schools moving towards a mastery-first future with Nonea.
                    Start your journey today with a personalized demo.
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground">School Portals</h4>
                      <Button size="lg" className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white" asChild>
                        <Link to="/login?role=student">
                          <GraduationCap className="w-5 h-5 mr-2" />
                          Student Login
                        </Link>
                      </Button>
                      <Button size="lg" variant="outline" className="w-full" asChild>
                        <Link to="/login?role=teacher">
                          <Users className="w-5 h-5 mr-2" />
                          Teacher Portal
                        </Link>
                      </Button>
                      <Button size="lg" variant="outline" className="w-full" asChild>
                        <Link to="/login?role=parent">
                          <Users2 className="w-5 h-5 mr-2" />
                          Parent Access
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="bg-secondary/30 rounded-xl p-6 border">
                      <h4 className="font-semibold text-foreground mb-3">Quick Actions</h4>
                      <div className="space-y-3">
                        <Button variant="secondary" className="w-full" asChild>
                          <Link to="/demo">
                            <Video className="w-4 h-4 mr-2" />
                            Watch Demo
                          </Link>
                        </Button>
                        <Button variant="secondary" className="w-full" asChild>
                          <Link to="/pricing">
                            <DollarSign className="w-4 h-4 mr-2" />
                            View Pricing
                          </Link>
                        </Button>
                        <Button variant="secondary" className="w-full" asChild>
                          <Link to="/contact">
                            <Mail className="w-4 h-4 mr-2" />
                            Contact Sales
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <span>Secure & Compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span>Global Support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>24/7 Assistance</span>
                    </div>
                  </div>
                </div>
                
                {/* Right - Illustration/Form */}
                <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-emerald-500/10 p-12 md:p-16 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-foreground mb-4">Request a Personalized Demo</h3>
                    <p className="text-muted-foreground mb-8">
                      See how Nonea fits your school's unique curriculum needs
                    </p>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Your Name</label>
                        <input
                          type="text"
                          placeholder="John Smith"
                          className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">School Email</label>
                        <input
                          type="email"
                          placeholder="name@school.edu"
                          className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">School Name</label>
                        <input
                          type="text"
                          placeholder="Oakwood Academy"
                          className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white" size="lg">
                        Schedule Demo
                        <Calendar className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-border/50">
                      <p className="text-sm text-muted-foreground text-center">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary hover:underline font-medium">
                          Sign in here
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <Footer/>
     
    </div>
  );
}
