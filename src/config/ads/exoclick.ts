/**
 * ExoClick VAST In-Stream 广告配置（Web 端激励广告）
 * https://www.exoclick.com/
 *
 * 使用 Fluid Player 播放 VAST 广告
 * Zone: Voicica_Web_Mining_Node_01
 */

export interface ExoClickConfig {
  /** VAST Zone ID */
  zoneId: string;
  /** 是否启用 */
  enabled: boolean;
  /** VAST tag 基础 URL */
  vastBaseUrl: string;
}

/**
 * 开发环境配置
 */
const devConfig: ExoClickConfig = {
  zoneId: '2366423', // ExoClick 测试 zone
  enabled: true,
  vastBaseUrl: 'https://s.magsrv.com/v1/vast.php',
};

/**
 * 生产环境配置
 */
const prodConfig: ExoClickConfig = {
  zoneId: '5856858', // Voicica_Web_Mining_Node_01
  enabled: true,
  vastBaseUrl: 'https://s.magsrv.com/v1/vast.php',
};

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const exoclickConfig: ExoClickConfig = isProduction ? prodConfig : devConfig;

/**
 * 获取 VAST tag URL
 */
export function getExoClickVastUrl(): string {
  return `${exoclickConfig.vastBaseUrl}?idzone=${exoclickConfig.zoneId}`;
}

/**
 * 检查 ExoClick 是否启用
 */
export function isExoClickEnabled(): boolean {
  return exoclickConfig.enabled;
}
