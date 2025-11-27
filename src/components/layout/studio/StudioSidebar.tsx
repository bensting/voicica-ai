'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { studioMenuCategories } from '@/config/studioMenu';

interface StudioSidebarProps {
  /** 桌面端不需要，移动端需要控制打开/关闭 */
  isOpen?: boolean;
  /** 桌面端不需要，移动端需要关闭回调 */
  onClose?: () => void;
}

/**
 * Studio 侧边栏组件（响应式）
 *
 * 桌面端（>= lg）：
 * - 固定侧边栏（悬停展开）
 * - 位置：左侧，top-[60px]
 *
 * 移动端（< lg）：
 * - 抽屉式菜单（从左侧滑入）
 * - 需要 isOpen 和 onClose props
 * - 带遮罩层
 */
export default function StudioSidebar({ isOpen = false, onClose }: StudioSidebarProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  // 渲染菜单内容（移动端和桌面端共用）
  const renderMenuContent = () => (
    <div className="py-4">
        {/* 主要功能 */}
        <div className="mb-6">
          {/* 移动端标题 */}
          <div className="px-4 py-2 lg:hidden">
            <span className="text-xs font-semibold text-gray-400 uppercase">
              {t('studio.menu.home')}
            </span>
          </div>
          {studioMenuCategories.main.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 transition-colors
                  ${isActive
                    ? 'bg-purple-50 text-purple-600 border-r-4 lg:border-r-2 border-purple-600'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span
                  className={`
                    text-sm font-medium whitespace-nowrap
                    lg:transition-opacity lg:duration-300
                    ${isExpanded ? 'lg:opacity-100' : 'lg:opacity-0 lg:w-0'}
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
            {/* 桌面端展开时显示，移动端始终显示 */}
            <div className={`px-4 py-2 ${isExpanded ? 'lg:block' : 'lg:hidden'}`}>
              <span className="text-xs font-semibold text-gray-400 uppercase">
                Video AI
              </span>
            </div>
            {studioMenuCategories.video.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 transition-colors
                    ${isActive
                      ? 'bg-purple-50 text-purple-600 border-r-4 lg:border-r-2 border-purple-600'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span
                    className={`
                      text-sm font-medium whitespace-nowrap
                      lg:transition-opacity lg:duration-300
                      ${isExpanded ? 'lg:opacity-100' : 'lg:opacity-0 lg:w-0'}
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
            {/* 桌面端展开时显示，移动端始终显示 */}
            <div className={`px-4 py-2 ${isExpanded ? 'lg:block' : 'lg:hidden'}`}>
              <span className="text-xs font-semibold text-gray-400 uppercase">
                Voiceover AI
              </span>
            </div>
            {studioMenuCategories.voiceover.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 transition-colors
                    ${isActive
                      ? 'bg-purple-50 text-purple-600 border-r-4 lg:border-r-2 border-purple-600'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span
                    className={`
                      text-sm font-medium whitespace-nowrap
                      lg:transition-opacity lg:duration-300
                      ${isExpanded ? 'lg:opacity-100' : 'lg:opacity-0 lg:w-0'}
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
            {/* 桌面端展开时显示，移动端始终显示 */}
            <div className={`px-4 py-2 ${isExpanded ? 'lg:block' : 'lg:hidden'}`}>
              <span className="text-xs font-semibold text-gray-400 uppercase">
                Music AI
              </span>
            </div>
            {studioMenuCategories.music.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 transition-colors
                    ${isActive
                      ? 'bg-purple-50 text-purple-600 border-r-4 lg:border-r-2 border-purple-600'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span
                    className={`
                      text-sm font-medium whitespace-nowrap
                      lg:transition-opacity lg:duration-300
                      ${isExpanded ? 'lg:opacity-100' : 'lg:opacity-0 lg:w-0'}
                    `}
                  >
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Tools (免费工具) */}
        {studioMenuCategories.tools.length > 0 && (
          <div className="mb-6">
            {/* 桌面端展开时显示，移动端始终显示 */}
            <div className={`px-4 py-2 ${isExpanded ? 'lg:block' : 'lg:hidden'}`}>
              <span className="text-xs font-semibold text-gray-400 uppercase">
                {t('studio.menu.tools')}
              </span>
            </div>
            {studioMenuCategories.tools.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 transition-colors
                    ${isActive
                      ? 'bg-purple-50 text-purple-600 border-r-4 lg:border-r-2 border-purple-600'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span
                    className={`
                      text-sm font-medium whitespace-nowrap
                      lg:transition-opacity lg:duration-300
                      ${isExpanded ? 'lg:opacity-100' : 'lg:opacity-0 lg:w-0'}
                    `}
                  >
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Account (我的账户) */}
        {studioMenuCategories.account.length > 0 && (
          <div className="mb-6 border-t border-gray-200 pt-4">
            {/* 桌面端展开时显示，移动端始终显示 */}
            <div className={`px-4 py-2 ${isExpanded ? 'lg:block' : 'lg:hidden'}`}>
              <span className="text-xs font-semibold text-gray-400 uppercase">
                {t('studio.menu.account')}
              </span>
            </div>
            {studioMenuCategories.account.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 transition-colors
                    ${isActive
                      ? 'bg-purple-50 text-purple-600 border-r-4 lg:border-r-2 border-purple-600'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span
                    className={`
                      text-sm font-medium whitespace-nowrap
                      lg:transition-opacity lg:duration-300
                      ${isExpanded ? 'lg:opacity-100' : 'lg:opacity-0 lg:w-0'}
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
    );

  return (
    <>
      {/* 移动端遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 侧边栏 */}
      <nav
        className={`
          fixed left-0 bg-white border-r border-gray-200 overflow-y-auto

          // 移动端样式：抽屉式，从左侧滑入
          top-[60px] bottom-0 w-72 shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}

          // 桌面端样式：固定侧边栏，悬停展开
          lg:translate-x-0
          lg:top-[60px] lg:h-[calc(100vh-60px)] lg:z-20
          lg:transition-all lg:duration-300 lg:ease-in-out
          ${isExpanded ? 'lg:w-64' : 'lg:w-16'}
        `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {renderMenuContent()}
      </nav>
    </>
  );
}