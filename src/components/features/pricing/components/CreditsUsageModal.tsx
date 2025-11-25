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
            {/* 表头 - 优化样式 */}
            <div className="flex justify-between text-sm font-semibold text-gray-600 px-5 pb-2 border-b-2 border-gray-200">
              <span>{t('pricing.creditsUsageGuide.feature')}</span>
              <span>{t('pricing.creditsUsageGuide.creditsRequired')}</span>
            </div>

            {/* 规则列表 - 从配置读取 */}
            {categoryData && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {/* 分类标题 - 增强样式 */}
                <div className="px-5 py-3 font-semibold text-gray-900 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  {categoryData.name}
                </div>
                {/* 功能列表 - 添加悬停效果 */}
                <div className="divide-y divide-gray-100">
                  {categoryData.features.map((feature, index) => (
                    <div key={index} className="px-5 py-4 hover:bg-purple-50/30 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-gray-800 font-medium flex-1">{feature.name}</span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700 shrink-0">
                          {feature.cost}
                        </span>
                      </div>
                      {feature.description && (
                        <p className="text-sm text-gray-500 mt-2.5 leading-relaxed">
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