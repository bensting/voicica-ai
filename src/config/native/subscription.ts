/**
 * Native App Subscription Configuration
 *
 * Native app specific subscription plans and credit packs
 * Independent from web/studio configuration
 */

// Billing period type
export type BillingPeriod = 'week' | 'month' | 'year';

// Subscription plan type
export interface SubscriptionPlanConfig {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  billingPeriod: BillingPeriod;
  // Platform-specific product IDs
  stripeProductId?: string;
  googlePlayProductId?: string;
  appleProductId?: string;
  // UI options
  isPopular?: boolean;
  features?: string[];
}

// Credit pack type
export interface CreditPackConfig {
  id: string;
  credits: number;
  price: number;
  currency: string;
  // Platform-specific product IDs
  stripeProductId?: string;
  googlePlayProductId?: string;
  appleProductId?: string;
}

// Membership benefit type
export interface MembershipBenefit {
  text: string;
  icon?: 'check' | 'star' | 'bolt';
}

/**
 * Subscription Plans Configuration
 * Recurring subscription plans
 */
export const subscriptionPlans: SubscriptionPlanConfig[] = [
  {
    id: 'starter_monthly',
    name: 'Starter Plan',
    credits: 100000,
    price: 4.99,
    currency: 'USD',
    billingPeriod: 'month',
    stripeProductId: 'prod_starter_100k',
    googlePlayProductId: 'starter_monthly',
    features: ['100,000 credits per month'],
  },
  {
    id: 'creator_monthly',
    name: 'Creator Plan',
    credits: 300000,
    price: 9.99,
    currency: 'USD',
    billingPeriod: 'month',
    stripeProductId: 'prod_creator_300k',
    googlePlayProductId: 'creator_monthly',
    features: ['300,000 credits per month'],
  },
  {
    id: 'pro_monthly',
    name: 'Pro Plan',
    credits: 500000,
    price: 14.99,
    currency: 'USD',
    billingPeriod: 'month',
    stripeProductId: 'prod_pro_500k',
    googlePlayProductId: 'pro_monthly',
    isPopular: true,
    features: ['500,000 credits per month'],
  },
];

/**
 * Credit Packs Configuration
 * One-time purchase credit packs
 */
export const creditPacks: CreditPackConfig[] = [
  {
    id: 'pack_2000',
    credits: 2000,
    price: 9.99,
    currency: 'USD',
    stripeProductId: 'prod_credit_2000',
    googlePlayProductId: 'credit_pack_2000',
  },
  {
    id: 'pack_4000',
    credits: 4000,
    price: 15.99,
    currency: 'USD',
    stripeProductId: 'prod_credit_4000',
    googlePlayProductId: 'credit_pack_4000',
  },
  {
    id: 'pack_6000',
    credits: 6000,
    price: 24.99,
    currency: 'USD',
    stripeProductId: 'prod_credit_6000',
    googlePlayProductId: 'credit_pack_6000',
  },
];

/**
 * Membership Benefits
 * Benefits displayed in the subscription tab
 */
export const membershipBenefits: MembershipBenefit[] = [
  { text: '1000 credits refresh weekly', icon: 'check' },
  { text: '20% Bonus on Credit Packs', icon: 'check' },
  { text: 'Fast Generation Channel', icon: 'check' },
  { text: 'Simultaneous Generations', icon: 'check' },
  { text: 'Higher Quality', icon: 'check' },
  { text: 'Watermark-free Downloads', icon: 'check' },
];

/**
 * Helper: Get subscription plan by ID
 */
export function getSubscriptionPlanById(id: string): SubscriptionPlanConfig | undefined {
  return subscriptionPlans.find(plan => plan.id === id);
}

/**
 * Helper: Get subscription plan by Stripe product ID
 */
export function getSubscriptionPlanByStripeProductId(productId: string): SubscriptionPlanConfig | undefined {
  return subscriptionPlans.find(plan => plan.stripeProductId === productId);
}

/**
 * Helper: Get credit pack by ID
 */
export function getCreditPackById(id: string): CreditPackConfig | undefined {
  return creditPacks.find(pack => pack.id === id);
}

/**
 * Helper: Get credit pack by Stripe product ID
 */
export function getCreditPackByStripeProductId(productId: string): CreditPackConfig | undefined {
  return creditPacks.find(pack => pack.stripeProductId === productId);
}

/**
 * Helper: Get credit pack by Google Play product ID
 */
export function getCreditPackByGooglePlayProductId(productId: string): CreditPackConfig | undefined {
  return creditPacks.find(pack => pack.googlePlayProductId === productId);
}

/**
 * Helper: Get subscription plan by Google Play product ID
 */
export function getSubscriptionPlanByGooglePlayProductId(productId: string): SubscriptionPlanConfig | undefined {
  return subscriptionPlans.find(plan => plan.googlePlayProductId === productId);
}

/**
 * Helper: Get billing period text
 */
export function getBillingPeriodText(period: BillingPeriod): string {
  switch (period) {
    case 'week':
      return 'Week';
    case 'year':
      return 'Year';
    default:
      return 'Month';
  }
}

/**
 * Helper: Format credits number
 */
export function formatCredits(credits: number): string {
  if (credits >= 1000000) {
    return (credits / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (credits >= 1000) {
    return (credits / 1000).toFixed(0) + 'K';
  }
  return credits.toString();
}
