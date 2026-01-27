/**
 * Adsterra 广告配置
 *
 * Smart Link: 通用广告链接，用户点击后跳转到广告页面
 * Native Banner: 原生横幅广告，嵌入页面显示
 */

export interface AdsterraConfig {
  /** 是否启用 */
  enabled: boolean;
  /** Smart Link URL */
  smartLinkUrl: string;
  /** 用户需要停留的最小时间（秒） */
  minWaitSeconds: number;
  /** Native Banner 配置 */
  nativeBanner: {
    /** 是否启用 */
    enabled: boolean;
    /** 脚本 URL */
    scriptUrl: string;
    /** 容器 ID */
    containerId: string;
  };
}

/**
 * Adsterra 配置
 */
export const adsterraConfig: AdsterraConfig = {
  enabled: true,
  smartLinkUrl: 'https://www.effectivegatecpm.com/upzk1kta?key=959f12f2aa1c427a1bb6b3d89de7cfb7',
  minWaitSeconds: 30,
  nativeBanner: {
    enabled: true,
    scriptUrl: 'https://pl28577351.effectivegatecpm.com/681184527acc76cbc3fea2492006189f/invoke.js',
    containerId: 'container-681184527acc76cbc3fea2492006189f',
  },
};

/**
 * 获取 Smart Link URL
 */
export function getAdsterraSmartLinkUrl(): string {
  return adsterraConfig.smartLinkUrl;
}

/**
 * 获取最小等待时间（秒）
 */
export function getAdsterraMinWaitSeconds(): number {
  return adsterraConfig.minWaitSeconds;
}

/**
 * 检查 Adsterra 是否启用
 */
export function isAdsterraEnabled(): boolean {
  return adsterraConfig.enabled;
}

/**
 * 获取 Native Banner 配置
 */
export function getAdseterraNativeBannerConfig() {
  return adsterraConfig.nativeBanner;
}

/**
 * 检查 Native Banner 是否启用
 */
export function isNativeBannerEnabled(): boolean {
  return adsterraConfig.nativeBanner.enabled;
}
