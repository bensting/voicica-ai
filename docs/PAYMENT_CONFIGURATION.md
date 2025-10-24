# 支付配置指南

本文档说明如何配置应用的支付平台（Creem 或 Stripe）。

## 环境变量配置

在 `.env.local` 文件中设置以下环境变量：

### 支付平台选择

```bash
# 支付平台选择: 'creem' 或 'stripe'
NEXT_PUBLIC_PAYMENT_PROVIDER=creem
```

**可选值：**
- `creem` - 使用 Creem 支付平台（默认）
- `stripe` - 使用 Stripe 支付平台

### 回调 URL 配置

```bash
# 支付成功后的回调 URL
NEXT_PUBLIC_PAYMENT_SUCCESS_URL=http://localhost:3000/payment/success

# 支付取消后的回调 URL（可选，仅 Stripe 需要）
NEXT_PUBLIC_PAYMENT_CANCEL_URL=http://localhost:3000/pricing
```

## 使用 Creem

1. 设置环境变量：
```bash
NEXT_PUBLIC_PAYMENT_PROVIDER=creem
NEXT_PUBLIC_PAYMENT_SUCCESS_URL=https://your-domain.com/payment/success
```

2. 应用会自动：
   - 从后端 API `/api/v1/subscriptions/plans?platform=creem` 获取 Creem 计划
   - 调用 `/api/v1/subscriptions/checkout/creem` 创建支付会话
   - 跳转到 Creem 支付页面

## 使用 Stripe

1. 设置环境变量：
```bash
NEXT_PUBLIC_PAYMENT_PROVIDER=stripe
NEXT_PUBLIC_PAYMENT_SUCCESS_URL=https://your-domain.com/payment/success
NEXT_PUBLIC_PAYMENT_CANCEL_URL=https://your-domain.com/pricing
```

2. 应用会自动：
   - 从后端 API `/api/v1/subscriptions/plans?platform=stripe` 获取 Stripe 计划
   - 调用 `/api/v1/subscriptions/checkout/stripe` 创建支付会话
   - 跳转到 Stripe Checkout 页面

## 后端 API 要求

### 获取订阅计划
```
GET /api/v1/subscriptions/plans?platform={creem|stripe}&active_only=true
```

### Creem Checkout
```
POST /api/v1/subscriptions/checkout/creem
{
  "product_id": "string",
  "success_url": "string"
}

Response:
{
  "checkout_url": "string",
  "checkout_id": "string"
}
```

### Stripe Checkout
```
POST /api/v1/subscriptions/checkout/stripe
{
  "product_id": "string",
  "success_url": "string",
  "cancel_url": "string"
}

Response:
{
  "checkout_url": "string",
  "session_id": "string"
}
```

## 代码实现

支付平台配置影响以下组件：

1. **usePricing Hook** (`src/components/features/pricing/hooks/usePricing.ts`)
   - 根据 `NEXT_PUBLIC_PAYMENT_PROVIDER` 获取对应平台的计划

2. **PricingCard Component** (`src/components/features/pricing/components/PricingCard.tsx`)
   - 根据配置调用不同的支付 API
   - Creem: `subscriptionAPI.createCreemCheckout()`
   - Stripe: `subscriptionAPI.createStripeCheckout()`

3. **Subscription API** (`src/lib/api/subscription.ts`)
   - `createCreemCheckout()` - Creem 支付
   - `createStripeCheckout()` - Stripe 支付

## 切换支付平台

要切换支付平台，只需：

1. 更新 `.env.local` 中的 `NEXT_PUBLIC_PAYMENT_PROVIDER`
2. 重启开发服务器
3. 应用会自动使用新的支付平台

无需修改任何代码！