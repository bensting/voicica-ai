'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

type Locale = 'en-US' | 'zh-CN' | 'zh-TW' | 'th-TH';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, unknown>) => string;
  isReady: boolean; // 添加就绪状态
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

type MessageValue = string | Record<string, unknown>;

// 检测浏览器语言
const detectBrowserLanguage = (): Locale => {
  if (typeof window === 'undefined') return 'en-US';

  const browserLang = navigator.language.toLowerCase();

  // 匹配浏览器语言到支持的语言
  if (browserLang.startsWith('zh')) {
    if (browserLang.includes('tw') || browserLang.includes('hk') || browserLang.includes('hant')) {
      return 'zh-TW';
    }
    return 'zh-CN';
  }

  return 'en-US';
};

// 获取初始 locale（在组件外部，只执行一次）
const getInitialLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en-US';

  const savedLocale = localStorage.getItem('locale') as Locale;
  if (savedLocale && ['en-US', 'zh-CN', 'zh-TW', 'th-TH'].includes(savedLocale)) {
    return savedLocale;
  }

  return detectBrowserLanguage();
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  // 使用函数式初始化，避免后续状态变化
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());
  const [messages, setMessages] = useState<Record<string, MessageValue>>({});
  const [isReady, setIsReady] = useState(false);

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
          toolsModule,
          historyModule,
          settingsModule,
          shareModule,
          pwaModule,
          languagesModule,
          countriesModule,
          ttsSamplesModule,
          ttsInputModule,
          voiceStylesModule,
        ] = await Promise.all([
          import(`@/i18n/locales/${locale}/common.json`),
          import(`@/i18n/locales/${locale}/auth.json`),
          import(`@/i18n/locales/${locale}/home.json`),
          import(`@/i18n/locales/${locale}/pricing.json`),
          import(`@/i18n/locales/${locale}/studio.json`),
          import(`@/i18n/locales/${locale}/tools.json`),
          import(`@/i18n/locales/${locale}/history.json`),
          import(`@/i18n/locales/${locale}/settings.json`),
          import(`@/i18n/locales/${locale}/share.json`),
          import(`@/i18n/locales/${locale}/pwa.json`),
          import(`@/i18n/locales/${locale}/data/languages.json`),
          import(`@/i18n/locales/${locale}/data/countries.json`),
          import(`@/i18n/locales/${locale}/tts-samples.json`),
          import(`@/i18n/locales/${locale}/tts-input.json`),
          import(`@/i18n/locales/${locale}/voice-styles.json`),
        ]);

        // 合并所有模块的消息
        setMessages({
          ...commonModule.default,
          ...authModule.default,
          ...homeModule.default,
          ...pricingModule.default,
          ...studioModule.default,
          ...toolsModule.default,
          ...historyModule.default,
          ...settingsModule.default,
          ...shareModule.default,
          ...pwaModule.default,
          ...languagesModule.default,
          ...countriesModule.default,
          ttsInput: ttsInputModule.default,
          voiceStyles: voiceStylesModule.default,
          ...ttsSamplesModule.default,
        });

        // 语言文件加载完成后，标记为已就绪
        setIsReady(true);
      } catch (error) {
        console.error(`Failed to load locale ${locale}`, error);
        // 即使加载失败也设置为就绪，避免一直卡住
        setIsReady(true);
      }
    };
    loadMessages();
  }, [locale]);

  const setLocale = useMemo(
    () => (newLocale: Locale) => {
      setLocaleState(newLocale);
      localStorage.setItem('locale', newLocale);
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
      if (params && typeof result === 'string') {
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
  { code: 'th-TH', name: 'Thai', nativeName: 'ภาษาไทย' },
];