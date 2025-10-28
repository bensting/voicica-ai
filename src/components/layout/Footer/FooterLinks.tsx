'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

interface FooterLink {
  labelKey: string;
  href: string;
}

interface FooterLinksProps {
  titleKey: string;
  links: FooterLink[];
}

/**
 * Footer Links Section
 *
 * Displays a column of links with a title
 */
export default function FooterLinks({ titleKey, links }: FooterLinksProps) {
  const { t } = useLanguage();

  return (
    <div>
      <h4 className="text-lg font-semibold text-white mb-4">
        {t(titleKey)}
      </h4>
      <nav className="flex flex-col gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            {t(link.labelKey)}
          </Link>
        ))}
      </nav>
    </div>
  );
}