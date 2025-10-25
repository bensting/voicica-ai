'use client';

import { useRouter } from 'next/navigation';
import { PricingPlan } from '@/types/subscription';
import { getCurrencySymbol, getCurrencyFromLocale } from '@/config/currency';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProductRoute } from '@/config/productRoutes';

interface FreePlanCardProps {
  plan: PricingPlan;
}

const Feature = ({ children, isNegative = false }: { children: React.ReactNode; isNegative?: boolean }) => (
  <li className="flex items-start gap-2 text-sm">
    <span className={`mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center ${isNegative ? 'text-gray-300' : 'text-purple-600'}`}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {isNegative ? (
          <path d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path d="M5 13l4 4L19 7" />
        )}
      </svg>
    </span>
    <span className={isNegative ? 'text-gray-400' : 'text-gray-700'}>{children}</span>
  </li>
);

export default function FreePlanCard({ plan }: FreePlanCardProps) {
  const { locale } = useLanguage();
  const router = useRouter();

  // 处理 Try it Free 按钮点击
  const handleTryFree = () => {
    // 从 plan 数据中获取 product_type，使用配置文件获取对应路由
    const productType = (plan as any).product_type;
    const route = getProductRoute(productType);
    router.push(route);
  };

  // 格式化价格显示（即使是免费计划也可能有价格信息）
  const formatPrice = () => {
    if (!plan.price && !plan.discounted_price) return null;

    const preferredCurrency = getCurrencyFromLocale(locale);
    const availableCurrencies = Object.keys(plan.discounted_price || plan.price || {});
    let selectedCurrency = preferredCurrency;

    if (!availableCurrencies.includes(selectedCurrency)) {
      selectedCurrency = 'USD';
    }

    if (!availableCurrencies.includes(selectedCurrency) && availableCurrencies.length > 0) {
      selectedCurrency = availableCurrencies[0];
    }

    const originalPrice = plan.price?.[selectedCurrency];
    const discountedPrice = plan.discounted_price?.[selectedCurrency];
    const displayPrice = discountedPrice ?? originalPrice;

    if (displayPrice === undefined) return null;

    return {
      display: displayPrice.toFixed(2),
      currency: selectedCurrency,
    };
  };

  const priceInfo = formatPrice();

  // 获取计划名称
  const getPlanName = () => {
    return plan.display_name?.en || plan.display_name?.['zh-CN'] || 'Free';
  };

  // 获取功能列表
  const getFeatures = () => {
    return plan.features?.en || plan.features?.['zh-CN'] || [];
  };

  return (
    <div className="relative rounded-2xl border-2 border-gray-200 bg-white hover:border-purple-200 transition-colors p-6 flex flex-col">
      {/* Plan Name */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">{getPlanName()}</h3>
      </div>

      {/* Price - Free */}
      <div className="text-center mb-6">
        {/* 主价格行（参考 PaidPlanCard 的布局） */}
        {priceInfo ? (
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="text-3xl font-bold text-gray-900">
              {getCurrencySymbol(priceInfo.currency)}
              {priceInfo.display}
            </div>
          </div>
        ) : (
          <div className="text-3xl font-bold text-gray-900 mb-1">$0</div>
        )}
        {/* Free for everyone 提示（参考 PaidPlanCard 的 Renewal 样式） */}
        <div className="text-sm text-gray-500">Free for everyone</div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleTryFree}
        className="w-full rounded-xl font-semibold py-3 mb-6 transition-colors bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400"
      >
        Try it Free
      </button>

      {/* Features */}
      <ul className="space-y-3 flex-grow">
        {getFeatures().map((feature, idx) => {
          const isNegative = feature.toLowerCase().includes('not supported') ||
                            feature.toLowerCase().includes('no ') ||
                            feature.toLowerCase().includes('limited');
          return <Feature key={idx} isNegative={isNegative}>{feature}</Feature>;
        })}
      </ul>
    </div>
  );
}