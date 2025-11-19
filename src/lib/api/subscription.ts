import { apiClient } from './client';
import type {
  BillingPeriod,
  StripeVerifyRequest,
  StripeVerifyResponse,
  UserSubscriptionListResponse
} from '@/types/subscription';

/**
 * 订阅相关 API
 */

// 获取订阅信息
export const getSubscription = () => {
  return apiClient.get('/api/v1/subscriptions/me');
};

// 创建订阅
export const createSubscription = (data: unknown) => {
  return apiClient.post('/api/v1/subscriptions', data);
};

// 获取订阅计划列表
export const getPlans = (params?: {
  platform?: 'google' | 'apple' | 'stripe';
  product_type?: 'voice_cloning' | 'text_to_speech';
  active_only?: boolean;
}) => {
  return apiClient.get('/api/v1/subscriptions/plans', { params });
};

// 创建 Stripe Checkout 会话
export const createStripeCheckout = (data: {
  product_id: string;
  currency: string;
  success_url: string;
  cancel_url: string;
}) => {
  return apiClient.post<{ checkout_url: string; session_id: string }>(
    '/api/v1/subscriptions/checkout/stripe',
    data
  );
};

// 验证 Stripe 支付 (POST 请求)
export const verifyStripePayment = (data: StripeVerifyRequest) => {
  return apiClient.post<StripeVerifyResponse>('/api/v1/subscriptions/verify/stripe', data);
};

// 获取 Stripe 产品价格
export const getStripePrices = (productId: string) => {
  return apiClient.get<Array<{
    id: string;
    product: string;
    unit_amount: number;
    currency: string;
    active: boolean;
    billing_type: 'recurring' | 'one_time';
    billing_period: BillingPeriod | null;
    metadata?: Record<string, string>;
  }>>(`/api/v1/subscriptions/products/stripe/${productId}/prices`);
};

// 获取用户订阅列表
export const getMySubscriptions = (params?: {
  status?: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
  product_type?: 'text_to_speech' | 'voice_cloning';
  platform?: 'stripe' | 'google_play' | 'apple';
}): Promise<UserSubscriptionListResponse> => {
  return apiClient.get<UserSubscriptionListResponse>('/api/v1/subscriptions/my-subscriptions', { params });
};

// 取消订阅（仅限 Stripe）
export const cancelSubscription = (
  subscriptionId: string,
  data?: { cancellation_reason?: string }
) => {
  return apiClient.post<{
    success: boolean;
    message: string;
    subscription_id: string;
    canceled_at: string;
  }>(`/api/v1/subscriptions/${subscriptionId}/cancel`, data || {});
};