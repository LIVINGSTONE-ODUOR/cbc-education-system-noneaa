import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import Stats from '@/components/Stats';
import {
  HelpCircle,
  MessageSquare,
  BookOpen,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  Send,
  Search,
  Download,
  ChevronRight,
  Users,
  FileText,
  Calendar,
  Video,
  Shield,
  Zap,
  Star,
  ArrowRight,
  Sparkles,
  Server,
  Target,
  Terminal,
  Headphones,
  FileQuestion,
  Video as VideoIcon,
  Globe,
  MessageCircle,
  Check,
  X,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Enhanced Data Structures
const supportFeatures = [
  {
    icon: Clock,
    title: "Fast Response",
    description: "Average response time under 2 minutes",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    icon: Shield,
    title: "Secure Support",
    description: "Enterprise-grade security & privacy",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  {
    icon: Users,
    title: "Expert Team",
    description: "Certified education specialists",
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  {
    icon: Globe,
    title: "24/7 Available",
    description: "Round-the-clock emergency support",
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  }
];

const faqSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Sparkles,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    questions: [
      {
        question: "How do I create my first classroom?",
        answer: "Navigate to the Classroom section in your dashboard, click 'Create New Classroom', and follow the guided setup wizard. You can add students, set up assignments, and customize settings.",
        tags: ['classroom', 'setup', 'beginner']
      },
      {
        question: "How do I enroll students?",
        answer: "Go to the Students section, click 'Add Student', and fill in the required information. You can import multiple students via CSV or connect with your school's SIS.",
        tags: ['students', 'enrollment', 'import']
      },
      {
        question: "What are the system requirements?",
        answer: "Noneaa works on any modern browser (Chrome, Firefox, Safari, Edge) with an internet connection. Mobile apps are available for iOS and Android.",
        tags: ['technical', 'requirements']
      }
    ]
  },
  {
    id: 'teaching',
    title: 'Teaching & Learning',
    icon: BookOpen,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    questions: [
      {
        question: "How do students submit assignments?",
        answer: "Students access their dashboard, navigate to the Assignments tab, and upload their work. You'll receive notifications when assignments are submitted.",
        tags: ['assignments', 'submissions']
      },
      {
        question: "Can I track student progress in real-time?",
        answer: "Yes, the Analytics dashboard provides real-time insights into student performance, engagement metrics, and learning progress.",
        tags: ['analytics', 'tracking', 'progress']
      },
      {
        question: "How do I create assessments?",
        answer: "Use the Assessment Builder to create quizzes, tests, and exams. You can choose from multiple question types and set automatic grading.",
        tags: ['assessments', 'quizzes', 'grading']
      }
    ]
  },
  {
    id: 'technical',
    title: 'Technical Support',
    icon: Terminal,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    questions: [
      {
        question: "What if I forget my password?",
        answer: "Click 'Forgot Password' on the login page. Enter your email address and follow the instructions to reset your password securely.",
        tags: ['account', 'security', 'password']
      },
      {
        question: "Is my data backed up?",
        answer: "Yes, we perform automatic daily backups and retain data for 30 days. Enterprise plans offer extended backup retention.",
        tags: ['backup', 'data', 'security']
      },
      {
        question: "How do I integrate with other tools?",
        answer: "We offer API access and pre-built integrations with popular educational tools. Visit our Integrations page for more details.",
        tags: ['integrations', 'api', 'tools']
      }
    ]
  }
];

const supportChannels = [
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Instant messaging with our support team",
    response: "Typically < 2 minutes",
    hours: "Mon-Fri, 8AM-6PM EAT",
    action: "Start Chat",
    color: "from-blue-500 to-cyan-500",
    popular: true
  },
  {
    icon: Headphones,
    title: "Phone Support",
    description: "Direct conversation with experts",
    response: "Immediate",
    hours: "Mon-Fri, 9AM-5PM EAT",
    action: "Call Now",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Detailed assistance for complex issues",
    response: "< 4 hours",
    hours: "24/7 support",
    action: "Send Email",
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description: "Self-service articles and guides",
    response: "Instant",
    hours: "Always available",
    action: "Browse Articles",
    color: "from-amber-500 to-orange-500"
  }
];

const learningResources = [
  {
    icon: VideoIcon,
    title: "Video Tutorials",
    count: "150+ videos",
    description: "Step-by-step video guides covering all features",
    color: "text-blue-500"
  },
  {
    icon: FileText,
    title: "PDF Guides",
    count: "80+ guides",
    description: "Downloadable guides and cheat sheets",
    color: "text-emerald-500"
  },
  {
    icon: Calendar,
    title: "Live Webinars",
    count: "Weekly sessions",
    description: "Interactive training with Q&A",
    color: "text-purple-500"
  },
  {
    icon: Download,
    title: "Templates",
    count: "60+ templates",
    description: "Ready-to-use lesson plans and assessments",
    color: "text-amber-500"
  }
];

const stats = [
  { value: "99.9%", label: "Platform Uptime", icon: Server, trend: "+0.1%" },
  { value: "4.8/5", label: "Customer Satisfaction", icon: Star, trend: "+0.2" },
  { value: "< 2min", label: "Avg. Response Time", icon: Clock, trend: "-30s" },
  { value: "95%", label: "First Contact Resolution", icon: Target, trend: "+5%" }
];

type SupportFeature = (typeof supportFeatures)[number];
type SupportChannel = (typeof supportChannels)[number];
type FAQCategory = (typeof faqSections)[number];
type FAQQuestion = FAQCategory['questions'][number];

// Enhanced Components
const FeatureCard = ({ feature, index }: { feature: SupportFeature; index: number }) => {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Card className="h-full border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-6">
          <div className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
            <Icon className={`w-7 h-7 ${feature.color}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {feature.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {feature.description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const SupportChannelCard = ({ channel, index }: { channel: SupportChannel; index: number }) => {
  const Icon = channel.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="relative"
    >
      {channel.popular && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1">
          Most Popular
        </Badge>
      )}
      <Card className="h-full border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${channel.color}`} />
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${channel.color} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {channel.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {channel.description}
              </p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Response time:</span>
              <span className="font-medium text-gray-900 dark:text-white">{channel.response}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Availability:</span>
              <span className="font-medium text-gray-900 dark:text-white">{channel.hours}</span>
            </div>
          </div>
          
          <Button className={`w-full bg-gradient-to-r ${channel.color} hover:opacity-90 text-white`}>
            {channel.action}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const FAQItem = ({ faq, index, category }: { faq: FAQQuestion; index: number; category: FAQCategory }) => {
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);
  
  return (
    <AccordionItem value={`${category.id}-${index}`} className="border-b border-gray-200 dark:border-gray-800">
      <AccordionTrigger className="py-4 text-left hover:no-underline group">
        <div className="flex items-start gap-4">
          <div className={`w-8 h-8 rounded-lg ${category.bg} flex items-center justify-center flex-shrink-0 group-data-[state=open]:bg-blue-100 dark:group-data-[state=open]:bg-blue-900/20`}>
            <category.icon className={`w-4 h-4 ${category.color} group-data-[state=open]:text-blue-600 dark:group-data-[state=open]:text-blue-400`} />
          </div>
          <div className="text-left">
            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {faq.question}
            </h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {faq.tags.map((tag: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-6 pl-12">
        <p className="text-gray-600 dark:text-gray-300 mb-4">{faq.answer}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Was this helpful?
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isHelpful === true ? "default" : "outline"}
              onClick={() => setIsHelpful(true)}
              className="gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              Yes
            </Button>
            <Button
              size="sm"
              variant={isHelpful === false ? "default" : "outline"}
              onClick={() => setIsHelpful(false)}
              className="gap-2"
            >
              <ThumbsDown className="w-4 h-4" />
              No
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState('help');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: '',
    urgency: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setShowSuccess(true);
    setFormData({
      name: '',
      email: '',
      category: '',
      subject: '',
      message: '',
      urgency: 'normal'
    });
    
    setTimeout(() => setShowSuccess(false), 3000);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Header />
      
      {/* Enhanced Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-blue-950/20 dark:via-gray-900 dark:to-emerald-950/20" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto text-center"
          >
            {/* Premium Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 backdrop-blur-sm mb-8"
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                Premium Support Experience
              </span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
            >
              We're Here to{' '}
              <span className="bg-gradient-to-r from-blue-600 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                Help You Succeed
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              Get expert support for the Noneaa platform. From setup to daily operations, 
              our team is dedicated to your success in education technology.
            </motion.p>

            {/* Stats: animated count-up */}
            <Stats
              metrics={[
                { label: 'Platform Uptime', end: 999, format: 'raw', suffix: '.9%', Icon: Server },
                { label: 'Customer Satisfaction', end: 48, format: 'raw', suffix: '/5', Icon: Star },
                { label: 'Avg. Response Time', end: 2, format: 'raw', suffix: 'min', Icon: Clock },
                { label: 'First Contact Resolution', end: 95, format: 'percent', Icon: Target }
              ]}
            />

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-2 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-gray-400 ml-4" />
                    <Input
                      placeholder="What can we help you with today? Try 'student enrollment', 'grading', or 'technical issues'..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg py-6"
                    />
                    <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-8 py-6 rounded-xl">
                      <Search className="w-5 h-5 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Quick Links */}
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900">
                  Student Management
                </Badge>
                <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900">
                  Gradebook Setup
                </Badge>
                <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900">
                  Parent Portal
                </Badge>
                <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900">
                  Technical Issues
                </Badge>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Support Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Why Choose Noneaa Support?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Our dedicated support team combines technical expertise with educational 
                experience to provide you with the best assistance.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {supportFeatures.map((feature, index) => (
                <FeatureCard key={index} feature={feature} index={index} />
              ))}
            </div>
          </motion.div>

          {/* Support Channels */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Get Help Your Way
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose the support channel that works best for you
                </p>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Average satisfaction: <span className="font-semibold text-emerald-500">4.8/5</span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {supportChannels.map((channel, index) => (
                <SupportChannelCard key={index} channel={channel} index={index} />
              ))}
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Frequently Asked Questions
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Quick answers to common questions
                </p>
              </div>
              
              <div className="flex gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {faqSections.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="w-4 h-4" />
                          {cat.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-6">
              {faqSections.map((category, catIndex) => (
                <Card key={catIndex} className="border border-gray-200 dark:border-gray-800">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${category.bg} flex items-center justify-center`}>
                        <category.icon className={`w-6 h-6 ${category.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                          {category.title}
                        </CardTitle>
                        <CardDescription>
                          Common questions about {category.title.toLowerCase()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="space-y-2">
                      {category.questions.map((faq, qIndex) => (
                        <FAQItem 
                          key={qIndex} 
                          faq={faq} 
                          index={qIndex} 
                          category={category} 
                        />
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Learning Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Learning Resources
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Explore our library of tutorials, guides, and templates to master the Noneaa platform
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {learningResources.map((resource, index) => {
                const Icon = resource.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="h-full border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                      <CardContent className="p-6">
                        <div className={`w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-7 h-7 ${resource.color}`} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {resource.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {resource.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {resource.count}
                          </span>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-3xl blur opacity-20" />
              <Card className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="grid lg:grid-cols-2">
                  {/* Left Side - Information */}
                  <div className="bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 p-8 lg:p-12">
                    <div className="h-full flex flex-col justify-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 mb-6 w-fit">
                        <Send className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Submit a Request
                        </span>
                      </div>
                      
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Still Need Help?
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Our team of experts will personally assist you with any questions or issues.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-emerald-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Fast Response
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Typically within 2 hours
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-emerald-500/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Secure & Confidential
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Your information is protected
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-emerald-500/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Expert Assistance
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Certified education specialists
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Side - Form */}
                  <div className="p-8 lg:p-12">
                    <AnimatePresence>
                      {showSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <div>
                              <div className="font-medium text-emerald-700 dark:text-emerald-300">
                                Request Submitted Successfully!
                              </div>
                              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                                We'll get back to you within 2 hours.
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">
                            Full Name *
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Your name"
                            required
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="your@email.com"
                            required
                            className="h-12"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm font-medium">
                          Issue Category *
                        </Label>
                        <Select 
                          value={formData.category} 
                          onValueChange={(value) => setFormData({...formData, category: value})}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technical">Technical Issue</SelectItem>
                            <SelectItem value="account">Account & Access</SelectItem>
                            <SelectItem value="billing">Billing & Subscription</SelectItem>
                            <SelectItem value="feature">Feature Request</SelectItem>
                            <SelectItem value="other">Other Inquiry</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="urgency" className="text-sm font-medium">
                          Urgency Level
                        </Label>
                        <Select 
                          value={formData.urgency} 
                          onValueChange={(value) => setFormData({...formData, urgency: value})}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select urgency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low - General question</SelectItem>
                            <SelectItem value="normal">Normal - Need assistance</SelectItem>
                            <SelectItem value="high">High - Blocking my work</SelectItem>
                            <SelectItem value="critical">Critical - System down</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-sm font-medium">
                          Subject *
                        </Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({...formData, subject: e.target.value})}
                          placeholder="Brief description of your issue"
                          required
                          className="h-12"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm font-medium">
                          Message *
                        </Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                          placeholder="Please provide detailed information about your issue. Include error messages, steps to reproduce, and what you've already tried."
                          rows={6}
                          required
                          className="resize-none"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full h-14 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Submitting Request...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span>Submit Support Request</span>
                            <Send className="w-5 h-5" />
                          </div>
                        )}
                      </Button>
                      
                      <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-800">
                        By submitting, you agree to our{' '}
                        <a href="#" className="text-blue-600 hover:underline">
                          Privacy Policy
                        </a>
                      </div>
                    </form>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Emergency CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-16"
          >
            <div className="relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-red-600" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
              <div className="relative p-8 md:p-12 text-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-medium">Emergency Support</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">
                      Critical System Issues?
                    </h3>
                    <p className="text-white/90 mb-6 max-w-2xl">
                      For urgent problems affecting multiple users, classroom access, or system-wide outages,
                      contact our emergency support line for immediate assistance.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        size="lg"
                        className="bg-white text-red-600 hover:bg-white/90 px-8 py-6 rounded-xl font-semibold shadow-lg"
                      >
                        <Phone className="w-5 h-5 mr-2" />
                        1-800-EDU-HELP
                      </Button>
                      <Button 
                        size="lg"
                        variant="outline"
                        className="border-white text-white hover:bg-white/10 px-8 py-6 rounded-xl"
                      >
                        <Mail className="w-5 h-5 mr-2" />
                        emergency@noneaa.edu
                      </Button>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <AlertTriangle className="w-12 h-12" />
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-white/20 text-sm text-white/80">
                  <div className="flex flex-wrap items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      24/7 Availability
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Priority Response
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Dedicated Engineers
                    </div>
                  </div>
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
