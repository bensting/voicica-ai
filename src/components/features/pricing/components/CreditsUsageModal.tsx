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
        {/* 头部 - 优化样式 */}
        <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 px-6 py-8 text-white overflow-hidden">
          {/* 装饰性背景元素 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-900/30 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex items-center gap-5">
            {/* 装饰图标 - 优化样式 */}
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0 border border-white/20 shadow-lg">
              <svg className="w-7 h-7 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {t('pricing.creditsUsageGuide.title')}
              </h2>
              <p className="text-sm text-purple-100 mt-1.5 opacity-90">
                {t('pricing.creditsUsageGuide.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* 关闭按钮 - 优化样式 */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 z-10"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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