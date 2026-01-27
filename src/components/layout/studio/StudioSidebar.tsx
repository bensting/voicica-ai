'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X, ChevronRight } from 'lucide-react';
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
 * - 全屏菜单
 * - 需要 isOpen 和 onClose props
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

        {/* AI Video */}
        {studioMenuCategories.ai_video.length > 0 && (
          <div className="mb-6">
            {/* 桌面端展开时显示，移动端始终显示 */}
            <div className={`px-4 py-2 ${isExpanded ? 'lg:block' : 'lg:hidden'}`}>
              <span className="text-xs font-semibold text-gray-400 uppercase">
                Video AI
              </span>
            </div>
            {studioMenuCategories.ai_video.map((item) => {
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

        {/* Story Maker AI */}
        {studioMenuCategories.story.length > 0 && (
          <div className="mb-6">
            {/* 桌面端展开时显示，移动端始终显示 */}
            <div className={`px-4 py-2 ${isExpanded ? 'lg:block' : 'lg:hidden'}`}>
              <span className="text-xs font-semibold text-gray-400 uppercase">
                Story Maker AI
              </span>
            </div>
            {studioMenuCategories.story.map((item) => {
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

  // 渲染移动端菜单项（精致水平布局）
  const renderMobileMenuItem = (item: { id: string; href: string; icon: React.ReactNode; labelKey: string }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={onClose}
        className={`
          flex items-center gap-3 px-3 py-3 transition-all rounded-xl
          ${isActive
            ? 'bg-purple-100 text-purple-700'
            : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'}
        `}
      >
        {/* 图标容器 */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
          ${isActive
            ? 'bg-purple-600 text-white shadow-sm'
            : 'bg-gray-100 text-gray-600'}
        `}>
          {item.icon}
        </div>
        {/* 文字 */}
        <span className={`flex-1 text-sm font-medium ${isActive ? 'text-purple-700' : 'text-gray-800'}`}>
          {t(item.labelKey)}
        </span>
        {/* 箭头 */}
        <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-purple-400' : 'text-gray-300'}`} />
      </Link>
    );
  };

  // 渲染移动端分组卡片
  const renderMobileSection = (title: string, items: { id: string; href: string; icon: React.ReactNode; labelKey: string }[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-5">
        <h3 className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
        <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5">
          {items.map((item, index) => (
            <div key={item.id}>
              {renderMobileMenuItem(item)}
              {/* 添加分隔线（最后一项不加） */}
              {index < items.length - 1 && (
                <div className="mx-3 border-b border-gray-100" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ========== 移动端全屏菜单 ========== */}
      <div
        className={`
          fixed inset-0 z-50 lg:hidden
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* 背景 */}
        <div className="absolute inset-0 bg-gray-50" />

        {/* 内容容器 */}
        <div className="relative h-full flex flex-col" style={{ paddingTop: 'var(--safe-area-inset-top, 0px)', paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}>
          {/* 头部：关闭按钮 + Logo */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100">
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <picture>
              <source srcSet="/logo/logo-full-transparent-light-256.webp" type="image/webp" />
              <Image
                src="/logo/logo-full-transparent-light.png"
                alt="Voicica.AI"
                width={110}
                height={22}
                className="h-5 w-auto"
              />
            </picture>
            {/* 占位，保持 Logo 居中 */}
            <div className="w-9" />
          </div>

          {/* 滚动区域 */}
          <div className="flex-1 overflow-y-auto pb-8">
            {/* HOME */}
            {renderMobileSection(t('studio.menu.home'), studioMenuCategories.main)}

            {/* VOICEOVER AI */}
            {renderMobileSection('VOICEOVER AI', studioMenuCategories.voiceover)}

            {/* MUSIC AI */}
            {renderMobileSection('MUSIC AI', studioMenuCategories.music)}

            {/* STORY MAKER AI */}
            {renderMobileSection('STORY MAKER AI', studioMenuCategories.story)}

            {/* FREE TOOLS */}
            {renderMobileSection(t('studio.menu.tools'), studioMenuCategories.tools)}

            {/* ACCOUNT */}
            {renderMobileSection(t('studio.menu.account'), studioMenuCategories.account)}
          </div>
        </div>
      </div>

      {/* ========== 桌面端侧边栏 ========== */}
      <nav
        className={`
          hidden lg:block fixed left-0 bg-white border-r border-gray-200 overflow-y-auto
          top-[60px] h-[calc(100vh-60px)] z-20
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-64' : 'w-16'}
        `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {renderMenuContent()}
      </nav>
    </>
  );
}