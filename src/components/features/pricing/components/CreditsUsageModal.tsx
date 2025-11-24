'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import CategoryTabs from '@/components/common/CategoryTabs';
import { ProductCategoryType, getDefaultCategory } from '@/config/productCategory';

interface CreditsUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 积分使用规则弹窗
 *
 * TODO: 完善积分使用规则内容
 */
export default function CreditsUsageModal({ isOpen, onClose }: CreditsUsageModalProps) {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<ProductCategoryType>(getDefaultCategory());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-900 to-purple-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-purple-300">
                {t('pricing.creditsUsageGuide.title')}
              </h2>
              <p className="text-sm text-purple-200 mt-1">
                {t('pricing.creditsUsageGuide.subtitle')}
              </p>
            </div>
            {/* 装饰图标 */}
            <div className="w-16 h-16 bg-purple-700/50 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
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

            {/* 规则列表 - TODO: 从配置读取 */}
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <div className="p-4 font-medium text-gray-900 bg-gray-100">
                Text to Speech
              </div>
              <div className="divide-y divide-gray-200">
                <div className="flex justify-between p-4">
                  <span className="text-gray-700">{t('pricing.creditsUsageGuide.standardVoice')}</span>
                  <span className="text-gray-900 font-medium">1/100 chars</span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-gray-700">{t('pricing.creditsUsageGuide.premiumVoice')}</span>
                  <span className="text-gray-900 font-medium">2/100 chars</span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-gray-700">{t('pricing.creditsUsageGuide.clonedVoice')}</span>
                  <span className="text-gray-900 font-medium">3/100 chars</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}