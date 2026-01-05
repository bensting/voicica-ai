'use client';

import AdSense from './AdSense';
import { adsenseConfig } from '@/config/ads';

interface AdBannerProps {
  // 变体样式
  variant?: 'inline' | 'section';
  // 自定义类名
  className?: string;
}

/**
 * 广告横幅组件
 *
 * 使用通用广告单元，简化配置
 */
export default function AdBanner({
  variant = 'inline',
  className = '',
}: AdBannerProps) {
  // 根据变体设置样式
  const variantStyles = {
    inline: 'my-4',
    section: 'py-8 px-4 max-w-4xl mx-auto',
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`}>
      <AdSense
        adSlot={adsenseConfig.slots.banner}
        adFormat="auto"
        fullWidthResponsive={true}
        style={{ minHeight: '90px' }}
      />
    </div>
  );
}