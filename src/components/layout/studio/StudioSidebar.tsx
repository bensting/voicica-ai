'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { studioMenuItems, studioMenuCategories } from '@/config/studioMenuConfig';

interface StudioSidebarProps {
  variant?: 'desktop' | 'mobile';
}

/**
 * Studio 侧边栏组件
 *
 * 桌面端：可折叠侧边栏（悬停展开）
 * 移动端：横向滚动菜单
 */
export default function StudioSidebar({ variant = 'desktop' }: StudioSidebarProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  // 移动端横向菜单
  if (variant === 'mobile') {
    return (
      <nav className="flex gap-2 pb-2">
        {studioMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap
                ${isActive
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="text-sm font-medium">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  // 桌面端可折叠侧边栏
  return (
    <nav
      className={`
        fixed left-0 top-[60px] h-[calc(100vh-60px)] bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out overflow-y-auto z-20
        ${isExpanded ? 'w-64' : 'w-16'}
      `}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="py-4">
        {/* 主要功能 */}
        <div className="mb-6">
          {studioMenuCategories.main.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 transition-colors
                  ${isActive
                    ? 'bg-purple-50 text-purple-600 border-r-2 border-purple-600'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span
                  className={`
                    text-sm font-medium whitespace-nowrap transition-opacity duration-300
                    ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}
                  `}
                >
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Video AI */}
        {studioMenuCategories.video.length > 0 && (
          <div className="mb-6">
            {isExpanded && (
              <div className="px-4 py-2">
                <span className="text-xs font-semibold text-gray-400 uppercase">
                  Video AI
                </span>
              </div>
            )}
            {studioMenuCategories.video.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 transition-colors
                    ${isActive
                      ? 'bg-purple-50 text-purple-600 border-r-2 border-purple-600'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span
                    className={`
                      text-sm font-medium whitespace-nowrap transition-opacity duration-300
                      ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}
                    `}
                  >
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Voiceover AI */}
        {studioMenuCategories.voiceover.length > 0 && (
          <div className="mb-6">
            {isExpanded && (
              <div className="px-4 py-2">
                <span className="text-xs font-semibold text-gray-400 uppercase">
                  Voiceover AI
                </span>
              </div>
            )}
            {studioMenuCategories.voiceover.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 transition-colors
                    ${isActive
                      ? 'bg-purple-50 text-purple-600 border-r-2 border-purple-600'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span
                    className={`
                      text-sm font-medium whitespace-nowrap transition-opacity duration-300
                      ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}
                    `}
                  >
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Music AI */}
        {studioMenuCategories.music.length > 0 && (
          <div className="mb-6">
            {isExpanded && (
              <div className="px-4 py-2">
                <span className="text-xs font-semibold text-gray-400 uppercase">
                  Music AI
                </span>
              </div>
            )}
            {studioMenuCategories.music.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 transition-colors
                    ${isActive
                      ? 'bg-purple-50 text-purple-600 border-r-2 border-purple-600'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span
                    className={`
                      text-sm font-medium whitespace-nowrap transition-opacity duration-300
                      ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}
                    `}
                  >
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}