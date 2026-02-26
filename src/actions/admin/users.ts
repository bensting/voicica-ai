'use server';

/**
 * 用户管理 Server Actions
 */
import db from '@/lib/db';
import { users, anonymousUsers, userSubscriptions, ttsRecords, creditHistory } from '@/db/schema';
import { eq, and, or, ilike, desc, count, isNull, isNotNull, lt, gt } from 'drizzle-orm';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';
import { generateUniqueCode, checkAndUpgradeLevel, hasCircularReferral } from '@/actions/referral';

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
    referral_code: string | null;
    referred_by: string | null;
    referral_level: string;
    ip_address: string | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  await verifyAdminWithoutDb();

  const { page = 1, pageSize = 20, search, hasSubscription, platform } = params;
  const now = new Date().toISOString();

  // Build where conditions
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(users.email, `%${search}%`),
        ilike(users.name, `%${search}%`),
        ilike(users.userId, `%${search}%`),
      )
    );
  }

  if (platform) {
    conditions.push(eq(users.platform, platform));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [userRows, [{ total }]] = await Promise.all([
    db.select().from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize),
    db.select({ total: count() }).from(users).where(whereClause),
  ]);

  // Check active subscriptions for fetched users
  const activeSubsRows = await db.select({ userId: userSubscriptions.userId })
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.status, 'ACTIVE'),
        gt(userSubscriptions.endDate, now),
      )
    );
  const activeSubUserIds = new Set(activeSubsRows.map(s => s.userId));

  let result = userRows.map((u) => ({
    id: u.id,
    user_id: u.userId,
    email: u.email,
    name: u.name,
    photo_url: u.photoUrl,
    auth_provider: u.authProvider,
    platform: u.platform,
    credits: u.credits,
    total_credits_used: u.totalCreditsUsed,
    created_at: new Date(u.createdAt),
    has_active_subscription: activeSubUserIds.has(u.userId),
    referral_code: u.referralCode,
    referred_by: u.referredBy,
    referral_level: u.referralLevel,
    ip_address: u.ipAddress,
  }));

  // 过滤订阅状态
  if (hasSubscription === true) {
    result = result.filter((u) => u.has_active_subscription);
  } else if (hasSubscription === false) {
    result = result.filter((u) => !u.has_active_subscription);
  }

  return {
    users: result,
    total: hasSubscription !== null && hasSubscription !== undefined ? result.length : Number(total),
    page,
    pageSize,
    totalPages: Math.ceil(Number(total) / pageSize),
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
  platform?: string;
}): Promise<{
  users: Array<{
    id: number;
    user_id: string;
    device_fingerprint: string;
    ip_address: string | null;
    platform: string | null;
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

  const { page = 1, pageSize = 20, search, isConverted, platform } = params;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(anonymousUsers.userId, `%${search}%`),
        ilike(anonymousUsers.deviceFingerprint, `%${search}%`),
        ilike(anonymousUsers.ipAddress, `%${search}%`),
      )
    );
  }

  if (isConverted === true) {
    conditions.push(isNotNull(anonymousUsers.convertedToUserId));
  } else if (isConverted === false) {
    conditions.push(isNull(anonymousUsers.convertedToUserId));
  }

  if (platform) {
    conditions.push(eq(anonymousUsers.platform, platform));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [userRows, [{ total }]] = await Promise.all([
    db.select().from(anonymousUsers)
      .where(whereClause)
      .orderBy(desc(anonymousUsers.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize),
    db.select({ total: count() }).from(anonymousUsers).where(whereClause),
  ]);

  return {
    users: userRows.map((u) => ({
      id: u.id,
      user_id: u.userId,
      device_fingerprint: u.deviceFingerprint,
      ip_address: u.ipAddress,
      platform: u.platform,
      credits: u.credits,
      total_credits_used: u.totalCreditsUsed,
      is_anonymous: u.isAnonymous,
      converted_to_user_id: u.convertedToUserId,
      expires_at: u.expiresAt ? new Date(u.expiresAt) : null,
      last_used_at: u.lastUsedAt ? new Date(u.lastUsedAt) : null,
      created_at: new Date(u.createdAt),
    })),
    total: Number(total),
    page,
    pageSize,
    totalPages: Math.ceil(Number(total) / pageSize),
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

  const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);

  if (!user) {
    return { user: null, subscriptions: [], recentTtsRecords: [] };
  }

  const [subs, ttsRows] = await Promise.all([
    db.select().from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(10),
    db.select().from(ttsRecords)
      .where(eq(ttsRecords.userId, userId))
      .orderBy(desc(ttsRecords.createdAt))
      .limit(10),
  ]);

  return {
    user: {
      id: user.id,
      user_id: user.userId,
      email: user.email,
      name: user.name,
      photo_url: user.photoUrl,
      credits: user.credits,
      total_credits_used: user.totalCreditsUsed,
      created_at: new Date(user.createdAt),
    },
    subscriptions: subs.map((s) => ({
      id: s.id,
      product_id: s.productId,
      status: s.status,
      start_date: new Date(s.startDate),
      end_date: new Date(s.endDate),
      credits_allocated: s.creditsAllocated,
      auto_renew: s.autoRenew,
    })),
    recentTtsRecords: ttsRows.map((r) => ({
      id: r.id,
      task_id: r.taskId,
      text: r.text.substring(0, 50) + (r.text.length > 50 ? '...' : ''),
      voice_name: r.voiceName,
      status: r.status,
      credits_cost: r.creditsCost,
      created_at: new Date(r.createdAt),
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
    const [user] = await db.select({ credits: users.credits }).from(users).where(eq(users.userId, userId)).limit(1);

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    const diff = credits - user.credits;

    await db.update(users).set({ credits }).where(eq(users.userId, userId));
    await db.insert(creditHistory).values({
      userId,
      amount: diff,
      description: `[管理员调整] ${reason}`,
      productType: 'admin_adjustment',
    });

    return { success: true, message: '积分已更新' };
  } catch (error) {
    console.error('更新用户积分失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '更新失败' };
  }
}

/**
 * 更新匿名用户积分
 */
export async function updateAnonymousUserCredits(
  userId: string,
  credits: number,
  reason: string
): Promise<{ success: boolean; message: string }> {
  await verifyAdminWithoutDb();

  try {
    const [user] = await db.select({ credits: anonymousUsers.credits }).from(anonymousUsers).where(eq(anonymousUsers.userId, userId)).limit(1);

    if (!user) {
      return { success: false, message: '匿名用户不存在' };
    }

    const diff = credits - user.credits;

    await db.update(anonymousUsers).set({ credits }).where(eq(anonymousUsers.userId, userId));
    await db.insert(creditHistory).values({
      userId,
      amount: diff,
      description: `[管理员调整] ${reason}`,
      productType: 'admin_adjustment',
    });

    return { success: true, message: '积分已更新' };
  } catch (error) {
    console.error('更新匿名用户积分失败:', error);
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
    await db.delete(anonymousUsers).where(eq(anonymousUsers.id, id));

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
    const now = new Date().toISOString();
    const result = await db.delete(anonymousUsers)
      .where(
        and(
          lt(anonymousUsers.expiresAt, now),
          isNull(anonymousUsers.convertedToUserId),
        )
      )
      .returning();

    return {
      success: true,
      message: `已清理 ${result.length} 个过期匿名用户`,
      deleted: result.length,
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

/**
 * 获取用户积分历史
 */
export async function getUserCreditHistory(params: {
  userId: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  records: Array<{
    id: number;
    amount: number;
    description: string;
    product_type: string | null;
    task_id: string | null;
    created_at: Date;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  await verifyAdminWithoutDb();

  const { userId, page = 1, pageSize = 20 } = params;

  const whereClause = eq(creditHistory.userId, userId);

  const [records, [{ total }]] = await Promise.all([
    db.select().from(creditHistory)
      .where(whereClause)
      .orderBy(desc(creditHistory.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize),
    db.select({ total: count() }).from(creditHistory).where(whereClause),
  ]);

  return {
    records: records.map((r) => ({
      id: r.id,
      amount: r.amount,
      description: r.description,
      product_type: r.productType,
      task_id: r.taskId,
      created_at: new Date(r.createdAt),
    })),
    total: Number(total),
    page,
    pageSize,
    totalPages: Math.ceil(Number(total) / pageSize),
  };
}

/**
 * 为用户生成邀请码
 */
export async function adminGenerateReferralCode(
  userId: string
): Promise<{ success: boolean; message: string; code?: string }> {
  await verifyAdminWithoutDb();

  try {
    const [user] = await db
      .select({ referralCode: users.referralCode })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    if (user.referralCode) {
      return { success: false, message: '该用户已有邀请码' };
    }

    const code = await generateUniqueCode();
    await db
      .update(users)
      .set({ referralCode: code })
      .where(eq(users.userId, userId));

    return { success: true, message: '邀请码生成成功', code };
  } catch (error) {
    console.error('生成邀请码失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '生成失败' };
  }
}

/**
 * 为用户绑定推荐人
 */
export async function adminBindReferrer(
  userId: string,
  referrerCode: string
): Promise<{ success: boolean; message: string }> {
  await verifyAdminWithoutDb();

  try {
    const [user] = await db
      .select({ referredBy: users.referredBy })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    if (user.referredBy) {
      return { success: false, message: '该用户已有推荐人' };
    }

    const [referrer] = await db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.referralCode, referrerCode.toUpperCase()))
      .limit(1);

    if (!referrer) {
      return { success: false, message: '推荐码不存在' };
    }

    if (referrer.userId === userId) {
      return { success: false, message: '不能绑定自己为推荐人' };
    }

    if (await hasCircularReferral(referrer.userId, userId)) {
      return { success: false, message: '存在循环推荐关系，无法绑定' };
    }

    await db
      .update(users)
      .set({ referredBy: referrer.userId })
      .where(eq(users.userId, userId));

    await checkAndUpgradeLevel(referrer.userId);

    return { success: true, message: '绑定推荐人成功' };
  } catch (error) {
    console.error('绑定推荐人失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '绑定失败' };
  }
}
