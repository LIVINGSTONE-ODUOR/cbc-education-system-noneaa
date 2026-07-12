import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Menu, X, ArrowRight, ChevronDown,
  Monitor, CreditCard, Rocket, Users, UserCircle, Star,
  LayoutGrid, ClipboardCheck, Users2, Sparkles, BookOpen, FileText,
  Briefcase, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const platformLinks = [
  { to: '/demo', label: 'Product Tour', description: 'See Noneaa in action', icon: Monitor },
  { to: '/getting-started', label: 'Getting Started', description: 'Set up in under an hour', icon: Rocket },
];

const solutionsLinks = [
  { to: '/curriculum', label: 'Curriculum Management', description: 'Learning areas, strands & sub-strands', icon: LayoutGrid },
  { to: '/assessments', label: 'Competency Assessments', description: 'Track the 4-level competency scale', icon: ClipboardCheck },
  { to: '/parent/portal', label: 'Parent Portal', description: 'Keep parents informed in real time', icon: Users2 },
];

const featuresLinks = [
  { to: '/features', label: 'All Features', description: 'Everything Noneaa includes', icon: Sparkles },
];

const companyLinks = [
  { to: '/about', label: 'About Noneaa', description: 'Our mission for CBC schools', icon: UserCircle },
  { to: '/company/client', label: 'Clients', description: 'Schools using Noneaa', icon: Users },
  { to: '/testimonials', label: 'Testimonials', description: 'What schools say about us', icon: Star },
  { to: '/careers', label: 'Careers', description: 'Join the Noneaa team', icon: Briefcase },
];

const resourcesLinks = [
  { to: '/resources', label: 'Resource Center', description: 'Guides for teachers & admins', icon: BookOpen },
  { to: '/blog', label: 'Blog', description: 'News from the Noneaa team', icon: FileText },
  { to: '/contact', label: 'Contact', description: 'Get in touch with our team', icon: Mail },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false);
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [mobilePlatformOpen, setMobilePlatformOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);
  const [mobileCompanyOpen, setMobileCompanyOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);

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
    setSolutionsDropdownOpen(false);
    setFeaturesDropdownOpen(false);
    setCompanyDropdownOpen(false);
    setResourcesDropdownOpen(false);
    setMobilePlatformOpen(false);
    setMobileSolutionsOpen(false);
    setMobileFeaturesOpen(false);
    setMobileCompanyOpen(false);
    setMobileResourcesOpen(false);
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

            {/* Solutions Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setSolutionsDropdownOpen(true)}
              onMouseLeave={() => setSolutionsDropdownOpen(false)}
            >
              <button className="text-sm font-medium text-foreground/80 hover:text-primary transition flex items-center gap-1 px-3 py-4">
                Solutions
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", solutionsDropdownOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {solutionsDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 w-72 bg-white border border-border rounded-xl shadow-xl py-2"
                  >
                    {solutionsLinks.map((item) => {
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

            {/* Features Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setFeaturesDropdownOpen(true)}
              onMouseLeave={() => setFeaturesDropdownOpen(false)}
            >
              <Link
                to="/features"
                className="text-sm font-medium text-foreground/80 hover:text-primary transition flex items-center gap-1 px-3 py-4"
              >
                Features
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", featuresDropdownOpen && "rotate-180")} />
              </Link>
              <AnimatePresence>
                {featuresDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 w-64 bg-white border border-border rounded-xl shadow-xl py-2"
                  >
                    {featuresLinks.map((item) => {
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

            {/* About Us Dropdown (was Company) */}
            <div
              className="relative"
              onMouseEnter={() => setCompanyDropdownOpen(true)}
              onMouseLeave={() => setCompanyDropdownOpen(false)}
            >
              <button className="text-sm font-medium text-foreground/80 hover:text-primary transition flex items-center gap-1 px-3 py-4">
                About Us
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

            {/* Resources Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setResourcesDropdownOpen(true)}
              onMouseLeave={() => setResourcesDropdownOpen(false)}
            >
              <button className="text-sm font-medium text-foreground/80 hover:text-primary transition flex items-center gap-1 px-3 py-4">
                Resources
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", resourcesDropdownOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {resourcesDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 w-64 bg-white border border-border rounded-xl shadow-xl py-2"
                  >
                    {resourcesLinks.map((item) => {
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

            {/* Pricing — plain link, no dropdown */}
            <Link
              to="/pricing"
              className="text-sm font-medium text-foreground/80 hover:text-primary transition px-3 py-4"
            >
              Pricing
            </Link>
          </nav>

          {/* Auth Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-full border-[#1E3A28]/20 text-[#1C1C1C]" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button size="sm" className="rounded-full px-5 bg-[#1E3A28] hover:bg-[#173420] text-white" asChild>
              <Link to="/demo">
                Request Demo
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

                {/* Mobile Solutions Accordion */}
                <div className="flex flex-col">
                  <button
                    onClick={() => setMobileSolutionsOpen(!mobileSolutionsOpen)}
                    className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-secondary/50"
                  >
                    <span className="text-sm font-medium">Solutions</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", mobileSolutionsOpen && "rotate-180")} />
                  </button>
                  {mobileSolutionsOpen && (
                    <div className="pl-4 flex flex-col bg-secondary/20 rounded-lg mx-2 overflow-hidden">
                      {solutionsLinks.map((item) => (
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

                {/* Mobile Features Accordion */}
                <div className="flex flex-col">
                  <button
                    onClick={() => setMobileFeaturesOpen(!mobileFeaturesOpen)}
                    className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-secondary/50"
                  >
                    <span className="text-sm font-medium">Features</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", mobileFeaturesOpen && "rotate-180")} />
                  </button>
                  {mobileFeaturesOpen && (
                    <div className="pl-4 flex flex-col bg-secondary/20 rounded-lg mx-2 overflow-hidden">
                      {featuresLinks.map((item) => (
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

                {/* Mobile About Us Accordion (was Company) */}
                <div className="flex flex-col">
                  <button
                    onClick={() => setMobileCompanyOpen(!mobileCompanyOpen)}
                    className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-secondary/50"
                  >
                    <span className="text-sm font-medium">About Us</span>
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

                {/* Mobile Resources Accordion */}
                <div className="flex flex-col">
                  <button
                    onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
                    className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-secondary/50"
                  >
                    <span className="text-sm font-medium">Resources</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", mobileResourcesOpen && "rotate-180")} />
                  </button>
                  {mobileResourcesOpen && (
                    <div className="pl-4 flex flex-col bg-secondary/20 rounded-lg mx-2 overflow-hidden">
                      {resourcesLinks.map((item) => (
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

                {/* Pricing — plain mobile link */}
                <Link
                  to="/pricing"
                  className="px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary/50"
                  onClick={closeMenus}
                >
                  Pricing
                </Link>

                <div className="grid grid-cols-2 gap-3 p-4 mt-2">
                  <Button variant="outline" className="rounded-full border-[#1E3A28]/20" asChild onClick={closeMenus}>
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button className="rounded-full bg-[#1E3A28] hover:bg-[#173420] text-white" asChild onClick={closeMenus}>
                    <Link to="/demo">Request Demo</Link>
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
