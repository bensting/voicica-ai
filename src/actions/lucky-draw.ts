'use server';

/**
 * Lucky Draw Server Actions
 *
 * 处理 Lucky Draw 的所有业务逻辑：
 * - 查询活跃抽奖、状态、购买、开奖、领奖、历史
 *
 * 抽奖实例从 lucky_draws 表读取（admin 创建），
 * 产品静态属性从 luckyDrawConfig 读取。
 */

import Stripe from 'stripe';
import db from '@/lib/db';
import { luckyDrawInstances, luckyDrawEntries, luckyDrawResults, luckyDrawClaims } from '@/db/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-firebase';
import { addCredits } from '@/lib/credits';
import { ProductType } from '@/config/productType';
import { getLuckyDrawProduct } from '@/config/native/luckyDrawConfig';
import { getLatestBlock, calculateWinnerSlot } from '@/lib/services/polygon';

// Lazy-init Stripe
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

// ─── Types ───

/** DB 中的 draw 实例记录 */
type DrawInstance = typeof luckyDrawInstances.$inferSelect;

export interface ActiveDrawInfo {
  drawId: string;
  productId: string;
  title: string | null;
  prize: string;
  prizeImageUrl: string;
  prizeType: 'product' | 'cash';
  icon: string;
  shortLabel: string;
  totalSlots: number;
  soldSlots: number;
  creditsPerPurchase: number;
  stripePriceCents: number;
  cryptoPriceCents: number;
  status: string;
  chainName: string | null;
  contractAddress: string | null;
  blockExplorerUrl: string | null;
  href: string;
}

export interface LuckyDrawStatusResult {
  drawId: string;
  productId: string;
  title: string | null;
  prize: string;
  prizeImageUrl: string;
  prizeType: 'product' | 'cash';
  totalSlots: number;
  soldSlots: number;
  creditsPerPurchase: number;
  stripePriceCents: number;
  cryptoPriceCents: number;
  status: 'selling' | 'drawing' | 'completed';
  chainName: string | null;
  contractAddress: string | null;
  blockExplorerUrl: string | null;
  myEntries: Array<{ slotNumber: number; packs: number; createdAt: string }>;
  drawResult?: {
    winnerSlot: number;
    winnerUserId: string;
    blockNumber: number | null;
    blockHash: string | null;
    txHash: string | null;
    isMe: boolean;
  };
  claim?: {
    status: string;
    fullName?: string | null;
    carrier?: string | null;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    shippedAt?: string | null;
  };
}

export interface LuckyDrawHistoryRecord {
  drawId: string;
  prize: string;
  packs: number;
  totalCredits: number;
  slots: number[];
  status: 'selling' | 'drawing' | 'completed';
  result?: {
    won: boolean;
    winnerSlot: number;
  };
  claim?: {
    status: string;
    shippingInfo?: {
      fullName: string;
      phone: string;
      email: string;
      country: string;
      address: string;
      zipCode: string;
      telegram?: string;
    };
    tracking?: {
      carrier: string;
      trackingNumber: string;
      trackingUrl?: string;
      shippedAt: string;
    };
  };
  date: string;
  href: string;
}

// ─── Helpers ───

/** 从 DB 获取 draw 实例 */
async function getDrawInstance(drawId: string): Promise<DrawInstance | undefined> {
  const [draw] = await db
    .select()
    .from(luckyDrawInstances)
    .where(eq(luckyDrawInstances.drawId, drawId))
    .limit(1);
  return draw;
}

/** 合并 DB draw + 产品配置 */
function mergeProductInfo(draw: DrawInstance) {
  const product = getLuckyDrawProduct(draw.productId);
  return {
    prize: product?.prize ?? draw.productId,
    prizeImageUrl: product?.prizeImageUrl ?? '',
    prizeType: (product?.prizeType ?? 'product') as 'product' | 'cash',
    icon: product?.icon ?? 'trophy',
    shortLabel: product?.shortLabel ?? draw.productId,
  };
}

// ─── getActiveDraw — 获取当前活跃的抽奖 ───

export async function getActiveDraw(): Promise<ActiveDrawInfo | null> {
  const [draw] = await db
    .select()
    .from(luckyDrawInstances)
    .where(and(
      eq(luckyDrawInstances.enabled, true),
      eq(luckyDrawInstances.status, 'selling'),
    ))
    .orderBy(desc(luckyDrawInstances.createdAt))
    .limit(1);

  if (!draw) return null;

  const product = mergeProductInfo(draw);

  // Get sold count
  const [soldResult] = await db
    .select({ count: count() })
    .from(luckyDrawEntries)
    .where(eq(luckyDrawEntries.drawId, draw.drawId));

  return {
    drawId: draw.drawId,
    productId: draw.productId,
    title: draw.title,
    ...product,
    totalSlots: draw.totalSlots,
    soldSlots: soldResult?.count ?? 0,
    creditsPerPurchase: draw.creditsPerPurchase,
    stripePriceCents: draw.stripePriceCents,
    cryptoPriceCents: draw.cryptoPriceCents,
    status: draw.status,
    chainName: draw.chainName,
    contractAddress: draw.contractAddress,
    blockExplorerUrl: draw.blockExplorerUrl,
    href: `/native/lucky-draw/${draw.drawId}`,
  };
}

// ─── getActiveDrawsByProduct — 获取各产品的活跃抽奖（FeatureGrid 用）───

export async function getActiveDrawsByProduct(): Promise<ActiveDrawInfo[]> {
  const draws = await db
    .select()
    .from(luckyDrawInstances)
    .where(eq(luckyDrawInstances.enabled, true))
    .orderBy(desc(luckyDrawInstances.createdAt));

  // 每个 productId 只取最新一期且状态为 selling
  const seen = new Set<string>();
  const result: ActiveDrawInfo[] = [];

  for (const draw of draws) {
    if (seen.has(draw.productId)) continue;
    if (draw.status !== 'selling') continue;
    seen.add(draw.productId);

    const product = mergeProductInfo(draw);
    const [soldResult] = await db
      .select({ count: count() })
      .from(luckyDrawEntries)
      .where(eq(luckyDrawEntries.drawId, draw.drawId));

    result.push({
      drawId: draw.drawId,
      productId: draw.productId,
      title: draw.title,
      ...product,
      totalSlots: draw.totalSlots,
      soldSlots: soldResult?.count ?? 0,
      creditsPerPurchase: draw.creditsPerPurchase,
      stripePriceCents: draw.stripePriceCents,
      cryptoPriceCents: draw.cryptoPriceCents,
      status: draw.status,
      chainName: draw.chainName,
      contractAddress: draw.contractAddress,
      blockExplorerUrl: draw.blockExplorerUrl,
      href: `/native/lucky-draw/${draw.drawId}`,
    });
  }

  return result;
}

// ─── getLuckyDrawStatus ───

export async function getLuckyDrawStatus(drawId: string): Promise<LuckyDrawStatusResult> {
  const draw = await getDrawInstance(drawId);
  if (!draw) {
    throw new Error(`Lucky Draw not found: ${drawId}`);
  }

  const product = mergeProductInfo(draw);

  // Get sold slots count
  const [soldResult] = await db
    .select({ count: count() })
    .from(luckyDrawEntries)
    .where(eq(luckyDrawEntries.drawId, drawId));

  const soldSlots = soldResult?.count ?? 0;

  // Get draw result (if any)
  const [result] = await db
    .select()
    .from(luckyDrawResults)
    .where(eq(luckyDrawResults.drawId, drawId))
    .limit(1);

  // Determine status
  let status: 'selling' | 'drawing' | 'completed' = draw.status as 'selling' | 'drawing' | 'completed';
  if (result) {
    status = 'completed';
  } else if (soldSlots >= draw.totalSlots) {
    status = 'drawing';
  }

  // Get current user's entries (optional - may not be logged in)
  let myEntries: LuckyDrawStatusResult['myEntries'] = [];
  let drawResult: LuckyDrawStatusResult['drawResult'];
  let claim: LuckyDrawStatusResult['claim'];

  try {
    const user = await getCurrentUser();
    const userId = user.uid;

    const entries = await db
      .select({
        slotNumber: luckyDrawEntries.slotNumber,
        packs: luckyDrawEntries.packs,
        createdAt: luckyDrawEntries.createdAt,
      })
      .from(luckyDrawEntries)
      .where(and(
        eq(luckyDrawEntries.drawId, drawId),
        eq(luckyDrawEntries.userId, userId),
      ))
      .orderBy(luckyDrawEntries.slotNumber);

    myEntries = entries;

    if (result) {
      drawResult = {
        winnerSlot: result.winnerSlot,
        winnerUserId: result.winnerUserId,
        blockNumber: result.blockNumber,
        blockHash: result.blockHash,
        txHash: result.txHash,
        isMe: result.winnerUserId === userId,
      };

      if (result.winnerUserId === userId) {
        const [claimRecord] = await db
          .select()
          .from(luckyDrawClaims)
          .where(eq(luckyDrawClaims.drawId, drawId))
          .limit(1);

        if (claimRecord) {
          claim = {
            status: claimRecord.status,
            fullName: claimRecord.fullName,
            carrier: claimRecord.carrier,
            trackingNumber: claimRecord.trackingNumber,
            trackingUrl: claimRecord.trackingUrl,
            shippedAt: claimRecord.shippedAt,
          };
        }
      }
    }
  } catch {
    if (result) {
      drawResult = {
        winnerSlot: result.winnerSlot,
        winnerUserId: result.winnerUserId,
        blockNumber: result.blockNumber,
        blockHash: result.blockHash,
        txHash: result.txHash,
        isMe: false,
      };
    }
  }

  return {
    drawId,
    productId: draw.productId,
    title: draw.title,
    ...product,
    totalSlots: draw.totalSlots,
    soldSlots,
    creditsPerPurchase: draw.creditsPerPurchase,
    stripePriceCents: draw.stripePriceCents,
    cryptoPriceCents: draw.cryptoPriceCents,
    status,
    chainName: draw.chainName,
    contractAddress: draw.contractAddress,
    blockExplorerUrl: draw.blockExplorerUrl,
    myEntries,
    drawResult,
    claim,
  };
}

// ─── createLuckyDrawCheckout ───

export async function createLuckyDrawCheckout(
  drawId: string,
  packs: number,
  successUrl: string,
  cancelUrl: string,
): Promise<{ checkout_url: string; session_id: string }> {
  const user = await getCurrentUser();
  const userId = user.uid;

  const draw = await getDrawInstance(drawId);
  if (!draw) {
    throw new Error(`Lucky Draw not found: ${drawId}`);
  }

  if (draw.status !== 'selling') {
    throw new Error('This Lucky Draw is no longer accepting purchases');
  }

  const product = mergeProductInfo(draw);

  // Check remaining slots
  const [soldResult] = await db
    .select({ count: count() })
    .from(luckyDrawEntries)
    .where(eq(luckyDrawEntries.drawId, drawId));

  const soldSlots = soldResult?.count ?? 0;
  const remaining = draw.totalSlots - soldSlots;

  if (packs > remaining) {
    throw new Error(`Not enough slots remaining. Available: ${remaining}`);
  }

  const totalCredits = draw.creditsPerPurchase * packs;

  const successUrlWithSession = successUrl.includes('?')
    ? `${successUrl}&request_id={CHECKOUT_SESSION_ID}`
    : `${successUrl}?request_id={CHECKOUT_SESSION_ID}`;

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: draw.stripePriceCents,
          product_data: {
            name: `Lucky Draw Credit Pack × ${packs}`,
            description: `${totalCredits} AI Credits + ${packs} Lucky Draw entries for ${product.prize}`,
          },
        },
        quantity: packs,
      },
    ],
    success_url: successUrlWithSession,
    cancel_url: cancelUrl,
    metadata: {
      type: 'lucky_draw',
      draw_id: drawId,
      user_id: userId,
      packs: String(packs),
      credits: String(totalCredits),
    },
    ...(user.email && { customer_email: user.email }),
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  console.log(`✅ Lucky Draw Checkout 创建成功: ${session.id}, 用户: ${userId}, packs: ${packs}`);

  return {
    checkout_url: session.url,
    session_id: session.id,
  };
}

// ─── handleLuckyDrawPurchase (called from webhook) ───

export async function handleLuckyDrawPurchase(
  session: Stripe.Checkout.Session,
  eventId: string,
): Promise<void> {
  const metadata = session.metadata || {};
  const drawId = metadata.draw_id;
  const userId = metadata.user_id;
  const packs = parseInt(metadata.packs, 10);
  const credits = parseInt(metadata.credits, 10);

  if (!drawId || !userId || isNaN(packs) || isNaN(credits)) {
    console.error('❌ Lucky Draw: 缺少必要的 metadata:', metadata);
    return;
  }

  const draw = await getDrawInstance(drawId);
  if (!draw) {
    console.error(`❌ Lucky Draw: 找不到实例: ${drawId}`);
    return;
  }

  const product = mergeProductInfo(draw);

  // Atomically allocate slot numbers
  const amountPerPack = session.amount_total ? Math.round(session.amount_total / packs) : null;
  const currency = session.currency?.toUpperCase() ?? null;

  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await db.execute(sql`
        INSERT INTO lucky_draw_entries
          (draw_id, user_id, slot_number, packs, credits_awarded, payment_platform, stripe_session_id, amount_paid, currency, created_at)
        SELECT
          ${drawId}, ${userId},
          COALESCE(MAX(slot_number), -1) + gs.n,
          1, ${draw.creditsPerPurchase}, 'stripe', ${session.id},
          ${amountPerPack}, ${currency}, CURRENT_TIMESTAMP
        FROM lucky_draw_entries
        WHERE draw_id = ${drawId}
        CROSS JOIN generate_series(1, ${packs}) AS gs(n)
      `);
      break;
    } catch (e: unknown) {
      const isUniqueViolation = e instanceof Error && e.message.includes('uq_lde_draw_slot');
      if (!isUniqueViolation || attempt === MAX_RETRIES - 1) throw e;
      console.warn(`⚠️ Lucky Draw slot 冲突, 重试 ${attempt + 1}/${MAX_RETRIES}`);
    }
  }

  // Add credits to user
  await addCredits(
    userId,
    credits,
    ProductType.LUCKY_DRAW,
    false,
    `Lucky Draw: ${product.prize} (${packs} packs)`,
  );

  console.log(`✅ Lucky Draw 购买完成: drawId=${drawId}, userId=${userId}, packs=${packs}, credits=+${credits}`);

  // Check if all slots are sold → trigger draw
  const [soldResult] = await db
    .select({ count: count() })
    .from(luckyDrawEntries)
    .where(eq(luckyDrawEntries.drawId, drawId));

  const soldSlots = soldResult?.count ?? 0;

  if (soldSlots >= draw.totalSlots) {
    // Update draw status to 'drawing'
    await db
      .update(luckyDrawInstances)
      .set({ status: 'drawing' })
      .where(eq(luckyDrawInstances.drawId, drawId));

    console.log(`🎰 所有 slots 已售罄 (${soldSlots}/${draw.totalSlots})，触发开奖...`);
    await triggerDraw(drawId);
  }
}

// ─── triggerDraw ───

export async function triggerDraw(drawId: string): Promise<void> {
  const draw = await getDrawInstance(drawId);
  if (!draw) {
    throw new Error(`Lucky Draw not found: ${drawId}`);
  }

  // Check if already drawn
  const [existingResult] = await db
    .select({ id: luckyDrawResults.id })
    .from(luckyDrawResults)
    .where(eq(luckyDrawResults.drawId, drawId))
    .limit(1);

  if (existingResult) {
    console.log(`⏭️ Lucky Draw ${drawId} 已开奖，跳过`);
    return;
  }

  // Get latest Polygon block
  const block = await getLatestBlock();
  const winnerSlot = calculateWinnerSlot(block.hash, draw.totalSlots);

  // Find the user who owns this slot
  const [winnerEntry] = await db
    .select({ userId: luckyDrawEntries.userId })
    .from(luckyDrawEntries)
    .where(and(
      eq(luckyDrawEntries.drawId, drawId),
      eq(luckyDrawEntries.slotNumber, winnerSlot),
    ))
    .limit(1);

  if (!winnerEntry) {
    console.error(`❌ Lucky Draw: 找不到 slot ${winnerSlot} 的拥有者`);
    return;
  }

  // Write result
  await db.insert(luckyDrawResults).values({
    drawId,
    winnerSlot,
    winnerUserId: winnerEntry.userId,
    blockNumber: block.number,
    blockHash: block.hash,
    txHash: null,
    totalSlots: draw.totalSlots,
  });

  // Create claim record
  await db.insert(luckyDrawClaims).values({
    drawId,
    userId: winnerEntry.userId,
    status: 'unclaimed',
  });

  // Update draw instance status
  await db
    .update(luckyDrawInstances)
    .set({ status: 'completed', completedAt: new Date().toISOString() })
    .where(eq(luckyDrawInstances.drawId, drawId));

  console.log(`🎉 Lucky Draw ${drawId} 开奖完成! Winner: slot #${winnerSlot}, user: ${winnerEntry.userId}`);
}

// ─── submitPrizeClaim ───

export interface ShippingInfoInput {
  fullName: string;
  phone: string;
  email: string;
  country: string;
  address: string;
  zipCode: string;
  telegram?: string;
}

export async function submitPrizeClaim(
  drawId: string,
  shippingInfo: ShippingInfoInput,
): Promise<void> {
  const user = await getCurrentUser();
  const userId = user.uid;

  const [result] = await db
    .select()
    .from(luckyDrawResults)
    .where(eq(luckyDrawResults.drawId, drawId))
    .limit(1);

  if (!result || result.winnerUserId !== userId) {
    throw new Error('You are not the winner of this Lucky Draw');
  }

  await db
    .update(luckyDrawClaims)
    .set({
      status: 'info_submitted',
      fullName: shippingInfo.fullName,
      phone: shippingInfo.phone,
      email: shippingInfo.email,
      country: shippingInfo.country,
      address: shippingInfo.address,
      zipCode: shippingInfo.zipCode,
      telegram: shippingInfo.telegram ?? null,
    })
    .where(and(
      eq(luckyDrawClaims.drawId, drawId),
      eq(luckyDrawClaims.userId, userId),
    ));

  console.log(`✅ Lucky Draw ${drawId} 领奖信息已提交: ${userId}`);
}

// ─── getUserLuckyDrawHistory ───

export async function getUserLuckyDrawHistory(): Promise<LuckyDrawHistoryRecord[]> {
  const user = await getCurrentUser();
  const userId = user.uid;

  const userEntries = await db
    .select({
      drawId: luckyDrawEntries.drawId,
      slotNumber: luckyDrawEntries.slotNumber,
      packs: luckyDrawEntries.packs,
      creditsAwarded: luckyDrawEntries.creditsAwarded,
      createdAt: luckyDrawEntries.createdAt,
    })
    .from(luckyDrawEntries)
    .where(eq(luckyDrawEntries.userId, userId))
    .orderBy(desc(luckyDrawEntries.createdAt));

  if (userEntries.length === 0) {
    return [];
  }

  // Group entries by drawId
  const drawMap = new Map<string, {
    slots: number[];
    totalPacks: number;
    totalCredits: number;
    earliestDate: string;
  }>();

  for (const entry of userEntries) {
    const existing = drawMap.get(entry.drawId);
    if (existing) {
      existing.slots.push(entry.slotNumber);
      existing.totalPacks += entry.packs;
      existing.totalCredits += entry.creditsAwarded;
    } else {
      drawMap.set(entry.drawId, {
        slots: [entry.slotNumber],
        totalPacks: entry.packs,
        totalCredits: entry.creditsAwarded,
        earliestDate: entry.createdAt,
      });
    }
  }

  const drawIds = Array.from(drawMap.keys());

  // Batch fetch: draw instances, results, claims
  const [drawInstances, results, claims] = await Promise.all([
    db.select().from(luckyDrawInstances)
      .where(sql`${luckyDrawInstances.drawId} IN (${sql.join(drawIds.map(id => sql`${id}`), sql`, `)})`),
    db.select().from(luckyDrawResults)
      .where(sql`${luckyDrawResults.drawId} IN (${sql.join(drawIds.map(id => sql`${id}`), sql`, `)})`),
    db.select().from(luckyDrawClaims)
      .where(and(
        eq(luckyDrawClaims.userId, userId),
        sql`${luckyDrawClaims.drawId} IN (${sql.join(drawIds.map(id => sql`${id}`), sql`, `)})`,
      )),
  ]);

  const instanceMap = new Map(drawInstances.map((d) => [d.drawId, d]));
  const resultMap = new Map(results.map((r) => [r.drawId, r]));
  const claimMap = new Map(claims.map((c) => [c.drawId, c]));

  const records: LuckyDrawHistoryRecord[] = [];

  for (const [drawId, data] of drawMap) {
    const draw = instanceMap.get(drawId);
    const product = draw ? mergeProductInfo(draw) : null;
    const result = resultMap.get(drawId);
    const claimRecord = claimMap.get(drawId);

    const status = (draw?.status ?? 'selling') as 'selling' | 'drawing' | 'completed';

    const record: LuckyDrawHistoryRecord = {
      drawId,
      prize: product?.prize ?? drawId,
      packs: data.totalPacks,
      totalCredits: data.totalCredits,
      slots: data.slots.sort((a, b) => a - b),
      status,
      date: data.earliestDate.split('T')[0],
      href: `/native/lucky-draw/${drawId}`,
    };

    if (result) {
      const won = result.winnerUserId === userId;
      record.result = { won, winnerSlot: result.winnerSlot };

      if (won && claimRecord) {
        record.claim = { status: claimRecord.status };

        if (claimRecord.fullName) {
          record.claim.shippingInfo = {
            fullName: claimRecord.fullName,
            phone: claimRecord.phone ?? '',
            email: claimRecord.email ?? '',
            country: claimRecord.country ?? '',
            address: claimRecord.address ?? '',
            zipCode: claimRecord.zipCode ?? '',
            telegram: claimRecord.telegram ?? '',
          };
        }

        if (claimRecord.carrier) {
          record.claim.tracking = {
            carrier: claimRecord.carrier,
            trackingNumber: claimRecord.trackingNumber ?? '',
            trackingUrl: claimRecord.trackingUrl ?? '',
            shippedAt: claimRecord.shippedAt ?? '',
          };
        }
      }
    }

    records.push(record);
  }

  records.sort((a, b) => b.date.localeCompare(a.date));
  return records;
}
