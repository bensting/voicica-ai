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
  teamBreakdown: {
    l1: number;
    l2: number;
    l3Plus: number;
  };
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

    // 团队分层统计（单个递归 CTE 同时获取 L1/L2/L3+ 人数）
    const teamBreakdownResult = await db.execute<{ l1: string; l2: string; l3_plus: string }>(sql`
      WITH RECURSIVE team AS (
        SELECT user_id, 1 as depth FROM users WHERE referred_by = ${userId}
        UNION ALL
        SELECT u.user_id, t.depth + 1 FROM users u
        INNER JOIN team t ON u.referred_by = t.user_id
        WHERE t.depth < 10
      )
      SELECT
        COUNT(*) FILTER (WHERE depth = 1)::text AS l1,
        COUNT(*) FILTER (WHERE depth = 2)::text AS l2,
        COUNT(*) FILTER (WHERE depth >= 3)::text AS l3_plus
      FROM team
    `);
    const l1 = Number(teamBreakdownResult.rows[0]?.l1 ?? 0);
    const l2 = Number(teamBreakdownResult.rows[0]?.l2 ?? 0);
    const l3Plus = Number(teamBreakdownResult.rows[0]?.l3_plus ?? 0);
    const directReferrals = l1;
    const teamMembers = l1 + l2 + l3Plus;

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
      teamBreakdown: { l1, l2, l3Plus },
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

    // 批量获取子团队人数（递归 CTE，避免 N+1）
    const memberIds = referrals.map(r => r.userId);
    let subTeamCounts: Record<string, number> = {};
    if (memberIds.length > 0) {
      const subTeamResult = await db.execute<{ root_id: string; cnt: string }>(sql`
        WITH RECURSIVE sub_team AS (
          SELECT referred_by AS root_id, user_id
          FROM users
          WHERE referred_by IN (${sql.join(memberIds.map(id => sql`${id}`), sql`, `)})
          UNION ALL
          SELECT st.root_id, u.user_id
          FROM users u
          INNER JOIN sub_team st ON u.referred_by = st.user_id
        )
        SELECT root_id, COUNT(*)::text AS cnt FROM sub_team GROUP BY root_id
      `);
      for (const row of subTeamResult.rows) {
        subTeamCounts[row.root_id] = Number(row.cnt);
      }
    }

    // 批量获取累计贡献提成
    let contribMap: Record<string, number> = {};
    if (memberIds.length > 0) {
      const contribResult = await db.execute<{ from_user_id: string; total: string }>(sql`
        SELECT from_user_id, SUM(commission_amount)::text AS total
        FROM referral_commissions
        WHERE user_id = ${userId} AND from_user_id IN (${sql.join(memberIds.map(id => sql`${id}`), sql`, `)})
        GROUP BY from_user_id
      `);
      for (const row of contribResult.rows) {
        contribMap[row.from_user_id] = Number(row.total);
      }
    }

    const items: ReferralTeamMember[] = referrals.map(ref => {
      // 脱敏处理
      let displayName = ref.name || ref.email || 'User';
      if (displayName.includes('@')) {
        const [local] = displayName.split('@');
        displayName = local.substring(0, 3) + '***';
      } else if (displayName.length > 3) {
        displayName = displayName.substring(0, 3) + '***';
      }

      return {
        name: displayName,
        level: ref.referralLevel,
        createdAt: ref.createdAt,
        totalContribution: contribMap[ref.userId] ?? 0,
        subTeamCount: subTeamCounts[ref.userId] ?? 0,
      };
    });

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
      rate = levelConfig.l1_rate;
      levelLabel = 'l1';
    } else if (depth === 2) {
      rate = levelConfig.l2_rate;
      levelLabel = 'l2';
    } else {
      // depth >= 3: team_rate 不再实时分配，后续改为日结
      break;
    }

    if (rate <= 0) {
      currentUserId = referrerId;
      continue;
    }

    const commissionAmount = Math.round(amount * rate * 10000) / 10000;

    if (commissionAmount <= 0) {
      currentUserId = referrerId;
      continue;
    }

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
      description: `Referral commission (${levelLabel}) from mining | ${rate * 100}% of ${amount} | from:${userId}`,
      productType: ProductType.REFERRAL_COMMISSION,
    });

    console.log(`💰 [referral] ${referrerId} earned ${commissionAmount} credits (${levelLabel}, ${rate * 100}%) from ${userId}'s mining of ${amount}`);

    currentUserId = referrerId;
  }
}
