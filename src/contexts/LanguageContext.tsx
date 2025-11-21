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

  // 加载语言文件（主文件 + FAQ 文件 + TTS Samples 文件 + TTS Input 文件）
  useEffect(() => {
    const loadMessages = async () => {
      try {
        // 每次切换语言时，先设置为未就绪
        setIsReady(false);

        // 加载主语言文件
        const messagesModule = await import(`@/i18n/locales/${locale}.json`);
        const mainMessages = messagesModule.default;

        // 加载 FAQ 语言文件
        const faqModule = await import(`@/i18n/locales/${locale}/faq.json`);
        const faqMessages = faqModule.default;

        // 加载 TTS Samples 语言文件
        const ttsSamplesModule = await import(`@/i18n/locales/${locale}/tts-samples.json`);
        const ttsSamplesMessages = ttsSamplesModule.default;

        // 加载 TTS Input 语言文件
        const ttsInputModule = await import(`@/i18n/locales/${locale}/tts-input.json`);
        const ttsInputMessages = ttsInputModule.default;

        // 加载 Voice Styles 语言文件
        const voiceStylesModule = await import(`@/i18n/locales/${locale}/voice-styles.json`);
        const voiceStylesMessages = voiceStylesModule.default;

        // 合并消息
        setMessages({
          ...mainMessages,
          faq: faqMessages,
          ttsInput: ttsInputMessages,
          voiceStyles: voiceStylesMessages,
          ...ttsSamplesMessages
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