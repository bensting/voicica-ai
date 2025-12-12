'use server';

/**
 * 月度积分模块 Server Actions
 *
 * 处理每月福利的领取、查询和扣费逻辑
 */

import prisma from '@/lib/prisma';
import { getCurrentUser, getUserOrAnonymous } from '@/lib/auth-firebase';
import { getMonthlyRewardsConfig } from '@/config/appConfig';

// ==================== 类型定义 ====================

export type RewardType = 'anonymous' | 'login' | 'app_download';

export interface MonthlyCreditsStatus {
  /** 当前月份 */
  currentMonth: string;
  /** 各福利领取状态 */
  rewards: {
    anonymous: { claimed: boolean; credits: number };
    login: { claimed: boolean; credits: number };
    app_download: { claimed: boolean; credits: number };
  };
  /** 本月可用积分（总领取 - 已使用） */
  availableCredits: number;
  /** 本月已使用积分 */
  usedCredits: number;
  /** 配置的积分数额 */
  config: {
    anonymous: number;
    login: number;
    app_download: number;
  };
}

export interface ClaimResult {
  success: boolean;
  message?: string;
  credits?: number;
  availableCredits?: number;
}

// ==================== 工具函数 ====================

/**
 * 获取当前月份字符串
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 计算月度积分可用余额
 */
function calculateAvailable(record: {
  anonymous_credits: number;
  login_credits: number;
  app_download_credits: number;
  used_credits: number;
} | null): number {
  if (!record) return 0;
  const total = record.anonymous_credits + record.login_credits + record.app_download_credits;
  return Math.max(0, total - record.used_credits);
}

// ==================== 查询接口 ====================

/**
 * 获取月度积分状态（支持登录用户和匿名用户）
 */
export async function getMonthlyCreditsStatus(): Promise<MonthlyCreditsStatus> {
  const config = getMonthlyRewardsConfig();
  const currentMonth = getCurrentMonth();
  const unifiedUser = await getUserOrAnonymous();

  let record = null;

  if (unifiedUser.is_anonymous) {
    // 匿名用户：通过 device_id 查询（user_id 格式为 anonymous_xxx，其中 xxx 是 device_fingerprint 的 hash）
    // 从 anonymous_users 表获取 device_fingerprint
    const anonUser = await prisma.anonymous_users.findUnique({
      where: { user_id: unifiedUser.user_id },
      select: { device_fingerprint: true },
    });
    if (anonUser?.device_fingerprint) {
      record = await prisma.monthly_credits.findUnique({
        where: {
          device_id_month: {
            device_id: anonUser.device_fingerprint,
            month: currentMonth,
          },
        },
      });
    }
  } else {
    // 登录用户：通过 user_id 查询
    record = await prisma.monthly_credits.findUnique({
      where: {
        user_id_month: {
          user_id: unifiedUser.user_id,
          month: currentMonth,
        },
      },
    });
  }

  return {
    currentMonth,
    rewards: {
      anonymous: {
        claimed: (record?.anonymous_credits ?? 0) > 0,
        credits: record?.anonymous_credits ?? 0,
      },
      login: {
        claimed: (record?.login_credits ?? 0) > 0,
        credits: record?.login_credits ?? 0,
      },
      app_download: {
        claimed: (record?.app_download_credits ?? 0) > 0,
        credits: record?.app_download_credits ?? 0,
      },
    },
    availableCredits: calculateAvailable(record),
    usedCredits: record?.used_credits ?? 0,
    config: {
      anonymous: config.anonymous_credits,
      login: config.login_credits,
      app_download: config.app_download_credits,
    },
  };
}

/**
 * 获取登录用户的月度积分状态
 */
export async function getLoginUserMonthlyStatus(): Promise<MonthlyCreditsStatus> {
  const config = getMonthlyRewardsConfig();
  const currentMonth = getCurrentMonth();
  const authUser = await getCurrentUser();

  const record = await prisma.monthly_credits.findUnique({
    where: {
      user_id_month: {
        user_id: authUser.uid,
        month: currentMonth,
      },
    },
  });

  return {
    currentMonth,
    rewards: {
      anonymous: {
        claimed: (record?.anonymous_credits ?? 0) > 0,
        credits: record?.anonymous_credits ?? 0,
      },
      login: {
        claimed: (record?.login_credits ?? 0) > 0,
        credits: record?.login_credits ?? 0,
      },
      app_download: {
        claimed: (record?.app_download_credits ?? 0) > 0,
        credits: record?.app_download_credits ?? 0,
      },
    },
    availableCredits: calculateAvailable(record),
    usedCredits: record?.used_credits ?? 0,
    config: {
      anonymous: config.anonymous_credits,
      login: config.login_credits,
      app_download: config.app_download_credits,
    },
  };
}

// ==================== 领取接口 ====================

/**
 * 匿名用户领取福利
 */
export async function claimAnonymousReward(deviceId: string): Promise<ClaimResult> {
  const config = getMonthlyRewardsConfig();

  if (!config.enabled) {
    return { success: false, message: '福利活动暂未开启' };
  }

  const currentMonth = getCurrentMonth();
  const credits = config.anonymous_credits;

  try {
    // 检查是否已领取
    const existing = await prisma.monthly_credits.findUnique({
      where: {
        device_id_month: {
          device_id: deviceId,
          month: currentMonth,
        },
      },
    });

    if (existing && existing.anonymous_credits > 0) {
      return { success: false, message: '本月已领取过游客福利' };
    }

    // 创建或更新记录
    const record = await prisma.monthly_credits.upsert({
      where: {
        device_id_month: {
          device_id: deviceId,
          month: currentMonth,
        },
      },
      create: {
        device_id: deviceId,
        month: currentMonth,
        anonymous_credits: credits,
      },
      update: {
        anonymous_credits: credits,
      },
    });

    // 同时更新 anonymous_users 表的积分
    await prisma.anonymous_users.updateMany({
      where: { device_fingerprint: deviceId },
      data: {
        credits: { increment: credits },
      },
    });

    console.log(`✅ [MonthlyCredits] 匿名用户领取福利: device=${deviceId}, credits=${credits}`);

    return {
      success: true,
      credits,
      availableCredits: calculateAvailable(record),
    };
  } catch (error) {
    console.error('❌ [MonthlyCredits] 匿名领取失败:', error);
    return { success: false, message: '领取失败，请稍后重试' };
  }
}

/**
 * 登录用户领取福利
 */
export async function claimLoginReward(): Promise<ClaimResult> {
  const config = getMonthlyRewardsConfig();

  if (!config.enabled) {
    return { success: false, message: '福利活动暂未开启' };
  }

  const currentMonth = getCurrentMonth();
  const credits = config.login_credits;

  try {
    const authUser = await getCurrentUser();

    // 检查是否已领取
    const existing = await prisma.monthly_credits.findUnique({
      where: {
        user_id_month: {
          user_id: authUser.uid,
          month: currentMonth,
        },
      },
    });

    if (existing && existing.login_credits > 0) {
      return { success: false, message: '本月已领取过登录福利' };
    }

    // 创建或更新记录
    const record = await prisma.monthly_credits.upsert({
      where: {
        user_id_month: {
          user_id: authUser.uid,
          month: currentMonth,
        },
      },
      create: {
        user_id: authUser.uid,
        month: currentMonth,
        login_credits: credits,
      },
      update: {
        login_credits: credits,
      },
    });

    // 同时更新 users 表的积分
    await prisma.users.update({
      where: { user_id: authUser.uid },
      data: {
        credits: { increment: credits },
      },
    });

    // 记录积分历史
    await prisma.credit_history.create({
      data: {
        user_id: authUser.uid,
        amount: credits,
        description: `${currentMonth} 月度登录福利`,
        product_type: 'monthly_login_reward',
      },
    });

    console.log(`✅ [MonthlyCredits] 用户领取登录福利: user=${authUser.uid}, credits=${credits}`);

    return {
      success: true,
      credits,
      availableCredits: calculateAvailable(record),
    };
  } catch (error) {
    console.error('❌ [MonthlyCredits] 登录福利领取失败:', error);
    return { success: false, message: '领取失败，请稍后重试' };
  }
}

/**
 * 领取 APP 下载福利
 */
export async function claimAppDownloadReward(): Promise<ClaimResult> {
  const config = getMonthlyRewardsConfig();

  if (!config.enabled) {
    return { success: false, message: '福利活动暂未开启' };
  }

  const currentMonth = getCurrentMonth();
  const credits = config.app_download_credits;

  try {
    const authUser = await getCurrentUser();

    // 检查是否已领取
    const existing = await prisma.monthly_credits.findUnique({
      where: {
        user_id_month: {
          user_id: authUser.uid,
          month: currentMonth,
        },
      },
    });

    if (existing && existing.app_download_credits > 0) {
      return { success: false, message: '本月已领取过APP福利' };
    }

    // 创建或更新记录
    const record = await prisma.monthly_credits.upsert({
      where: {
        user_id_month: {
          user_id: authUser.uid,
          month: currentMonth,
        },
      },
      create: {
        user_id: authUser.uid,
        month: currentMonth,
        app_download_credits: credits,
      },
      update: {
        app_download_credits: credits,
      },
    });

    // 同时更新 users 表的积分
    await prisma.users.update({
      where: { user_id: authUser.uid },
      data: {
        credits: { increment: credits },
      },
    });

    // 记录积分历史
    await prisma.credit_history.create({
      data: {
        user_id: authUser.uid,
        amount: credits,
        description: `${currentMonth} APP下载福利`,
        product_type: 'monthly_app_reward',
      },
    });

    console.log(`✅ [MonthlyCredits] 用户领取APP福利: user=${authUser.uid}, credits=${credits}`);

    return {
      success: true,
      credits,
      availableCredits: calculateAvailable(record),
    };
  } catch (error) {
    console.error('❌ [MonthlyCredits] APP福利领取失败:', error);
    return { success: false, message: '领取失败，请稍后重试' };
  }
}

// ==================== 扣费接口 ====================

/**
 * 获取用户可用积分（永久 + 月度）
 */
export async function getAvailableCredits(): Promise<{
  permanent: number;
  monthly: number;
  total: number;
}> {
  const currentMonth = getCurrentMonth();
  const unifiedUser = await getUserOrAnonymous();

  let permanentCredits = 0;
  let monthlyRecord = null;

  if (unifiedUser.is_anonymous) {
    // 匿名用户
    const anonUser = await prisma.anonymous_users.findUnique({
      where: { user_id: unifiedUser.user_id },
      select: { credits: true, device_fingerprint: true },
    });
    permanentCredits = anonUser?.credits ?? 0;

    if (anonUser?.device_fingerprint) {
      monthlyRecord = await prisma.monthly_credits.findUnique({
        where: {
          device_id_month: {
            device_id: anonUser.device_fingerprint,
            month: currentMonth,
          },
        },
      });
    }
  } else {
    // 登录用户
    const user = await prisma.users.findUnique({
      where: { user_id: unifiedUser.user_id },
      select: { credits: true },
    });
    permanentCredits = user?.credits ?? 0;

    monthlyRecord = await prisma.monthly_credits.findUnique({
      where: {
        user_id_month: {
          user_id: unifiedUser.user_id,
          month: currentMonth,
        },
      },
    });
  }

  const monthlyAvailable = calculateAvailable(monthlyRecord);

  return {
    permanent: permanentCredits,
    monthly: monthlyAvailable,
    total: permanentCredits + monthlyAvailable,
  };
}

/**
 * 扣除积分（先扣月度，再扣永久）
 *
 * 注意：这个函数主要用于直接扣费场景
 * TTS 等任务的扣费通常在各自的模块中处理
 */
export async function deductCredits(amount: number): Promise<{
  success: boolean;
  message?: string;
  deducted?: {
    monthly: number;
    permanent: number;
  };
}> {
  if (amount <= 0) {
    return { success: false, message: '扣费金额必须大于0' };
  }

  const currentMonth = getCurrentMonth();
  const unifiedUser = await getUserOrAnonymous();

  try {
    // 获取月度积分记录
    let monthlyRecord = null;
    let permanentCredits = 0;

    // 用于匿名用户更新月度积分时需要的 device_fingerprint
    let deviceFingerprint: string | null = null;

    if (unifiedUser.is_anonymous) {
      const anonUser = await prisma.anonymous_users.findUnique({
        where: { user_id: unifiedUser.user_id },
        select: { credits: true, device_fingerprint: true },
      });
      permanentCredits = anonUser?.credits ?? 0;
      deviceFingerprint = anonUser?.device_fingerprint ?? null;

      if (deviceFingerprint) {
        monthlyRecord = await prisma.monthly_credits.findUnique({
          where: {
            device_id_month: {
              device_id: deviceFingerprint,
              month: currentMonth,
            },
          },
        });
      }
    } else {
      monthlyRecord = await prisma.monthly_credits.findUnique({
        where: {
          user_id_month: {
            user_id: unifiedUser.user_id,
            month: currentMonth,
          },
        },
      });
      const user = await prisma.users.findUnique({
        where: { user_id: unifiedUser.user_id },
        select: { credits: true },
      });
      permanentCredits = user?.credits ?? 0;
    }

    const monthlyAvailable = calculateAvailable(monthlyRecord);
    const totalAvailable = monthlyAvailable + permanentCredits;

    if (totalAvailable < amount) {
      return { success: false, message: '积分不足' };
    }

    // 计算扣费分配
    const monthlyDeduct = Math.min(monthlyAvailable, amount);
    const permanentDeduct = amount - monthlyDeduct;

    // 执行扣费
    if (monthlyDeduct > 0 && monthlyRecord) {
      if (unifiedUser.is_anonymous && deviceFingerprint) {
        await prisma.monthly_credits.update({
          where: {
            device_id_month: {
              device_id: deviceFingerprint,
              month: currentMonth,
            },
          },
          data: {
            used_credits: { increment: monthlyDeduct },
          },
        });
      } else if (!unifiedUser.is_anonymous) {
        await prisma.monthly_credits.update({
          where: {
            user_id_month: {
              user_id: unifiedUser.user_id,
              month: currentMonth,
            },
          },
          data: {
            used_credits: { increment: monthlyDeduct },
          },
        });
      }
    }

    if (permanentDeduct > 0) {
      if (unifiedUser.is_anonymous) {
        await prisma.anonymous_users.updateMany({
          where: { user_id: unifiedUser.user_id },
          data: {
            credits: { decrement: permanentDeduct },
          },
        });
      } else {
        await prisma.users.update({
          where: { user_id: unifiedUser.user_id },
          data: {
            credits: { decrement: permanentDeduct },
          },
        });
      }
    }

    console.log(`✅ [MonthlyCredits] 扣费成功: user=${unifiedUser.user_id}, monthly=${monthlyDeduct}, permanent=${permanentDeduct}`);

    return {
      success: true,
      deducted: {
        monthly: monthlyDeduct,
        permanent: permanentDeduct,
      },
    };
  } catch (error) {
    console.error('❌ [MonthlyCredits] 扣费失败:', error);
    return { success: false, message: '扣费失败' };
  }
}

/**
 * 获取月度福利配置（客户端可用）
 */
export async function getMonthlyRewardsConfigAction() {
  const config = getMonthlyRewardsConfig();
  return {
    anonymous_credits: config.anonymous_credits,
    login_credits: config.login_credits,
    app_download_credits: config.app_download_credits,
    popup_max_per_day: config.popup_max_per_day,
    enabled: config.enabled,
  };
}