/**
 * Bull or Bear 游戏静态配置
 *
 * 客户端常量，与服务端 bull_bear_config 表的动态配置互补
 */

/** Binance WebSocket 实时价格流 */
export const BINANCE_WS_URL = 'wss://stream.binance.com/ws/btcusdt@trade';

/** Binance REST ticker (用于获取入场/结算价格) */
export const BINANCE_TICKER_URL = 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT';

/** 可选回合时长（秒） */
export const AVAILABLE_DURATIONS = [30, 60, 120] as const;

/** 默认赔率（按时长） */
export const DEFAULT_MULTIPLIERS: Record<number, number> = {
  30: 1.85,
  60: 1.90,
  120: 1.95,
};

/** 默认最小投注 */
export const DEFAULT_MIN_BET = 1;

/** 默认最大投注 */
export const DEFAULT_MAX_BET = 10000;

/** 快捷投注金额按钮 */
export const QUICK_BET_AMOUNTS = [10, 100, 500, 1000];

/** 价格图表历史秒数 */
export const PRICE_CHART_HISTORY_SECONDS = 300;

/** Binance REST klines (用于预加载历史 K 线) */
export const BINANCE_KLINES_URL = 'https://api.binance.com/api/v3/klines';

/** WebSocket 重连延迟（毫秒） */
export const WS_RECONNECT_DELAY_MS = 2000;
