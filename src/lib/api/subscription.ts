import { apiClient } from './client';
import type { CreemVerifyRequest, CreemVerifyResponse } from '@/types/subscription';

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
  platform?: 'google' | 'apple' | 'stripe' | 'creem';
  active_only?: boolean;
}) => {
  return apiClient.get('/api/v1/subscriptions/plans', { params });
};

// 创建 Creem Checkout 会话
export const createCreemCheckout = (data: {
  product_id: string;
  success_url: string;
}) => {
  return apiClient.post<{ checkout_url: string; checkout_id: string }>(
    '/api/v1/subscriptions/checkout/creem',
    data
  );
};

// 验证 Creem 支付 (POST 请求，包含签名验证)
export const verifyCreemPayment = (data: CreemVerifyRequest) => {
  return apiClient.post<CreemVerifyResponse>('/api/v1/subscriptions/verify/creem', data);
};

// 创建 Stripe Checkout 会话
export const createStripeCheckout = (data: {
  product_id: string;
  success_url: string;
  cancel_url?: string;
}) => {
  return apiClient.post<{ checkout_url: string; session_id: string }>(
    '/api/v1/subscriptions/checkout/stripe',
    data
  );
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
    billing_period: string | null;
    metadata?: Record<string, string>;
  }>>(`/api/v1/subscriptions/products/stripe/${productId}/prices`);
};