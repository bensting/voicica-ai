'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Mic, Users, Copy, Wrench, Sparkles } from 'lucide-react';

interface NavItem {
  id: string;
  icon: React.ReactNode;
  labelKey: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'tts',
    icon: <Mic className="w-5 h-5" />,
    labelKey: 'TTS',
    href: '/studio/tts',
  },
  {
    id: 'voices',
    icon: <Users className="w-5 h-5" />,
    labelKey: 'Voices',
    href: '/studio/voices',
  },
  {
    id: 'clone',
    icon: <Copy className="w-5 h-5" />,
    labelKey: 'Clone',
    href: '/clone',
  },
  {
    id: 'more',
    icon: <Wrench className="w-5 h-5" />,
    labelKey: 'More Tools',
    href: '/studio',
  },
];

/**
 * Bottom Navigation for Mobile Studio
 *
 * Fixed bottom navigation bar for mobile devices with:
 * - TTS, Voices, Clone, More Tools tabs
 * - 70% OFF promotion button
 *
 * Used across multiple Studio pages (TTS, Voices, etc.)
 */
export default function StudioBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavClick = (href: string) => {
    router.push(href);
  };

  const handlePromoClick = () => {
    router.push('/pricing');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {/* Navigation Items */}
        {NAV_ITEMS.map((item) => {
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
                {item.labelKey}
              </span>
            </button>
          );
        })}

        {/* Promo Button */}
        <button
          onClick={handlePromoClick}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600 transition-all shadow-lg"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-bold whitespace-nowrap">
            70% OFF
          </span>
        </button>
      </div>
    </div>
  );
}