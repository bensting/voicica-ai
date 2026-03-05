/**
 * 应用配置 - 开发环境
 */

import type { AppConfig } from './types';

export const appConfig: AppConfig = {
  /**
   * TTS 试听配置
   */
  tts_samples: {
    sample_locales: [
      'en-US',
      'zh-CN',
      'zh-TW',
      'th-TH',
      'ja-JP',
      'ko-KR',
    ],
    sample_text_max_length: 200,
  },

  /**
   * 新用户首次登录用户积分配置
   */
  credits: {
    // Web 端
    anonymous_user: 1000,
    registered_user: 2000,
    // Native App 端
    native: {
      anonymous_user: 1000,    // Native 匿名用户不赠送积分
      registered_user: 2000, // Native 登录用户赠送 2000 积分
    },
  },

  /**
   * 匿名用户配置
   */
  anonymous_user: {
    expiry_days: 30,
    tts_daily_limit: 1, // 开发环境设大一点方便测试
  },

  /**
   * 版本检测配置
   */
  version_check: {
    check_interval_minutes: 1, // 开发环境设为 1 分钟，方便测试
  },

  /**
   * 每日任务配置 (Studio Web 端)
   */
  daily_tasks: {
    checkin_credits: 50,
    ad_reward_tiers: [1, 1, 2, 2, 3, 3],
    max_daily_ad_views: 100, // 开发环境 10 次，方便测试
    popup_interval_minutes: 5, // 开发环境 5 分钟，方便测试
    enabled: true, // 开发环境启用，方便测试挖矿经济
    // Native App 独立配置
    native: {
      checkin_credits: 50,
      ad_reward_tiers: [1, 1, 2, 2, 3, 3],
      max_daily_ad_views: 100, // 开发环境 10 次，方便测试
      popup_interval_minutes: 5, // 开发环境 5 分钟，方便测试
      enabled: true,
    },
  },

  /**
   * 挖矿经济配置（开发环境分成比例更高）
   */
  mining_economy: {
    token_value_usd: 0.0001,
    revenue_share_ratio: 0.8,
    random_multiplier: [0.8, 1.2],
    currency_to_usd: {
      USD: 1,
      THB: 0.030,
    },
    estimated_ecpm_by_country: {
      US: 25, CA: 22, AU: 20, GB: 18, DE: 17, FR: 16, JP: 20, KR: 18,
      TW: 12, HK: 14, SG: 12,
      TH: 3, MY: 5, PH: 0.7, ID: 3, AZ: 6,
      IN: 0.8, VN: 3,
    },
    default_ecpm_usd: 5,
    // Unity Ads 激励视频（每日任务场景，约 AdMob 60%）
    unity_estimated_ecpm_by_country: {
      US: 15, CA: 13, AU: 12, GB: 11, DE: 10, JP: 12, KR: 11,
      TW: 7, HK: 8, SG: 7,
      TH: 1.8, MY: 3, PH: 0.4, ID: 2, AZ: 3.6,
      IN: 0.5, VN: 2,
    },
    unity_default_ecpm_usd: 3,
    // Web 端 ExoClick VAST In-Stream（每次播 2 个 zone）
    web_estimated_ecpm_by_country: {
      US: 0.10, CA: 0.10, AU: 0.10, GB: 0.10, DE: 0.10, JP: 0.10, KR: 0.10,
      TW: 0.05, HK: 0.05, SG: 0.05,
      TH: 0.05, MY: 0.05, PH: 0.05, ID: 0.05,
      IN: 0.01, VN: 0.01,
    },
    web_default_ecpm_usd: 0.03,
    show_home_banner: false, // 是否显示首页 Banner
    show_navbar_mining: true, // 是否显示导航栏 Mining 入口
    show_wallet_card: true, // 是否显示首页 钱包
    conversion: {
      min_voicica_reserve: 2000, // 最低保留 2000 $VOICICA
      min_convert_amount: 1,   // 单次最低兑换 1
      enabled: true,             // 汇率复用上面的 token_value_usd
    },
    withdrawal: {
      min_amount: 5, // 最低提现 5 USDT
      networks: [
        { id: 'polygon', label: 'Polygon(POL)', fee: 0.02, placeholder: '0x...', addressPattern: '^0x[0-9a-fA-F]{40}$' },
        { id: 'bep20', label: 'BEP20 (BSC)', fee: 0.02, placeholder: '0x...', addressPattern: '^0x[0-9a-fA-F]{40}$' },
        { id: 'solana', label: 'Solana (SOL)', fee: 0.5, placeholder: 'So...', addressPattern: '^[1-9A-HJ-NP-Za-km-z]{32,44}$' },
      ],
      enabled: true,
    },
    crash_game: {
      show_home_card: true,
      subtitle: 'Turn $1 into $100 in seconds.',
    },
    bull_bear: {
      show_home_card: true,
      subtitle: 'Predict BTC. Win big.',
    },
  },

  /**
   * Google Play 应用更新配置
   */
  app_update: {
    enabled: false, // 开发环境禁用
    check_interval_minutes: 1,
    install_prompt_delay_seconds: 3,
  },

  /**
   * 推荐裂变系统配置（开发环境降低门槛方便测试）
   */
  referral: {
    enabled: true,
    code_length: 6,
    max_team_depth: 10,
    levels: {
      miner:  { l1_rate: 0.08, l2_rate: 0,    team_rate: 0 },
      bronze: { l1_rate: 0.08, l2_rate: 0.03, team_rate: 0 },
      gold:   { l1_rate: 0.08, l2_rate: 0.03, team_rate: 0.02 },
    },
    upgrade_conditions: {
      bronze: { direct_referrals: 3 },  // 开发环境 3 人即可升级
      gold:   { bronze_captains: 1 },   // 开发环境 1 个青铜即可升级
    },
  },
};
