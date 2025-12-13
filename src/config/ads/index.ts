/**
 * 广告配置统一入口
 *
 * - AdSense: Web 端展示广告
 * - AppLixir: Web 端激励广告
 * - AdMob: 移动端广告（激励广告、插页式广告）
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
  isAdMobEnabled,
  type AdMobConfig,
} from './admob';
