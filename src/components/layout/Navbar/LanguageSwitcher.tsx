'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage, locales } from '@/contexts/LanguageContext';

interface LanguageSwitcherProps {
  theme?: 'light' | 'dark';
  variant?: 'full' | 'compact' | 'pink' | 'pink-icon' | 'native';
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

  // 弹出层统一白色背景
  const dropdownStyles = 'bg-white/95 backdrop-blur-xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl overflow-hidden';
  const itemStyles = 'text-gray-600 hover:bg-pink-50 hover:text-pink-600';
  const activeItemStyles = 'bg-pink-50 text-pink-600 font-bold';

  // 下拉菜单位置样式
  const positionStyles = dropdownPosition === 'up'
    ? 'bottom-full mb-3 left-1/2 -translate-x-1/2'
    : 'top-full mt-3 right-0';

  // Pink icon only variant - 移动端用
  if (variant === 'pink-icon') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center p-1 rounded-full hover:bg-pink-50/50 transition-all duration-200"
          aria-label="Switch language"
        >
          {/* 淡粉背景 + 粉色图标 */}
          <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </button>

        {/* 下拉菜单 */}
        <div className={`absolute w-40 py-1.5 z-50 transition-all duration-200 transform origin-top-right ${positionStyles} ${dropdownStyles} ${isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
          }`}>
          {locales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => {
                setLocale(loc.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 transition-colors text-sm ${locale === loc.code ? activeItemStyles : itemStyles
                }`}
            >
              <div className="flex items-center justify-between">
                <span>{loc.nativeName}</span>
                {locale === loc.code && (
                  <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
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
      </div>
    );
  }

  // Native variant - 适用于 native app 深色主题
  if (variant === 'native') {
    const nativeDropdownStyles = 'bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-2xl overflow-hidden';
    const nativeItemStyles = 'text-white/70 hover:bg-white/10 hover:text-white';
    const nativeActiveItemStyles = 'bg-purple-500/20 text-purple-400 font-medium';

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95"
          aria-label="Switch language"
        >
          <svg className="w-4.5 h-4.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* 下拉菜单 - 深色主题 */}
        <div className={`absolute w-40 py-1.5 z-50 transition-all duration-200 transform origin-top-right ${positionStyles} ${nativeDropdownStyles} ${isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
          }`}>
          {locales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => {
                setLocale(loc.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 transition-colors text-sm ${locale === loc.code ? nativeActiveItemStyles : nativeItemStyles
                }`}
            >
              <div className="flex items-center justify-between">
                <span>{loc.nativeName}</span>
                {locale === loc.code && (
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
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
      </div>
    );
  }

  // Pink variant - 新的粉色样式
  if (variant === 'pink') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-pink-50/50 transition-all duration-200"
          aria-label="Switch language"
        >
          {/* 淡粉背景 + 粉色图标 */}
          <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {/* 语言名称 */}
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap" suppressHydrationWarning>
            {isReady ? currentLocale.nativeName : ''}
          </span>
        </button>

        {/* 下拉菜单 */}
        <div className={`absolute w-40 py-1.5 z-50 transition-all duration-200 transform origin-top-right ${positionStyles} ${dropdownStyles} ${isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
          }`}>
          {locales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => {
                setLocale(loc.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 transition-colors text-sm ${locale === loc.code ? activeItemStyles : itemStyles
                }`}
            >
              <div className="flex items-center justify-between">
                <span>{loc.nativeName}</span>
                {locale === loc.code && (
                  <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
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
      </div>
    );
  }

  // Theme-based styles for other variants
  // For 'full' variant, don't use fixed dimensions; for compact, use circular button
  const buttonStyles = theme === 'dark'
    ? variant === 'full'
      ? 'text-pink-500 hover:bg-pink-50 rounded-lg px-3 py-2'
      : 'text-pink-500 bg-pink-50 hover:bg-pink-100 rounded-full w-10 h-10 justify-center'
    : variant === 'full'
      ? 'text-gray-300 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2'
      : 'text-white bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 justify-center';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 transition-all duration-300 ${variant === 'compact' ? 'p-2 rounded-full hover:bg-pink-50 text-gray-500 hover:text-pink-500' : buttonStyles}`}
        aria-label="Switch language"
      >
        {/* Globe Icon */}
        <div className={`flex items-center justify-center ${variant === 'compact' ? '' : 'w-full h-full'}`}>
          <svg className={variant === 'compact' ? 'w-6 h-6' : 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {variant === 'full' && (
          <span className="hidden sm:inline text-sm font-medium pr-2" suppressHydrationWarning>
            {isReady ? currentLocale.nativeName : ''}
          </span>
        )}
        {showArrow && variant === 'full' && (
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* 下拉菜单 */}
      <div className={`absolute w-40 py-1.5 z-50 transition-all duration-200 transform origin-top-right ${positionStyles} ${dropdownStyles} ${isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
        }`}>
        {locales.map((loc) => (
          <button
            key={loc.code}
            onClick={() => {
              setLocale(loc.code);
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 transition-colors text-sm ${locale === loc.code ? activeItemStyles : itemStyles
              }`}
          >
            <div className="flex items-center justify-between">
              <span>{loc.nativeName}</span>
              {locale === loc.code && (
                <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
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
    </div>
  );
}
