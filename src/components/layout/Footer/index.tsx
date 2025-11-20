'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import FooterBrand from './FooterBrand';
import FooterLinks from './FooterLinks';
import { FOOTER_SECTIONS } from '@/config/footerConfig';

/**
 * Footer Component
 *
 * A dark-themed footer with 4 main sections:
 * 1. Brand + Social Media + Language Switcher
 * 2. Info Links
 * 3. About Links
 * 4. Star Products Links
 */
export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Section 1: Brand + Social Media + Language Switcher */}
          <FooterBrand />

          {/* Sections 2-4: Dynamic Link Sections */}
          {FOOTER_SECTIONS.map((section, index) => (
            <FooterLinks
              key={index}
              titleKey={section.titleKey}
              links={section.links}
            />
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} {t('common.brand')}. {t('footer.copyright')}
          </p>
          {process.env.NEXT_PUBLIC_APP_VERSION && (
            <p className="mt-2 text-xs text-gray-600">
              v{process.env.NEXT_PUBLIC_APP_VERSION}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}