'use client';

import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LanguageSwitcher from '@/components/layout/Navbar/LanguageSwitcher';
import UserMenu from '@/components/layout/Navbar/UserMenu';
import Link from 'next/link';

interface MobileTopNavProps {
  isMenuOpen?: boolean;
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
export default function MobileTopNav({ isMenuOpen = false, onMenuToggle }: MobileTopNavProps) {
  const router = useRouter();

  const toggleMenu = () => {
    onMenuToggle?.(!isMenuOpen);
  };

  const handlePricingClick = () => {
    router.push('/pricing');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-3 py-2.5 gap-2">
        {/* Left: Hamburger Menu + Logo */}
        <div className="flex items-center gap-1.5 flex-shrink min-w-0">
          <button
            onClick={toggleMenu}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>

          <Link href="/" className="flex items-center min-w-0">
            <Image
              src="/logo/voice-labs-logo-light.svg"
              alt="Voice-Labs.AI"
              width={180}
              height={28}
              priority
              className="h-7 w-auto"
            />
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Pricing Button */}
          <button
            onClick={handlePricingClick}
            className="px-2.5 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-full hover:bg-purple-50 transition-colors"
          >
            Pricing
          </button>

          {/* Language Switcher */}
          <div className="flex items-center px-1">
            <LanguageSwitcher theme="dark" variant="compact" showArrow={false} />
          </div>

          {/* User Menu */}
          <UserMenu size="sm" />
        </div>
      </div>
    </div>
  );
}