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
      // 查询或创建今日任务记录
      const existing = await tx.daily_tasks.findUnique({
        where: {
          user_id_date: {
            user_id: authUser.uid,
            date: today,
          },
        },
      });

      if (existing?.checkin_done) {
        return { success: false, message: 'Already checked in today' };
      }

      // 更新或创建记录
      await tx.daily_tasks.upsert({
        where: {
          user_id_date: {
            user_id: authUser.uid,
            date: today,
          },
        },
        create: {
          user_id: authUser.uid,
          date: today,
          checkin_done: true,
          checkin_credits: credits,
        },
        update: {
          checkin_done: true,
          checkin_credits: credits,
        },
      });

      // 增加用户积分
      await tx.users.update({
        where: { user_id: authUser.uid },
        data: {
          credits: { increment: credits },
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
      // 查询今日任务记录
      const existing = await tx.daily_tasks.findUnique({
        where: {
          user_id_date: {
            user_id: authUser.uid,
            date: today,
          },
        },
      });

      const currentClaimed = existing?.ad_rewards_claimed ?? 0;

      // 检查是否还有可领取的档位
      if (currentClaimed >= tiers.length) {
        return { success: false, message: 'All ad rewards claimed today' };
      }

      // 获取当前档位的奖励积分
      const credits = tiers[currentClaimed];
      const newClaimed = currentClaimed + 1;
      const newTotalAdCredits = (existing?.ad_rewards_credits ?? 0) + credits;

      // 更新或创建记录
      await tx.daily_tasks.upsert({
        where: {
          user_id_date: {
            user_id: authUser.uid,
            date: today,
          },
        },
        create: {
          user_id: authUser.uid,
          date: today,
          ad_rewards_claimed: newClaimed,
          ad_rewards_credits: credits,
        },
        update: {
          ad_rewards_claimed: newClaimed,
          ad_rewards_credits: newTotalAdCredits,
        },
      });

      // 增加用户积分
      await tx.users.update({
        where: { user_id: authUser.uid },
        data: {
          credits: { increment: credits },
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
    });

    return result;
  } catch (error) {
    console.error('❌ [claimAdReward] 领取广告奖励失败:', error);
    return { success: false, message: 'Claim failed' };
  }
}