import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import {
  Home,
  Search,
  Compass,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Map,
  Sparkles,
  Zap,
  Globe,
  Rocket,
  BookOpen,
  Users,
  Target,
  Cloud,
  type LucideIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NotFound = () => {
  const location = useLocation();
  const controls = useAnimation();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    color: string;
  }>>([]);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    // Start animations
    controls.start({
      y: [0, -10, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    });

    // Create floating particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      color: [
        '#60a5fa', // blue
        '#34d399', // emerald
        '#a855f7', // purple
        '#f59e0b', // amber
        '#ef4444'  // red
      ][Math.floor(Math.random() * 5)]
    }));
    setParticles(newParticles);

    // Mouse move effect
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [location.pathname, controls]);

  const quickLinks = [
    {
      icon: Home,
      title: "Home",
      description: "Return to main dashboard",
      href: "/",
      color: "text-blue-500",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: BookOpen,
      title: "Curriculum",
      description: "Browse learning materials",
      href: "/curriculum",
      color: "text-emerald-500",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: Users,
      title: "Support",
      description: "Get help & assistance",
      href: "/support",
      color: "text-purple-500",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Globe,
      title: "About",
      description: "Learn about our platform",
      href: "/about",
      color: "text-amber-500",
      gradient: "from-amber-500 to-orange-500"
    }
  ];

  const errorMessages = [
    "This page seems to have wandered off into the digital void.",
    "The content you're looking for has taken an unexpected vacation.",
    "This route appears to be on a coffee break.",
    "We've searched high and low, but this page remains elusive.",
    "This link has embarked on a journey of self-discovery."
  ];

  const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, 50, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            x: [100, 0, 100],
            y: [50, 0, 50],
            rotate: [180, 360, 540]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
        />

        {/* Floating Particles */}
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                x: particle.x + '%',
                y: particle.y + '%',
                opacity: 0
              }}
              animate={{ 
                x: [particle.x + '%', (particle.x + particle.speedX * 100) + '%'],
                y: [particle.y + '%', (particle.y + particle.speedY * 100) + '%'],
                opacity: [0, 0.5, 0]
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute w-1 h-1 rounded-full"
              style={{ 
                backgroundColor: particle.color,
                width: particle.size,
                height: particle.size
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <motion.div 
          className="max-w-4xl w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-12">
            {/* Error Code with Animation */}
            <motion.div
              animate={controls}
              className="relative inline-block mb-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 blur-3xl opacity-30" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                className="relative"
              >
                <h1 className="text-[12rem] md:text-[15rem] font-black bg-gradient-to-r from-blue-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent leading-none">
                  404
                </h1>
              </motion.div>
              
              {/* Animated 404 Badge */}
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.5
                }}
                className="absolute -top-4 -right-4"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-xl">
                    <AlertTriangle className="w-10 h-10 text-white" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-2xl border-2 border-white/20 border-t-transparent"
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 mb-4">
                <Compass className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-primary">Navigation Error</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Page Not Found
              </h2>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto"
              >
                {randomMessage}
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-mono">
                  Attempted path: {location.pathname}
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* Interactive Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-12"
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ 
                      y: -5,
                      scale: 1.05,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <Link
                      to={link.href}
                      className="group block h-full"
                    >
                      <div className="relative h-full p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                        {/* Background gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${link.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                        
                        {/* Icon */}
                        <div className={`relative z-10 w-14 h-14 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                          <Icon className={`w-7 h-7 ${link.color}`} />
                        </div>

                        {/* Content */}
                        <h3 className="font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                          {link.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {link.description}
                        </p>

                        {/* Arrow indicator */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowLeft className="w-5 h-5 text-primary rotate-180" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white px-8 py-6 rounded-xl shadow-lg shadow-blue-500/20"
              asChild
            >
              <Link to="/">
                <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Return to Home
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="group px-8 py-6 rounded-xl border-2 hover:border-primary hover:bg-primary/5"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="group px-8 py-6 rounded-xl hover:bg-secondary/50"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              Refresh Page
            </Button>
          </motion.div>

          {/* Debug Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 pt-8 border-t border-border/50"
          >
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/30 mb-4">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Troubleshooting</span>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground max-w-2xl mx-auto">
                <p>If you believe this page should exist, please:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 justify-center">
                    <Target className="w-3 h-3" />
                    <span>Check the URL for typos</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Cloud className="w-3 h-3" />
                    <span>Clear your browser cache</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Sparkles className="w-3 h-3" />
                    <span>Contact support if issue persists</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Map className="w-3 h-3" />
                    <span>Use the navigation links above</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.2 }}
            className="fixed bottom-8 left-8"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Rocket className="w-4 h-4" />
              <span>Noneaa Platform • 404</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.3 }}
            className="fixed bottom-8 right-8"
          >
            <div className="text-xs text-muted-foreground">
              Error ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Interactive Cursor Effect */}
      <motion.div
        className="fixed pointer-events-none z-0 w-64 h-64 rounded-full bg-gradient-to-r from-blue-500/10 to-emerald-500/10 blur-3xl"
        animate={{
          x: mousePosition.x,
          y: mousePosition.y
        }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 15,
          mass: 0.1
        }}
      />
    </div>
  );
};

export default NotFound;