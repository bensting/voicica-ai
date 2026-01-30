import { NextRequest, NextResponse } from 'next/server';
import {
  handleGooglePlayRenewal,
  handleGooglePlayCancellation,
  handleGooglePlayReactivation,
} from '@/actions/google-play';

/**
 * Google Play Real-time Developer Notifications (RTDN) Webhook
 *
 * 处理来自 Google Cloud Pub/Sub 的推送消息
 *
 * 配置步骤:
 * 1. 在 Google Play Console 设置 Real-time developer notifications
 * 2. 在 Google Cloud Console 创建 Pub/Sub 主题
 * 3. 创建推送订阅，URL 指向此 endpoint
 * 4. 确保 Pub/Sub 服务账号有权限推送到此 URL
 *
 * 通知类型:
 * - SUBSCRIPTION_RECOVERED (1): 订阅从暂停状态恢复
 * - SUBSCRIPTION_RENEWED (2): 订阅续订成功
 * - SUBSCRIPTION_CANCELED (3): 订阅被取消（自愿或非自愿）
 * - SUBSCRIPTION_PURCHASED (4): 新订阅购买
 * - SUBSCRIPTION_ON_HOLD (5): 订阅进入暂停状态
 * - SUBSCRIPTION_IN_GRACE_PERIOD (6): 订阅进入宽限期
 * - SUBSCRIPTION_RESTARTED (7): 用户重新激活订阅
 * - SUBSCRIPTION_PRICE_CHANGE_CONFIRMED (8): 价格变更确认
 * - SUBSCRIPTION_DEFERRED (9): 续订日期延后
 * - SUBSCRIPTION_PAUSED (10): 订阅暂停
 * - SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED (11): 暂停计划变更
 * - SUBSCRIPTION_REVOKED (12): 订阅被撤销
 * - SUBSCRIPTION_EXPIRED (13): 订阅过期
 */

// 通知类型枚举
const NotificationType = {
  SUBSCRIPTION_RECOVERED: 1,
  SUBSCRIPTION_RENEWED: 2,
  SUBSCRIPTION_CANCELED: 3,
  SUBSCRIPTION_PURCHASED: 4,
  SUBSCRIPTION_ON_HOLD: 5,
  SUBSCRIPTION_IN_GRACE_PERIOD: 6,
  SUBSCRIPTION_RESTARTED: 7,
  SUBSCRIPTION_PRICE_CHANGE_CONFIRMED: 8,
  SUBSCRIPTION_DEFERRED: 9,
  SUBSCRIPTION_PAUSED: 10,
  SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED: 11,
  SUBSCRIPTION_REVOKED: 12,
  SUBSCRIPTION_EXPIRED: 13,
} as const;

interface PubSubMessage {
  message: {
    data: string; // Base64 encoded
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

interface DeveloperNotification {
  version: string;
  packageName: string;
  eventTimeMillis: string;
  subscriptionNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    subscriptionId: string;
  };
  testNotification?: {
    version: string;
  };
}

/**
 * POST /api/webhooks/google-play
 * 接收 Google Cloud Pub/Sub 推送的消息
 */
export async function POST(request: NextRequest) {
  try {
    const body: PubSubMessage = await request.json();

    console.log(`📥 [GooglePlay Webhook] 收到消息: ${body.message?.messageId}`);

    // 解码 Base64 消息
    const messageData = body.message?.data;
    if (!messageData) {
      console.error('❌ 缺少消息数据');
      return NextResponse.json({ error: 'Missing message data' }, { status: 400 });
    }

    const decodedData = Buffer.from(messageData, 'base64').toString('utf-8');
    const notification: DeveloperNotification = JSON.parse(decodedData);

    console.log(`📦 [GooglePlay Webhook] 通知内容:`, JSON.stringify(notification, null, 2));

    // 处理测试通知
    if (notification.testNotification) {
      console.log('✅ [GooglePlay Webhook] 测试通知，返回成功');
      return NextResponse.json({ received: true, test: true });
    }

    // 处理订阅通知
    const subNotification = notification.subscriptionNotification;
    if (!subNotification) {
      console.log('⏭️ [GooglePlay Webhook] 非订阅通知，跳过');
      return NextResponse.json({ received: true });
    }

    const {
      notificationType,
      purchaseToken,
      subscriptionId,
    } = subNotification;

    const eventTime = parseInt(notification.eventTimeMillis, 10);

    console.log(`🔔 [GooglePlay Webhook] 通知类型: ${notificationType}, 产品: ${subscriptionId}`);

    // 根据通知类型处理
    switch (notificationType) {
      case NotificationType.SUBSCRIPTION_PURCHASED:
        // 新购买 - 通常由客户端处理，这里可以作为备份
        console.log('🆕 [GooglePlay Webhook] 新订阅购买');
        // 不在这里处理，由客户端调用 verifyGooglePlayPurchase
        break;

      case NotificationType.SUBSCRIPTION_RENEWED:
        // 自动续费成功 - 需要添加积分
        console.log('🔄 [GooglePlay Webhook] 订阅自动续费');
        await handleGooglePlayRenewal({
          purchaseToken,
          productId: subscriptionId,
          eventTime,
        });
        break;

      case NotificationType.SUBSCRIPTION_RECOVERED:
      case NotificationType.SUBSCRIPTION_RESTARTED:
        // 从暂停恢复 / 取消后重新激活 - 不添加积分（客户端已处理或订阅期没变）
        console.log('🔄 [GooglePlay Webhook] 订阅恢复/重新激活（不添加积分）');
        await handleGooglePlayReactivation({
          purchaseToken,
        });
        break;

      case NotificationType.SUBSCRIPTION_CANCELED:
      case NotificationType.SUBSCRIPTION_REVOKED:
      case NotificationType.SUBSCRIPTION_EXPIRED:
        // 取消/撤销/过期
        console.log('❌ [GooglePlay Webhook] 订阅取消/过期');
        await handleGooglePlayCancellation({
          purchaseToken,
          cancelReason: notificationType,
        });
        break;

      case NotificationType.SUBSCRIPTION_ON_HOLD:
      case NotificationType.SUBSCRIPTION_IN_GRACE_PERIOD:
      case NotificationType.SUBSCRIPTION_PAUSED:
        // 暂停状态 - 可选处理
        console.log('⏸️ [GooglePlay Webhook] 订阅暂停/宽限期');
        break;

      default:
        console.log(`⏭️ [GooglePlay Webhook] 未处理的通知类型: ${notificationType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ [GooglePlay Webhook] 处理错误:', error);
    // 返回 200 以防止 Pub/Sub 重试
    // 如果需要重试，返回 5xx
    return NextResponse.json(
      { error: 'Webhook handler failed', received: true },
      { status: 200 }
    );
  }
}

/**
 * GET /api/webhooks/google-play
 * 用于验证 endpoint 是否可访问
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Google Play RTDN Webhook endpoint',
  });
}
