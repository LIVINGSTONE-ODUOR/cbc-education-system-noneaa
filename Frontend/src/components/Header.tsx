import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, ArrowRight, Unlock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
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

  // Utility to close all menus on navigation
  const closeMenus = () => {
    setMobileMenuOpen(false);
    setCompanyDropdownOpen(false);
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
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={closeMenus}>
            <img
              src="/Noneea-logo.jpg"
              alt="Noneaa"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              to="/explore"
              className="text-sm font-medium text-foreground/80 hover:text-primary transition"
            >
              Explore
            </Link>

            {/* Desktop Company Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCompanyDropdownOpen(true)}
              onMouseLeave={() => setCompanyDropdownOpen(false)}
            >
              <button className="text-sm font-medium text-foreground/80 hover:text-primary transition flex items-center gap-1 py-4">
                Company
                <ChevronDown className={cn("w-4 h-4 transition-transform", companyDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {companyDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-48 bg-white border border-border rounded-lg shadow-lg py-2"
                  >
                    <Link
                      to="/company/client"
                      className="block px-4 py-2 text-sm text-foreground/80 hover:bg-secondary/50 hover:text-primary transition"
                      onClick={closeMenus}
                    >
                      Client
                    </Link>
                    <Link
                      to="/company/our-team"
                      className="block px-4 py-2 text-sm text-foreground/80 hover:bg-secondary/50 hover:text-primary transition"
                      onClick={closeMenus}
                    >
                      Our Team
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {['Analytics', 'About','Features', 'Contact'].map((item) => (
              <Link
                key={item}
                to={`/${item.toLowerCase()}`}
                className="text-sm font-medium text-foreground/80 hover:text-primary transition"
              >
                {item}
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
                <Link to="/explore" className="px-4 py-3 rounded-lg hover:bg-secondary/50" onClick={closeMenus}>
                  Explore
                </Link>

                {/* Mobile Dropdown (Accordion Style) */}
                <div className="flex flex-col">
                  <button
                    onClick={() => setMobileCompanyOpen(!mobileCompanyOpen)}
                    className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-secondary/50"
                  >
                    <span className="text-sm font-medium">Company</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", mobileCompanyOpen && "rotate-180")} />
                  </button>
                  {mobileCompanyOpen && (
                    <div className="pl-8 flex flex-col bg-secondary/20 rounded-lg mx-2">
                      <Link to="/company/client" className="py-3 text-sm text-foreground/70" onClick={closeMenus}>
                        Client
                      </Link>
                      <Link to="/company/our-team" className="py-3 text-sm text-foreground/70" onClick={closeMenus}>
                        Our Team
                      </Link>
                    </div>
                  )}
                </div>

                {['Analytics', 'About', 'Features', 'Contact'].map((item) => (
                  <Link
                    key={item}
                    to={`/${item.toLowerCase()}`}
                    className="px-4 py-3 rounded-lg hover:bg-secondary/50"
                    onClick={closeMenus}
                  >
                    {item}
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