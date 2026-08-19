import React, { useState, useEffect } from 'react';
import { Sparkles, Menu, X, ArrowRight, User as UserIcon, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onNavigate: (route: 'home' | 'login' | 'signup' | 'app') => void;
  onOpenDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onOpenDemo }) => {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Product', href: '#product' },
    { label: 'How It Works', href: '#workflow' },
    { label: 'Features', href: '#features' },
    { label: 'Use Cases', href: '#use-cases' },
    { label: 'Security', href: '#security' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <header
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-3 bg-white/80 backdrop-blur-lg border-b border-slate-200/70 shadow-xs'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <button
            onClick={() => onNavigate('home')}
            id="nav-logo"
            className="flex items-center gap-2.5 text-slate-900 group cursor-pointer focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 font-display">
              ✦ Insight<span className="text-indigo-600">AI</span>
            </span>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-200/60 shadow-xs">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 rounded-full hover:bg-slate-100/70 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => onNavigate('app')}
                  id="nav-btn-app"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white bg-slate-900 hover:bg-indigo-600 shadow-md shadow-slate-900/10 hover:shadow-indigo-500/25 transition-all duration-200 cursor-pointer active:scale-98"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Workspace</span>
                </button>
                <button
                  onClick={() => logout()}
                  id="nav-btn-logout"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  id="nav-btn-login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 rounded-full transition-colors cursor-pointer"
                >
                  Log in
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  id="nav-btn-try"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white bg-slate-900 hover:bg-indigo-600 shadow-md shadow-slate-900/10 hover:shadow-indigo-500/25 transition-all duration-200 cursor-pointer active:scale-98"
                >
                  <span>Try InsightAI</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="nav-mobile-toggle"
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-xl transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xl px-5 py-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
            {user ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('app');
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Workspace</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-2.5 text-center text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('login');
                  }}
                  className="w-full py-2.5 text-center text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('signup');
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Try InsightAI Free
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

