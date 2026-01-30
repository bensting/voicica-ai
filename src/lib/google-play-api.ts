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
 * 一次性购买（INAPP）验证结果
 */
export interface ProductVerificationResult {
  valid: boolean;
  error?: string;
  /** 购买状态: 0=已购买, 1=已取消, 2=待处理 */
  purchaseState?: number;
  /** 消费状态: 0=未消费, 1=已消费 */
  consumptionState?: number;
  /** 订单 ID */
  orderId?: string;
  /** 购买时间（毫秒） */
  purchaseTimeMillis?: string;
  /** 是否已确认 */
  acknowledged?: boolean;
}

/**
 * 验证 Google Play 一次性购买（INAPP 产品）
 *
 * @param productId 产品 ID（如 credit_pack_6000）
 * @param purchaseToken 购买令牌
 * @returns 验证结果
 */
export async function verifyProductWithGooglePlay(
  productId: string,
  purchaseToken: string
): Promise<ProductVerificationResult> {
  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'ai.voicica.app';

  console.log(`[GooglePlayAPI] 验证一次性购买: packageName=${packageName}, productId=${productId}, token=${purchaseToken.substring(0, 30)}...`);

  try {
    const client = await getAndroidPublisherClient();

    // 使用 purchases.products.get API 验证一次性购买
    const response = await client.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    });

    const purchase = response.data;

    // 检查购买状态
    // purchaseState: 0 = 已购买, 1 = 已取消, 2 = 待处理
    const purchaseState = purchase.purchaseState;
    if (purchaseState !== 0) {
      console.log(`[GooglePlayAPI] 一次性购买状态无效: ${purchaseState}`);
      return {
        valid: false,
        error: `Invalid purchase state: ${purchaseState}`,
        purchaseState: purchaseState ?? undefined,
      };
    }

    console.log(`[GooglePlayAPI] 一次性购买验证通过:`, {
      orderId: purchase.orderId,
      purchaseState: purchase.purchaseState,
      consumptionState: purchase.consumptionState,
      acknowledged: purchase.acknowledgementState === 1,
    });

    return {
      valid: true,
      purchaseState: purchase.purchaseState ?? undefined,
      consumptionState: purchase.consumptionState ?? undefined,
      orderId: purchase.orderId ?? undefined,
      purchaseTimeMillis: purchase.purchaseTimeMillis ?? undefined,
      acknowledged: purchase.acknowledgementState === 1,
    };
  } catch (error: unknown) {
    console.error('[GooglePlayAPI] 一次性购买验证出错');
    console.error('[GooglePlayAPI] packageName:', packageName);
    console.error('[GooglePlayAPI] productId:', productId);
    console.error('[GooglePlayAPI] token:', purchaseToken.substring(0, 50));

    // 尝试提取更详细的错误信息
    let errorMessage = 'Verification failed';
    let errorCode: number | undefined;

    if (error && typeof error === 'object') {
      // googleapis 错误格式
      if ('response' in error) {
        const gError = error as { response?: { status?: number; data?: { error?: { message?: string } } } };
        errorCode = gError.response?.status;
        errorMessage = gError.response?.data?.error?.message || errorMessage;
        console.error('[GooglePlayAPI] HTTP Status:', errorCode);
        console.error('[GooglePlayAPI] Error message:', errorMessage);
      } else if ('code' in error) {
        const apiError = error as { code: number; message?: string };
        errorCode = apiError.code;
        errorMessage = apiError.message || errorMessage;
        console.error('[GooglePlayAPI] API 错误码:', errorCode);
        console.error('[GooglePlayAPI] API 错误信息:', errorMessage);
      }
    }

    if (error instanceof Error) {
      console.error('[GooglePlayAPI] Error:', error.message);
      if (!errorMessage || errorMessage === 'Verification failed') {
        errorMessage = error.message;
      }
    }

    // 根据错误码返回更友好的错误信息
    if (errorCode === 400) {
      return { valid: false, error: `Invalid request: ${errorMessage}` };
    }
    if (errorCode === 404) {
      return { valid: false, error: `Purchase not found: ${errorMessage}` };
    }
    if (errorCode === 401 || errorCode === 403) {
      return { valid: false, error: `API authentication failed: ${errorMessage}` };
    }

    return { valid: false, error: errorMessage };
  }
}

/**
 * 确认一次性购买（INAPP 产品）
 *
 * @param productId 产品 ID
 * @param purchaseToken 购买令牌
 */
export async function acknowledgeProduct(
  productId: string,
  purchaseToken: string
): Promise<boolean> {
  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'ai.voicica.app';

  try {
    const client = await getAndroidPublisherClient();

    await client.purchases.products.acknowledge({
      packageName,
      productId,
      token: purchaseToken,
    });

    console.log('[GooglePlayAPI] 一次性购买已确认');
    return true;
  } catch (error) {
    console.error('[GooglePlayAPI] 确认一次性购买失败:', error);
    return false;
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
