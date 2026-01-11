/**
 * Google Play Developer API 客户端
 *
 * 用于验证 Google Play 购买的真实性
 */

import { google } from 'googleapis';

// 缓存 API 客户端
let androidPublisherClient: ReturnType<typeof google.androidpublisher> | null = null;

/**
 * 获取 Android Publisher API 客户端
 */
async function getAndroidPublisherClient() {
  if (androidPublisherClient) {
    return androidPublisherClient;
  }

  // 使用服务账号认证
  // 优先使用 Google Play 专用服务账号，否则使用 Firebase 服务账号
  const clientEmail = process.env.GOOGLE_PLAY_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PLAY_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!clientEmail || !rawPrivateKey) {
    throw new Error('Google Play API credentials not configured');
  }

  // 处理私钥格式：环境变量中可能是 \n 字符串或实际换行符
  let privateKey = rawPrivateKey;

  console.log('[GooglePlayAPI] 初始化客户端...');
  console.log('[GooglePlayAPI] clientEmail:', clientEmail);
  console.log('[GooglePlayAPI] privateKey 长度:', rawPrivateKey.length);
  console.log('[GooglePlayAPI] privateKey 前50字符:', rawPrivateKey.substring(0, 50));
  console.log('[GooglePlayAPI] privateKey 包含 \\n:', rawPrivateKey.includes('\\n'));
  console.log('[GooglePlayAPI] privateKey 包含真实换行:', rawPrivateKey.includes('\n'));

  // 如果包含字面量 \n（不是真正的换行），则替换为真正的换行符
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    console.log('[GooglePlayAPI] 已将 \\n 替换为真实换行');
  }
  // 如果被引号包裹，去掉引号
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1).replace(/\\n/g, '\n');
    console.log('[GooglePlayAPI] 已去掉引号');
  }

  console.log('[GooglePlayAPI] 处理后 privateKey 前100字符:', privateKey.substring(0, 100));
  console.log('[GooglePlayAPI] 处理后 privateKey 是否以 BEGIN 开头:', privateKey.includes('-----BEGIN'));

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  androidPublisherClient = google.androidpublisher({
    version: 'v3',
    auth,
  });

  return androidPublisherClient;
}

/**
 * 订阅验证结果
 */
export interface SubscriptionVerificationResult {
  valid: boolean;
  error?: string;
  /** 订阅状态 */
  subscriptionState?: string;
  /** 过期时间 */
  expiryTime?: string;
  /** 是否自动续订 */
  autoRenewing?: boolean;
  /** 产品 ID */
  productId?: string;
  /** 订单 ID */
  orderId?: string;
}

/**
 * 验证 Google Play 订阅购买
 *
 * @param purchaseToken 购买令牌
 * @returns 验证结果
 */
export async function verifySubscriptionWithGooglePlay(
  purchaseToken: string
): Promise<SubscriptionVerificationResult> {
  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'ai.voicica.app';

  try {
    const client = await getAndroidPublisherClient();

    // 使用 v2 API 验证订阅（不需要 subscriptionId）
    const response = await client.purchases.subscriptionsv2.get({
      packageName,
      token: purchaseToken,
    });

    const subscription = response.data;

    // 检查订阅状态
    // 有效状态: SUBSCRIPTION_STATE_ACTIVE, SUBSCRIPTION_STATE_IN_GRACE_PERIOD
    const validStates = [
      'SUBSCRIPTION_STATE_ACTIVE',
      'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
    ];

    const subscriptionState = subscription.subscriptionState || '';
    const isValid = validStates.includes(subscriptionState);

    if (!isValid) {
      console.log(`[GooglePlayAPI] 订阅状态无效: ${subscriptionState}`);
      return {
        valid: false,
        error: `Invalid subscription state: ${subscriptionState}`,
        subscriptionState,
      };
    }

    // 获取最新的订单信息
    const lineItems = subscription.lineItems || [];
    const latestItem = lineItems[0];

    return {
      valid: true,
      subscriptionState,
      expiryTime: latestItem?.expiryTime || undefined,
      autoRenewing: latestItem?.autoRenewingPlan !== undefined,
      productId: latestItem?.productId || undefined,
      orderId: subscription.latestOrderId || undefined,
    };
  } catch (error: unknown) {
    // 详细记录错误信息
    console.error('[GooglePlayAPI] 验证出错，完整错误:', JSON.stringify(error, null, 2));
    console.error('[GooglePlayAPI] 错误类型:', typeof error);
    if (error instanceof Error) {
      console.error('[GooglePlayAPI] Error message:', error.message);
      console.error('[GooglePlayAPI] Error stack:', error.stack);
    }

    // Google API 错误处理
    if (error && typeof error === 'object' && 'code' in error) {
      const apiError = error as { code: number; message?: string; errors?: unknown[] };
      console.error('[GooglePlayAPI] API 错误码:', apiError.code);
      console.error('[GooglePlayAPI] API 错误信息:', apiError.message);
      console.error('[GooglePlayAPI] API 错误详情:', JSON.stringify(apiError.errors, null, 2));

      if (apiError.code === 400) {
        console.error('[GooglePlayAPI] 无效的 purchaseToken');
        return {
          valid: false,
          error: 'Invalid purchase token',
        };
      }

      if (apiError.code === 404) {
        console.error('[GooglePlayAPI] 找不到订阅');
        return {
          valid: false,
          error: 'Subscription not found',
        };
      }

      if (apiError.code === 401 || apiError.code === 403) {
        console.error('[GooglePlayAPI] 认证失败，请检查服务账号配置');
        return {
          valid: false,
          error: 'API authentication failed',
        };
      }
    }

    console.error('[GooglePlayAPI] 验证失败:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * 确认订阅（可选，用于确认已处理）
 */
export async function acknowledgeSubscription(
  purchaseToken: string,
  subscriptionId: string
): Promise<boolean> {
  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'ai.voicica.app';

  try {
    const client = await getAndroidPublisherClient();

    await client.purchases.subscriptions.acknowledge({
      packageName,
      subscriptionId,
      token: purchaseToken,
    });

    console.log('[GooglePlayAPI] 订阅已确认');
    return true;
  } catch (error) {
    console.error('[GooglePlayAPI] 确认订阅失败:', error);
    return false;
  }
}
