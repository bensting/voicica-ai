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
 * 月度福利配置
 */
export interface MonthlyRewardsConfig {
  /** 匿名用户福利积分 */
  anonymous_credits: number;
  /** 登录福利积分 */
  login_credits: number;
  /** APP下载福利积分 */
  app_download_credits: number;
  /** 弹窗每日最多显示次数 */
  popup_max_per_day: number;
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
  monthly_rewards: MonthlyRewardsConfig;
}
