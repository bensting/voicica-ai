'use client';

import { PricingPlan } from '@/types/subscription';
import { BillingCycle } from '../hooks/usePricing';
import PaidPlanCard from './PaidPlanCard';

interface PricingCardProps {
  plan: PricingPlan;
  isRecommended?: boolean;
  cycle: BillingCycle;
}

/**
 * PricingCard - 定价卡片组件
 */
export default function PricingCard({ plan, isRecommended = false, cycle }: PricingCardProps) {
  return <PaidPlanCard plan={plan} isRecommended={isRecommended} cycle={cycle} />;
}