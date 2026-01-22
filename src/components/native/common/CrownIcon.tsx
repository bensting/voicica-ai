'use client';

interface CrownIconProps {
  className?: string;
}

/**
 * 皇冠图标
 * 用于显示会员/VIP 状态或订阅相关功能
 */
export default function CrownIcon({ className = 'w-5 h-5' }: CrownIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}
