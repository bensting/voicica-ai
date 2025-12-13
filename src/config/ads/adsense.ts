/**
 * Google AdSense 配置
 */

export interface AdSenseConfig {
  /** 发布商 ID */
  clientId: string;
  /** 是否启用（生产环境启用） */
  enabled: boolean;
  /** 广告单元 */
  slots: {
    /** 通用横幅广告 */
    banner: string;
  };
}

/**
 * 开发环境配置
 */
const devConfig: AdSenseConfig = {
  clientId: 'ca-pub-5946279989031789',
  enabled: false, // 开发环境显示占位符
  slots: {
    banner: 'xxxxxxxxxx',
  },
};

/**
 * 生产环境配置
 */
const prodConfig: AdSenseConfig = {
  clientId: 'ca-pub-5946279989031789',
  enabled: true,
  slots: {
    banner: '7898009535',
  },
};

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const adsenseConfig: AdSenseConfig = isProduction ? prodConfig : devConfig;

/**
 * 获取 AdSense 发布商 ID
 */
export function getAdSenseClientId(): string {
  return adsenseConfig.clientId;
}

/**
 * 获取广告单元 ID
 */
export function getAdSlot(name: keyof AdSenseConfig['slots']): string {
  return adsenseConfig.slots[name];
}

/**
 * 检查 AdSense 是否启用
 */
export function isAdSenseEnabled(): boolean {
  return adsenseConfig.enabled;
}
