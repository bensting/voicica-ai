'use server';

/**
 * Lucky Draw Server Actions
 *
 * 处理 Lucky Draw 的所有业务逻辑：
 * - 查询状态、购买、开奖、领奖
 */

import Stripe from 'stripe';
import db from '@/lib/db';
import { luckyDrawEntries, luckyDrawResults, luckyDrawClaims } from '@/db/schema';
import { eq, and, sql, desc, count, max } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-firebase';
import { addCredits } from '@/lib/credits';
import { ProductType } from '@/config/productType';
import { luckyDraws, type LuckyDrawConfig } from '@/config/native/luckyDrawConfig';
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

export interface LuckyDrawStatusResult {
  totalSlots: number;
  soldSlots: number;
  status: 'selling' | 'drawing' | 'completed';
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

function getLuckyDrawConfig(drawId: string): LuckyDrawConfig | undefined {
  return luckyDraws.find((d) => d.id === drawId);
}

// ─── 3.1 getLuckyDrawStatus ───

export async function getLuckyDrawStatus(drawId: string): Promise<LuckyDrawStatusResult> {
  const config = getLuckyDrawConfig(drawId);
  if (!config) {
    throw new Error(`Lucky Draw not found: ${drawId}`);
  }

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
  let status: 'selling' | 'drawing' | 'completed' = 'selling';
  if (result) {
    status = 'completed';
  } else if (soldSlots >= config.totalSlots) {
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

    // Build draw result with isMe flag
    if (result) {
      drawResult = {
        winnerSlot: result.winnerSlot,
        winnerUserId: result.winnerUserId,
        blockNumber: result.blockNumber,
        blockHash: result.blockHash,
        txHash: result.txHash,
        isMe: result.winnerUserId === userId,
      };

      // Get claim info if user is the winner
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
    // Not logged in — return public data only
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
    totalSlots: config.totalSlots,
    soldSlots,
    status,
    myEntries,
    drawResult,
    claim,
  };
}

// ─── 3.2 createLuckyDrawCheckout ───

export async function createLuckyDrawCheckout(
  drawId: string,
  packs: number,
  successUrl: string,
  cancelUrl: string,
): Promise<{ checkout_url: string; session_id: string }> {
  const user = await getCurrentUser();
  const userId = user.uid;

  const config = getLuckyDrawConfig(drawId);
  if (!config) {
    throw new Error(`Lucky Draw not found: ${drawId}`);
  }

  // Check remaining slots
  const [soldResult] = await db
    .select({ count: count() })
    .from(luckyDrawEntries)
    .where(eq(luckyDrawEntries.drawId, drawId));

  const soldSlots = soldResult?.count ?? 0;
  const remaining = config.totalSlots - soldSlots;

  if (packs > remaining) {
    throw new Error(`Not enough slots remaining. Available: ${remaining}`);
  }

  // Check if draw is already completed
  const [existingResult] = await db
    .select({ id: luckyDrawResults.id })
    .from(luckyDrawResults)
    .where(eq(luckyDrawResults.drawId, drawId))
    .limit(1);

  if (existingResult) {
    throw new Error('This Lucky Draw has already been completed');
  }

  const totalAmount = Math.round(config.stripePriceUsd * packs * 100); // cents
  const totalCredits = config.creditsPerPurchase * packs;

  // Build success URL with session ID
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
          unit_amount: Math.round(config.stripePriceUsd * 100),
          product_data: {
            name: `Lucky Draw Credit Pack × ${packs}`,
            description: `${totalCredits} AI Credits + ${packs} Lucky Draw entries for ${config.prize}`,
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

// ─── 3.3 handleLuckyDrawPurchase (called from webhook) ───

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

  const config = getLuckyDrawConfig(drawId);
  if (!config) {
    console.error(`❌ Lucky Draw: 找不到配置: ${drawId}`);
    return;
  }

  // Get current max slot number for this draw
  const [maxSlotResult] = await db
    .select({ maxSlot: max(luckyDrawEntries.slotNumber) })
    .from(luckyDrawEntries)
    .where(eq(luckyDrawEntries.drawId, drawId));

  const currentMaxSlot = maxSlotResult?.maxSlot ?? -1;

  // Insert entries (one row per pack, each with a unique slot)
  const entryValues = Array.from({ length: packs }, (_, i) => ({
    drawId,
    userId,
    slotNumber: currentMaxSlot + 1 + i,
    packs: 1,
    creditsAwarded: config.creditsPerPurchase,
    paymentPlatform: 'stripe' as const,
    stripeSessionId: session.id,
    amountPaid: session.amount_total ? Math.round(session.amount_total / packs) : null,
    currency: session.currency?.toUpperCase() ?? null,
  }));

  await db.insert(luckyDrawEntries).values(entryValues);

  // Add credits to user
  await addCredits(
    userId,
    credits,
    ProductType.LUCKY_DRAW,
    false,
    `Lucky Draw: ${config.prize} (${packs} packs)`,
  );

  console.log(`✅ Lucky Draw 购买完成: drawId=${drawId}, userId=${userId}, packs=${packs}, credits=+${credits}`);

  // Check if all slots are sold → trigger draw
  const [soldResult] = await db
    .select({ count: count() })
    .from(luckyDrawEntries)
    .where(eq(luckyDrawEntries.drawId, drawId));

  const soldSlots = soldResult?.count ?? 0;

  if (soldSlots >= config.totalSlots) {
    console.log(`🎰 所有 slots 已售罄 (${soldSlots}/${config.totalSlots})，触发开奖...`);
    await triggerDraw(drawId);
  }
}

// ─── 3.4 triggerDraw ───

export async function triggerDraw(drawId: string): Promise<void> {
  const config = getLuckyDrawConfig(drawId);
  if (!config) {
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
  const winnerSlot = calculateWinnerSlot(block.hash, config.totalSlots);

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
    totalSlots: config.totalSlots,
  });

  // Create claim record
  await db.insert(luckyDrawClaims).values({
    drawId,
    userId: winnerEntry.userId,
    status: 'unclaimed',
  });

  console.log(`🎉 Lucky Draw ${drawId} 开奖完成! Winner: slot #${winnerSlot}, user: ${winnerEntry.userId}`);
}

// ─── 3.5 submitPrizeClaim ───

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

  // Verify user is the winner
  const [result] = await db
    .select()
    .from(luckyDrawResults)
    .where(eq(luckyDrawResults.drawId, drawId))
    .limit(1);

  if (!result || result.winnerUserId !== userId) {
    throw new Error('You are not the winner of this Lucky Draw');
  }

  // Update claim with shipping info
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

// ─── 3.6 getUserLuckyDrawHistory ───

export async function getUserLuckyDrawHistory(): Promise<LuckyDrawHistoryRecord[]> {
  const user = await getCurrentUser();
  const userId = user.uid;

  // Get all draws the user participated in
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

  // Get results for all participated draws
  const results = await db
    .select()
    .from(luckyDrawResults)
    .where(sql`${luckyDrawResults.drawId} IN (${sql.join(drawIds.map(id => sql`${id}`), sql`, `)})`);

  const resultMap = new Map(results.map((r) => [r.drawId, r]));

  // Get claims for won draws
  const claims = await db
    .select()
    .from(luckyDrawClaims)
    .where(and(
      eq(luckyDrawClaims.userId, userId),
      sql`${luckyDrawClaims.drawId} IN (${sql.join(drawIds.map(id => sql`${id}`), sql`, `)})`,
    ));

  const claimMap = new Map(claims.map((c) => [c.drawId, c]));

  // Build history records
  const records: LuckyDrawHistoryRecord[] = [];

  for (const [drawId, data] of drawMap) {
    const config = getLuckyDrawConfig(drawId);
    const result = resultMap.get(drawId);
    const claimRecord = claimMap.get(drawId);

    // Determine status
    let status: 'selling' | 'drawing' | 'completed' = 'selling';
    if (result) {
      status = 'completed';
    } else {
      // Check sold count
      const [soldResult] = await db
        .select({ count: count() })
        .from(luckyDrawEntries)
        .where(eq(luckyDrawEntries.drawId, drawId));
      const totalConfig = config?.totalSlots ?? 0;
      if ((soldResult?.count ?? 0) >= totalConfig) {
        status = 'drawing';
      }
    }

    const record: LuckyDrawHistoryRecord = {
      drawId,
      prize: config?.prize ?? drawId,
      packs: data.totalPacks,
      totalCredits: data.totalCredits,
      slots: data.slots.sort((a, b) => a - b),
      status,
      date: data.earliestDate.split('T')[0],
      href: `/native/lucky-draw/${drawId}`,
    };

    if (result) {
      const won = result.winnerUserId === userId;
      record.result = {
        won,
        winnerSlot: result.winnerSlot,
      };

      if (won && claimRecord) {
        record.claim = {
          status: claimRecord.status,
        };

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

  // Sort by date descending
  records.sort((a, b) => b.date.localeCompare(a.date));

  return records;
}
