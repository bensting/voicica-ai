/**
 * AppLixir 广告配置（Web 端激励广告）
 * https://www.applixir.com/
 */

export interface AppLixirConfig {
  /** API Key - 从 AppLixir 后台 GENERAL 页面获取 */
  apiKey: string;
  /** 是否启用（false 时使用模拟广告） */
  enabled: boolean;
}

/**
 * 开发环境配置
 */
const devConfig: AppLixirConfig = {
  apiKey: '6efa877c-8828-4355-977a-fd57996ddcbf',
  enabled: true, // 开发环境也启用，方便测试
};

/**
 * 生产环境配置
 */
const prodConfig: AppLixirConfig = {
  apiKey: '6efa877c-8828-4355-977a-fd57996ddcbf',
  enabled: true,
};

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const applixirConfig: AppLixirConfig = isProduction ? prodConfig : devConfig;

/**
 * 获取 AppLixir API Key
 */
export function getAppLixirApiKey(): string {
  return applixirConfig.apiKey;
}

/**
 * 检查 AppLixir 是否启用
 */
export function isAppLixirEnabled(): boolean {
  return applixirConfig.enabled;
}
