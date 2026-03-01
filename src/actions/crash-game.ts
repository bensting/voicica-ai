'use server';

/**
 * Crash Game Server Actions
 *
 * 核心游戏逻辑：开始游戏、Cash Out、过期处理、历史记录
 * 使用 Provably Fair 算法生成 crashPoint
 */

import { getDb } from '@/lib/db';
import { crashGameRounds, crashGameConfig } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-firebase';
import { deductCreditsAtomic, addCredits } from '@/lib/credits';
import { ProductType } from '@/config/productType';
import { MAX_GAME_DURATION_SECONDS } from '@/config/native/crashGameConfig';

// ============================================================
// Types
// ============================================================

export interface CrashGameConfigData {
  enabled: boolean;
  minBet: number;
  maxBet: number;
  speed: number;
  maxDurationSeconds: number;
}

export interface CrashRoundData {
  roundId: string;
  betAmount: number;
  seedHash: string;
  speed: number;
  startedAt: string;
  status: string;
  crashPoint?: number;
  cashOutMultiplier?: number;
  profit?: number;
  seed?: string;
}

export interface CrashGameResult {
  success: boolean;
  data?: CrashRoundData;
  error?: string;
}

export interface CrashHistoryItem {
  roundId: string;
  betAmount: number;
  crashPoint: number;
  cashOutMultiplier: number | null;
  profit: number | null;
  status: string;
  createdAt: string;
  seed: string;
  seedHash: string;
}

// ============================================================
// Helpers
// ============================================================

/** SHA-256 hash using Web Crypto API */
async function sha256(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Provably Fair crash point generation
 *
 * seed → SHA-256 hash → float → crashPoint
 * With house edge: houseEdgePercent% chance of instant crash (1.00x)
 */
function computeCrashPoint(hash: string, houseEdgePercent: number): number {
  const hashFloat = parseInt(hash.substring(0, 8), 16) / 0x100000000; // [0, 1)

  // House edge: instant crash
  if (hashFloat < houseEdgePercent / 100) {
    return 1.00;
  }

  // Normal crash point calculation
  const crashPoint = Math.floor(((100 - houseEdgePercent) / (1 - hashFloat))) / 100;
  return Math.max(1.00, crashPoint);
}

/** Load config from DB, fallback to defaults */
async function loadConfig() {
  const db = await getDb();
  const [config] = await db.select().from(crashGameConfig).limit(1);
  return config || {
    enabled: false,
    minBet: 1,
    maxBet: 1000,
    houseEdgePercent: 3,
    speed: 0.00006,
    maxDurationSeconds: MAX_GAME_DURATION_SECONDS,
    gracePeriodMs: 300,
  };
}

// ============================================================
// Server Actions
// ============================================================

/**
 * 获取 Crash Game 配置
 */
export async function getCrashGameConfig(): Promise<CrashGameConfigData> {
  const config = await loadConfig();
  return {
    enabled: config.enabled,
    minBet: config.minBet,
    maxBet: config.maxBet,
    speed: config.speed,
    maxDurationSeconds: config.maxDurationSeconds,
  };
}

/**
 * 开始一轮游戏
 *
 * 1. 验证用户已登录
 * 2. 检查没有进行中的游戏
 * 3. 扣除积分
 * 4. 生成 seed → crashPoint
 * 5. 创建 round 记录
 */
export async function startCrashRound(betAmount: number): Promise<CrashGameResult> {
  try {
    const user = await getCurrentUser();
    const config = await loadConfig();

    if (!config.enabled) {
      return { success: false, error: 'Game is currently disabled' };
    }

    if (betAmount < config.minBet || betAmount > config.maxBet) {
      return { success: false, error: `Bet must be between ${config.minBet} and ${config.maxBet}` };
    }

    const db = await getDb();

    // Check for existing active round
    const [activeRound] = await db.select({ id: crashGameRounds.id })
      .from(crashGameRounds)
      .where(and(
        eq(crashGameRounds.userId, user.uid),
        eq(crashGameRounds.status, 'active')
      ))
      .limit(1);

    if (activeRound) {
      return { success: false, error: 'You already have an active game' };
    }

    // Deduct credits
    await deductCreditsAtomic(
      user.uid,
      betAmount,
      ProductType.CRASH_GAME_BET,
      false,
      `Crash Game bet: ${betAmount}`,
    );

    // Generate seed and crash point
    const seed = crypto.randomUUID();
    const seedHash = await sha256(seed);
    const crashPoint = computeCrashPoint(seedHash, config.houseEdgePercent);

    const roundId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(crashGameRounds).values({
      roundId,
      userId: user.uid,
      betAmount,
      seed,
      seedHash,
      crashPoint,
      status: 'active',
      speed: config.speed,
      startedAt: now,
    });

    return {
      success: true,
      data: {
        roundId,
        betAmount,
        seedHash,
        speed: config.speed,
        startedAt: now,
        status: 'active',
      },
    };
  } catch (error) {
    console.error('[CrashGame] startCrashRound error:', error);
    const message = error instanceof Error ? error.message : 'Failed to start game';
    return { success: false, error: message };
  }
}

/**
 * Cash Out - 玩家兑现
 *
 * 1. 验证 round 存在且状态为 active
 * 2. 用服务端时间计算实际 multiplier
 * 3. 对比 crashPoint
 * 4. 发奖或判负
 */
export async function cashOutCrashRound(roundId: string): Promise<CrashGameResult> {
  try {
    const user = await getCurrentUser();
    const db = await getDb();
    const config = await loadConfig();

    // Find active round - atomic update with WHERE status='active'
    const [round] = await db.select()
      .from(crashGameRounds)
      .where(and(
        eq(crashGameRounds.roundId, roundId),
        eq(crashGameRounds.userId, user.uid),
        eq(crashGameRounds.status, 'active')
      ))
      .limit(1);

    if (!round) {
      return { success: false, error: 'No active round found' };
    }

    const now = Date.now();
    const startedAt = new Date(round.startedAt).getTime();
    const elapsedMs = now - startedAt;

    // Check max duration
    const maxDurationMs = config.maxDurationSeconds * 1000;
    if (elapsedMs > maxDurationMs + config.gracePeriodMs) {
      // Expired - mark as crashed
      await db.update(crashGameRounds)
        .set({
          status: 'expired',
          profit: -round.betAmount,
        })
        .where(and(
          eq(crashGameRounds.roundId, roundId),
          eq(crashGameRounds.status, 'active')
        ));

      return {
        success: true,
        data: {
          roundId: round.roundId,
          betAmount: round.betAmount,
          seedHash: round.seedHash,
          speed: round.speed,
          startedAt: round.startedAt,
          status: 'expired',
          crashPoint: round.crashPoint,
          cashOutMultiplier: undefined,
          profit: -round.betAmount,
          seed: round.seed,
        },
      };
    }

    // Calculate actual multiplier with grace period
    const effectiveElapsedMs = Math.max(0, elapsedMs - config.gracePeriodMs);
    const actualMultiplier = Math.exp(round.speed * effectiveElapsedMs);
    const roundedMultiplier = Math.floor(actualMultiplier * 100) / 100;

    if (roundedMultiplier <= round.crashPoint) {
      // WIN
      const winAmount = Math.floor(round.betAmount * roundedMultiplier * 100) / 100;
      const profit = winAmount - round.betAmount;

      // Atomic status update
      const result = await db.update(crashGameRounds)
        .set({
          status: 'cashed_out',
          cashOutMultiplier: roundedMultiplier,
          profit,
          cashedOutAt: new Date().toISOString(),
        })
        .where(and(
          eq(crashGameRounds.roundId, roundId),
          eq(crashGameRounds.status, 'active')
        ));

      if (result.changes === 0) {
        return { success: false, error: 'Round already settled' };
      }

      // Add winnings
      await addCredits(
        user.uid,
        winAmount,
        ProductType.CRASH_GAME_WIN,
        false,
        `Crash Game win: ${roundedMultiplier}x`,
      );

      return {
        success: true,
        data: {
          roundId: round.roundId,
          betAmount: round.betAmount,
          seedHash: round.seedHash,
          speed: round.speed,
          startedAt: round.startedAt,
          status: 'cashed_out',
          crashPoint: round.crashPoint,
          cashOutMultiplier: roundedMultiplier,
          profit,
          seed: round.seed,
        },
      };
    } else {
      // LOSE - multiplier exceeded crash point
      await db.update(crashGameRounds)
        .set({
          status: 'crashed',
          cashOutMultiplier: roundedMultiplier,
          profit: -round.betAmount,
        })
        .where(and(
          eq(crashGameRounds.roundId, roundId),
          eq(crashGameRounds.status, 'active')
        ));

      return {
        success: true,
        data: {
          roundId: round.roundId,
          betAmount: round.betAmount,
          seedHash: round.seedHash,
          speed: round.speed,
          startedAt: round.startedAt,
          status: 'crashed',
          crashPoint: round.crashPoint,
          cashOutMultiplier: roundedMultiplier,
          profit: -round.betAmount,
          seed: round.seed,
        },
      };
    }
  } catch (error) {
    console.error('[CrashGame] cashOutCrashRound error:', error);
    const message = error instanceof Error ? error.message : 'Failed to cash out';
    return { success: false, error: message };
  }
}

/**
 * 过期处理 - 超时自动判负
 */
export async function expireCrashRound(roundId: string): Promise<CrashGameResult> {
  try {
    const user = await getCurrentUser();
    const db = await getDb();

    const [round] = await db.select()
      .from(crashGameRounds)
      .where(and(
        eq(crashGameRounds.roundId, roundId),
        eq(crashGameRounds.userId, user.uid),
        eq(crashGameRounds.status, 'active')
      ))
      .limit(1);

    if (!round) {
      return { success: false, error: 'No active round found' };
    }

    await db.update(crashGameRounds)
      .set({
        status: 'expired',
        profit: -round.betAmount,
      })
      .where(and(
        eq(crashGameRounds.roundId, roundId),
        eq(crashGameRounds.status, 'active')
      ));

    return {
      success: true,
      data: {
        roundId: round.roundId,
        betAmount: round.betAmount,
        seedHash: round.seedHash,
        speed: round.speed,
        startedAt: round.startedAt,
        status: 'expired',
        crashPoint: round.crashPoint,
        profit: -round.betAmount,
        seed: round.seed,
      },
    };
  } catch (error) {
    console.error('[CrashGame] expireCrashRound error:', error);
    const message = error instanceof Error ? error.message : 'Failed to expire round';
    return { success: false, error: message };
  }
}

/**
 * 获取当前活跃的游戏轮次（用于页面刷新恢复）
 *
 * 如果有超时的 active round，自动标记为 expired
 */
export async function getActiveRound(): Promise<CrashGameResult> {
  try {
    const user = await getCurrentUser();
    const db = await getDb();
    const config = await loadConfig();

    const [round] = await db.select()
      .from(crashGameRounds)
      .where(and(
        eq(crashGameRounds.userId, user.uid),
        eq(crashGameRounds.status, 'active')
      ))
      .limit(1);

    if (!round) {
      return { success: true }; // No active round, data is undefined
    }

    // Check if expired
    const now = Date.now();
    const startedAt = new Date(round.startedAt).getTime();
    const elapsedMs = now - startedAt;
    const maxDurationMs = config.maxDurationSeconds * 1000;

    if (elapsedMs > maxDurationMs) {
      // Auto-expire
      await db.update(crashGameRounds)
        .set({
          status: 'expired',
          profit: -round.betAmount,
        })
        .where(and(
          eq(crashGameRounds.roundId, round.roundId),
          eq(crashGameRounds.status, 'active')
        ));

      return {
        success: true,
        data: {
          roundId: round.roundId,
          betAmount: round.betAmount,
          seedHash: round.seedHash,
          speed: round.speed,
          startedAt: round.startedAt,
          status: 'expired',
          crashPoint: round.crashPoint,
          profit: -round.betAmount,
          seed: round.seed,
        },
      };
    }

    return {
      success: true,
      data: {
        roundId: round.roundId,
        betAmount: round.betAmount,
        seedHash: round.seedHash,
        speed: round.speed,
        startedAt: round.startedAt,
        status: 'active',
      },
    };
  } catch (error) {
    console.error('[CrashGame] getActiveRound error:', error);
    return { success: false, error: 'Failed to get active round' };
  }
}

/**
 * 获取用户历史记录
 */
export async function getUserCrashHistory(limit: number = 20, offset: number = 0): Promise<CrashHistoryItem[]> {
  try {
    const user = await getCurrentUser();
    const db = await getDb();

    const rounds = await db.select({
      roundId: crashGameRounds.roundId,
      betAmount: crashGameRounds.betAmount,
      crashPoint: crashGameRounds.crashPoint,
      cashOutMultiplier: crashGameRounds.cashOutMultiplier,
      profit: crashGameRounds.profit,
      status: crashGameRounds.status,
      createdAt: crashGameRounds.createdAt,
      seed: crashGameRounds.seed,
      seedHash: crashGameRounds.seedHash,
    })
      .from(crashGameRounds)
      .where(eq(crashGameRounds.userId, user.uid))
      .orderBy(desc(crashGameRounds.createdAt))
      .limit(limit)
      .offset(offset);

    return rounds;
  } catch (error) {
    console.error('[CrashGame] getUserCrashHistory error:', error);
    return [];
  }
}
