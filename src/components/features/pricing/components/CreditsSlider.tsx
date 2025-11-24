'use client';

import { useMemo } from 'react';
import { CreditTier } from '@/config/subscription/types';

interface CreditsSliderProps {
  tiers: CreditTier[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

/**
 * 积分档位滑块组件
 *
 * 显示一个带刻度的滑块，允许用户选择不同的积分档位
 */
export default function CreditsSlider({ tiers, selectedIndex, onChange }: CreditsSliderProps) {
  // 计算滑块位置百分比
  const sliderPosition = useMemo(() => {
    if (tiers.length <= 1) return 50;
    return (selectedIndex / (tiers.length - 1)) * 100;
  }, [tiers.length, selectedIndex]);

  // 格式化积分显示
  const formatCredits = (credits: number) => {
    if (credits >= 1000) {
      return `${(credits / 1000).toFixed(credits % 1000 === 0 ? 0 : 1)}k`;
    }
    return credits.toString();
  };

  if (tiers.length === 0) return null;

  return (
    <div className="w-full py-2">
      {/* 滑块轨道 */}
      <div className="relative h-2 bg-gray-200 rounded-full">
        {/* 已选择部分的填充 */}
        <div
          className="absolute h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-200"
          style={{ width: `${sliderPosition}%` }}
        />

        {/* 滑块手柄 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-purple-500 rounded-full shadow-md cursor-pointer transition-all duration-200 hover:scale-110"
          style={{ left: `${sliderPosition}%` }}
        />

        {/* 刻度点 */}
        {tiers.map((_, index) => {
          const position = tiers.length <= 1 ? 50 : (index / (tiers.length - 1)) * 100;
          const isSelected = index <= selectedIndex;
          return (
            <button
              key={index}
              type="button"
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full transition-all duration-200 ${
                isSelected ? 'bg-purple-500' : 'bg-gray-300'
              }`}
              style={{ left: `${position}%` }}
              onClick={() => onChange(index)}
            />
          );
        })}
      </div>

      {/* 积分标签 */}
      <div className="relative mt-3 h-6">
        {tiers.map((tier, index) => {
          const position = tiers.length <= 1 ? 50 : (index / (tiers.length - 1)) * 100;
          const isSelected = index === selectedIndex;
          return (
            <button
              key={index}
              type="button"
              className={`absolute -translate-x-1/2 text-sm font-medium transition-colors ${
                isSelected ? 'text-gray-900' : 'text-gray-500'
              }`}
              style={{ left: `${position}%` }}
              onClick={() => onChange(index)}
            >
              {formatCredits(tier.credits)}
              {isSelected && (
                <span className="block text-xs text-gray-500">Credits</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}