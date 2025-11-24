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

  if (tiers.length === 0) return null;

  return (
    <div className="w-full py-2">
      {/* 滑块轨道 */}
      <div className="relative h-2.5 bg-gray-200 rounded-full">
        {/* 已选择部分的渐变填充 */}
        <div
          className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-200"
          style={{ width: `${sliderPosition}%` }}
        />

        {/* 刻度点 */}
        {tiers.map((_, index) => {
          const position = tiers.length <= 1 ? 50 : (index / (tiers.length - 1)) * 100;
          const isBeforeOrSelected = index <= selectedIndex;
          const isSelected = index === selectedIndex;
          return (
            <button
              key={index}
              type="button"
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-all duration-200 ${
                isSelected
                  ? 'w-4 h-4 bg-white border-2 border-purple-500 shadow-md'
                  : isBeforeOrSelected
                    ? 'w-2.5 h-2.5 bg-pink-500'
                    : 'w-2.5 h-2.5 bg-gray-300'
              }`}
              style={{ left: `${position}%` }}
              onClick={() => onChange(index)}
            />
          );
        })}
      </div>

      {/* 积分标签 */}
      <div className="relative mt-4 flex justify-between">
        {tiers.map((tier, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={index}
              type="button"
              className={`text-sm transition-colors ${
                isSelected ? 'text-gray-900 font-medium' : 'text-gray-400'
              }`}
              onClick={() => onChange(index)}
            >
              {tier.credits.toLocaleString()}
              {isSelected && <span className="ml-1">Credits</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}