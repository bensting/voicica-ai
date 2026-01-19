'use client';

interface CreditsIconProps {
  className?: string;
}

/**
 * 积分图标（四角星）
 * 用于显示积分数量
 */
export default function CreditsIcon({ className = 'w-4 h-4' }: CreditsIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L14.5 9.5L23 12L14.5 14.5L12 23L9.5 14.5L1 12L9.5 9.5L12 1Z" />
    </svg>
  );
}