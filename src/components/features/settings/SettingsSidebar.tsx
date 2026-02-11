'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

interface MenuItem {
  id: string;
  labelKey: string;
  href: string;
  icon: React.ReactNode;
}

interface SettingsSidebarProps {
  variant?: 'vertical' | 'horizontal';
}

export default function SettingsSidebar({ variant = 'vertical' }: SettingsSidebarProps) {
  const { t } = useLanguage();
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    {
      id: 'home',
      labelKey: 'settings.menu.home',
      href: '/native',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'subscription',
      labelKey: 'settings.menu.mySubscription',
      href: '/native/subscribe',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
    },
    {
      id: 'profile',
      labelKey: 'settings.menu.myProfile',
      href: '/native/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'orders',
      labelKey: 'settings.menu.orderList',
      href: '/native/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
  ];

  if (variant === 'horizontal') {
    return (
      <nav className="flex gap-2 py-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap
                ${
                  isActive
                    ? 'bg-purple-50 text-purple-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span className={isActive ? 'text-purple-600' : 'text-gray-500'}>
                {item.icon}
              </span>
              <span className="text-sm">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
              ${
                isActive
                  ? 'bg-purple-50 text-purple-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <span className={isActive ? 'text-purple-600' : 'text-gray-500'}>
              {item.icon}
            </span>
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}