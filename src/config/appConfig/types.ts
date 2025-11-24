/**
 * 应用配置类型定义
 */

/**
 * 语音成本配置
 *
 * 计费规则：每 unit_chars 个字符消耗对应积分，不足 unit_chars 也按一个单位计算
 * 例如：unit_chars=100, standard=1 时，101个字符消耗2积分
 */
export interface VoiceCostConfig {
  /** 计费单位（字符数），默认100 */
  unit_chars: number;
  /** 标准语音每单位消耗积分 */
  standard: number;
  /** 专业语音每单位消耗积分 */
  professional: number;
  /** 特殊语音每单位消耗积分 */
  special: number;
  /** 克隆语音每单位消耗积分 */
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
