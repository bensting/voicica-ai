/**
 * Unity Ads 广告配置
 *
 * Unity Ads 用于每日任务/挖矿中心的激励视频广告
 * 文档: https://docs.unity.com/ads/
 */

export interface UnityAdsConfig {
  /** 是否启用 Unity Ads */
  enabled: boolean;
  /** Android Game ID */
  androidGameId: string;
  /** iOS Game ID */
  iosGameId: string;
  /** 是否开启测试模式 */
  testMode: boolean;
  /** Android 激励视频广告位 ID */
  androidRewardedPlacementId: string;
  /** iOS 激励视频广告位 ID */
  iosRewardedPlacementId: string;
}

/**
 * 开发环境配置
 */
const devConfig: UnityAdsConfig = {
  enabled: true,
  androidGameId: '6058964',
  iosGameId: '6058965',
  testMode: true,
  androidRewardedPlacementId: 'Rewarded_Android',
  iosRewardedPlacementId: 'Rewarded_iOS',
};

/**
 * 生产环境配置
 *
 * ⚠️ 使用前需要：
 * 1. 在 Unity Dashboard 创建项目并获取 Game ID
 * 2. 填入真实 Game ID 和 Placement ID
 * 3. 将 enabled 设为 true
 * 4. 在 rewarded.ts 中配置 sceneOverrides
 */
const prodConfig: UnityAdsConfig = {
  enabled: true,
  androidGameId: '6058964',
  iosGameId: '6058965',
  testMode: false,
  androidRewardedPlacementId: 'Rewarded_Android',
  iosRewardedPlacementId: 'Rewarded_iOS',
};

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const unityConfig: UnityAdsConfig = isProduction ? prodConfig : devConfig;

/**
 * 获取当前平台的 Game ID
 */
export function getUnityGameId(platform: 'android' | 'ios'): string {
  return platform === 'android' ? unityConfig.androidGameId : unityConfig.iosGameId;
}

/**
 * 检查 Unity Ads 是否启用
 */
export function isUnityEnabled(): boolean {
  return unityConfig.enabled;
}

/**
 * 获取当前平台的激励视频广告位 ID
 */
export function getUnityRewardedPlacementId(platform?: 'android' | 'ios'): string {
  const p = platform || 'android';
  return p === 'android' ? unityConfig.androidRewardedPlacementId : unityConfig.iosRewardedPlacementId;
}
