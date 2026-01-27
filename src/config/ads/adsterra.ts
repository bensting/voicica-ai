/**
 * Adsterra 广告配置
 *
 * Smart Link: 通用广告链接，用户点击后跳转到广告页面
 * Native Banner: 原生横幅广告，嵌入页面显示
 * Social Bar: 固定显示的社交样式广告条
 * Popunder: 用户点击时在后台打开的广告页面
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
  /** Social Bar 配置 */
  socialBar: {
    /** 是否启用 */
    enabled: boolean;
    /** 脚本 URL */
    scriptUrl: string;
  };
  /** Popunder 配置 */
  popunder: {
    /** 是否启用 */
    enabled: boolean;
    /** 脚本 URL */
    scriptUrl: string;
    /** 冷却时间（小时） */
    cooldownHours: number;
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
  socialBar: {
    enabled: true,
    scriptUrl: 'https://pl28577830.effectivegatecpm.com/76/dc/8a/76dc8a70c4293a874ced42a2f7637ddd.js',
  },
  popunder: {
    enabled: true,
    scriptUrl: 'https://pl28577187.effectivegatecpm.com/7f/c9/b8/7fc9b82b234616030c0b94e33f799bf9.js',
    cooldownHours: 24,
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

/**
 * 获取 Social Bar 配置
 */
export function getSocialBarConfig() {
  return adsterraConfig.socialBar;
}

/**
 * 检查 Social Bar 是否启用
 */
export function isSocialBarEnabled(): boolean {
  return adsterraConfig.socialBar.enabled;
}

/**
 * 获取 Popunder 配置
 */
export function getPopunderConfig() {
  return adsterraConfig.popunder;
}

/**
 * 检查 Popunder 是否启用
 */
export function isPopunderEnabled(): boolean {
  return adsterraConfig.popunder.enabled;
}
