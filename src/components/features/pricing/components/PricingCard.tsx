'use client';

import { PricingPlan } from '@/types/subscription';
import { BillingCycle } from '../hooks/usePricing';
import FreePlanCard from './FreePlanCard';
import PaidPlanCard from './PaidPlanCard';

interface PricingCardProps {
  plan: PricingPlan;
  isRecommended?: boolean;
  cycle: BillingCycle;
}

/**
 * PricingCard - 根据计划类型选择合适的卡片组件
 * - 免费计划使用 FreePlanCard
 * - 付费计划使用 PaidPlanCard
 */
export default function PricingCard({ plan, isRecommended = false, cycle }: PricingCardProps) {
  const isFree = plan.plan_name === 'Free';

  // 根据计划类型返回对应的卡片组件
  if (isFree) {
    return <FreePlanCard plan={plan} />;
  }

  return <PaidPlanCard plan={plan} isRecommended={isRecommended} cycle={cycle} />;
}