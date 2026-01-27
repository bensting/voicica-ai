/**
 * Adsterra 广告配置
 *
 * Smart Link: 通用广告链接，用户点击后跳转到广告页面
 * 需要用户停留指定时间才能获得奖励
 */

export interface AdsterraConfig {
  /** 是否启用 */
  enabled: boolean;
  /** Smart Link URL */
  smartLinkUrl: string;
  /** 用户需要停留的最小时间（秒） */
  minWaitSeconds: number;
}

/**
 * Adsterra 配置
 */
export const adsterraConfig: AdsterraConfig = {
  enabled: true,
  smartLinkUrl: 'https://www.effectivegatecpm.com/upzk1kta?key=959f12f2aa1c427a1bb6b3d89de7cfb7',
  minWaitSeconds: 30,
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
