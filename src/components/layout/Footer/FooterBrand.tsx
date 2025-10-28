'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Twitter, Youtube } from 'lucide-react';
import { FaDiscord, FaTiktok } from 'react-icons/fa';
import LanguageSwitcher from '@/components/layout/Navbar/LanguageSwitcher';

/**
 * Footer Brand Section
 *
 * Displays brand name, tagline, social media links, and language switcher
 */
export default function FooterBrand() {
  const { t } = useLanguage();

  const socialLinks = [
    {
      name: 'Twitter',
      href: 'https://twitter.com',
      icon: Twitter,
    },
    {
      name: 'Discord',
      href: 'https://discord.com',
      icon: FaDiscord,
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com',
      icon: Youtube,
    },
    {
      name: 'TikTok',
      href: 'https://tiktok.com',
      icon: FaTiktok,
    },
  ];

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

      {/* Social Media */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-3">
          {t('footer.followUs')}
        </h4>
        <div className="flex items-center gap-3">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 hover:bg-purple-600 rounded-lg flex items-center justify-center transition-colors"
                aria-label={social.name}
              >
                <Icon className="w-5 h-5" />
              </a>
            );
          })}
        </div>
      </div>

      {/* Language Selector */}
      <div>
        <LanguageSwitcher theme="dark" variant="full" />
      </div>
    </div>
  );
}