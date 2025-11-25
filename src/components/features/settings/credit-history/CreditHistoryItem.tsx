'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import type { CreditHistoryItem as CreditHistoryItemType } from '@/types/user';

interface CreditHistoryItemProps {
  item: CreditHistoryItemType;
}

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CreditHistoryItem({ item }: CreditHistoryItemProps) {
  const { t } = useLanguage();
  const isPositive = item.amount > 0;

  // 获取产品类型配置
  const getProductTypeConfig = (productType: string | null) => {
    switch (productType) {
      case 'text_to_speech':
        return {
          label: t('creditHistory.productType.textToSpeech'),
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
        };
      case 'voice_cloning':
        return {
          label: t('creditHistory.productType.voiceCloning'),
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-200',
        };
      default:
        return {
          label: t('creditHistory.productType.other'),
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200',
        };
    }
  };

  const typeConfig = getProductTypeConfig(item.product_type);

  return (
    <div className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all ${
      isPositive ? 'border-green-100 hover:border-green-200' : 'border-red-100 hover:border-red-200'
    }`}>
      <div className="flex items-center gap-4">
        {/* 图标 */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          isPositive
            ? 'bg-gradient-to-br from-green-50 to-green-100'
            : 'bg-gradient-to-br from-red-50 to-red-100'
        }`}>
          {isPositive ? (
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
            </svg>
          )}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-medium truncate">
            {item.description}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-gray-400">
              {formatDate(item.created_at)}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${typeConfig.bgColor} ${typeConfig.textColor} ${typeConfig.borderColor}`}>
              {typeConfig.label}
            </span>
          </div>
        </div>

        {/* 积分数量 */}
        <div className={`text-xl font-bold shrink-0 ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isPositive ? '+' : ''}
          {item.amount.toLocaleString()}
        </div>
      </div>
    </div>
  );
}