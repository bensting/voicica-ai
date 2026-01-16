'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Story 页面底部导航
 *
 * 包含两个导航项：
 * - Generate Story: 生成故事
 * - My Stories: 我的故事
 */

interface NavItem {
  id: string;
  href: string;
  labelKey: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: 'generate',
    href: '/studio/story/generate',
    labelKey: 'story.nav.generate',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: 'my-stories',
    href: '/studio/story/my-stories',
    labelKey: 'story.nav.myStories',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

export default function StoryBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const handleNavClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-purple-50 to-white border-t border-purple-100 z-40 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.href)}
              className={`
                flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors
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
