/**
 * 广告配置统一入口
 *
 * - AdSense: Web 端展示广告
 * - AdMob: 移动端广告（激励广告、开屏广告）
 */

// AdSense (Web)
export {
  adsenseConfig,
  getAdSenseClientId,
  getAdSlot,
  isAdSenseEnabled,
  type AdSenseConfig,
} from './adsense';

// AdMob (Mobile)
export {
  admobConfig,
  getRewardedAdUnitId,
  getAppOpenAdUnitId,
  isAdMobEnabled,
  type AdMobConfig,
} from './admob';
