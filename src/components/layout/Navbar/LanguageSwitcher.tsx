'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage, locales } from '@/contexts/LanguageContext';

interface LanguageSwitcherProps {
  theme?: 'light' | 'dark';
  variant?: 'full' | 'compact';
  showArrow?: boolean;
  /** 下拉菜单弹出方向 */
  dropdownPosition?: 'up' | 'down';
}

export default function LanguageSwitcher({
  theme = 'light',
  variant = 'full',
  showArrow = true,
  dropdownPosition = 'down'
}: LanguageSwitcherProps = {}) {
  const { locale, setLocale, isReady } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLocale = locales.find((l) => l.code === locale) || locales[0];

  // Theme-based styles
  // theme="dark" → 用于白色/浅色背景（深色文字）
  // theme="light" → 用于深色背景（浅色文字）
  // 弹出层统一使用白色背景
  const buttonStyles = theme === 'dark'
    ? 'text-gray-700 hover:text-gray-900'
    : 'text-white hover:text-purple-400';

  // 弹出层统一白色背景
  const dropdownStyles = 'bg-white border-gray-200 shadow-xl';
  const itemStyles = 'text-gray-700 hover:bg-purple-100 hover:text-purple-700';
  const activeItemStyles = 'bg-purple-50 text-purple-600 font-medium';

  // 下拉菜单位置样式
  const positionStyles = dropdownPosition === 'up'
    ? 'bottom-full mb-2 left-0'
    : 'top-full mt-2 right-0';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 transition-all ${variant === 'compact' ? 'p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white' : buttonStyles}`}
        aria-label="Switch language"
      >
        <svg className={variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {variant === 'full' && (
          <span className="hidden sm:inline text-sm font-medium" suppressHydrationWarning>
            {isReady ? currentLocale.nativeName : ''}
          </span>
        )}
        {showArrow && (
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className={`absolute w-48 rounded-lg border py-1 z-50 ${positionStyles} ${dropdownStyles}`}>
          {locales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => {
                setLocale(loc.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 transition-colors ${
                locale === loc.code ? activeItemStyles : itemStyles
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{loc.nativeName}</span>
                {locale === loc.code && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}