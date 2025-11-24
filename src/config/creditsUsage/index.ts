/**
 * 积分使用规则配置统一入口
 *
 * 根据语言代码获取对应的积分使用数据
 */

import { creditsUsageData as enUS } from './data/en-US';
import { creditsUsageData as zhCN } from './data/zh-CN';
import { creditsUsageData as zhTW } from './data/zh-TW';
import { creditsUsageData as thTH } from './data/th-TH';
import type {
  CreditsUsageData,
  CreditsUsageCategory,
  CreditsUsageFeature,
} from './types';
import { ProductCategoryType } from '../productCategory';

// 语言数据映射
const localeDataMap: Record<string, CreditsUsageData> = {
  'en-US': enUS,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'th-TH': thTH,
};

// 导出类型
export type { CreditsUsageData, CreditsUsageCategory, CreditsUsageFeature };

/**
 * 根据语言获取积分使用数据
 */
export function getCreditsUsageData(locale: string): CreditsUsageData {
  return localeDataMap[locale] || localeDataMap['en-US'];
}

/**
 * 根据语言和分类获取对应的积分规则
 */
export function getCreditsUsageByCategory(
  locale: string,
  categoryId: ProductCategoryType
): CreditsUsageCategory | undefined {
  const data = getCreditsUsageData(locale);
  return data.categories.find((cat) => cat.id === categoryId);
}

/**
 * 获取所有支持的语言
 */
export function getSupportedLocales(): string[] {
  return Object.keys(localeDataMap);
}