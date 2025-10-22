import * as CountryFlags from 'country-flag-icons/react/3x2';
import { PRIORITY_COUNTRIES, COUNTRY_CODE_MAP } from './constants';
import type { ComponentType, SVGProps } from 'react';

/**
 * 获取国旗 SVG 组件类型
 */
export function getCountryFlagComponent(countryCode: string): ComponentType<SVGProps<SVGSVGElement>> | null {
  const code = COUNTRY_CODE_MAP[countryCode] || countryCode;
  const FlagComponent = (CountryFlags as any)[code];
  return FlagComponent || null;
}

/**
 * 根据当前语言对国家列表进行排序
 */
export function sortCountriesByLanguage(countryList: string[], currentLang: string): string[] {
  const priority = PRIORITY_COUNTRIES[currentLang] || [];

  // 将国家分为优先和其他两组
  const priorityList = priority.filter(country => countryList.includes(country));
  const otherList = countryList.filter(country => !priority.includes(country)).sort();

  return [...priorityList, ...otherList];
}
