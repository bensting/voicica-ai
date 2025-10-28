'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Locale = 'en' | 'zh-CN' | 'zh-TW';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  isReady: boolean; // 添加就绪状态
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

type MessageValue = string | Record<string, unknown>;

// 检测浏览器语言
const detectBrowserLanguage = (): Locale => {
  if (typeof window === 'undefined') return 'en';

  const browserLang = navigator.language.toLowerCase();

  // 匹配浏览器语言到支持的语言
  if (browserLang.startsWith('zh')) {
    if (browserLang.includes('tw') || browserLang.includes('hk') || browserLang.includes('hant')) {
      return 'zh-TW';
    }
    return 'zh-CN';
  }

  return 'en';
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  // 初始状态始终为 'en'，避免 hydration 不匹配
  const [locale, setLocaleState] = useState<Locale>('en');
  const [messages, setMessages] = useState<Record<string, MessageValue>>({});
  const [isReady, setIsReady] = useState(false);

  // 在客户端检测语言设置
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && ['en', 'zh-CN', 'zh-TW'].includes(savedLocale)) {
      // 优先使用保存的语言
      setLocaleState(savedLocale);
    } else {
      // 如果没有保存的语言，检测浏览器语言
      const detectedLocale = detectBrowserLanguage();
      setLocaleState(detectedLocale);
    }
    // 标记为已就绪
    setIsReady(true);
  }, []);

  // 加载语言文件（主文件 + FAQ 文件）
  useEffect(() => {
    const loadMessages = async () => {
      try {
        // 加载主语言文件
        const messagesModule = await import(`@/i18n/locales/${locale}.json`);
        const mainMessages = messagesModule.default;

        // 加载 FAQ 语言文件
        const faqModule = await import(`@/i18n/locales/${locale}/faq.json`);
        const faqMessages = faqModule.default;

        // 合并消息
        setMessages({
          ...mainMessages,
          faq: faqMessages
        });
      } catch (error) {
        console.error(`Failed to load locale ${locale}`, error);
      }
    };
    loadMessages();
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  // 简单的翻译函数
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: MessageValue | undefined = messages;

    for (const k of keys) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        value = (value as Record<string, MessageValue>)[k];
      } else {
        return key; // 如果找不到，返回 key 本身
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
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
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh-CN', name: 'Simplified Chinese', nativeName: '简体中文' },
  { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文' },
];