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
 * 用户积分配置
 */
export interface CreditsConfig {
  /** 匿名用户初始积分 */
  anonymous_user: number;
  /** 注册用户初始积分 */
  registered_user: number;
}

/**
 * 匿名用户配置
 */
export interface AnonymousUserConfig {
  /** 匿名用户过期天数 */
  expiry_days: number;
}

/**
 * 应用配置
 */
export interface AppConfig {
  voice_cost: VoiceCostConfig;
  tts_samples: TtsSamplesConfig;
  credits: CreditsConfig;
  anonymous_user: AnonymousUserConfig;
}
