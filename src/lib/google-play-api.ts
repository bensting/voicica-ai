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
  const privateKey = process.env.GOOGLE_PLAY_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error('Google Play API credentials not configured');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
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
    // Google API 错误处理
    if (error && typeof error === 'object' && 'code' in error) {
      const apiError = error as { code: number; message?: string };

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
