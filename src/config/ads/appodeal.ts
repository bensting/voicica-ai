/**
 * Appodeal 广告配置
 *
 * Appodeal 是一个广告聚合平台，支持激励视频广告
 * 文档: https://docs.appodeal.com/
 */

export interface AppodealConfig {
  /** 是否启用 Appodeal */
  enabled: boolean;
  /** Android App Key */
  androidAppKey: string;
  /** iOS App Key */
  iosAppKey: string;
  /** 是否开启测试模式 */
  testMode: boolean;
  /** 连续播放广告数量（1-5，默认2） */
  adCount: number;
  /** 关闭按钮显示延迟（秒，5-60，默认15） */
  closeButtonDelaySeconds: number;
}

/**
 * 测试用 App Key（开发环境）
 * 注意：Appodeal 没有官方测试 key，需要在 Appodeal 后台创建测试应用
 * 或者开启 testMode 使用测试广告
 */
const TEST_APP_KEYS = {
  android: '8573a31362e775f428d4d18bd00a90af8d10861c35589d29', // 填入你的测试 App Key
  ios: '',
};

/**
 * 真实 App Key（生产环境）
 * 从 Appodeal 后台获取: https://app.appodeal.com/
 */
const REAL_APP_KEYS = {
  android: '8573a31362e775f428d4d18bd00a90af8d10861c35589d29', // 填入你的 Android App Key
  ios: '',     // 填入你的 iOS App Key
};

/**
 * 开发环境配置
 */
const devConfig: AppodealConfig = {
  enabled: true, // 开发环境也启用 Appodeal
  androidAppKey: TEST_APP_KEYS.android,
  iosAppKey: TEST_APP_KEYS.ios,
  testMode: false, // 使用真实广告（测试广告没有关闭按钮）
  adCount: 2, // 连续播放 2 个广告
  closeButtonDelaySeconds: 30, // 15秒后显示关闭按钮
};

/**
 * 生产环境配置
 *
 * ⚠️ 使用前需要：
 * 1. 在 Appodeal 后台创建应用并获取 App Key
 * 2. 填入上方的 REAL_APP_KEYS
 * 3. 将 enabled 设为 true
 * 4. 在 rewarded.ts 中将 provider 设为 'appodeal'
 */
const prodConfig: AppodealConfig = {
  enabled: true,
  androidAppKey: TEST_APP_KEYS.android, // 使用测试 Key，正式上线后改为 REAL_APP_KEYS.android
  iosAppKey: REAL_APP_KEYS.ios,
  testMode: false,
  adCount: 2, // 连续播放 2 个广告
  closeButtonDelaySeconds: 15, // 15秒后显示关闭按钮
};

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const appodealConfig: AppodealConfig = isProduction ? prodConfig : devConfig;

/**
 * 获取当前平台的 App Key
 */
export function getAppodealAppKey(platform: 'android' | 'ios'): string {
  return platform === 'android' ? appodealConfig.androidAppKey : appodealConfig.iosAppKey;
}

/**
 * 检查 Appodeal 是否启用
 */
export function isAppodealEnabled(): boolean {
  return appodealConfig.enabled;
}

/**
 * 检查是否使用测试模式
 */
export function isAppodealTestMode(): boolean {
  return appodealConfig.testMode;
}
