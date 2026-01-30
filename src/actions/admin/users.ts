'use server';

/**
 * 用户管理 Server Actions
 */
import prisma from '@/lib/prisma';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

/**
 * 获取注册用户列表
 */
export async function getAdminUserList(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  hasSubscription?: boolean | null;
  platform?: string;
}): Promise<{
  users: Array<{
    id: number;
    user_id: string;
    email: string | null;
    name: string | null;
    photo_url: string | null;
    auth_provider: string | null;
    platform: string | null;
    credits: number;
    total_credits_used: number;
    created_at: Date;
    has_active_subscription: boolean;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  await verifyAdminWithoutDb();

  const { page = 1, pageSize = 20, search, hasSubscription, platform } = params;
  const now = new Date();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
      { user_id: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (platform) {
    where.platform = platform;
  }

  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user_subscriptions: {
          where: {
            status: 'ACTIVE',
            end_date: { gt: now },
          },
          take: 1,
        },
      },
    }),
    prisma.users.count({ where }),
  ]);

  let result = users.map((u) => ({
    id: u.id,
    user_id: u.user_id,
    email: u.email,
    name: u.name,
    photo_url: u.photo_url,
    auth_provider: u.auth_provider,
    platform: u.platform,
    credits: u.credits,
    total_credits_used: u.total_credits_used,
    created_at: u.created_at,
    has_active_subscription: u.user_subscriptions.length > 0,
  }));

  // 过滤订阅状态
  if (hasSubscription === true) {
    result = result.filter((u) => u.has_active_subscription);
  } else if (hasSubscription === false) {
    result = result.filter((u) => !u.has_active_subscription);
  }

  return {
    users: result,
    total: hasSubscription !== null && hasSubscription !== undefined ? result.length : total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 获取匿名用户列表
 */
export async function getAdminAnonymousUserList(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  isConverted?: boolean | null;
}): Promise<{
  users: Array<{
    id: number;
    user_id: string;
    device_fingerprint: string;
    ip_address: string | null;
    credits: number;
    total_credits_used: number;
    is_anonymous: boolean;
    converted_to_user_id: string | null;
    expires_at: Date | null;
    last_used_at: Date | null;
    created_at: Date;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  await verifyAdminWithoutDb();

  const { page = 1, pageSize = 20, search, isConverted } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (search) {
    where.OR = [
      { user_id: { contains: search, mode: 'insensitive' } },
      { device_fingerprint: { contains: search, mode: 'insensitive' } },
      { ip_address: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (isConverted === true) {
    where.converted_to_user_id = { not: null };
  } else if (isConverted === false) {
    where.converted_to_user_id = null;
  }

  const [users, total] = await Promise.all([
    prisma.anonymous_users.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.anonymous_users.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      user_id: u.user_id,
      device_fingerprint: u.device_fingerprint,
      ip_address: u.ip_address,
      credits: u.credits,
      total_credits_used: u.total_credits_used,
      is_anonymous: u.is_anonymous,
      converted_to_user_id: u.converted_to_user_id,
      expires_at: u.expires_at,
      last_used_at: u.last_used_at,
      created_at: u.created_at,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 获取用户详情
 */
export async function getAdminUserById(userId: string): Promise<{
  user: {
    id: number;
    user_id: string;
    email: string | null;
    name: string | null;
    photo_url: string | null;
    credits: number;
    total_credits_used: number;
    created_at: Date;
  } | null;
  subscriptions: Array<{
    id: number;
    product_id: string;
    status: string;
    start_date: Date;
    end_date: Date;
    credits_allocated: number;
    auto_renew: boolean;
  }>;
  recentTtsRecords: Array<{
    id: number;
    task_id: string;
    text: string;
    voice_name: string;
    status: string;
    credits_cost: number;
    created_at: Date;
  }>;
}> {
  await verifyAdminWithoutDb();

  const user = await prisma.users.findUnique({
    where: { user_id: userId },
  });

  if (!user) {
    return { user: null, subscriptions: [], recentTtsRecords: [] };
  }

  const [subscriptions, recentTtsRecords] = await Promise.all([
    prisma.user_subscriptions.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 10,
    }),
    prisma.tts_records.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 10,
    }),
  ]);

  return {
    user: {
      id: user.id,
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      photo_url: user.photo_url,
      credits: user.credits,
      total_credits_used: user.total_credits_used,
      created_at: user.created_at,
    },
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      product_id: s.product_id,
      status: s.status,
      start_date: s.start_date,
      end_date: s.end_date,
      credits_allocated: s.credits_allocated,
      auto_renew: s.auto_renew,
    })),
    recentTtsRecords: recentTtsRecords.map((r) => ({
      id: r.id,
      task_id: r.task_id,
      text: r.text.substring(0, 50) + (r.text.length > 50 ? '...' : ''),
      voice_name: r.voice_name,
      status: r.status,
      credits_cost: r.credits_cost,
      created_at: r.created_at,
    })),
  };
}

/**
 * 更新用户积分
 */
export async function updateUserCredits(
  userId: string,
  credits: number,
  reason: string
): Promise<{ success: boolean; message: string }> {
  await verifyAdminWithoutDb();

  try {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { credits: true },
    });

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    const diff = credits - user.credits;

    await prisma.$transaction([
      prisma.users.update({
        where: { user_id: userId },
        data: { credits },
      }),
      prisma.credit_history.create({
        data: {
          user_id: userId,
          amount: diff,
          description: `[管理员调整] ${reason}`,
          product_type: 'admin_adjustment',
        },
      }),
    ]);

    return { success: true, message: '积分已更新' };
  } catch (error) {
    console.error('更新用户积分失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '更新失败' };
  }
}

/**
 * 删除匿名用户
 */
export async function deleteAnonymousUser(
  id: number
): Promise<{ success: boolean; message: string }> {
  await verifyAdminWithoutDb();

  try {
    await prisma.anonymous_users.delete({
      where: { id },
    });

    return { success: true, message: '已删除' };
  } catch (error) {
    console.error('删除匿名用户失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '删除失败' };
  }
}

/**
 * 清理过期的匿名用户
 */
export async function cleanExpiredAnonymousUsers(): Promise<{ success: boolean; message: string; deleted: number }> {
  await verifyAdminWithoutDb();

  try {
    const now = new Date();
    const result = await prisma.anonymous_users.deleteMany({
      where: {
        expires_at: { lt: now },
        converted_to_user_id: null,
      },
    });

    return {
      success: true,
      message: `已清理 ${result.count} 个过期匿名用户`,
      deleted: result.count,
    };
  } catch (error) {
    console.error('清理过期匿名用户失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '清理失败',
      deleted: 0,
    };
  }
}