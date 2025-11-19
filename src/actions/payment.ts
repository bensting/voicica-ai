'use server';

/**
 * 支付模块 Server Actions
 *
 * 注意：这些 Server Actions 用于客户端发起的支付操作
 * Webhook 处理需要单独的 API 路由
 */
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import type {
  StripeVerifyRequest,
  StripeVerifyResponse,
} from '@/types/subscription';

// 支付特有的类型定义
export interface StripeCheckoutRequest {
  product_id: string;
  currency?: string;
  success_url: string;
  cancel_url: string;
}

export interface CheckoutResponse {
  checkout_url: string;
}

/**
 * 获取后端 API 基础 URL
 */
function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
}

/**
 * 创建 Stripe Checkout 会话
 */
export async function createStripeCheckout(request: StripeCheckoutRequest): Promise<CheckoutResponse> {
  // 验证用户已登录
  await getCurrentUser();

  // 从 cookie 获取 token
  const cookieStore = await cookies();
  const token = cookieStore.get('firebase-token')?.value;

  if (!token) {
    throw new Error('未登录');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/subscriptions/stripe/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stripe checkout failed: ${error}`);
  }

  return response.json();
}

/**
 * 验证 Stripe 支付
 */
export async function verifyStripePayment(request: StripeVerifyRequest): Promise<StripeVerifyResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/subscriptions/stripe/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stripe payment verification failed: ${error}`);
  }

  return response.json();
}
