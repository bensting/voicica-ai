/**
 * Crash Game 静态配置
 *
 * 客户端常量，与服务端 crash_game_config 表的动态配置互补
 */

/** 默认倍率增长速度（e^(speed * elapsedMs)） */
export const DEFAULT_CRASH_SPEED = 0.00006;

/** 最大游戏时长（秒） */
export const MAX_GAME_DURATION_SECONDS = 120;

/** 网络延迟宽限期（毫秒） */
export const GRACE_PERIOD_MS = 300;

/** LiveFeed 假玩家名字池 */
export const FAKE_PLAYER_NAMES = [
  'Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan',
  'Casey', 'Riley', 'Quinn', 'Avery', 'Blake',
  'Drew', 'Finley', 'Harper', 'Jamie', 'Kai',
  'Logan', 'Reese', 'Sage', 'Skyler', 'Rowan',
  'Phoenix', 'Eden', 'Emery', 'Lennox', 'Remy',
  'Atlas', 'Nova', 'Storm', 'River', 'Cruz',
];

/** LiveFeed 配置 */
export const LIVE_FEED_CONFIG = {
  /** 新条目生成间隔（毫秒） */
  intervalMs: 2000,
  /** 最大显示条目数 */
  maxEntries: 20,
  /** 假投注金额范围 */
  betRange: { min: 5, max: 500 },
  /** 假倍率范围 */
  multiplierRange: { min: 1.01, max: 15 },
  /** 赢率（0-1） */
  winRate: 0.55,
};

/** 快捷投注金额按钮 */
export const QUICK_BET_AMOUNTS = [10, 100, 500, 1000];
