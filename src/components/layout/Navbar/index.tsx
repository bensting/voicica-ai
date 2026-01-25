'use client';

import { useState, useEffect } from 'react';
import Logo from './Logo';
import NavLinks from './NavLinks';
import LanguageSwitcher from './LanguageSwitcher';
import LoginButton from './LoginButton';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-b border-white/20'
        : 'bg-white/50 backdrop-blur-md border-b border-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left Section: Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Logo />
          </div>

          {/* Center Section: Navigation Links - Desktop */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="px-6 py-2 bg-white/40 backdrop-blur-md rounded-full border border-white/30 shadow-sm">
              <NavLinks />
            </div>
          </div>

          {/* Right Section: Language, Login & Mobile Toggle */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher theme="dark" variant="compact" />
              <LoginButton />
            </div>

            {/* Mobile Menu Button - Moved to right */}
            <button
              className="md:hidden p-2 text-gray-700 hover:text-pink-500 rounded-lg hover:bg-pink-50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay - Glassmorphism */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-20 z-40 bg-white/80 backdrop-blur-3xl animate-fade-in p-4 flex flex-col overflow-y-auto">
            <div className="flex flex-col space-y-4 mt-4">
              <NavLinks mobile onLinkClick={() => setMobileMenuOpen(false)} />
              <div className="h-px bg-gray-100 my-4" />
              <div className="flex flex-col gap-4 px-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Language</span>
                  <LanguageSwitcher theme="dark" />
                </div>
                <div className="pt-2">
                  <LoginButton />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}