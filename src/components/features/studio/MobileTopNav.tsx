'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from '@/components/layout/Navbar/LanguageSwitcher';
import Link from 'next/link';

interface MobileTopNavProps {
  onMenuToggle?: (isOpen: boolean) => void;
}

/**
 * Mobile Top Navigation for Studio
 *
 * TopMediAi-style mobile nav with:
 * - Hamburger menu button
 * - Logo
 * - Pricing button
 * - Language switcher
 * - User avatar
 */
export default function MobileTopNav({ onMenuToggle }: MobileTopNavProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);
    onMenuToggle?.(newState);
  };

  const handlePricingClick = () => {
    router.push('/pricing');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Hamburger Menu */}
        <button
          onClick={toggleMenu}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </button>

        {/* Center: Logo */}
        <Link href="/" className="flex items-center gap-1">
          <span className="text-xl font-bold text-gray-900">AI Voice Labs</span>
          <span className="text-xl font-bold">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              AI
            </span>
          </span>
          <sup className="text-[10px] text-gray-500">®</sup>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Pricing Button */}
          <button
            onClick={handlePricingClick}
            className="px-3 py-1.5 text-sm font-medium text-purple-600 border border-purple-200 rounded-full hover:bg-purple-50 transition-colors"
          >
            Pricing
          </button>

          {/* Language Switcher */}
          <div className="flex items-center">
            <LanguageSwitcher theme="light" variant="compact" />
          </div>

          {/* User Avatar */}
          {user && (
            <button
              onClick={() => router.push('/settings/my-account')}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-sm hover:scale-105 transition-transform"
            >
              {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}