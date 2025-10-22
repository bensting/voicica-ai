'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Locale = 'en' | 'zh-CN' | 'zh-TW';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
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
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'en';

    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && ['en', 'zh-CN', 'zh-TW'].includes(savedLocale)) {
      return savedLocale;
    }

    // 如果没有保存的语言设置，检测浏览器语言
    return detectBrowserLanguage();
  });
  const [messages, setMessages] = useState<Record<string, MessageValue>>({});

  // 从 localStorage 加载语言设置
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && ['en', 'zh-CN', 'zh-TW'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
  }, []);

  // 加载语言文件
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const messagesModule = await import(`@/i18n/locales/${locale}.json`);
        setMessages(messagesModule.default);
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
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
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