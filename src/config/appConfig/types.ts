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
  /** 每日最大广告观看次数（防刷上限） */
  max_daily_ad_views: number;
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
  /** AdMob 报告币种到 USD 的汇率（如 THB: 0.029 表示 1 THB = 0.029 USD） */
  currency_to_usd: Record<string, number>;
  /** 按国家估算 eCPM（USD），原生端 AdMob 激励视频 */
  estimated_ecpm_by_country: Record<string, number>;
  /** 未知国家的默认 eCPM（USD），原生端 */
  default_ecpm_usd: number;
  /** 按国家估算 eCPM（USD），Web 端 ExoClick VAST In-Stream */
  web_estimated_ecpm_by_country: Record<string, number>;
  /** 未知国家的默认 eCPM（USD），Web 端 */
  web_default_ecpm_usd: number;
  /** 是否显示资产钱包卡片（Total Assets） */
  show_wallet_card: boolean;
  /** $VOICICA → USDT 兑换配置 */
  conversion: ConversionConfig;
  /** USDT 提现配置 */
  withdrawal: WithdrawalConfig;
}

/**
 * $VOICICA → USDT 兑换配置
 */
export interface ConversionConfig {
  /** 最低保留 $VOICICA 余额（低于此值不可兑换） */
  min_voicica_reserve: number;
  /** 单次最低兑换数量 */
  min_convert_amount: number;
  /** 是否启用兑换功能 */
  enabled: boolean;
  // 汇率复用 mining_economy.token_value_usd（1 $VOICICA = token_value_usd USDT）
}

/**
 * USDT 提现网络配置
 */
export interface WithdrawalNetworkConfig {
  /** 网络标识 */
  id: string;
  /** 显示名称 */
  label: string;
  /** 固定手续费 USDT */
  fee: number;
  /** 地址占位符 */
  placeholder: string;
}

/**
 * USDT 提现配置
 */
export interface WithdrawalConfig {
  /** 最低提现金额 USDT */
  min_amount: number;
  /** 支持的网络列表 */
  networks: WithdrawalNetworkConfig[];
  /** 是否启用提现功能 */
  enabled: boolean;
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
