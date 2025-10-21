import { apiClient } from './client';

/**
 * 枚举值相关 API
 */

// 获取国家代码列表
export const getCountries = () => {
  return apiClient.get<Array<{ value: string; label: string }>>('/api/v1/enums/countries');
};

// 获取指定国家支持的语言列表
export const getVoiceLanguagesByCountry = (countryCode?: string) => {
  return apiClient.get<string[]>('/api/v1/enums/voice-languages-by-country', {
    params: countryCode ? { country_code: countryCode } : undefined,
  });
};