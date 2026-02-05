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
  /** 插页式广告单元 */
  interstitial: {
    android: string;
    ios: string;
  };
  /** 插页式激励广告单元（签到用） */
  interstitialRewarded: {
    android: string;
    ios: string;
  };
  /** 开屏广告单元（App 启动时显示） */
  appOpen: {
    android: string;
    ios: string;
    /** 显示间隔（分钟） */
    intervalMinutes: number;
    /** 是否启用开屏广告 */
    enabled: boolean;
  };
  /** 原生广告单元（信息流中显示） */
  native: {
    android: string;
    ios: string;
    /** 是否启用原生广告 */
    enabled: boolean;
    /** 在列表中的位置（从0开始） */
    position: number;
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
  /** 插页式激励广告测试 ID */
  interstitialRewarded: {
    android: 'ca-app-pub-3940256099942544/5354046379',
    ios: 'ca-app-pub-3940256099942544/6978759866',
  },
  appOpen: {
    android: 'ca-app-pub-3940256099942544/9257395921',
    ios: 'ca-app-pub-3940256099942544/5575463023',
  },
  banner: {
    android: 'ca-app-pub-3940256099942544/6300978111',
    ios: 'ca-app-pub-3940256099942544/2934735716',
  },
  /** 原生高级广告测试 ID */
  native: {
    android: 'ca-app-pub-3940256099942544/2247696110',
    ios: 'ca-app-pub-3940256099942544/3986624511',
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
  /** 插页式激励广告（签到用） */
  interstitialRewarded: {
    android: 'ca-app-pub-5946279989031789/7444547539',
    ios: '', // iOS 插页式激励广告（待创建）
  },
  appOpen: {
    android: 'ca-app-pub-5946279989031789/6006343368',
    ios: '', // iOS 开屏广告（待创建）
  },
  /** 原生高级广告（信息流用） */
  native: {
    android: 'ca-app-pub-5946279989031789/4551912389',
    ios: '', // iOS 原生广告（待创建）
  },
};

/**
 * 开发环境配置（使用测试广告）
 */
const devConfig: AdMobConfig = {
  androidAppId: TEST_AD_IDS.appId.android,
  iosAppId: TEST_AD_IDS.appId.ios,
  rewarded: TEST_AD_IDS.rewarded,
  interstitial: TEST_AD_IDS.interstitial,
  interstitialRewarded: TEST_AD_IDS.interstitialRewarded,
  appOpen: {
    ...TEST_AD_IDS.appOpen,
    intervalMinutes: 1, // 开发环境 1 分钟，方便测试
    enabled: false, // 关闭开屏广告
  },
  native: {
    ...TEST_AD_IDS.native,
    enabled: true, // 开发环境启用原生广告测试
    position: 2, // 在第3个位置显示（索引从0开始）
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
  interstitial: REAL_AD_IDS.interstitial,
  interstitialRewarded: REAL_AD_IDS.interstitialRewarded,
  appOpen: {
    ...REAL_AD_IDS.appOpen,
    intervalMinutes: 15, // 生产环境 15 分钟
    enabled: true, // 启用开屏广告
  },
  native: {
    ...REAL_AD_IDS.native,
    enabled: true, // 启用原生广告
    position: 2, // 在第3个位置显示（索引从0开始）
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
      interstitial: TEST_AD_IDS.interstitial,
      interstitialRewarded: TEST_AD_IDS.interstitialRewarded,
      appOpen: {
        ...TEST_AD_IDS.appOpen,
        intervalMinutes: baseConfig.appOpen.intervalMinutes,
        enabled: baseConfig.appOpen.enabled,
      },
      native: {
        ...TEST_AD_IDS.native,
        enabled: baseConfig.native.enabled,
        position: baseConfig.native.position,
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
 * 获取插页式广告单元 ID
 */
export function getInterstitialAdUnitId(platform: 'android' | 'ios'): string {
  return admobConfig.interstitial[platform];
}

/**
 * 获取插页式激励广告单元 ID（签到用）
 */
export function getInterstitialRewardedAdUnitId(platform: 'android' | 'ios'): string {
  return admobConfig.interstitialRewarded[platform];
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

/**
 * 检查开屏广告是否启用
 */
export function isAppOpenAdEnabled(): boolean {
  return admobConfig.enabled && admobConfig.appOpen.enabled;
}

/**
 * 获取原生广告单元 ID
 */
export function getNativeAdUnitId(platform: 'android' | 'ios'): string {
  return admobConfig.native[platform];
}

/**
 * 检查原生广告是否启用
 */
export function isNativeAdEnabled(): boolean {
  return admobConfig.enabled && admobConfig.native.enabled;
}

/**
 * 获取原生广告在列表中的位置
 */
export function getNativeAdPosition(): number {
  return admobConfig.native.position;
}