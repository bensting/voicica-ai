/**
 * 广告配置统一入口
 *
 * - AdSense: Web 端展示广告
 * - AppLixir: Web 端激励广告
 * - AdMob: 移动端广告（激励广告、插页式广告）
 * - Appodeal: 移动端广告聚合平台
 * - Rewarded: 激励广告统一配置（AppLixir/AdMob/Appodeal 切换）
 */

// AdSense (Web 展示广告)
export {
  adsenseConfig,
  getAdSenseClientId,
  getAdSlot,
  isAdSenseEnabled,
  type AdSenseConfig,
} from './adsense';

// AppLixir (Web 激励广告)
export {
  applixirConfig,
  getAppLixirApiKey,
  isAppLixirEnabled,
  type AppLixirConfig,
} from './applixir';

// AdMob (Mobile)
export {
  admobConfig,
  getRewardedAdUnitId,
  getInterstitialAdUnitId,
  getInterstitialRewardedAdUnitId,
  isAdMobEnabled,
  getNativeAdUnitId,
  isNativeAdEnabled,
  getNativeAdPosition,
  type AdMobConfig,
} from './admob';

// Appodeal (Mobile 广告聚合)
export {
  appodealConfig,
  getAppodealAppKey,
  isAppodealEnabled,
  isAppodealTestMode,
  type AppodealConfig,
} from './appodeal';

// 激励广告统一配置
export {
  rewardedAdConfig,
  getRewardedAdProvider,
  getNativeAdProvider,
  shouldUseAdMob,
  shouldUseAppodeal,
  shouldUseAppLixir,
  type RewardedAdProvider,
  type NativeAdProvider,
  type RewardedAdConfig,
} from './rewarded';

// Adsterra (Web Smart Link + Native Banner)
export {
  adsterraConfig,
  getAdsterraSmartLinkUrl,
  getAdsterraMinWaitSeconds,
  isAdsterraEnabled,
  getAdseterraNativeBannerConfig,
  isNativeBannerEnabled,
  type AdsterraConfig,
} from './adsterra';
