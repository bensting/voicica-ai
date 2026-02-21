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
  /** 匿名用户初始积分 (Web端) */
  anonymous_user: number;
  /** 注册用户初始积分 (Web端) */
  registered_user: number;
  /** Native App 积分配置 */
  native: {
    /** 匿名用户初始积分 */
    anonymous_user: number;
    /** 注册用户初始积分 */
    registered_user: number;
  };
}

/**
 * 匿名用户配置
 */
export interface AnonymousUserConfig {
  /** 匿名用户过期天数 */
  expiry_days: number;
  /** TTS 每日免费生成次数 */
  tts_daily_limit: number;
}

/**
 * 版本检测配置
 */
export interface VersionCheckConfig {
  /** 版本检查间隔（分钟） */
  check_interval_minutes: number;
}

/**
 * 每日任务基础配置
 */
export interface DailyTasksBaseConfig {
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
 * 每日任务配置（支持 Studio 和 Native 独立配置）
 */
export interface DailyTasksConfig extends DailyTasksBaseConfig {
  /** Native App 独立配置（可选，不设置则使用默认值） */
  native?: DailyTasksBaseConfig;
}

/**
 * 挖矿经济配置（基于广告收益动态计算 $VOICICA 奖励）
 */
export interface MiningEconomyConfig {
  /** 1 $VOICICA = 多少 USD */
  token_value_usd: number;
  /** 分成比例（0.7 = 70% 给用户） */
  revenue_share_ratio: number;
  /** 随机浮动范围 [min, max] */
  random_multiplier: [number, number];
  /** 按国家估算 eCPM（USD），旧 APK 无 OnPaidEvent 时根据 IP 所在国家回退 */
  estimated_ecpm_by_country: Record<string, number>;
  /** 未知国家的默认 eCPM（USD） */
  default_ecpm_usd: number;
}

/**
 * Google Play 应用更新配置
 */
export interface AppUpdateConfig {
  /** 是否启用应用内更新检查 */
  enabled: boolean;
  /** 检查更新间隔（分钟） */
  check_interval_minutes: number;
  /** 下载完成后延迟提示安装（秒） */
  install_prompt_delay_seconds: number;
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
  mining_economy: MiningEconomyConfig;
  app_update: AppUpdateConfig;
}
