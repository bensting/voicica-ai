'use server';

/**
 * Admin Lucky Draw Server Actions
 * 管理抽奖实例的 CRUD 操作
 */
import { getDb } from '@/lib/db';
import { luckyDrawInstances, luckyDrawEntries, luckyDrawResults, luckyDrawClaims } from '@/db/schema';
import { eq, desc, asc, count } from 'drizzle-orm';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';
import { getLuckyDrawProduct } from '@/config/native/luckyDrawConfig';
import { triggerDraw } from '@/actions/lucky-draw';

// ─── Types ───

export interface AdminLuckyDraw {
  id: number;
  drawId: string;
  productId: string;
  prizeType: string | null;
  title: string | null;
  enabled: boolean;
  status: string;
  totalSlots: number;
  soldSlots: number;
  creditsPerPurchase: number;
  stripePriceCents: number;
  cryptoPriceCents: number;
  chainName: string | null;
  contractAddress: string | null;
  blockExplorerUrl: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface CreateLuckyDrawInput {
  productId: string;
  prizeType?: string;
  title?: string;
  enabled: boolean;
  status?: string;
  totalSlots: number;
  creditsPerPurchase: number;
  stripePriceCents: number;
  cryptoPriceCents: number;
  chainName: string;
}

interface ActionResult {
  success: boolean;
  message: string;
}

export interface AdminLuckyDrawDetail {
  entries: Array<{
    id: number;
    userId: string;
    slotNumber: number;
    status: string;
    packs: number;
    creditsAwarded: number;
    paymentPlatform: string;
    stripeSessionId: string | null;
    amountPaid: number | null;
    createdAt: string;
  }>;
  result: {
    winnerSlot: number;
    winnerUserId: string;
    blockNumber: number | null;
    blockHash: string | null;
    txHash: string | null;
    totalSlots: number;
    createdAt: string;
  } | null;
  claim: {
    status: string;
    fullName: string | null;
    phone: string | null;
    email: string | null;
    country: string | null;
    address: string | null;
    zipCode: string | null;
    telegram: string | null;
    walletNetwork: string | null;
    walletAddress: string | null;
    carrier: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    createdAt: string;
  } | null;
}

// ─── Actions ───

/**
 * 列表查询，关联查询已售 slots 数量，按 createdAt DESC
 */
export async function getAdminLuckyDraws(): Promise<AdminLuckyDraw[]> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  const draws = await db
    .select()
    .from(luckyDrawInstances)
    .orderBy(desc(luckyDrawInstances.createdAt));

  const results: AdminLuckyDraw[] = [];

  for (const draw of draws) {
    const [soldResult] = await db
      .select({ count: count() })
      .from(luckyDrawEntries)
      .where(eq(luckyDrawEntries.drawId, draw.drawId));

    results.push({
      id: draw.id,
      drawId: draw.drawId,
      productId: draw.productId,
      prizeType: draw.prizeType,
      title: draw.title,
      enabled: draw.enabled,
      status: draw.status,
      totalSlots: draw.totalSlots,
      soldSlots: soldResult?.count ?? 0,
      creditsPerPurchase: draw.creditsPerPurchase,
      stripePriceCents: draw.stripePriceCents,
      cryptoPriceCents: draw.cryptoPriceCents,
      chainName: draw.chainName,
      contractAddress: draw.contractAddress,
      blockExplorerUrl: draw.blockExplorerUrl,
      createdAt: draw.createdAt,
      completedAt: draw.completedAt,
    });
  }

  return results;
}

/**
 * 创建抽奖实例，自动生成 drawId = `${productId}-${timestamp}`
 */
export async function createLuckyDraw(data: CreateLuckyDrawInput): Promise<ActionResult> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const product = getLuckyDrawProduct(data.productId);
    if (!product) {
      return { success: false, message: `产品 ${data.productId} 不存在` };
    }

    const drawId = `${data.productId}-${Date.now()}`;

    await db.insert(luckyDrawInstances).values({
      drawId,
      productId: data.productId,
      prizeType: product.prizeType,
      title: data.title || null,
      enabled: data.enabled,
      status: 'selling',
      totalSlots: data.totalSlots,
      creditsPerPurchase: data.creditsPerPurchase,
      stripePriceCents: data.stripePriceCents,
      cryptoPriceCents: data.cryptoPriceCents,
      chainName: data.chainName,
      contractAddress: null,
      blockExplorerUrl: null,
    });

    return { success: true, message: `抽奖 ${drawId} 创建成功` };
  } catch (error) {
    console.error('创建抽奖失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '创建失败',
    };
  }
}

/**
 * 更新抽奖实例
 */
export async function updateLuckyDraw(
  id: number,
  data: Partial<CreateLuckyDrawInput>,
): Promise<ActionResult> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    await db
      .update(luckyDrawInstances)
      .set({
        ...(data.title !== undefined && { title: data.title || null }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.totalSlots !== undefined && { totalSlots: data.totalSlots }),
        ...(data.creditsPerPurchase !== undefined && { creditsPerPurchase: data.creditsPerPurchase }),
        ...(data.stripePriceCents !== undefined && { stripePriceCents: data.stripePriceCents }),
        ...(data.cryptoPriceCents !== undefined && { cryptoPriceCents: data.cryptoPriceCents }),
        ...(data.chainName !== undefined && { chainName: data.chainName }),
        ...(data.prizeType !== undefined && { prizeType: data.prizeType }),
      })
      .where(eq(luckyDrawInstances.id, id));

    return { success: true, message: '更新成功' };
  } catch (error) {
    console.error('更新抽奖失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败',
    };
  }
}

/**
 * 硬删除（仅允许删除无购买记录的实例）
 */
export async function deleteLuckyDraw(id: number): Promise<ActionResult> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const [draw] = await db
      .select()
      .from(luckyDrawInstances)
      .where(eq(luckyDrawInstances.id, id))
      .limit(1);

    if (!draw) {
      return { success: false, message: '抽奖不存在' };
    }

    // Check if there are any entries
    const [soldResult] = await db
      .select({ count: count() })
      .from(luckyDrawEntries)
      .where(eq(luckyDrawEntries.drawId, draw.drawId));

    if ((soldResult?.count ?? 0) > 0) {
      return { success: false, message: '该抽奖已有购买记录，无法删除' };
    }

    await db.delete(luckyDrawInstances).where(eq(luckyDrawInstances.id, id));

    return { success: true, message: `抽奖 ${draw.drawId} 已删除` };
  } catch (error) {
    console.error('删除抽奖失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}

/**
 * 快速切换 enabled 状态
 */
export async function toggleLuckyDrawEnabled(id: number): Promise<ActionResult> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const [draw] = await db
      .select({ enabled: luckyDrawInstances.enabled })
      .from(luckyDrawInstances)
      .where(eq(luckyDrawInstances.id, id))
      .limit(1);

    if (!draw) {
      return { success: false, message: '抽奖不存在' };
    }

    await db
      .update(luckyDrawInstances)
      .set({ enabled: !draw.enabled })
      .where(eq(luckyDrawInstances.id, id));

    return {
      success: true,
      message: draw.enabled ? '已禁用' : '已启用',
    };
  } catch (error) {
    console.error('切换状态失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '切换失败',
    };
  }
}

/**
 * 查询抽奖详情：entries、开奖结果、领奖信息
 */
export async function getAdminLuckyDrawDetail(drawId: string): Promise<AdminLuckyDrawDetail> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  const [entries, resultRows, claimRows] = await Promise.all([
    db
      .select({
        id: luckyDrawEntries.id,
        userId: luckyDrawEntries.userId,
        slotNumber: luckyDrawEntries.slotNumber,
        status: luckyDrawEntries.status,
        packs: luckyDrawEntries.packs,
        creditsAwarded: luckyDrawEntries.creditsAwarded,
        paymentPlatform: luckyDrawEntries.paymentPlatform,
        stripeSessionId: luckyDrawEntries.stripeSessionId,
        amountPaid: luckyDrawEntries.amountPaid,
        createdAt: luckyDrawEntries.createdAt,
      })
      .from(luckyDrawEntries)
      .where(eq(luckyDrawEntries.drawId, drawId))
      .orderBy(asc(luckyDrawEntries.slotNumber)),

    db
      .select({
        winnerSlot: luckyDrawResults.winnerSlot,
        winnerUserId: luckyDrawResults.winnerUserId,
        blockNumber: luckyDrawResults.blockNumber,
        blockHash: luckyDrawResults.blockHash,
        txHash: luckyDrawResults.txHash,
        totalSlots: luckyDrawResults.totalSlots,
        createdAt: luckyDrawResults.createdAt,
      })
      .from(luckyDrawResults)
      .where(eq(luckyDrawResults.drawId, drawId))
      .limit(1),

    db
      .select({
        status: luckyDrawClaims.status,
        fullName: luckyDrawClaims.fullName,
        phone: luckyDrawClaims.phone,
        email: luckyDrawClaims.email,
        country: luckyDrawClaims.country,
        address: luckyDrawClaims.address,
        zipCode: luckyDrawClaims.zipCode,
        telegram: luckyDrawClaims.telegram,
        walletNetwork: luckyDrawClaims.walletNetwork,
        walletAddress: luckyDrawClaims.walletAddress,
        carrier: luckyDrawClaims.carrier,
        trackingNumber: luckyDrawClaims.trackingNumber,
        trackingUrl: luckyDrawClaims.trackingUrl,
        shippedAt: luckyDrawClaims.shippedAt,
        deliveredAt: luckyDrawClaims.deliveredAt,
        createdAt: luckyDrawClaims.createdAt,
      })
      .from(luckyDrawClaims)
      .where(eq(luckyDrawClaims.drawId, drawId))
      .limit(1),
  ]);

  return {
    entries,
    result: resultRows[0] ?? null,
    claim: claimRows[0] ?? null,
  };
}

// ─── Claim Actions ───

export interface ShipClaimInput {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
}

/**
 * 标记发货：info_submitted → shipped
 */
export async function updateClaimShipped(drawId: string, data: ShipClaimInput): Promise<ActionResult> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const [claim] = await db
      .select({ status: luckyDrawClaims.status })
      .from(luckyDrawClaims)
      .where(eq(luckyDrawClaims.drawId, drawId))
      .limit(1);

    if (!claim) {
      return { success: false, message: '领奖记录不存在' };
    }

    if (claim.status !== 'info_submitted') {
      return { success: false, message: `当前状态为 ${claim.status}，无法标记发货` };
    }

    await db
      .update(luckyDrawClaims)
      .set({
        status: 'shipped',
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl || null,
        shippedAt: new Date().toISOString(),
      })
      .where(eq(luckyDrawClaims.drawId, drawId));

    return { success: true, message: '已标记发货' };
  } catch (error) {
    console.error('标记发货失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '标记发货失败',
    };
  }
}

/**
 * 标记签收：shipped → delivered
 */
export async function updateClaimDelivered(drawId: string): Promise<ActionResult> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const [claim] = await db
      .select({ status: luckyDrawClaims.status })
      .from(luckyDrawClaims)
      .where(eq(luckyDrawClaims.drawId, drawId))
      .limit(1);

    if (!claim) {
      return { success: false, message: '领奖记录不存在' };
    }

    if (claim.status !== 'shipped') {
      return { success: false, message: `当前状态为 ${claim.status}，无法标记签收` };
    }

    await db
      .update(luckyDrawClaims)
      .set({
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
      })
      .where(eq(luckyDrawClaims.drawId, drawId));

    return { success: true, message: '已标记签收' };
  } catch (error) {
    console.error('标记签收失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '标记签收失败',
    };
  }
}

/**
 * 手动开奖：仅允许对已满额但未开奖的实例操作
 */
export async function adminTriggerDraw(drawId: string): Promise<ActionResult> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const [draw] = await db
      .select()
      .from(luckyDrawInstances)
      .where(eq(luckyDrawInstances.drawId, drawId))
      .limit(1);

    if (!draw) {
      return { success: false, message: '抽奖不存在' };
    }

    if (draw.status === 'completed') {
      return { success: false, message: '该期已开奖' };
    }

    // 检查是否已满额
    const [paidResult] = await db
      .select({ count: count() })
      .from(luckyDrawEntries)
      .where(eq(luckyDrawEntries.drawId, drawId));

    const paidSlots = paidResult?.count ?? 0;
    if (paidSlots < draw.totalSlots) {
      return { success: false, message: `尚未满额 (${paidSlots}/${draw.totalSlots})` };
    }

    // 更新状态为 drawing
    await db
      .update(luckyDrawInstances)
      .set({ status: 'drawing' })
      .where(eq(luckyDrawInstances.drawId, drawId));

    // 执行开奖
    await triggerDraw(drawId);

    return { success: true, message: '开奖成功' };
  } catch (error) {
    console.error('手动开奖失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '开奖失败',
    };
  }
}
