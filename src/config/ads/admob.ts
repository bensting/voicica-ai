/**
 * Google AdMob 广告配置（移动端）
 */

export interface AdMobConfig {
  /** Android 应用 ID */
  androidAppId: string;
  /** iOS 应用 ID */
  iosAppId: string;
  /** 激励广告单元 */
  rewarded: {
    android: string;
    ios: string;
  };
  /** 开屏广告单元 */
  appOpen: {
    android: string;
    ios: string;
  };
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 开发环境配置（使用 Google 测试广告 ID）
 * https://developers.google.com/admob/android/test-ads
 */
const devConfig: AdMobConfig = {
  androidAppId: 'ca-app-pub-3940256099942544~3347511713',
  iosAppId: 'ca-app-pub-3940256099942544~1458002511',
  rewarded: {
    android: 'ca-app-pub-3940256099942544/5224354917',
    ios: 'ca-app-pub-3940256099942544/1712485313',
  },
  appOpen: {
    android: 'ca-app-pub-3940256099942544/9257395921',
    ios: 'ca-app-pub-3940256099942544/5575463023',
  },
  enabled: false,
};

/**
 * 生产环境配置
 */
const prodConfig: AdMobConfig = {
  androidAppId: 'ca-app-pub-5946279989031789~1671706051',
  iosAppId: '', // iOS 应用 ID（待创建）
  rewarded: {
    android: 'ca-app-pub-5946279989031789/2057707104',
    ios: '', // iOS 激励广告（待创建）
  },
  appOpen: {
    android: 'ca-app-pub-5946279989031789/6006343368',
    ios: '', // iOS 开屏广告（待创建）
  },
  enabled: true,
};

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const admobConfig: AdMobConfig = isProduction ? prodConfig : devConfig;

/**
 * 获取激励广告单元 ID
 */
export function getRewardedAdUnitId(platform: 'android' | 'ios'): string {
  return admobConfig.rewarded[platform];
}

/**
 * 获取开屏广告单元 ID
 */
export function getAppOpenAdUnitId(platform: 'android' | 'ios'): string {
  return admobConfig.appOpen[platform];
}

/**
 * 检查 AdMob 是否启用
 */
export function isAdMobEnabled(): boolean {
  return admobConfig.enabled;
}
