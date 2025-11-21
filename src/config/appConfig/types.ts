/**
 * 应用配置类型定义
 */

/**
 * 语音成本配置 - 不同语音类型每字符扣除的积分
 */
export interface VoiceCostConfig {
  standard: number;
  professional: number;
  special: number;
  clone: number;
}

/**
 * TTS 试听配置
 */
export interface TtsSamplesConfig {
  /** 支持的语言列表 */
  sample_locales: string[];
  /** 试听文本最大长度 */
  sample_text_max_length: number;
}

/**
 * 应用配置
 */
export interface AppConfig {
  voice_cost: VoiceCostConfig;
  tts_samples: TtsSamplesConfig;
}
