import { ButtonHTMLAttributes, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮文本 */
  children: ReactNode;
  /** 左侧图标（Lucide React 图标） */
  icon?: LucideIcon;
  /** 图标位置 */
  iconPosition?: 'left' | 'right';
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 渐变色方案 */
  variant?: 'purple-pink' | 'blue-purple' | 'green-blue';
  /** 是否全宽 */
  fullWidth?: boolean;
}

/**
 * 渐变按钮组件
 *
 * 特点：
 * - 紫色到粉色的渐变背景
 * - 支持可选的 Lucide 图标
 * - 悬停时缩放和阴影效果
 * - 多种尺寸和颜色方案
 * - 支持所有标准按钮属性
 *
 * @example
 * ```tsx
 * import { Video } from 'lucide-react';
 * import GradientButton from '@/components/ui/GradientButton';
 *
 * <GradientButton icon={Video} iconPosition="right">
 *   Image to Video
 * </GradientButton>
 * ```
 */
export default function GradientButton({
  children,
  icon: Icon,
  iconPosition = 'right',
  size = 'md',
  variant = 'purple-pink',
  fullWidth = false,
  className = '',
  ...props
}: GradientButtonProps) {
  // 尺寸样式映射
  const sizeStyles = {
    sm: 'px-6 py-2 text-sm',
    md: 'px-8 py-3 text-base',
    lg: 'px-10 py-4 text-lg',
  };

  // 渐变色方案映射
  const variantStyles = {
    'purple-pink': 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    'blue-purple': 'from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
    'green-blue': 'from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600',
  };

  // 图标尺寸映射
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const baseStyles =
    'bg-gradient-to-r text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyles} ${className} flex items-center justify-center gap-2`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon size={iconSizes[size]} />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={iconSizes[size]} />}
    </button>
  );
}