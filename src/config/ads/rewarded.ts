/**
 * 激励广告统一配置
 *
 * 支持在 AppLixir（Web）、AdMob（原生）、Appodeal（原生）之间切换
 *
 * 使用场景：
 * - Web 端：使用 AppLixir
 * - 原生端：使用 AdMob 或 Appodeal（根据配置）
 *
 * 提供商选择：
 * - 'applixir': Web 端激励广告
 * - 'admob': Google AdMob，最大广告网络，收益稳定
 * - 'appodeal': 广告聚合平台，整合多个广告网络，可能获得更高 eCPM
 * - 'auto': 自动选择（原生环境用 nativeProvider，Web 用 AppLixir）
 */

/**
 * 激励广告提供商
 */
export type RewardedAdProvider = 'applixir' | 'admob' | 'appodeal' | 'auto';

/**
 * 原生端广告提供商（当 provider 为 'auto' 时使用）
 */
export type NativeAdProvider = 'admob' | 'appodeal';

export interface RewardedAdConfig {
  /**
   * 激励广告提供商
   * - 'applixir': 强制使用 AppLixir（Web 端）
   * - 'admob': 强制使用 AdMob（原生端）
   * - 'appodeal': 强制使用 Appodeal（原生端）
   * - 'auto': 自动选择（原生环境用 nativeProvider，Web 用 AppLixir）
   */
  provider: RewardedAdProvider;

  /**
   * 原生端默认提供商（当 provider 为 'auto' 时使用）
   * @default 'admob'
   */
  nativeProvider: NativeAdProvider;
}

/**
 * 开发环境配置
 */
const devConfig: RewardedAdConfig = {
  provider: 'auto', // 开发环境自动选择
  nativeProvider: 'admob', // 原生端默认使用 AdMob
};

/**
 * 生产环境配置
 *
 * ⚠️ 切换广告提供商：
 * 1. 使用 AdMob: nativeProvider: 'admob'
 * 2. 使用 Appodeal: nativeProvider: 'appodeal'（需先配置 appodeal.ts）
 */
const prodConfig: RewardedAdConfig = {
  provider: 'auto', // 自动选择：原生用 nativeProvider，Web 用 AppLixir
  nativeProvider: 'appodeal', // ⚠️ 切换到 Appodeal 时改为 'appodeal'
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
 * 获取当前应该使用的原生广告提供商
 * @param isNativePlatform 是否在原生平台运行
 * @returns 返回当前应该使用的提供商
 */
export function getNativeAdProvider(isNativePlatform: boolean): 'admob' | 'appodeal' | null {
  const { provider, nativeProvider } = rewardedAdConfig;

  // 非原生平台返回 null
  if (!isNativePlatform) {
    return null;
  }

  // 强制使用特定提供商
  if (provider === 'admob') return 'admob';
  if (provider === 'appodeal') return 'appodeal';
  if (provider === 'applixir') return null; // 强制使用 AppLixir，不使用原生广告

  // auto 模式：使用配置的 nativeProvider
  return nativeProvider;
}

/**
 * 判断是否应该使用 AdMob
 * @param isNativePlatform 是否在原生平台运行
 */
export function shouldUseAdMob(isNativePlatform: boolean): boolean {
  return getNativeAdProvider(isNativePlatform) === 'admob';
}

/**
 * 判断是否应该使用 Appodeal
 * @param isNativePlatform 是否在原生平台运行
 */
export function shouldUseAppodeal(isNativePlatform: boolean): boolean {
  return getNativeAdProvider(isNativePlatform) === 'appodeal';
}

/**
 * 判断是否应该使用 AppLixir
 * @param isNativePlatform 是否在原生平台运行
 */
export function shouldUseAppLixir(isNativePlatform: boolean): boolean {
  const { provider } = rewardedAdConfig;

  // 强制使用 AppLixir
  if (provider === 'applixir') return true;

  // 非原生平台使用 AppLixir（auto 模式）
  if (provider === 'auto' && !isNativePlatform) return true;

  return false;
}