'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/layout/Navbar/LanguageSwitcher';

/**
 * Footer Brand Section
 *
 * Displays brand logo, tagline, and language switcher
 */
export default function FooterBrand() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Brand Logo */}
      <div>
        <Image
          src="/logo/voice-labs-logo-light.svg"
          alt="AI-Voice-Labs.com"
          width={225}
          height={40}
          className="h-8 md:h-9 w-auto"
        />
        <p className="text-sm text-gray-400 mt-2">
          {t('footer.tagline')}
        </p>
      </div>

      {/* Language Selector */}
      <div>
        <LanguageSwitcher theme="light" variant="full" dropdownPosition="up" />
      </div>
    </div>
  );
}