'use server';

/**
 * 用户模块 Server Actions
 *
 * 使用 React cache() 在同一请求内去重数据库查询
 */
import { getDb } from '@/lib/db';
import { users, anonymousUsers, creditHistory, userEvents } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { cache } from 'react';
import { getCurrentUser, getUserOrAnonymous } from '@/lib/auth-firebase';
import { uploadImage } from '@/lib/services/r2-storage';
import { v4 as uuidv4 } from 'uuid';
import type { UserProfile, CreditsInfo, CreditHistoryResponse } from '@/types/user';

// ==================== 请求级缓存 ====================
// 同一次请求内，相同 userId 只查一次数据库

const getCachedAnonymousUser = cache(async (userId: string) => {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(anonymousUsers)
    .where(eq(anonymousUsers.userId, userId))
    .limit(1);
  return row ?? null;
});

/**
 * 获取当前用户资料
 *
 * 需要认证，首次登录自动注册
 * 包含懒加载当月积分重置逻辑
 *
 * @param platform - 可选，用户注册时的平台 (web, mobile-web, android, android-apk, ios)
 */
export async function getCurrentUserProfile(platform?: string): Promise<UserProfile> {
  const db = await getDb();
  const authUser = await getCurrentUser();

  // 查找或创建用户
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.userId, authUser.uid))
    .limit(1);

  if (!user) {
    const [newUser] = await db
      .insert(users)
      .values({
        userId: authUser.uid,
        email: authUser.email || null,
        name: authUser.name || null,
        photoUrl: authUser.picture || null,
        platform: platform || null,
        credits: 0,
        monthlyCredits: 0,
        monthlyCreditsResetAt: new Date().toISOString(),
        totalCreditsUsed: 0,
      })
      .returning();
    user = newUser;
    console.log(`新用户注册: ${authUser.uid}, 平台: ${platform || '未知'}`);
  } else {
    if (!user.platform && platform) {
      await db
        .update(users)
        .set({ platform })
        .where(eq(users.userId, authUser.uid));
      user = { ...user, platform } as typeof user;
    }
  }

  return {
    id: user.id,
    user_id: user.userId,
    email: user.email,
    name: user.name,
    photo_url: user.photoUrl,
    phone: user.phone,
    credits: user.credits,
    monthly_credits: user.monthlyCredits,
    total_credits_used: user.totalCreditsUsed,
    usdt_balance: parseFloat(user.usdtBalance) || 0,
    is_anonymous: false,
    expires_at: null,
  };
}

/**
 * 更新当前用户资料
 */
export async function updateUserProfile(data: {
  name?: string;
  photo_url?: string;
  phone?: string;
}): Promise<UserProfile> {
  const db = await getDb();
  const authUser = await getCurrentUser();

  console.log(`🔄 [User] 更新用户资料: ${authUser.uid}`, data);

  // 构建更新数据，只更新传入的字段
  const updateData: { name?: string; photoUrl?: string; phone?: string } = {};

  // 只有当字段被明确传入时才更新（包括空字符串）
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.photo_url !== undefined) {
    updateData.photoUrl = data.photo_url;
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone;
  }

  console.log(`📝 [User] 实际更新数据:`, updateData);

  // 先查询确认用户存在
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.userId, authUser.uid))
    .limit(1);
  console.log(`🔍 [User] 查询到现有用户:`, existingUser ? `id=${existingUser.id}, name=${existingUser.name}` : '未找到');

  if (!existingUser) {
    throw new Error(`用户不存在: ${authUser.uid}`);
  }

  const [user] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.userId, authUser.uid))
    .returning();

  console.log(`✅ [User] 用户资料已更新: ${authUser.uid}, name=${user.name}, phone=${user.phone}, photo_url=${user.photoUrl}`);

  return {
    id: user.id,
    user_id: user.userId,
    email: user.email,
    name: user.name,
    photo_url: user.photoUrl,
    phone: user.phone,
    credits: user.credits,
    monthly_credits: user.monthlyCredits,
    total_credits_used: user.totalCreditsUsed,
    usdt_balance: parseFloat(user.usdtBalance) || 0,
    is_anonymous: false,
    expires_at: null,
  };
}

/**
 * 上传用户头像
 */
export async function uploadAvatar(formData: FormData): Promise<{
  success: boolean;
  message?: string;
  url?: string;
}> {
  const db = await getDb();
  try {
    const authUser = await getCurrentUser();
    const file = formData.get('file') as File;

    if (!file) {
      return {
        success: false,
        message: '请选择文件',
      };
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        message: '请选择有效的图片文件',
      };
    }

    // 验证文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        message: '文件大小不能超过 5MB',
      };
    }

    // 生成唯一文件名
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${authUser.uid}_${uuidv4()}.${ext}`;

    // 转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 R2
    const url = await uploadImage(buffer, fileName, file.type);

    // 更新用户头像 URL
    await db
      .update(users)
      .set({
        photoUrl: url,
      })
      .where(eq(users.userId, authUser.uid));

    console.log(`✅ [User] 头像已上传: ${authUser.uid}`);

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error('❌ [User] 上传头像失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '上传失败',
    };
  }
}

/**
 * 获取用户积分（仅积分信息）
 */
export async function getUserCredits(): Promise<{ credits: number; total_used: number }> {
  const db = await getDb();
  const authUser = await getCurrentUser();

  const [user] = await db
    .select({ credits: users.credits, totalCreditsUsed: users.totalCreditsUsed })
    .from(users)
    .where(eq(users.userId, authUser.uid))
    .limit(1);

  if (!user) {
    throw new Error('用户不存在');
  }

  return {
    credits: user.credits,
    total_used: user.totalCreditsUsed,
  };
}

/**
 * 获取用户资料（统一接口，支持正式用户和匿名用户）
 * 使用 React cache() 在同一请求内去重
 */
export async function getUnifiedUserProfile(): Promise<UserProfile> {
  const db = await getDb();
  const unifiedUser = await getUserOrAnonymous();

  if (unifiedUser.is_anonymous) {
    // 匿名用户（使用缓存）
    const anonUser = await getCachedAnonymousUser(unifiedUser.user_id);

    if (!anonUser) {
      throw new Error('匿名用户不存在');
    }

    // 匿名用户没有每日任务，全部算作永久积分
    return {
      id: anonUser.id,
      user_id: anonUser.userId,
      email: null,
      name: null,
      photo_url: null,
      phone: null,
      credits: anonUser.credits,
      monthly_credits: 0,
      total_credits_used: anonUser.totalCreditsUsed,
      usdt_balance: 0,
      is_anonymous: true,
      expires_at: anonUser.expiresAt || null,
    };
  } else {
    // 正式用户
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.userId, unifiedUser.user_id))
      .limit(1);

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      id: user.id,
      user_id: user.userId,
      email: user.email,
      name: user.name,
      photo_url: user.photoUrl,
      phone: user.phone,
      credits: user.credits,
      monthly_credits: user.monthlyCredits,
      total_credits_used: user.totalCreditsUsed,
      usdt_balance: parseFloat(user.usdtBalance) || 0,
      is_anonymous: false,
      expires_at: null,
    };
  }
}

/**
 * 获取积分余额（统一接口，支持正式用户和匿名用户）
 */
export async function getUnifiedCredits(): Promise<CreditsInfo> {
  const db = await getDb();
  const unifiedUser = await getUserOrAnonymous();

  if (unifiedUser.is_anonymous) {
    // 使用缓存查询
    const anonUser = await getCachedAnonymousUser(unifiedUser.user_id);

    if (!anonUser) {
      throw new Error('匿名用户不存在');
    }

    return {
      credits: anonUser.credits,
      monthly_credits: 0,
      total_used: anonUser.totalCreditsUsed,
      is_anonymous: true,
      expires_at: anonUser.expiresAt || null,
    };
  } else {
    // 正式用户
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.userId, unifiedUser.user_id))
      .limit(1);

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      credits: user.credits,
      monthly_credits: user.monthlyCredits,
      total_used: user.totalCreditsUsed,
      is_anonymous: false,
      expires_at: null,
    };
  }
}

/**
 * 获取积分历史记录
 *
 * @param page - 页码（从1开始）
 * @param pageSize - 每页数量
 * @param productType - 可选，按产品类型筛选
 */
export async function getCreditHistory(
  page: number = 1,
  pageSize: number = 20,
  productType?: string
): Promise<CreditHistoryResponse> {
  const db = await getDb();
  const authUser = await getCurrentUser();

  const conditions = [eq(creditHistory.userId, authUser.uid)];
  if (productType) {
    conditions.push(eq(creditHistory.productType, productType));
  }
  const whereClause = and(...conditions);

  // 并行获取总数和数据
  const [totalResult, items] = await Promise.all([
    db.select({ total: count() }).from(creditHistory).where(whereClause),
    db
      .select({
        id: creditHistory.id,
        amount: creditHistory.amount,
        description: creditHistory.description,
        productType: creditHistory.productType,
        taskId: creditHistory.taskId,
        createdAt: creditHistory.createdAt,
      })
      .from(creditHistory)
      .where(whereClause)
      .orderBy(desc(creditHistory.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize),
  ]);

  const total = totalResult[0].total;

  return {
    items: items.map((item) => ({
      id: item.id,
      amount: item.amount,
      description: item.description,
      product_type: item.productType,
      task_id: item.taskId,
      created_at: item.createdAt,
    })),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}

/**
 * 记录用户事件
 *
 * @param event - 事件名称，如 buy_now_clicked, upgrade_modal_opened
 * @param data - 可选的附加数据
 */
export async function trackUserEvent(
  event: string,
  data?: Record<string, unknown> | null
): Promise<{ success: boolean }> {
  const db = await getDb();
  try {
    const authUser = await getCurrentUser();

    await db.insert(userEvents).values({
      userId: authUser.uid,
      event,
      data: data ?? null,
    });

    return { success: true };
  } catch (error) {
    // 事件记录失败不应阻断用户流程，仅记录日志
    console.error('❌ [UserEvent] 记录事件失败:', error);
    return { success: false };
  }
}
