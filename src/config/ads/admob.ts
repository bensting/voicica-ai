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
  /** 插页式广告单元（启动广告） */
  interstitial: {
    android: string;
    ios: string;
    /** 显示间隔（分钟） */
    intervalMinutes: number;
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
  interstitial: {
    android: 'ca-app-pub-3940256099942544/1033173712',
    ios: 'ca-app-pub-3940256099942544/4411468910',
    intervalMinutes: 5, // 开发环境 5 分钟，方便测试
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
  interstitial: {
    android: 'ca-app-pub-5946279989031789/1915055115',
    ios: '', // iOS 插页式广告（待创建）
    intervalMinutes: 30, // 生产环境 30 分钟
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
 * 获取插页式广告单元 ID（启动广告）
 */
export function getInterstitialAdUnitId(platform: 'android' | 'ios'): string {
  return admobConfig.interstitial[platform];
}

/**
 * 检查 AdMob 是否启用
 */
export function isAdMobEnabled(): boolean {
  return admobConfig.enabled;
}
