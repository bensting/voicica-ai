/**
 * 应用配置类型定义
 */

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
 * 版本检测配置
 */
export interface VersionCheckConfig {
  /** 版本检查间隔（分钟） */
  check_interval_minutes: number;
}

/**
 * 每日任务配置
 */
export interface DailyTasksConfig {
  /** 签到奖励积分 */
  checkin_credits: number;
  /** 广告奖励积分档位（递进式） */
  ad_reward_tiers: number[];
  /** 弹窗最小间隔时间（分钟） */
  popup_interval_minutes: number;
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 应用配置
 */
export interface AppConfig {
  tts_samples: TtsSamplesConfig;
  credits: CreditsConfig;
  anonymous_user: AnonymousUserConfig;
  version_check: VersionCheckConfig;
  daily_tasks: DailyTasksConfig;
}
