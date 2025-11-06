'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { mobileBottomNavItems } from '@/config/mobileBottomNavConfig';

/**
 * Mobile Bottom Navigation
 *
 * Fixed bottom navigation bar for mobile devices with:
 * - TTS, Voices, Clone, History tabs
 * - Internationalization support
 * - Configuration-driven menu items
 *
 * Used across multiple Studio pages (TTS, Voices, etc.)
 */
export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const handleNavClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {/* Navigation Items */}
        {mobileBottomNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.href)}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors
                ${isActive
                  ? 'text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <span className={isActive ? 'scale-110' : ''}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium whitespace-nowrap">
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}