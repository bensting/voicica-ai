import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { adRewardTransactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
/**
 * AdMob Server-Side Verification (SSV) 回调处理
 *
 * 当用户完成观看激励广告后，AdMob 会调用此 URL 进行验证
 *
 * 文档: https://developers.google.com/admob/android/rewarded-video-ssv
 */

// Google AdMob 公钥缓存（缓存 CryptoKey 对象）
let googlePublicKeys: Map<string, CryptoKey> | null = null;
let keysLastFetched = 0;
const KEYS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 小时

/** base64 标准编码 → Uint8Array */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 将 DER 编码的 ECDSA 签名转换为 IEEE P1363 格式（Web Crypto 要求）
 * DER: 0x30 [len] 0x02 [r_len] [r] 0x02 [s_len] [s]
 * P1363: [r_padded_32] [s_padded_32]
 */
function derToP1363(der: Uint8Array): Uint8Array {
  // 跳过 SEQUENCE tag 和 length
  let offset = 2;
  if (der[1] & 0x80) {
    offset += (der[1] & 0x7f);
  }

  // 读取 r
  if (der[offset] !== 0x02) throw new Error('Invalid DER: expected INTEGER tag for r');
  offset++;
  const rLen = der[offset++];
  const rBytes = der.slice(offset, offset + rLen);
  offset += rLen;

  // 读取 s
  if (der[offset] !== 0x02) throw new Error('Invalid DER: expected INTEGER tag for s');
  offset++;
  const sLen = der[offset++];
  const sBytes = der.slice(offset, offset + sLen);

  // P-256 使用 32 字节，去掉前导零或左填充零
  const result = new Uint8Array(64);
  const rTrimmed = rBytes[0] === 0 ? rBytes.slice(1) : rBytes;
  const sTrimmed = sBytes[0] === 0 ? sBytes.slice(1) : sBytes;
  result.set(rTrimmed, 32 - rTrimmed.length);
  result.set(sTrimmed, 64 - sTrimmed.length);

  return result;
}

/**
 * 获取 Google AdMob 公钥（CryptoKey 格式）
 */
async function getGooglePublicKeys(): Promise<Map<string, CryptoKey>> {
  const now = Date.now();

  // 使用缓存的公钥
  if (googlePublicKeys && (now - keysLastFetched) < KEYS_CACHE_DURATION) {
    return googlePublicKeys;
  }

  // 从 Google 获取公钥
  const response = await fetch('https://www.gstatic.com/admob/reward/verifier-keys.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch Google public keys: ${response.status}`);
  }

  const data = await response.json();
  const keys = new Map<string, CryptoKey>();

  for (const key of data.keys) {
    // base64url → 标准 base64
    const base64Key = key.base64.replace(/-/g, '+').replace(/_/g, '/');
    const keyData = base64ToUint8Array(base64Key);

    // 导入为 CryptoKey（ECDSA P-256）
    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      keyData.buffer as ArrayBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
    keys.set(key.keyId.toString(), cryptoKey);
  }

  googlePublicKeys = keys;
  keysLastFetched = now;

  console.log(`🔑 [AdMob SSV] 已获取 ${keys.size} 个 Google 公钥`);
  return keys;
}

/**
 * 验证 AdMob SSV 签名（Web Crypto API）
 */
async function verifySignature(
  queryString: string,
  signature: string,
  keyId: string
): Promise<boolean> {
  try {
    const keys = await getGooglePublicKeys();
    const publicKey = keys.get(keyId);

    if (!publicKey) {
      console.error(`❌ [AdMob SSV] 未找到 key_id: ${keyId}`);
      return false;
    }

    // 构建要验证的消息（不包含 signature 和 key_id 参数）
    const params = new URLSearchParams(queryString);
    params.delete('signature');
    params.delete('key_id');

    // 按字母顺序排序参数
    const sortedParams = new URLSearchParams([...params.entries()].sort());
    const message = sortedParams.toString();

    // 解码签名（base64url → 标准 base64 → bytes）
    const sigBase64 = signature.replace(/-/g, '+').replace(/_/g, '/');
    const sigDer = base64ToUint8Array(sigBase64);

    // DER → IEEE P1363（Web Crypto ECDSA 要求 P1363 格式）
    const sigP1363 = derToP1363(sigDer);

    // 编码消息
    const messageBytes = new TextEncoder().encode(message);

    // 使用 Web Crypto 验证 ECDSA 签名
    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      sigP1363.buffer as ArrayBuffer,
      messageBytes
    );
  } catch (error) {
    console.error('❌ [AdMob SSV] 签名验证失败:', error);
    return false;
  }
}

/**
 * GET /api/v1/ads/reward-callback
 *
 * AdMob SSV 回调端点
 *
 * 参数:
 * - ad_network: 广告网络 ID
 * - ad_unit: 广告单元 ID
 * - reward_amount: 奖励数量（AdMob 配置的，非实际发放数量）
 * - reward_item: 奖励类型
 * - timestamp: 时间戳
 * - transaction_id: 唯一交易 ID
 * - user_id: 用户 ID（从 custom_data 中解析）
 * - custom_data: 自定义数据（JSON 格式：{user_id, tier}）
 * - signature: Google 签名
 * - key_id: 签名密钥 ID
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    // 获取必要参数
    const transactionId = searchParams.get('transaction_id');
    const signature = searchParams.get('signature');
    const keyId = searchParams.get('key_id');
    const customData = searchParams.get('custom_data');
    const timestamp = searchParams.get('timestamp');

    console.log(`📥 [AdMob SSV] 收到回调: transaction_id=${transactionId}`);

    // 参数验证
    if (!transactionId || !signature || !keyId) {
      console.error('❌ [AdMob SSV] 缺少必要参数');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 验证签名
    const queryString = request.url.split('?')[1] || '';
    const isValid = await verifySignature(queryString, signature, keyId);

    if (!isValid) {
      console.error(`❌ [AdMob SSV] 签名验证失败: ${transactionId}`);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    console.log(`✅ [AdMob SSV] 签名验证通过: ${transactionId}`);

    // 解析自定义数据
    let userId: string | null = null;
    let tier: number | null = null;

    if (customData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(customData));
        userId = decoded.user_id || null;
        tier = decoded.tier !== undefined ? Number(decoded.tier) : null;
      } catch {
        console.warn('⚠️ [AdMob SSV] custom_data 解析失败:', customData);
      }
    }

    // 如果没有 custom_data，尝试从 user_id 参数获取
    if (!userId) {
      userId = searchParams.get('user_id');
    }

    if (!userId) {
      console.error('❌ [AdMob SSV] 缺少 user_id');
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    // 检查交易是否已处理（防重放攻击）
    const [existingReward] = await db.select()
      .from(adRewardTransactions)
      .where(eq(adRewardTransactions.transactionId, transactionId))
      .limit(1);

    if (existingReward) {
      console.log(`⏭️ [AdMob SSV] 交易已处理: ${transactionId}`);
      // 返回成功，避免 AdMob 重试
      return NextResponse.json({ success: true, duplicate: true });
    }

    // 记录交易（先记录，再发放积分，确保幂等性）
    await db.insert(adRewardTransactions).values({
      transactionId,
      userId,
      tier,
      timestamp: timestamp ? new Date(Number(timestamp) * 1000).toISOString() : new Date().toISOString(),
      adUnit: searchParams.get('ad_unit') || null,
      rewardAmount: Number(searchParams.get('reward_amount')) || 0,
      processed: false,
    });

    // TODO: 这里可以触发实际的积分发放逻辑
    // 目前积分发放由前端调用 claimAdReward 完成
    // SSV 回调主要用于验证广告确实被观看

    // 标记交易已处理
    await db.update(adRewardTransactions)
      .set({ processed: true })
      .where(eq(adRewardTransactions.transactionId, transactionId));

    const duration = Date.now() - startTime;
    console.log(`✅ [AdMob SSV] 处理完成: ${transactionId}, 耗时: ${duration}ms`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [AdMob SSV] 处理失败:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
