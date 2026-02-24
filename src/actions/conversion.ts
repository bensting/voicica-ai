'use server';

/**
 * $VOICICA → USDT 兑换 Server Action
 *
 * 原子性扣减 credits 并增加 usdt_balance，
 * 使用 WHERE 条件防止并发超扣。
 */

import db from '@/lib/db';
import { users, creditHistory, conversions } from '@/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-firebase';
import { getConversionConfig, getMiningEconomyConfig } from '@/config/appConfig';
import { ProductType } from '@/config/productType';

export interface ConvertResult {
  success: boolean;
  error?: string;
  credits?: number;
  usdt_balance?: number;
  usdt_received?: number;
}

/**
 * 将 $VOICICA 兑换为 USDT
 *
 * @param amount - 要兑换的 $VOICICA 数量
 */
export async function convertVoicicaToUsdt(amount: number): Promise<ConvertResult> {
  try {
    // 1. 必须登录
    const authUser = await getCurrentUser();

    // 2. 读取配置（汇率复用 token_value_usd）
    const config = getConversionConfig();
    const miningConfig = getMiningEconomyConfig();
    const rate = miningConfig.token_value_usd;

    if (!config.enabled) {
      return { success: false, error: 'conversion_disabled' };
    }

    // 3. 校验数量
    if (!Number.isInteger(amount) || amount <= 0) {
      return { success: false, error: 'invalid_amount' };
    }

    if (amount < config.min_convert_amount) {
      return { success: false, error: 'below_minimum' };
    }

    // 4. 原子 UPDATE：credits - amount, usdt_balance + (amount * rate)
    //    WHERE credits >= amount + min_voicica_reserve  防止余额不足
    const usdtReceived = amount * rate;
    const minRequired = amount + config.min_voicica_reserve;

    const result = await db
      .update(users)
      .set({
        credits: sql`${users.credits} - ${amount}`,
        usdtBalance: sql`${users.usdtBalance}::numeric + ${usdtReceived}::numeric`,
      })
      .where(
        and(
          eq(users.userId, authUser.uid),
          gte(users.credits, minRequired)
        )
      )
      .returning({
        credits: users.credits,
        usdtBalance: users.usdtBalance,
      });

    // 5. affected rows = 0 → 余额不足
    if (result.length === 0) {
      return { success: false, error: 'insufficient_balance' };
    }

    const updated = result[0];

    // 6. 写 credit_history（负值）
    await db.insert(creditHistory).values({
      userId: authUser.uid,
      amount: -amount,
      description: `Convert ${amount} $VOICICA → ${usdtReceived.toFixed(6)} USDT`,
      productType: ProductType.CONVERSION,
    });

    // 7. 写 conversions 记录
    await db.insert(conversions).values({
      userId: authUser.uid,
      type: 'voicica_to_usdt',
      voicicaAmount: amount,
      usdtAmount: usdtReceived.toFixed(6),
      rate: rate.toFixed(6),
    });

    console.log(`✅ [Conversion] ${authUser.uid}: ${amount} $VOICICA → ${usdtReceived} USDT`);

    return {
      success: true,
      credits: updated.credits,
      usdt_balance: parseFloat(updated.usdtBalance) || 0,
      usdt_received: usdtReceived,
    };
  } catch (error) {
    console.error('❌ [Conversion] 兑换失败:', error);
    if (error instanceof Error && (error.message === '未提供认证信息' || error.message === '未登录')) {
      return { success: false, error: 'not_authenticated' };
    }
    return { success: false, error: 'server_error' };
  }
}
