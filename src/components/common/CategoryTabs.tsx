'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import {
  getEnabledCategories,
  getDefaultCategory,
  ProductCategoryType,
} from '@/config/productCategory';
import { useState, useEffect } from 'react';

interface CategoryTabsProps {
  /** 当前选中的分类 */
  value?: ProductCategoryType;
  /** 分类变化回调 */
  onChange?: (category: ProductCategoryType) => void;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 产品分类 Tab 切换组件
 *
 * 从配置读取启用的分类，支持环境差异化
 */
export default function CategoryTabs({
  value,
  onChange,
  className = '',
}: CategoryTabsProps) {
  const { t } = useLanguage();
  const enabledCategories = getEnabledCategories();
  const defaultCategory = getDefaultCategory();

  const [activeCategory, setActiveCategory] = useState<ProductCategoryType>(
    value ?? defaultCategory
  );

  // 同步外部 value 变化
  useEffect(() => {
    if (value !== undefined) {
      setActiveCategory(value);
    }
  }, [value]);

  const handleCategoryChange = (category: ProductCategoryType) => {
    setActiveCategory(category);
    onChange?.(category);
  };

  // 如果只有一个分类，不显示 Tabs
  if (enabledCategories.length <= 1) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {enabledCategories.map((category) => {
        const isActive = activeCategory === category.id;
        return (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t(category.labelKey)}
          </button>
        );
      })}
    </div>
  );
}