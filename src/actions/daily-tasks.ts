'use server';

import { prisma } from '@/lib/prisma';
import { getOptionalUser } from '@/lib/auth-firebase';
import { getDailyTasksConfig } from '@/config/appConfig';

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
 */
export async function getDailyTasksConfigAction() {
  return getDailyTasksConfig();
}

/**
 * 获取每日任务状态
 */
export async function getDailyTasksStatus(): Promise<DailyTasksStatus | null> {
  try {
    const authUser = await getOptionalUser();
    if (!authUser) {
      // 未登录用户返回 null
      return null;
    }

    const config = getDailyTasksConfig();
    const today = getTodayDate();

    // 查询今日任务记录
    const record = await prisma.daily_tasks.findUnique({
      where: {
        user_id_date: {
          user_id: authUser.uid,
          date: today,
        },
      },
    });

    // 计算最大可获得积分
    const maxAdCredits = config.ad_reward_tiers.reduce((sum, v) => sum + v, 0);
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

    const todayTotalCredits = record.checkin_credits + record.ad_rewards_credits;
    const nextTierIndex = record.ad_rewards_claimed;
    const nextAdReward = nextTierIndex < config.ad_reward_tiers.length
      ? config.ad_reward_tiers[nextTierIndex]
      : null;

    return {
      date: today,
      checkinDone: record.checkin_done,
      checkinCredits: record.checkin_credits,
      adRewardsClaimed: record.ad_rewards_claimed,
      adRewardsCredits: record.ad_rewards_credits,
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
 */
export async function checkin(): Promise<TaskResult> {
  try {
    const authUser = await getOptionalUser();
    if (!authUser) {
      return { success: false, message: 'Please login first' };
    }

    const config = getDailyTasksConfig();
    if (!config.enabled) {
      return { success: false, message: 'Daily tasks disabled' };
    }

    const today = getTodayDate();
    const credits = config.checkin_credits;

    // 使用事务确保原子操作
    const result = await prisma.$transaction(async (tx) => {
      // 先尝试创建记录（如果不存在）
      // 使用 createMany + skipDuplicates 确保只有一个请求能成功创建
      const createResult = await tx.daily_tasks.createMany({
        data: [{
          user_id: authUser.uid,
          date: today,
          checkin_done: false,
          checkin_credits: 0,
          ad_rewards_claimed: 0,
          ad_rewards_credits: 0,
        }],
        skipDuplicates: true,
      });

      console.log(`[checkin] createMany result: ${createResult.count} rows created`);

      // 使用 updateMany 原子更新，只有 checkin_done = false 时才会更新成功
      const updateResult = await tx.daily_tasks.updateMany({
        where: {
          user_id: authUser.uid,
          date: today,
          checkin_done: false, // 关键：只更新未签到的记录
        },
        data: {
          checkin_done: true,
          checkin_credits: credits,
        },
      });

      // 如果没有更新任何记录，说明已经签到过了
      if (updateResult.count === 0) {
        console.log('[checkin] Already checked in today (updateMany returned 0)');
        return { success: false, message: 'Already checked in today' };
      }

      console.log(`[checkin] Successfully checked in, updating monthly_credits...`);

      // 增加用户当月积分（每日任务获得的积分只计入当月积分，不计入永久积分）
      await tx.users.update({
        where: { user_id: authUser.uid },
        data: {
          monthly_credits: { increment: credits },
        },
      });

      // 记录积分历史
      await tx.credit_history.create({
        data: {
          user_id: authUser.uid,
          amount: credits,
          description: 'Daily check-in reward',
          product_type: 'daily_checkin',
        },
      });

      return { success: true, credits };
    });

    return result;
  } catch (error) {
    console.error('❌ [checkin] 签到失败:', error);
    return { success: false, message: 'Check-in failed' };
  }
}

/**
 * 领取广告奖励
 * 使用原子操作防止并发重复领取
 * @param adWatched 是否真的看完了广告（第一阶段模拟为 true）
 */
export async function claimAdReward(adWatched: boolean = true): Promise<TaskResult> {
  try {
    if (!adWatched) {
      return { success: false, message: 'Please watch the ad first' };
    }

    const authUser = await getOptionalUser();
    if (!authUser) {
      return { success: false, message: 'Please login first' };
    }

    const config = getDailyTasksConfig();
    if (!config.enabled) {
      return { success: false, message: 'Daily tasks disabled' };
    }

    const today = getTodayDate();
    const tiers = config.ad_reward_tiers;

    // 使用事务确保原子操作
    const result = await prisma.$transaction(async (tx) => {
      // 先尝试创建记录（如果不存在）
      await tx.daily_tasks.createMany({
        data: [{
          user_id: authUser.uid,
          date: today,
          checkin_done: false,
          checkin_credits: 0,
          ad_rewards_claimed: 0,
          ad_rewards_credits: 0,
        }],
        skipDuplicates: true,
      });

      // 尝试每个档位，从 0 开始
      for (let tierIndex = 0; tierIndex < tiers.length; tierIndex++) {
        // 使用原子更新：只有当 ad_rewards_claimed 等于当前 tierIndex 时才更新
        const credits = tiers[tierIndex];
        const newClaimed = tierIndex + 1;

        // 计算新的累计积分（基于档位）
        const newTotalAdCredits = tiers.slice(0, newClaimed).reduce((sum, v) => sum + v, 0);

        const updateResult = await tx.daily_tasks.updateMany({
          where: {
            user_id: authUser.uid,
            date: today,
            ad_rewards_claimed: tierIndex, // 关键：只更新当前档位等于 tierIndex 的记录
          },
          data: {
            ad_rewards_claimed: newClaimed,
            ad_rewards_credits: newTotalAdCredits,
          },
        });

        // 如果更新成功，说明成功领取了这个档位
        if (updateResult.count > 0) {
          console.log(`[claimAdReward] Successfully claimed tier ${newClaimed}, credits: ${credits}`);

          // 增加用户当月积分（广告奖励只计入当月积分，不计入永久积分）
          await tx.users.update({
            where: { user_id: authUser.uid },
            data: {
              monthly_credits: { increment: credits },
            },
          });

          // 记录积分历史
          await tx.credit_history.create({
            data: {
              user_id: authUser.uid,
              amount: credits,
              description: `Ad reward tier ${newClaimed}`,
              product_type: 'ad_reward',
            },
          });

          return { success: true, credits };
        }
      }

      // 所有档位都已领取
      console.log('[claimAdReward] All ad rewards claimed today');
      return { success: false, message: 'All ad rewards claimed today' };
    });

    return result;
  } catch (error) {
    console.error('❌ [claimAdReward] 领取广告奖励失败:', error);
    return { success: false, message: 'Claim failed' };
  }
}