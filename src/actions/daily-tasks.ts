'use server';

import db from '@/lib/db';
import { dailyTasks, users, anonymousUsers, creditHistory } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { getDailyTasksConfig, getMiningEconomyConfig } from '@/config/appConfig';

/**
 * 增加用户积分（根据是否匿名用户选择正确的表）
 * 匿名用户只有 credits（永久积分），没有 monthlyCredits
 */
async function addUserCredits(userId: string, isAnonymous: boolean, amount: number, addToPermanent: boolean) {
  if (isAnonymous) {
    // 匿名用户只有 credits 字段
    await db
      .update(anonymousUsers)
      .set({ credits: sql`${anonymousUsers.credits} + ${amount}` })
      .where(eq(anonymousUsers.userId, userId));
  } else if (addToPermanent) {
    await db
      .update(users)
      .set({ credits: sql`${users.credits} + ${amount}` })
      .where(eq(users.userId, userId));
  } else {
    await db
      .update(users)
      .set({ monthlyCredits: sql`${users.monthlyCredits} + ${amount}` })
      .where(eq(users.userId, userId));
  }
}

/**
 * 获取用户所在国家代码（从 Cloudflare / Vercel 注入的 header 中读取）
 */
async function getCountryFromHeaders(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get('cf-ipcountry')
      || headersList.get('x-vercel-ip-country')
      || null;
  } catch {
    return null;
  }
}

/**
 * 基于广告收益动态计算 $VOICICA 奖励
 * 公式: revenueUsd × revenue_share_ratio × randomFactor ÷ token_value_usd
 *
 * 新 APK 传真实 adRevenueMicros → 用真实收益（精准）
 * 旧 APK 不传 → 根据 IP 所在国家查 eCPM 表估算
 */
async function calculateVoicicaReward(adRevenueMicros?: number): Promise<{
  voicicaAmount: number;
  randomMultiplier: number;
  revenueUsd: number;
}> {
  const miningConfig = getMiningEconomyConfig();
  const [minMul, maxMul] = miningConfig.random_multiplier;
  const randomMultiplier = minMul + Math.random() * (maxMul - minMul);

  let revenueUsd: number;
  if (adRevenueMicros && adRevenueMicros > 0) {
    // 精准：来自 OnPaidEvent
    revenueUsd = adRevenueMicros / 1_000_000;
  } else {
    // 估算：根据国家查 eCPM 表
    const country = await getCountryFromHeaders();
    const ecpm = (country && miningConfig.estimated_ecpm_by_country[country])
      || miningConfig.default_ecpm_usd;
    revenueUsd = ecpm / 1000; // eCPM 是千次展示收益，单次 = ÷1000
  }

  const voicicaAmount = Math.max(1, Math.round(
    revenueUsd * miningConfig.revenue_share_ratio * randomMultiplier / miningConfig.token_value_usd
  ));

  return { voicicaAmount, randomMultiplier, revenueUsd };
}

/**
 * 每日任务状态
 */
export interface DailyTasksStatus {
  /** 今日日期 */
  date: string;
  /** 是否已签到 */
  checkinDone: boolean;
  /** 签到获得的积分 */
  checkinCredits: number;
  /** 已领取的广告档位数 (0-6) */
  adRewardsClaimed: number;
  /** 广告奖励累计获得的积分 */
  adRewardsCredits: number;
  /** 今日已获得总积分 */
  todayTotalCredits: number;
  /** 今日可获得最大积分 */
  todayMaxCredits: number;
  /** 下一档广告奖励积分（如果还有） */
  nextAdReward: number | null;
}

/**
 * 任务结果
 */
export interface TaskResult {
  success: boolean;
  message?: string;
  credits?: number;
  reason?: 'unavailable' | 'skipped' | 'error';
}

/**
 * 获取今日日期字符串 (YYYY-MM-DD)
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 获取每日任务配置（Server Action 包装）
 * @param isNative 是否为原生应用
 */
export async function getDailyTasksConfigAction(isNative: boolean = false) {
  return getDailyTasksConfig(isNative);
}

/**
 * 获取每日任务状态
 * @param isNative 是否为原生应用
 */
export async function getDailyTasksStatus(isNative: boolean = false): Promise<DailyTasksStatus | null> {
  try {
    const { user_id } = await getUserOrAnonymous();
    if (!user_id) {
      return null;
    }

    const config = getDailyTasksConfig(isNative);
    const today = getTodayDate();

    // 查询今日任务记录 (composite unique on user_id + date)
    const [record] = await db
      .select()
      .from(dailyTasks)
      .where(and(eq(dailyTasks.userId, user_id), eq(dailyTasks.date, today)))
      .limit(1);

    // 计算最大可获得积分
    const maxAdCredits = config.ad_reward_tiers.reduce((sum: number, v: number) => sum + v, 0);
    const todayMaxCredits = config.checkin_credits + maxAdCredits;

    if (!record) {
      // 今日还没有任何任务记录
      return {
        date: today,
        checkinDone: false,
        checkinCredits: 0,
        adRewardsClaimed: 0,
        adRewardsCredits: 0,
        todayTotalCredits: 0,
        todayMaxCredits,
        nextAdReward: config.ad_reward_tiers[0] || null,
      };
    }

    const todayTotalCredits = record.checkinCredits + record.adRewardsCredits;
    const nextTierIndex = record.adRewardsClaimed;
    const nextAdReward = nextTierIndex < config.ad_reward_tiers.length
      ? config.ad_reward_tiers[nextTierIndex]
      : null;

    return {
      date: today,
      checkinDone: record.checkinDone,
      checkinCredits: record.checkinCredits,
      adRewardsClaimed: record.adRewardsClaimed,
      adRewardsCredits: record.adRewardsCredits,
      todayTotalCredits,
      todayMaxCredits,
      nextAdReward,
    };
  } catch (error) {
    console.error('❌ [getDailyTasksStatus] 获取每日任务状态失败:', error);
    return null;
  }
}

/**
 * 签到领取积分
 * 使用原子操作防止并发重复领取
 * @param addToPermanent 是否添加到永久积分（默认添加到当月积分）
 * @param isNative 是否为原生应用（用于获取对应的配置）
 */
export async function checkin(addToPermanent: boolean = false, isNative: boolean = false, adRevenueMicros?: number, adRevenueCurrency?: string): Promise<TaskResult> {
  try {
    const { user_id, is_anonymous } = await getUserOrAnonymous();
    if (!user_id) {
      return { success: false, message: 'Please login first' };
    }

    const config = getDailyTasksConfig(isNative);
    if (!config.enabled) {
      return { success: false, message: 'Daily tasks disabled' };
    }

    const today = getTodayDate();
    const credits = config.checkin_credits;

    // 先尝试创建记录（如果不存在），使用 onConflictDoNothing 替代 skipDuplicates
    await db
      .insert(dailyTasks)
      .values({
        userId: user_id,
        date: today,
        checkinDone: false,
        checkinCredits: 0,
        adRewardsClaimed: 0,
        adRewardsCredits: 0,
      })
      .onConflictDoNothing();

    // 使用原子更新，只有 checkin_done = false 时才会更新成功
    const updateResult = await db
      .update(dailyTasks)
      .set({
        checkinDone: true,
        checkinCredits: credits,
      })
      .where(
        and(
          eq(dailyTasks.userId, user_id),
          eq(dailyTasks.date, today),
          eq(dailyTasks.checkinDone, false), // 关键：只更新未签到的记录
        )
      )
      .returning();

    // 如果没有更新任何记录，说明已经签到过了
    if (updateResult.length === 0) {
      console.log('[checkin] Already checked in today (update returned 0 rows)');
      return { success: false, message: 'Already checked in today' };
    }

    console.log(`[checkin] Successfully checked in, updating ${addToPermanent ? 'credits' : 'monthly_credits'}...`);

    // 增加用户积分（根据是否匿名用户选择正确的表）
    await addUserCredits(user_id, is_anonymous, credits, addToPermanent);

    // 记录积分历史
    await db.insert(creditHistory).values({
      userId: user_id,
      amount: credits,
      description: addToPermanent ? 'Daily check-in reward (permanent)' : 'Daily check-in reward',
      productType: 'daily_checkin',
    });

    return { success: true, credits };
  } catch (error) {
    console.error('❌ [checkin] 签到失败:', error);
    return { success: false, message: 'Check-in failed' };
  }
}

/**
 * 领取广告奖励
 * 使用原子操作防止并发重复领取
 * @param adWatched 是否真的看完了广告（第一阶段模拟为 true）
 * @param addToPermanent 是否添加到永久积分（默认添加到当月积分）
 * @param bonusMode 是否为奖励模式（所有档位领取完后，继续看广告获得固定1积分）
 * @param isNative 是否为原生应用（用于获取对应的配置）
 */
export async function claimAdReward(adWatched: boolean = true, addToPermanent: boolean = false, bonusMode: boolean = false, isNative: boolean = false, adRevenueMicros?: number, adRevenueCurrency?: string): Promise<TaskResult> {
  try {
    if (!adWatched) {
      return { success: false, message: 'Please watch the ad first' };
    }

    const { user_id, is_anonymous } = await getUserOrAnonymous();
    if (!user_id) {
      return { success: false, message: 'Please login first' };
    }

    const config = getDailyTasksConfig(isNative);
    if (!config.enabled) {
      return { success: false, message: 'Daily tasks disabled' };
    }

    const today = getTodayDate();
    const tiers = config.ad_reward_tiers;

    // 动态计算奖励（基于广告收益）
    const { voicicaAmount, randomMultiplier } = await calculateVoicicaReward(adRevenueMicros);

    // 先尝试创建记录（如果不存在）
    await db
      .insert(dailyTasks)
      .values({
        userId: user_id,
        date: today,
        checkinDone: false,
        checkinCredits: 0,
        adRewardsClaimed: 0,
        adRewardsCredits: 0,
      })
      .onConflictDoNothing();

    // 尝试每个档位，从 0 开始（保留 tier 循环作为防刷计数机制）
    for (let tierIndex = 0; tierIndex < tiers.length; tierIndex++) {
      const newClaimed = tierIndex + 1;

      const updateResult = await db
        .update(dailyTasks)
        .set({
          adRewardsClaimed: newClaimed,
          adRewardsCredits: sql`${dailyTasks.adRewardsCredits} + ${voicicaAmount}`,
        })
        .where(
          and(
            eq(dailyTasks.userId, user_id),
            eq(dailyTasks.date, today),
            eq(dailyTasks.adRewardsClaimed, tierIndex), // 关键：只更新当前档位等于 tierIndex 的记录
          )
        )
        .returning();

      // 如果更新成功，说明成功领取了这个档位
      if (updateResult.length > 0) {
        console.log(`[claimAdReward] Successfully claimed tier ${newClaimed}, voicicaAmount: ${voicicaAmount}, addToPermanent: ${addToPermanent}`);

        // 增加用户积分（根据是否匿名用户选择正确的表）
        await addUserCredits(user_id, is_anonymous, voicicaAmount, addToPermanent);

        // 记录积分历史（含广告收益数据）
        await db.insert(creditHistory).values({
          userId: user_id,
          amount: voicicaAmount,
          description: addToPermanent ? `Ad reward tier ${newClaimed} (permanent)` : `Ad reward tier ${newClaimed}`,
          productType: 'ad_reward',
          adRevenueMicros: adRevenueMicros ?? null,
          adRevenueCurrency: adRevenueCurrency ?? null,
          randomMultiplier,
        });

        return { success: true, credits: voicicaAmount };
      }
    }

    // 所有档位都已领取
    if (bonusMode) {
      // 奖励模式：动态计算（不再固定 1 积分）
      console.log(`[claimAdReward] Bonus mode: giving ${voicicaAmount} credits, addToPermanent: ${addToPermanent}`);

      // 更新累计积分
      await db
        .update(dailyTasks)
        .set({
          adRewardsCredits: sql`${dailyTasks.adRewardsCredits} + ${voicicaAmount}`,
        })
        .where(
          and(
            eq(dailyTasks.userId, user_id),
            eq(dailyTasks.date, today),
          )
        );

      // 增加用户积分（根据是否匿名用户选择正确的表）
      await addUserCredits(user_id, is_anonymous, voicicaAmount, addToPermanent);

      // 记录积分历史（含广告收益数据）
      await db.insert(creditHistory).values({
        userId: user_id,
        amount: voicicaAmount,
        description: addToPermanent ? 'Bonus ad reward (permanent)' : 'Bonus ad reward',
        productType: 'ad_reward_bonus',
        adRevenueMicros: adRevenueMicros ?? null,
        adRevenueCurrency: adRevenueCurrency ?? null,
        randomMultiplier,
      });

      return { success: true, credits: voicicaAmount };
    }

    console.log('[claimAdReward] All ad rewards claimed today');
    return { success: false, message: 'All ad rewards claimed today' };
  } catch (error) {
    console.error('❌ [claimAdReward] 领取广告奖励失败:', error);
    return { success: false, message: 'Claim failed' };
  }
}
