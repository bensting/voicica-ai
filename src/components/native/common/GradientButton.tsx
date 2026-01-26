'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  /** 图标（Lucide React 图标） */
  icon?: LucideIcon;
  /** 图标位置 */
  iconPosition?: 'left' | 'right';
  /** 图标大小 */
  iconSize?: number;
}

/**
 * 通用渐变按钮组件
 * 使用多色渐变背景，适用于底部主操作按钮
 */
export default function GradientButton({
  children,
  onClick,
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  iconSize = 16,
}: GradientButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2 rounded-lg font-medium text-white text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${className}`}
      style={{
        background: 'linear-gradient(90deg, #8B5CF6 0%, #A855F7 25%, #D946EF 50%, #EC4899 75%, #F97316 100%)',
      }}
    >
      {Icon && iconPosition === 'left' && <Icon size={iconSize} />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={iconSize} />}
    </button>
  );
}