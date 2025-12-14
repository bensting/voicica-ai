/**
 * 激励广告统一配置
 *
 * 支持在 AppLixir（Web）和 AdMob（原生）之间切换
 *
 * 使用场景：
 * - 上架前：使用 AppLixir（不需要 Google Play 审核）
 * - 上架后：使用 AdMob（更高收益）
 */

/**
 * 激励广告提供商
 */
export type RewardedAdProvider = 'applixir' | 'admob' | 'auto';

export interface RewardedAdConfig {
  /**
   * 激励广告提供商
   * - 'applixir': 强制使用 AppLixir（Web 端）
   * - 'admob': 强制使用 AdMob（原生端）
   * - 'auto': 自动选择（原生环境用 AdMob，Web 用 AppLixir）
   */
  provider: RewardedAdProvider;
}

/**
 * 开发环境配置
 */
const devConfig: RewardedAdConfig = {
  provider: 'auto', // 开发环境自动选择
};

/**
 * 生产环境配置
 *
 * ⚠️ 上架前：设为 'applixir' 或 'auto'
 * ⚠️ 上架后：设为 'admob' 或 'auto' 以获得更高收益
 */
const prodConfig: RewardedAdConfig = {
  provider: 'auto', // ⚠️ 上架后改为 'admob' 或 'auto'
};

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const rewardedAdConfig: RewardedAdConfig = isProduction ? prodConfig : devConfig;

/**
 * 获取当前激励广告提供商
 */
export function getRewardedAdProvider(): RewardedAdProvider {
  return rewardedAdConfig.provider;
}

/**
 * 判断是否应该使用 AdMob
 * @param isNativePlatform 是否在原生平台运行
 */
export function shouldUseAdMob(isNativePlatform: boolean): boolean {
  const { provider } = rewardedAdConfig;

  if (provider === 'admob') {
    return true;
  }

  if (provider === 'applixir') {
    return false;
  }

  // auto 模式：原生环境用 AdMob，Web 用 AppLixir
  return isNativePlatform;
}

/**
 * 判断是否应该使用 AppLixir
 * @param isNativePlatform 是否在原生平台运行
 */
export function shouldUseAppLixir(isNativePlatform: boolean): boolean {
  return !shouldUseAdMob(isNativePlatform);
}