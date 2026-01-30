'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { studioMenuCategories, categoryOrder } from '@/config/studioMenu';
import type { MenuCategory } from '@/config/studioMenu';

interface StudioSidebarProps {
  /** 桌面端不需要，移动端需要控制打开/关闭 */
  isOpen?: boolean;
  /** 桌面端不需要，移动端需要关闭回调 */
  onClose?: () => void;
}

/**
 * Studio 侧边栏组件（响应式）- 少女粉风格
 */
export default function StudioSidebar({ isOpen = false, onClose }: StudioSidebarProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  // 渲染分类区块（桌面端用）
  const renderCategorySection = (categoryKey: MenuCategory, labelKey: string, withBorder?: boolean) => {
    const items = studioMenuCategories[categoryKey];
    if (items.length === 0) return null;

    return (
      <div className={`mb-2 ${withBorder ? 'border-t border-pink-100 pt-2' : ''}`}>
        <div className={`px-4 py-1.5 ${isExpanded ? 'lg:block' : 'lg:hidden'}`}>
          <span className="text-xs font-semibold text-pink-400 uppercase">
            {t(labelKey)}
          </span>
        </div>
        {items.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <div key={item.id}>
              <Link
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-white/80 shadow-sm'
                    : 'hover:bg-white'
                  }
                `}
              >
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                  ${isActive
                    ? 'bg-gradient-to-br from-pink-400 to-rose-400 text-white shadow-sm'
                    : 'bg-white/60 text-pink-500'
                  }
                `}>
                  {item.icon}
                </div>
                <span
                  className={`
                    text-sm font-medium whitespace-nowrap transition-all
                    lg:transition-opacity lg:duration-300
                    ${isExpanded ? 'lg:opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}
                    ${isActive ? 'text-pink-600' : 'text-gray-600'}
                  `}
                >
                  {t(item.labelKey)}
                </span>
                {/* 选中指示器 */}
                {isActive && isExpanded && (
                  <div className="ml-auto w-1 h-5 bg-gradient-to-b from-pink-400 to-rose-400 rounded-full" />
                )}
              </Link>
              {/* 分隔线 */}
              {index < items.length - 1 && (
                <div className={`mx-4 border-b border-pink-100/50 ${isExpanded ? '' : 'lg:mx-3'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染菜单内容（桌面端用）
  const renderMenuContent = () => (
    <div className="py-4">
        {/* 主要功能 */}
        <div className="mb-2">
          {studioMenuCategories.main.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <div key={item.id}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-white/80 shadow-sm'
                      : 'hover:bg-white'
                    }
                  `}
                >
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                    ${isActive
                      ? 'bg-gradient-to-br from-pink-400 to-rose-400 text-white shadow-sm'
                      : 'bg-white/60 text-pink-500'
                    }
                  `}>
                    {item.icon}
                  </div>
                  <span
                    className={`
                      text-sm font-medium whitespace-nowrap transition-all
                      lg:transition-opacity lg:duration-300
                      ${isExpanded ? 'lg:opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}
                      ${isActive ? 'text-pink-600' : 'text-gray-600'}
                    `}
                  >
                    {t(item.labelKey)}
                  </span>
                  {isActive && isExpanded && (
                    <div className="ml-auto w-1 h-5 bg-gradient-to-b from-pink-400 to-rose-400 rounded-full" />
                  )}
                </Link>
                {/* 分隔线 */}
                {index < studioMenuCategories.main.length - 1 && (
                  <div className={`mx-4 border-b border-pink-100/50 ${isExpanded ? '' : 'lg:mx-3'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* 按配置顺序渲染分类 */}
        {categoryOrder.map((category) => (
          <div key={category.key}>
            {renderCategorySection(category.key, category.labelKey)}
          </div>
        ))}

        {/* Account (我的账户) - 始终在最后，带分隔线 */}
        {renderCategorySection('account', 'studio.menu.account', true)}
      </div>
    );

  // 渲染移动端菜单项
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
            ? 'bg-pink-50'
            : 'hover:bg-pink-50/50 active:bg-pink-100'}
        `}
      >
        {/* 图标容器 */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all
          ${isActive
            ? 'bg-gradient-to-br from-pink-400 to-rose-400 text-white shadow-sm'
            : 'bg-pink-50 text-pink-500'}
        `}>
          {item.icon}
        </div>
        {/* 文字 */}
        <span className={`flex-1 text-sm font-medium ${isActive ? 'text-pink-600' : 'text-gray-700'}`}>
          {t(item.labelKey)}
        </span>
        {/* 选中指示器或箭头 */}
        {isActive ? (
          <div className="w-1.5 h-6 bg-gradient-to-b from-pink-400 to-rose-400 rounded-full" />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-300" />
        )}
      </Link>
    );
  };

  // 渲染移动端分组卡片
  const renderMobileSection = (title: string, items: { id: string; href: string; icon: React.ReactNode; labelKey: string }[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-5">
        <h3 className="px-5 py-2 text-xs font-semibold text-pink-400 uppercase tracking-wider">
          {title}
        </h3>
        <div className="mx-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-pink-100/50 p-1.5">
          {items.map((item, index) => (
            <div key={item.id}>
              {renderMobileMenuItem(item)}
              {/* 添加分隔线（最后一项不加） */}
              {index < items.length - 1 && (
                <div className="mx-3 border-b border-pink-100/50" />
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
        {/* 淡粉色背景 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-pink-50/30 to-rose-50/50" />

        {/* 内容容器 */}
        <div className="relative h-full flex flex-col" style={{ paddingTop: 'var(--safe-area-inset-top, 0px)', paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}>
          {/* 头部：关闭按钮 + Logo */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-white/60 backdrop-blur-sm border-b border-pink-100/50">
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-pink-400 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-colors"
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
          <div className="flex-1 overflow-y-auto pb-8 pt-4">
            {/* HOME */}
            {renderMobileSection(t('studio.menu.home'), studioMenuCategories.main)}

            {/* 按配置顺序渲染分类 */}
            {categoryOrder.map((category) => (
              <div key={category.key}>
                {renderMobileSection(t(category.labelKey), studioMenuCategories[category.key])}
              </div>
            ))}

            {/* ACCOUNT - 始终在最后 */}
            {renderMobileSection(t('studio.menu.account'), studioMenuCategories.account)}
          </div>
        </div>
      </div>

      {/* ========== 桌面端侧边栏 ========== */}
      <nav
        className={`
          hidden lg:block fixed left-0 overflow-y-auto overflow-x-hidden
          bg-gradient-to-b from-white via-pink-50/40 to-rose-50/60
          border-r border-pink-100/30
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
