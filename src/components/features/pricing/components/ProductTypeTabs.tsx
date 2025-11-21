'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { getEnabledProductTypeTabs, type ProductType } from '@/config/subscription';

// 重新导出类型供其他组件使用
export type { ProductType };

interface ProductTypeTabsProps {
  activeType: ProductType;
  onChange: (type: ProductType) => void;
}

/**
 * Product type tabs component
 * Allows switching between Text to Voice and Voice Clone subscription types
 *
 * Tab 配置来自 subscription 配置，根据环境自动选择：
 * - 开发环境：显示所有产品类型
 * - 生产环境：只显示已上线的产品类型
 */
export default function ProductTypeTabs({ activeType, onChange }: ProductTypeTabsProps) {
  const { t } = useLanguage();
  const enabledTabs = getEnabledProductTypeTabs();

  // 如果只有一个 Tab，不显示切换器
  if (enabledTabs.length <= 1) {
    return null;
  }

  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex bg-gray-100 rounded-lg p-1">
        {enabledTabs.map(tab => (
          <button
            key={tab.type}
            onClick={() => onChange(tab.type)}
            className={`
              px-6 py-2.5 rounded-md font-medium transition-all duration-200
              ${
                activeType === tab.type
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}