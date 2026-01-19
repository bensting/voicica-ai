'use client';

import { ReactNode } from 'react';

interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
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
}: GradientButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2.5 rounded-lg font-medium text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${className}`}
      style={{
        background: 'linear-gradient(90deg, #8B5CF6 0%, #A855F7 25%, #D946EF 50%, #EC4899 75%, #F97316 100%)',
      }}
    >
      {children}
    </button>
  );
}