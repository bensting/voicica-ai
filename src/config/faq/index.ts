/**
 * FAQ 配置统一入口
 *
 * 根据语言代码获取对应的 FAQ 数据
 */

import { faqData as enUS } from './data/en-US';
import { faqData as zhCN } from './data/zh-CN';
import { faqData as zhTW } from './data/zh-TW';
import { faqData as thTH } from './data/th-TH';
import type { FAQData, FAQItem } from './types';

// 语言数据映射
const localeDataMap: Record<string, FAQData> = {
  'en-US': enUS,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'th-TH': thTH,
};

// 导出类型
export type { FAQData, FAQItem };

/**
 * 根据语言获取 FAQ 数据
 */
export function getFAQData(locale: string): FAQData {
  return localeDataMap[locale] || localeDataMap['en-US'];
}

/**
 * 获取所有支持的语言
 */
export function getSupportedLocales(): string[] {
  return Object.keys(localeDataMap);
}