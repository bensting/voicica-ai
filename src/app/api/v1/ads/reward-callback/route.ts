import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

/**
 * AdMob Server-Side Verification (SSV) 回调处理
 *
 * 当用户完成观看激励广告后，AdMob 会调用此 URL 进行验证
 *
 * 文档: https://developers.google.com/admob/android/rewarded-video-ssv
 */

// Google AdMob 公钥缓存
let googlePublicKeys: Map<string, string> | null = null;
let keysLastFetched = 0;
const KEYS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 小时

/**
 * 获取 Google AdMob 公钥
 */
async function getGooglePublicKeys(): Promise<Map<string, string>> {
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
  const keys = new Map<string, string>();

  for (const key of data.keys) {
    // 将 base64url 编码的公钥转换为 PEM 格式
    const base64Key = key.base64.replace(/-/g, '+').replace(/_/g, '/');
    keys.set(key.keyId.toString(), base64Key);
  }

  googlePublicKeys = keys;
  keysLastFetched = now;

  console.log(`🔑 [AdMob SSV] 已获取 ${keys.size} 个 Google 公钥`);
  return keys;
}

/**
 * 验证 AdMob SSV 签名
 */
async function verifySignature(
  queryString: string,
  signature: string,
  keyId: string
): Promise<boolean> {
  try {
    const keys = await getGooglePublicKeys();
    const publicKeyBase64 = keys.get(keyId);

    if (!publicKeyBase64) {
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

    // 解码签名和公钥
    const signatureBuffer = Buffer.from(signature.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const publicKeyDer = Buffer.from(publicKeyBase64, 'base64');

    // 创建公钥对象
    const publicKey = crypto.createPublicKey({
      key: publicKeyDer,
      format: 'der',
      type: 'spki',
    });

    // 验证签名 (ECDSA with SHA-256)
    const verifier = crypto.createVerify('SHA256');
    verifier.update(message);

    return verifier.verify(publicKey, signatureBuffer);
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
    const existingReward = await prisma.ad_reward_transactions.findUnique({
      where: { transaction_id: transactionId },
    });

    if (existingReward) {
      console.log(`⏭️ [AdMob SSV] 交易已处理: ${transactionId}`);
      // 返回成功，避免 AdMob 重试
      return NextResponse.json({ success: true, duplicate: true });
    }

    // 记录交易（先记录，再发放积分，确保幂等性）
    await prisma.ad_reward_transactions.create({
      data: {
        transaction_id: transactionId,
        user_id: userId,
        tier: tier,
        timestamp: timestamp ? new Date(Number(timestamp) * 1000) : new Date(),
        ad_unit: searchParams.get('ad_unit') || null,
        reward_amount: Number(searchParams.get('reward_amount')) || 0,
        processed: false,
      },
    });

    // TODO: 这里可以触发实际的积分发放逻辑
    // 目前积分发放由前端调用 claimAdReward 完成
    // SSV 回调主要用于验证广告确实被观看

    // 标记交易已处理
    await prisma.ad_reward_transactions.update({
      where: { transaction_id: transactionId },
      data: { processed: true },
    });

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
