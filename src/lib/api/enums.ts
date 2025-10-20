import { apiClient } from './client';

/**
 * 枚举值相关 API
 */

// 获取国家代码列表
export const getCountries = () => {
  return apiClient.get<Array<{ value: string; label: string }>>('/api/v1/enums/countries');
};