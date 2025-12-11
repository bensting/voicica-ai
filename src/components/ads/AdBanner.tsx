'use client';

import AdSense from './AdSense';

// 预定义的广告位 Slot ID（需要在 AdSense 控制台创建后替换）
export const AD_SLOTS = {
  // 首页 - TTS Samples 下方
  HOME_AFTER_SAMPLES: process.env.NEXT_PUBLIC_AD_SLOT_HOME_SAMPLES || 'xxxxxxxxxx',
  // 首页 - CTA 下方
  HOME_AFTER_CTA: process.env.NEXT_PUBLIC_AD_SLOT_HOME_CTA || 'xxxxxxxxxx',
  // 通用横幅
  BANNER: process.env.NEXT_PUBLIC_AD_SLOT_BANNER || 'xxxxxxxxxx',
} as const;

interface AdBannerProps {
  // 使用预定义的广告位
  slot: keyof typeof AD_SLOTS | string;
  // 变体样式
  variant?: 'inline' | 'section';
  // 自定义类名
  className?: string;
}

/**
 * 广告横幅组件 - 封装常用广告位
 */
export default function AdBanner({
  slot,
  variant = 'inline',
  className = '',
}: AdBannerProps) {
  // 获取实际的 slot ID
  const adSlot = slot in AD_SLOTS ? AD_SLOTS[slot as keyof typeof AD_SLOTS] : slot;

  // 根据变体设置样式
  const variantStyles = {
    inline: 'my-4',
    section: 'py-8 px-4 max-w-4xl mx-auto',
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`}>
      <AdSense
        adSlot={adSlot}
        adFormat="auto"
        fullWidthResponsive={true}
        style={{ minHeight: '90px' }}
      />
    </div>
  );
}