/**
 * 登录方式配置类型定义
 */

import { ReactNode } from 'react';

// 登录提供商类型
export type LoginProvider = 'google' | 'apple' | 'twitter' | 'facebook';

// 登录配置项
export interface LoginProviderConfig {
  id: LoginProvider;
  labelKey: string; // 国际化 key
  enabled: boolean; // 是否启用
  icon: ReactNode; // 图标组件
  order: number; // 显示顺序
}