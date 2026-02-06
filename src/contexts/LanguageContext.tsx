'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

export type Locale = 'en-US' | 'zh-CN' | 'zh-TW' | 'th-TH' | 'my-MM' | 'id-ID' | 'ja-JP' | 'vi-VN' | 'es-ES' | 'pt-BR' | 'hi-IN' | 'ar-SA';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, unknown>) => string;
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

type MessageValue = string | Record<string, unknown>;

// 支持的语言列表
const SUPPORTED_LOCALES: Locale[] = ['en-US', 'zh-CN', 'zh-TW', 'th-TH', 'my-MM', 'id-ID', 'ja-JP', 'vi-VN', 'es-ES', 'pt-BR', 'hi-IN', 'ar-SA'];
const DEFAULT_LOCALE: Locale = 'en-US';

/**
 * 从 cookie 读取语言设置
 * 可在客户端调用，读取 middleware 设置的 locale cookie
 * 返回 null 表示没有设置过语言
 */
function getLocaleFromCookie(): Locale | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
  const locale = match?.[1] as Locale | undefined;

  if (locale && SUPPORTED_LOCALES.includes(locale)) {
    return locale;
  }

  return null;
}

/**
 * 检测浏览器/设备语言偏好
 * 支持精确匹配和语言族匹配
 */
function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;

  // 获取浏览器语言列表（按优先级排序）
  const browserLanguages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const browserLang of browserLanguages) {
    // 标准化语言代码 (zh-Hans -> zh-CN, zh-Hant -> zh-TW)
    const normalizedLang = browserLang.toLowerCase();

    // 1. 精确匹配 (如 zh-CN, en-US)
    const exactMatch = SUPPORTED_LOCALES.find(
      (loc) => loc.toLowerCase() === normalizedLang
    );
    if (exactMatch) return exactMatch;

    // 2. 处理中文变体
    if (normalizedLang.startsWith('zh')) {
      // 简体中文: zh-hans, zh-cn, zh-sg
      if (
        normalizedLang.includes('hans') ||
        normalizedLang.includes('cn') ||
        normalizedLang.includes('sg')
      ) {
        return 'zh-CN';
      }
      // 繁体中文: zh-hant, zh-tw, zh-hk, zh-mo
      if (
        normalizedLang.includes('hant') ||
        normalizedLang.includes('tw') ||
        normalizedLang.includes('hk') ||
        normalizedLang.includes('mo')
      ) {
        return 'zh-TW';
      }
      // 默认中文使用简体
      return 'zh-CN';
    }

    // 3. 语言族匹配 (如 en -> en-US, ja -> ja-JP)
    const langPrefix = normalizedLang.split('-')[0];
    const prefixMatch = SUPPORTED_LOCALES.find(
      (loc) => loc.toLowerCase().startsWith(langPrefix + '-')
    );
    if (prefixMatch) return prefixMatch;
  }

  return DEFAULT_LOCALE;
}

/**
 * 获取初始语言
 * 优先级: cookie > 浏览器语言 > 默认语言
 */
function getInitialLocale(): Locale {
  const cookieLocale = getLocaleFromCookie();
  if (cookieLocale) return cookieLocale;

  return detectBrowserLocale();
}

/**
 * 设置语言 cookie
 */
function setLocaleCookie(locale: Locale): void {
  if (typeof document === 'undefined') return;

  // 设置 1 年有效期的 cookie
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `locale=${locale}; path=/; max-age=${maxAge}; samesite=lax`;
}

interface LanguageProviderProps {
  children: ReactNode;
  initialLocale?: Locale; // 从服务端传入的初始语言
}

export function LanguageProvider({ children, initialLocale }: LanguageProviderProps) {
  // 使用服务端传入的语言，或默认语言
  const [locale, setLocaleState] = useState<Locale>(initialLocale || DEFAULT_LOCALE);
  const [messages, setMessages] = useState<Record<string, MessageValue>>({});
  const [isReady, setIsReady] = useState(false);

  // 如果没有传入 initialLocale，挂载后自动检测语言
  // 优先级: cookie > 浏览器语言 > 默认语言
  useEffect(() => {
    if (!initialLocale) {
      const detectedLocale = getInitialLocale();
      setLocaleState(detectedLocale);
    }
  }, [initialLocale]);

  // 加载语言文件（按页面模块拆分）
  useEffect(() => {
    const loadMessages = async () => {
      try {
        // 每次切换语言时，先设置为未就绪
        setIsReady(false);

        // 并行加载所有模块化的语言文件
        // 注意: FAQ 内容已移至 faqConfig.ts，不再通过 i18n 加载
        const [
          commonModule,
          authModule,
          homeModule,
          pricingModule,
          studioModule,
          ttsModule,
          toolsModule,
          historyModule,
          settingsModule,
          shareModule,
          pwaModule,
          languagesModule,
          countriesModule,
          ttsSamplesModule,
          voiceStylesModule,
          videoModule,
          ttsPromoModule,
          paymentModule,
          dailyTasksModule,
          appDownloadModule,
          storyModule,
          nativeModule,
        ] = await Promise.all([
          import(`@/i18n/locales/${locale}/common.json`),
          import(`@/i18n/locales/${locale}/auth.json`),
          import(`@/i18n/locales/${locale}/home.json`),
          import(`@/i18n/locales/${locale}/pricing.json`),
          import(`@/i18n/locales/${locale}/studio.json`),
          import(`@/i18n/locales/${locale}/tts.json`),
          import(`@/i18n/locales/${locale}/tools.json`),
          import(`@/i18n/locales/${locale}/history.json`),
          import(`@/i18n/locales/${locale}/settings.json`),
          import(`@/i18n/locales/${locale}/share.json`),
          import(`@/i18n/locales/${locale}/pwa.json`),
          import(`@/i18n/locales/${locale}/data/languages.json`),
          import(`@/i18n/locales/${locale}/data/countries.json`),
          import(`@/i18n/locales/${locale}/tts-samples.json`),
          import(`@/i18n/locales/${locale}/voice-styles.json`),
          import(`@/i18n/locales/${locale}/video.json`),
          import(`@/i18n/locales/${locale}/tts-promo.json`),
          import(`@/i18n/locales/${locale}/payment.json`),
          import(`@/i18n/locales/${locale}/daily-tasks.json`),
          import(`@/i18n/locales/${locale}/app-download.json`),
          import(`@/i18n/locales/${locale}/story.json`),
          import(`@/i18n/locales/${locale}/native.json`),
        ]);

        // 合并所有模块的消息
        setMessages({
          ...commonModule.default,
          ...authModule.default,
          ...homeModule.default,
          ...pricingModule.default,
          ...studioModule.default,
          ...ttsModule.default,
          ...toolsModule.default,
          ...historyModule.default,
          ...settingsModule.default,
          ...shareModule.default,
          ...pwaModule.default,
          ...languagesModule.default,
          ...countriesModule.default,
          voiceStyles: voiceStylesModule.default,
          ...ttsSamplesModule.default,
          ...videoModule.default,
          ...ttsPromoModule.default,
          ...paymentModule.default,
          ...dailyTasksModule.default,
          ...appDownloadModule.default,
          ...storyModule.default,
          ...nativeModule.default,
        });

        // 语言文件加载完成后，标记为已就绪
        setIsReady(true);
      } catch (error) {
        console.error(`Failed to load locale ${locale}`, error);
        // 即使加载失败也设置为就绪，避免一直卡住
        setIsReady(true);
      }
    };
    void loadMessages();
  }, [locale]);

  const setLocale = useMemo(
    () => (newLocale: Locale) => {
      setLocaleState(newLocale);
      setLocaleCookie(newLocale); // 保存到 cookie，下次访问 middleware 可读取
    },
    []
  );

  // 翻译函数（支持参数插值）
  const t = useMemo(
    () => (key: string, params?: Record<string, unknown>): string => {
      const keys = key.split('.');
      let value: MessageValue | undefined = messages;

      for (const k of keys) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          value = (value as Record<string, MessageValue>)[k];
        } else {
          return key; // 如果找不到，返回 key 本身
        }
      }

      let result = typeof value === 'string' ? value : key;

      // 如果提供了参数，进行插值替换
      if (params) {
        Object.keys(params).forEach((paramKey) => {
          const regex = new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g');
          result = result.replace(regex, String(params[paramKey]));
        });
      }

      return result;
    },
    [messages]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, isReady }),
    [locale, setLocale, t, isReady]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// 语言配置
export const locales: { code: Locale; name: string; nativeName: string }[] = [
  { code: 'en-US', name: 'English', nativeName: 'English' },
  { code: 'zh-CN', name: 'Simplified Chinese', nativeName: '简体中文' },
  { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
  { code: 'th-TH', name: 'Thai', nativeName: 'ภาษาไทย' },
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'my-MM', name: 'Burmese', nativeName: 'မြန်မာဘာသာ' },
  { code: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية' },
];