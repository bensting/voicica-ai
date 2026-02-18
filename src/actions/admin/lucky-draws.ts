'use server';

/**
 * Admin Lucky Draw Server Actions
 * 管理抽奖实例的 CRUD 操作
 */
import db from '@/lib/db';
import { luckyDrawInstances, luckyDrawEntries } from '@/db/schema';
import { eq, desc, sql, count } from 'drizzle-orm';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';
import { getLuckyDrawProduct } from '@/config/native/luckyDrawConfig';

// ─── Types ───

export interface AdminLuckyDraw {
  id: number;
  drawId: string;
  productId: string;
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
  title?: string;
  enabled: boolean;
}

interface ActionResult {
  success: boolean;
  message: string;
}

// ─── Actions ───

/**
 * 列表查询，关联查询已售 slots 数量，按 createdAt DESC
 */
export async function getAdminLuckyDraws(): Promise<AdminLuckyDraw[]> {
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
      title: data.title || null,
      enabled: data.enabled,
      status: 'selling',
      totalSlots: product.totalSlots,
      creditsPerPurchase: product.creditsPerPurchase,
      stripePriceCents: product.stripePriceCents,
      cryptoPriceCents: product.cryptoPriceCents,
      chainName: product.chainName,
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
  await verifyAdminWithoutDb();

  try {
    await db
      .update(luckyDrawInstances)
      .set({
        ...(data.title !== undefined && { title: data.title || null }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
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
