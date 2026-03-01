import { getCrashGameConfig, getActiveRound, type CrashGameConfigData, type CrashGameResult } from '@/actions/crash-game';

/**
 * Crash Game 预加载缓存
 * CrashGameCard 点击时调用 prefetch，页面挂载时 consume（一次性）
 */

let configPromise: Promise<CrashGameConfigData> | null = null;
let activeRoundPromise: Promise<CrashGameResult> | null = null;

export function prefetchCrashGame() {
  configPromise = getCrashGameConfig();
  activeRoundPromise = getActiveRound();
}

export function consumeCrashGamePrefetch() {
  const result = { configPromise, activeRoundPromise };
  configPromise = null;
  activeRoundPromise = null;
  return result;
}
