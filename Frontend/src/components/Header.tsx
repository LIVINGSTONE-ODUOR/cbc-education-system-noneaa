import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Menu, X, ArrowRight, ChevronDown,
  Monitor, CreditCard, Rocket, Users, UserCircle, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const platformLinks = [
  { to: '/demo', label: 'Product Tour', description: 'See Noneaa in action', icon: Monitor },
  { to: '/pricing', label: 'Pricing', description: 'Plans for every school', icon: CreditCard },
  { to: '/getting-started', label: 'Getting Started', description: 'Set up in under an hour', icon: Rocket },
];

const companyLinks = [
  { to: '/company/client', label: 'Clients', description: 'Schools using Noneaa', icon: Users },
  { to: '/company/our-team', label: 'Our Team', description: 'Meet the people behind Noneaa', icon: UserCircle },
  { to: '/testimonials', label: 'Testimonials', description: 'What schools say about us', icon: Star },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [mobilePlatformOpen, setMobilePlatformOpen] = useState(false);
  const [mobileCompanyOpen, setMobileCompanyOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 50);

      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false);
        setMobileMenuOpen(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setPlatformDropdownOpen(false);
    setCompanyDropdownOpen(false);
    setMobilePlatformOpen(false);
    setMobileCompanyOpen(false);
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-lg'
          : 'bg-white',
        visible ? 'translate-y-0' : '-translate-y-full'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={closeMenus}>
            <img
              src="/Noneea-logo.jpg"
              alt="Noneaa"
              className="h-10 w-10 object-cover rounded-full"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Platform Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setPlatformDropdownOpen(true)}
              onMouseLeave={() => setPlatformDropdownOpen(false)}
            >
              <button className="text-sm font-medium text-foreground/80 hover:text-primary transition flex items-center gap-1 px-3 py-4">
                Platform
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", platformDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {platformDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 w-64 bg-white border border-border rounded-xl shadow-xl py-2"
                  >
                    {platformLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition"
                          onClick={closeMenus}
                        >
                          <Icon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">{item.label}</div>
                            <div className="text-xs text-slate-500">{item.description}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Company Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCompanyDropdownOpen(true)}
              onMouseLeave={() => setCompanyDropdownOpen(false)}
            >
              <button className="text-sm font-medium text-foreground/80 hover:text-primary transition flex items-center gap-1 px-3 py-4">
                Company
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", companyDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {companyDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 w-64 bg-white border border-border rounded-xl shadow-xl py-2"
                  >
                    {companyLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition"
                          onClick={closeMenus}
                        >
                          <Icon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">{item.label}</div>
                            <div className="text-xs text-slate-500">{item.description}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Direct links */}
            {[
              { label: 'Features', to: '/features' },
              { label: 'About', to: '/about' },
              { label: 'Careers', to: '/careers' },
              { label: 'Blogs', to: '/blog' },
              { label: 'Contact', to: '/contact' },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="text-sm font-medium text-foreground/80 hover:text-primary transition px-3 py-4"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button size="sm" className="rounded-full px-5" asChild>
              <Link to="/admin-register">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-secondary/50 transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden border-t"
            >
              <nav className="flex flex-col py-4 gap-1">
                {/* Mobile Platform Accordion */}
                <div className="flex flex-col">
                  <button
                    onClick={() => setMobilePlatformOpen(!mobilePlatformOpen)}
                    className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-secondary/50"
                  >
                    <span className="text-sm font-medium">Platform</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", mobilePlatformOpen && "rotate-180")} />
                  </button>
                  {mobilePlatformOpen && (
                    <div className="pl-4 flex flex-col bg-secondary/20 rounded-lg mx-2 overflow-hidden">
                      {platformLinks.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="py-3 px-4 text-sm text-foreground/70 hover:text-primary"
                          onClick={closeMenus}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile Company Accordion */}
                <div className="flex flex-col">
                  <button
                    onClick={() => setMobileCompanyOpen(!mobileCompanyOpen)}
                    className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-secondary/50"
                  >
                    <span className="text-sm font-medium">Company</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", mobileCompanyOpen && "rotate-180")} />
                  </button>
                  {mobileCompanyOpen && (
                    <div className="pl-4 flex flex-col bg-secondary/20 rounded-lg mx-2 overflow-hidden">
                      {companyLinks.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="py-3 px-4 text-sm text-foreground/70 hover:text-primary"
                          onClick={closeMenus}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct mobile links */}
                {[
                  { label: 'Features', to: '/features' },
                  { label: 'About', to: '/about' },
                  { label: 'Careers', to: '/careers' },
                  { label: 'Blogs', to: '/blog' },
                  { label: 'Contact', to: '/contact' },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary/50"
                    onClick={closeMenus}
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="grid grid-cols-2 gap-3 p-4 mt-2">
                  <Button variant="outline" asChild onClick={closeMenus}>
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button asChild onClick={closeMenus}>
                    <Link to="/admin-register">Start Free</Link>
                  </Button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
