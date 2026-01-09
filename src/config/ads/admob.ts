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
  /** 是否使用测试广告（上架前测试用） */
  useTestAds: boolean;
}

/**
 * Google 官方测试广告 ID
 * https://developers.google.com/admob/android/test-ads
 */
export const TEST_AD_IDS = {
  appId: {
    android: 'ca-app-pub-3940256099942544~3347511713',
    ios: 'ca-app-pub-3940256099942544~1458002511',
  },
  rewarded: {
    android: 'ca-app-pub-3940256099942544/5224354917',
    ios: 'ca-app-pub-3940256099942544/1712485313',
  },
  interstitial: {
    android: 'ca-app-pub-3940256099942544/1033173712',
    ios: 'ca-app-pub-3940256099942544/4411468910',
  },
  appOpen: {
    android: 'ca-app-pub-3940256099942544/9257395921',
    ios: 'ca-app-pub-3940256099942544/5575463023',
  },
  banner: {
    android: 'ca-app-pub-3940256099942544/6300978111',
    ios: 'ca-app-pub-3940256099942544/2934735716',
  },
};

/**
 * 真实广告 ID（上架后使用）
 */
const REAL_AD_IDS = {
  appId: {
    android: 'ca-app-pub-5946279989031789~1671706051',
    ios: '', // iOS 应用 ID（待创建）
  },
  rewarded: {
    android: 'ca-app-pub-5946279989031789/2057707104',
    ios: '', // iOS 激励广告（待创建）
  },
  interstitial: {
    android: 'ca-app-pub-5946279989031789/1915055115',
    ios: '', // iOS 插页式广告（待创建）
  },
};

/**
 * 开发环境配置（使用测试广告）
 */
const devConfig: AdMobConfig = {
  androidAppId: TEST_AD_IDS.appId.android,
  iosAppId: TEST_AD_IDS.appId.ios,
  rewarded: TEST_AD_IDS.rewarded,
  interstitial: {
    ...TEST_AD_IDS.interstitial,
    intervalMinutes: 1, // 开发环境 1 分钟，方便测试
  },
  enabled: true, // 开发环境启用，使用测试广告
  useTestAds: true,
};

/**
 * 生产环境配置
 *
 * ⚠️ 重要：上架前将 useTestAds 设为 true 进行测试
 * 上架并通过审核后，改为 false 使用真实广告
 */
const prodConfig: AdMobConfig = {
  androidAppId: REAL_AD_IDS.appId.android,
  iosAppId: REAL_AD_IDS.appId.ios,
  rewarded: REAL_AD_IDS.rewarded,
  interstitial: {
    ...REAL_AD_IDS.interstitial,
    intervalMinutes: 30, // 生产环境 30 分钟
  },
  enabled: true,
  useTestAds: false, // 使用真实广告
};

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
const baseConfig = isProduction ? prodConfig : devConfig;

// 如果启用测试广告，替换为测试 ID
export const admobConfig: AdMobConfig = baseConfig.useTestAds
  ? {
      ...baseConfig,
      androidAppId: TEST_AD_IDS.appId.android,
      iosAppId: TEST_AD_IDS.appId.ios,
      rewarded: TEST_AD_IDS.rewarded,
      interstitial: {
        ...TEST_AD_IDS.interstitial,
        intervalMinutes: baseConfig.interstitial.intervalMinutes,
      },
    }
  : baseConfig;

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
