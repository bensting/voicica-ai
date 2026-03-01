/**
 * 应用配置 - 生产环境
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
    tts_daily_limit: 1, // 生产环境每日 1 次免费
  },

  /**
   * APK 版本检测配置
   */
  version_check: {
    check_interval_minutes: 5,
  },

  /**
   * 每日任务配置 (Studio Web 端)
   */
  daily_tasks: {
    checkin_credits: 1,
    ad_reward_tiers: [1, 1, 1, 1, 1, 1],
    max_daily_ad_views: 100,
    popup_interval_minutes: 30, // 生产环境每 30 分钟最多弹出一次
    enabled: true,
    // Native App 独立配置
    native: {
      checkin_credits: 50,
      ad_reward_tiers: [1, 1, 2, 2, 3, 3],
      max_daily_ad_views: 100,
      popup_interval_minutes: 30,
      enabled: true,
    },
  },

  /**
   * 挖矿经济配置
   */
  mining_economy: {
    token_value_usd: 0.0001,
    revenue_share_ratio: 0.7,
    random_multiplier: [0.8, 1.2],
    currency_to_usd: {
      USD: 1,
      THB: 0.030, // 1 THB ≈ 0.029 USD，需定期更新
    },
    estimated_ecpm_by_country: {
      // T1 高收益国家
      US: 25, CA: 22, AU: 20, GB: 18, DE: 17, FR: 16, JP: 20, KR: 18,
      NZ: 16, CH: 20, NO: 18, SE: 16, DK: 16, AT: 15, NL: 15, BE: 14,
      // T2 中等收益
      TW: 12, HK: 14, SG: 12, IL: 12,
      BR: 8, MX: 7, AR: 6, CL: 7, CO: 6,
      TH: 6, MY: 5, PH: 4, ID: 3,
      SA: 10, AE: 12, TR: 5, PL: 7, CZ: 7, RO: 5,
      // T3 低收益国家
      IN: 2, PK: 1.5, BD: 1, LK: 2,
      VN: 3, MM: 1.5, KH: 2, LA: 1.5,
      NG: 2, KE: 2, EG: 3, ZA: 5,
    },
    default_ecpm_usd: 5,
    // Web 端 ExoClick VAST In-Stream（eCPM 远低于 AdMob，单位 USD）
    // 每次奖励播 2 个 zone，所以实际收入 = eCPM × 2 / 1000
    web_estimated_ecpm_by_country: {
      // T1
      US: 0.10, CA: 0.10, AU: 0.10, GB: 0.10, DE: 0.10, FR: 0.10, JP: 0.10, KR: 0.10,
      NZ: 0.10, CH: 0.10, NO: 0.10, SE: 0.10, DK: 0.10, AT: 0.10, NL: 0.10, BE: 0.10,
      // T2
      TW: 0.05, HK: 0.05, SG: 0.05, IL: 0.05,
      BR: 0.05, MX: 0.05, AR: 0.05, CL: 0.05, CO: 0.05,
      TH: 0.05, MY: 0.05, PH: 0.05, ID: 0.05,
      SA: 0.05, AE: 0.05, TR: 0.05, PL: 0.05, CZ: 0.05, RO: 0.05,
      // T3
      IN: 0.01, PK: 0.01, BD: 0.01, LK: 0.01,
      VN: 0.01, MM: 0.01, KH: 0.01, LA: 0.01,
      NG: 0.01, KE: 0.01, EG: 0.01, ZA: 0.01,
    },
    web_default_ecpm_usd: 0.03,
    show_home_banner: false, // 是否显示首页 Banner
    show_wallet_card: false, // 是否显示首页 钱包
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
      show_home_card: false,
      subtitle: 'Turn $1 into $100 in seconds.',
    },
  },

  /**
   * Google Play 应用更新配置
   */
  app_update: {
    enabled: true,
    check_interval_minutes: 60, // 每小时检查一次
    install_prompt_delay_seconds: 3, // 下载完成后 3 秒提示安装
  },

  /**
   * 推荐裂变系统配置
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
      bronze: { direct_referrals: 10 },
      gold:   { bronze_captains: 2 },
    },
  },
};
