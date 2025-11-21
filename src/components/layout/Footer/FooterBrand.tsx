'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/layout/Navbar/LanguageSwitcher';

/**
 * Footer Brand Section
 *
 * Displays brand name, tagline, and language switcher
 */
export default function FooterBrand() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Brand */}
      <div>
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {t('common.brand')}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            AI
          </span>
          <sup className="text-xs text-gray-400 ml-1">®</sup>
        </h3>
        <p className="text-sm text-gray-400">
          {t('footer.tagline')}
        </p>
      </div>

      {/* Language Selector */}
      <div>
        <LanguageSwitcher theme="dark" variant="full" />
      </div>
    </div>
  );
}