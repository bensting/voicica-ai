'use server';

import db from '@/lib/db';
import { dailyTasks, users, anonymousUsers, creditHistory } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { getDailyTasksConfig, getMiningEconomyConfig } from '@/config/appConfig';
import { distributeReferralCommissions } from '@/actions/referral';

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
 * 原生端（AdMob）：新 APK 传真实 adRevenueMicros → 精准；旧 APK → 按 AdMob eCPM 估算
 * Web 端（ExoClick）：无精准数据，按 ExoClick eCPM 估算（远低于 AdMob）
 */
async function calculateVoicicaReward(isNative: boolean, adRevenueMicros?: number, adRevenueCurrency?: string): Promise<{
  voicicaAmount: number;
  randomMultiplier: number;
  revenueMicros: number;
  revenueSource: 'precise' | 'estimated';
}> {
  const miningConfig = getMiningEconomyConfig();
  const [minMul, maxMul] = miningConfig.random_multiplier;
  const randomMultiplier = minMul + Math.random() * (maxMul - minMul);

  let revenueUsd: number;
  let revenueSource: 'precise' | 'estimated';

  // 有真实数据且币种有配置汇率 → 精准（仅原生端 AdMob 会传）
  const exchangeRate = adRevenueCurrency
    ? miningConfig.currency_to_usd[adRevenueCurrency]
    : undefined;
  const hasValidRevenue = adRevenueMicros && adRevenueMicros > 0 && exchangeRate;

  if (hasValidRevenue) {
    // 精准：来自 AdMob OnPaidEvent，按汇率转 USD
    revenueUsd = (adRevenueMicros / 1_000_000) * exchangeRate;
    revenueSource = 'precise';
  } else {
    // 估算：根据平台选择对应的 eCPM 表
    const country = await getCountryFromHeaders();

    if (isNative) {
      // 原生端：AdMob 激励视频 eCPM（$2~$25）
      const ecpm = (country && miningConfig.estimated_ecpm_by_country[country])
        || miningConfig.default_ecpm_usd;
      revenueUsd = ecpm / 1000;
    } else {
      // Web 端：ExoClick VAST In-Stream eCPM（$0.01~$0.10）
      // 注意：每次奖励播放多个 zone，这里是单个 zone 的 eCPM
      const ecpm = (country && miningConfig.web_estimated_ecpm_by_country[country])
        || miningConfig.web_default_ecpm_usd;
      // Web 端播放多个 zone，总收入 = 单 zone eCPM × zone 数量 / 1000
      const zoneCount = 2; // 与 exoclick.ts zoneIds 数量一致
      revenueUsd = (ecpm * zoneCount) / 1000;
    }
    revenueSource = 'estimated';
  }

  const revenueMicros = Math.round(revenueUsd * 1_000_000);

  const voicicaAmount = Math.max(0.0001, Math.round(
    revenueUsd * miningConfig.revenue_share_ratio * randomMultiplier / miningConfig.token_value_usd * 10000
  ) / 10000);

  return { voicicaAmount, randomMultiplier, revenueMicros, revenueSource };
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
  /** 今日已观看广告次数 */
  adRewardsClaimed: number;
  /** 广告奖励累计获得的积分 */
  adRewardsCredits: number;
  /** 今日已获得总积分 */
  todayTotalCredits: number;
  /** 每日最大广告观看次数 */
  maxDailyAdViews: number;
  /** 剩余可观看次数 */
  remainingAdViews: number;
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

    const maxViews = config.max_daily_ad_views;

    if (!record) {
      return {
        date: today,
        checkinDone: false,
        checkinCredits: 0,
        adRewardsClaimed: 0,
        adRewardsCredits: 0,
        todayTotalCredits: 0,
        maxDailyAdViews: maxViews,
        remainingAdViews: maxViews,
      };
    }

    const todayTotalCredits = record.checkinCredits + record.adRewardsCredits;

    return {
      date: today,
      checkinDone: record.checkinDone,
      checkinCredits: record.checkinCredits,
      adRewardsClaimed: record.adRewardsClaimed,
      adRewardsCredits: record.adRewardsCredits,
      todayTotalCredits,
      maxDailyAdViews: maxViews,
      remainingAdViews: Math.max(0, maxViews - record.adRewardsClaimed),
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
export async function checkin(addToPermanent: boolean = false, isNative: boolean = false): Promise<TaskResult> {
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
 * @param isNative 是否为原生应用（用于获取对应的配置）
 */
export async function claimAdReward(adWatched: boolean = true, addToPermanent: boolean = false, isNative: boolean = false, adRevenueMicros?: number, adRevenueCurrency?: string): Promise<TaskResult> {
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
    const maxViews = config.max_daily_ad_views;

    // 动态计算奖励（基于广告收益）
    const { voicicaAmount, randomMultiplier, revenueMicros, revenueSource } = await calculateVoicicaReward(isNative, adRevenueMicros, adRevenueCurrency);

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

    // 原子操作：只有 adRewardsClaimed < maxViews 时才递增并发放奖励
    const updateResult = await db
      .update(dailyTasks)
      .set({
        adRewardsClaimed: sql`${dailyTasks.adRewardsClaimed} + 1`,
        adRewardsCredits: sql`${dailyTasks.adRewardsCredits} + ${voicicaAmount}`,
      })
      .where(
        and(
          eq(dailyTasks.userId, user_id),
          eq(dailyTasks.date, today),
          sql`${dailyTasks.adRewardsClaimed} < ${maxViews}`,
        )
      )
      .returning();

    if (updateResult.length === 0) {
      console.log(`[claimAdReward] Daily limit reached (${maxViews} views)`);
      return { success: false, message: `Daily limit reached (${maxViews} views)` };
    }

    const newClaimed = updateResult[0].adRewardsClaimed;
    console.log(`[claimAdReward] Mining #${newClaimed}/${maxViews}, voicicaAmount: ${voicicaAmount}, addToPermanent: ${addToPermanent}`);

    // 增加用户积分
    await addUserCredits(user_id, is_anonymous, voicicaAmount, addToPermanent);

    // 记录积分历史（含广告收益数据）
    await db.insert(creditHistory).values({
      userId: user_id,
      amount: voicicaAmount,
      description: `Mining #${newClaimed} | ${isNative ? 'native' : 'web'} | ${revenueSource} | ${revenueMicros}µ | x${randomMultiplier.toFixed(2)} | ${voicicaAmount}credits${addToPermanent ? ' | permanent' : ''}`,
      productType: 'ad_reward',
      adRevenueMicros: revenueMicros,
      adRevenueCurrency: adRevenueCurrency ?? null,
      adRevenueSource: revenueSource,
      randomMultiplier,
    });

    // 分发推荐提成（异步，不阻塞主流程）
    if (!is_anonymous) {
      distributeReferralCommissions(user_id, voicicaAmount).catch(err =>
        console.error('❌ [referral] commission distribution failed:', err)
      );
    }

    return { success: true, credits: voicicaAmount };
  } catch (error) {
    console.error('❌ [claimAdReward] 领取广告奖励失败:', error);
    return { success: false, message: 'Claim failed' };
  }
}
