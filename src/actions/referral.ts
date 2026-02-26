'use server';

import db from '@/lib/db';
import { users, referralCommissions, creditHistory } from '@/db/schema';
import { eq, and, sql, count, sum } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-firebase';
import { getReferralConfig } from '@/config/appConfig';
import { ProductType } from '@/config/productType';

/**
 * 生成随机邀请码 [A-Z0-9]
 */
function generateCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 生成唯一邀请码（查库去重）
 */
export async function generateUniqueCode(): Promise<string> {
  const config = getReferralConfig();
  for (let i = 0; i < 10; i++) {
    const code = generateCode(config.code_length);
    const [existing] = await db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);
    if (!existing) return code;
  }
  // Fallback: use longer code
  return generateCode(config.code_length + 2);
}

/**
 * 检测循环推荐：从 referrerId 沿推荐链向上查找，看是否会遇到 targetUserId
 */
export async function hasCircularReferral(referrerId: string, targetUserId: string): Promise<boolean> {
  let currentId: string | null = referrerId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === targetUserId) return true;
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const [row] = await db
      .select({ referredBy: users.referredBy })
      .from(users)
      .where(eq(users.userId, currentId))
      .limit(1);

    currentId = row?.referredBy ?? null;
  }

  return false;
}

/**
 * 推荐信息返回类型
 */
export interface ReferralInfo {
  referralCode: string;
  referralLevel: string;
  directReferrals: number;
  teamMembers: number;
  totalEarnings: number;
  todayEarnings: number;
  referredBy: string | null;
  inviterCode: string | null;
  upgradeProgress: {
    bronze: { current: number; required: number };
    gold: { current: number; required: number };
  };
}

/**
 * 4a. 获取我的推荐信息
 * 如果用户没有邀请码，惰性生成
 */
export async function getMyReferralInfo(): Promise<ReferralInfo | null> {
  try {
    const authUser = await getCurrentUser();
    const userId = authUser.uid;

    // 获取用户信息
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (!user) return null;

    // 惰性检查升级（用户查看推荐页时触发）
    await checkAndUpgradeLevel(userId);

    // 重新读取（等级可能已变）
    const [freshUser] = await db
      .select({ referralLevel: users.referralLevel })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);
    if (freshUser) {
      user.referralLevel = freshUser.referralLevel;
    }

    // 如果没有邀请码，生成一个
    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = await generateUniqueCode();
      await db
        .update(users)
        .set({ referralCode })
        .where(eq(users.userId, userId));
    }

    // 直推人数
    const [directCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.referredBy, userId));

    const directReferrals = directCount?.count ?? 0;

    // 团队总人数（递归 CTE）
    const teamResult = await db.execute<{ count: string }>(sql`
      WITH RECURSIVE team AS (
        SELECT user_id FROM users WHERE referred_by = ${userId}
        UNION ALL
        SELECT u.user_id FROM users u INNER JOIN team t ON u.referred_by = t.user_id
      )
      SELECT COUNT(*)::text AS count FROM team
    `);
    const teamMembers = Number(teamResult.rows[0]?.count ?? 0);

    // 累计提成
    const [totalEarningsResult] = await db
      .select({ total: sum(referralCommissions.commissionAmount) })
      .from(referralCommissions)
      .where(eq(referralCommissions.userId, userId));

    // 今日提成
    const today = new Date().toISOString().split('T')[0];
    const [todayEarningsResult] = await db
      .select({ total: sum(referralCommissions.commissionAmount) })
      .from(referralCommissions)
      .where(
        and(
          eq(referralCommissions.userId, userId),
          sql`DATE(${referralCommissions.createdAt}) = ${today}`
        )
      );

    // 升级进度
    const config = getReferralConfig();

    // 直推中青铜及以上人数
    const [bronzeCount] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.referredBy, userId),
          sql`${users.referralLevel} IN ('bronze', 'gold')`
        )
      );

    // 获取邀请人的邀请码（用于显示）
    let inviterCode: string | null = null;
    if (user.referredBy) {
      const [inviter] = await db
        .select({ referralCode: users.referralCode })
        .from(users)
        .where(eq(users.userId, user.referredBy))
        .limit(1);
      inviterCode = inviter?.referralCode ?? null;
    }

    return {
      referralCode,
      referralLevel: user.referralLevel,
      directReferrals,
      teamMembers,
      totalEarnings: Number(totalEarningsResult?.total ?? 0),
      todayEarnings: Number(todayEarningsResult?.total ?? 0),
      referredBy: user.referredBy,
      inviterCode,
      upgradeProgress: {
        bronze: {
          current: directReferrals,
          required: config.upgrade_conditions.bronze.direct_referrals,
        },
        gold: {
          current: bronzeCount?.count ?? 0,
          required: config.upgrade_conditions.gold.bronze_captains,
        },
      },
    };
  } catch (error) {
    console.error('❌ [getMyReferralInfo] Failed:', error);
    return null;
  }
}

/**
 * 推荐团队成员
 */
export interface ReferralTeamMember {
  name: string;
  level: string;
  createdAt: string;
  totalContribution: number;
  subTeamCount: number;
}

/**
 * 4b. 获取推荐团队列表（分页）
 */
export async function getReferralTeam(
  page: number = 1,
  pageSize: number = 20
): Promise<{ items: ReferralTeamMember[]; total: number; hasMore: boolean }> {
  try {
    const authUser = await getCurrentUser();
    const userId = authUser.uid;

    const offset = (page - 1) * pageSize;

    // 总数
    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.referredBy, userId));
    const total = totalResult?.count ?? 0;

    // 直推用户列表
    const referrals = await db
      .select({
        name: users.name,
        email: users.email,
        referralLevel: users.referralLevel,
        createdAt: users.createdAt,
        userId: users.userId,
      })
      .from(users)
      .where(eq(users.referredBy, userId))
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(pageSize)
      .offset(offset);

    // 获取每个下线的累计贡献提成和子团队人数
    const items: ReferralTeamMember[] = [];
    for (const ref of referrals) {
      const [[contrib], [subCount]] = await Promise.all([
        db
          .select({ total: sum(referralCommissions.commissionAmount) })
          .from(referralCommissions)
          .where(
            and(
              eq(referralCommissions.userId, userId),
              eq(referralCommissions.fromUserId, ref.userId)
            )
          ),
        db
          .select({ count: count() })
          .from(users)
          .where(eq(users.referredBy, ref.userId)),
      ]);

      // 脱敏处理
      let displayName = ref.name || ref.email || 'User';
      if (displayName.includes('@')) {
        const [local] = displayName.split('@');
        displayName = local.substring(0, 3) + '***';
      } else if (displayName.length > 3) {
        displayName = displayName.substring(0, 3) + '***';
      }

      items.push({
        name: displayName,
        level: ref.referralLevel,
        createdAt: ref.createdAt,
        totalContribution: Number(contrib?.total ?? 0),
        subTeamCount: subCount?.count ?? 0,
      });
    }

    return {
      items,
      total,
      hasMore: offset + pageSize < total,
    };
  } catch (error) {
    console.error('❌ [getReferralTeam] Failed:', error);
    return { items: [], total: 0, hasMore: false };
  }
}

/**
 * 4c. 处理推荐码绑定
 */
export async function processReferralCode(code: string): Promise<{ success: boolean; message?: string }> {
  try {
    const config = getReferralConfig();
    if (!config.enabled) {
      return { success: false, message: 'Referral system is disabled' };
    }

    const authUser = await getCurrentUser();
    const userId = authUser.uid;

    // 检查当前用户是否已有推荐人
    const [currentUser] = await db
      .select({ referredBy: users.referredBy })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (currentUser?.referredBy) {
      return { success: false, message: 'Already has a referrer' };
    }

    // 查找推荐码对应的用户
    const [referrer] = await db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.referralCode, code.toUpperCase()))
      .limit(1);

    if (!referrer) {
      return { success: false, message: 'Invalid referral code' };
    }

    // 不能推荐自己
    if (referrer.userId === userId) {
      return { success: false, message: 'Cannot refer yourself' };
    }

    // 检测循环推荐
    if (await hasCircularReferral(referrer.userId, userId)) {
      return { success: false, message: 'Circular referral detected' };
    }

    // 绑定推荐人
    await db
      .update(users)
      .set({ referredBy: referrer.userId })
      .where(eq(users.userId, userId));

    // 检查推荐人是否需要升级
    await checkAndUpgradeLevel(referrer.userId);

    console.log(`✅ [referral] User ${userId} bound to referrer ${referrer.userId} via code ${code}`);
    return { success: true };
  } catch (error) {
    console.error('❌ [processReferralCode] Failed:', error);
    return { success: false, message: 'Failed to process referral code' };
  }
}

/**
 * 4d. 检查并升级用户等级
 */
export async function checkAndUpgradeLevel(userId: string): Promise<void> {
  try {
    const config = getReferralConfig();

    const [user] = await db
      .select({ referralLevel: users.referralLevel })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (!user) return;

    const currentLevel = user.referralLevel;

    // 直推人数
    const [directCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.referredBy, userId));
    const directReferrals = directCount?.count ?? 0;

    // 检查是否可升级到黄金
    if (currentLevel !== 'gold') {
      // 直推中青铜及以上人数
      const [bronzeCount] = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            eq(users.referredBy, userId),
            sql`${users.referralLevel} IN ('bronze', 'gold')`
          )
        );
      const bronzeCaptains = bronzeCount?.count ?? 0;

      if (bronzeCaptains >= config.upgrade_conditions.gold.bronze_captains) {
        await db
          .update(users)
          .set({ referralLevel: 'gold' })
          .where(eq(users.userId, userId));
        console.log(`🏆 [referral] User ${userId} upgraded to GOLD`);

        // 升级为黄金后，检查其上级是否也可升级
        const [self] = await db
          .select({ referredBy: users.referredBy })
          .from(users)
          .where(eq(users.userId, userId))
          .limit(1);
        if (self?.referredBy) {
          await checkAndUpgradeLevel(self.referredBy);
        }
        return;
      }
    }

    // 检查是否可升级到青铜
    if (currentLevel === 'miner') {
      if (directReferrals >= config.upgrade_conditions.bronze.direct_referrals) {
        await db
          .update(users)
          .set({ referralLevel: 'bronze' })
          .where(eq(users.userId, userId));
        console.log(`🥉 [referral] User ${userId} upgraded to BRONZE`);

        // 升级为青铜后，检查其上级是否可升级为黄金
        const [self] = await db
          .select({ referredBy: users.referredBy })
          .from(users)
          .where(eq(users.userId, userId))
          .limit(1);
        if (self?.referredBy) {
          await checkAndUpgradeLevel(self.referredBy);
        }
      }
    }
  } catch (error) {
    console.error('❌ [checkAndUpgradeLevel] Failed:', error);
  }
}

/**
 * 4e. 分发推荐提成
 * 挖矿后调用，沿推荐树向上遍历分发提成
 */
export async function distributeReferralCommissions(
  userId: string,
  amount: number
): Promise<void> {
  const config = getReferralConfig();
  if (!config.enabled || amount <= 0) return;

  let currentUserId = userId;

  for (let depth = 1; depth <= config.max_team_depth; depth++) {
    // 找到当前用户的推荐人
    const [currentUser] = await db
      .select({ referredBy: users.referredBy })
      .from(users)
      .where(eq(users.userId, currentUserId))
      .limit(1);

    if (!currentUser?.referredBy) break;

    const referrerId = currentUser.referredBy;

    // 获取推荐人的等级
    const [referrer] = await db
      .select({ referralLevel: users.referralLevel })
      .from(users)
      .where(eq(users.userId, referrerId))
      .limit(1);

    if (!referrer) break;

    const levelConfig = config.levels[referrer.referralLevel as keyof typeof config.levels];
    if (!levelConfig) break;

    // 根据深度计算提成比例
    let rate = 0;
    let levelLabel = '';

    if (depth === 1) {
      rate = levelConfig.l1_rate + levelConfig.team_rate;
      levelLabel = 'l1';
    } else if (depth === 2) {
      rate = levelConfig.l2_rate + levelConfig.team_rate;
      levelLabel = 'l2';
    } else {
      // depth >= 3: 只有 team_rate
      rate = levelConfig.team_rate;
      levelLabel = 'team';
    }

    if (rate <= 0) {
      // 如果当前层级没有提成，继续向上遍历（更上层可能有 team_rate）
      currentUserId = referrerId;
      continue;
    }

    const commissionAmount = Math.max(1, Math.round(amount * rate));

    // 插入提成记录
    await db.insert(referralCommissions).values({
      userId: referrerId,
      fromUserId: userId,
      level: levelLabel,
      sourceAmount: amount,
      commissionRate: rate,
      commissionAmount,
    });

    // 更新推荐人积分
    await db
      .update(users)
      .set({ credits: sql`${users.credits} + ${commissionAmount}` })
      .where(eq(users.userId, referrerId));

    // 记录积分历史
    await db.insert(creditHistory).values({
      userId: referrerId,
      amount: commissionAmount,
      description: `Referral commission (${levelLabel}) from mining | ${rate * 100}% of ${amount}`,
      productType: ProductType.REFERRAL_COMMISSION,
    });

    console.log(`💰 [referral] ${referrerId} earned ${commissionAmount} credits (${levelLabel}, ${rate * 100}%) from ${userId}'s mining of ${amount}`);

    currentUserId = referrerId;
  }
}
