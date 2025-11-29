/**
 * 登录方式配置统一入口
 *
 * 根据环境变量自动选择开发或生产配置
 */

import { loginProviders as devProviders } from './providers.development';
import { loginProviders as prodProviders } from './providers.production';
import type { LoginProviderConfig, LoginProvider } from './types';

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const loginProviders: LoginProviderConfig[] = isProduction ? prodProviders : devProviders;

// 导出类型
export type { LoginProviderConfig, LoginProvider };

/**
 * 获取已启用的登录方式（按 order 排序）
 */
export function getEnabledLoginProviders(): LoginProviderConfig[] {
  return loginProviders
    .filter(provider => provider.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * 根据 ID 获取登录方式配置
 */
export function getLoginProviderById(id: LoginProvider): LoginProviderConfig | undefined {
  return loginProviders.find(provider => provider.id === id);
}

/**
 * 检查某个登录方式是否启用
 */
export function isLoginProviderEnabled(id: LoginProvider): boolean {
  const provider = getLoginProviderById(id);
  return provider?.enabled ?? false;
}