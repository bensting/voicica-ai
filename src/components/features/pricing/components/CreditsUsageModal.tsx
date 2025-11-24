'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import CategoryTabs from '@/components/common/CategoryTabs';
import { ProductCategoryType, getDefaultCategory } from '@/config/productCategory';
import { getCreditsUsageByCategory } from '@/config/creditsUsage';

interface CreditsUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 积分使用规则弹窗
 *
 * 从配置文件读取多语言数据，根据选中的分类显示对应的积分规则
 */
export default function CreditsUsageModal({ isOpen, onClose }: CreditsUsageModalProps) {
  const { t, locale } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<ProductCategoryType>(getDefaultCategory());

  if (!isOpen) return null;

  // 获取当前分类的积分规则数据
  const categoryData = getCreditsUsageByCategory(locale, activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl lg:max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-900 to-purple-800 p-6 text-white">
          <div className="flex items-center gap-4">
            {/* 装饰图标 */}
            <div className="w-12 h-12 bg-purple-700/50 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {t('pricing.creditsUsageGuide.title')}
              </h2>
              <p className="text-sm text-purple-200 mt-1">
                {t('pricing.creditsUsageGuide.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* 产品分类标签 */}
          <CategoryTabs
            value={activeCategory}
            onChange={setActiveCategory}
            className="mb-6"
          />

          {/* 积分规则表格 */}
          <div className="space-y-4">
            {/* 表头 */}
            <div className="flex justify-between text-sm text-gray-500 px-4">
              <span>{t('pricing.creditsUsageGuide.feature')}</span>
              <span>{t('pricing.creditsUsageGuide.creditsRequired')}</span>
            </div>

            {/* 规则列表 - 从配置读取 */}
            {categoryData && (
              <div className="bg-gray-50 rounded-xl overflow-hidden">
                {/* 分类标题 */}
                <div className="p-4 font-medium text-gray-900 bg-gray-100">
                  {categoryData.name}
                </div>
                {/* 功能列表 */}
                <div className="divide-y divide-gray-200">
                  {categoryData.features.map((feature, index) => (
                    <div key={index} className="p-4">
                      <div className="flex justify-between items-start">
                        <span className="text-gray-700">{feature.name}</span>
                        <span className="text-gray-900 font-medium shrink-0 ml-4">
                          {feature.cost}
                        </span>
                      </div>
                      {feature.description && (
                        <p className="text-sm text-gray-500 mt-2">
                          {feature.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 无数据提示 */}
            {!categoryData && (
              <div className="text-center py-8 text-gray-500">
                {t('common.loading')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}