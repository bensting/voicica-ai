'use client';

import { useState } from 'react';
import { Download, X } from 'lucide-react';

interface FloatingButtonProps {
  icon?: React.ReactNode;
  text?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Floating Button - 固定在屏幕右下角的悬浮按钮
 *
 * 特性：
 * - 悬停时展开显示文字
 * - 平滑动画过渡
 * - 可自定义图标和文字
 */
export default function FloatingButton({
  icon = <Download className="w-5 h-5" />,
  text = 'Shortcut on your desktop.',
  onClick,
  className = ''
}: FloatingButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onClick={onClick}
        className={`
          group flex items-center justify-center gap-3
          bg-gradient-to-r from-purple-600 to-purple-700
          hover:from-purple-500 hover:to-purple-600
          text-white font-medium
          shadow-2xl hover:shadow-purple-500/50
          transition-all duration-300 ease-out
          h-14
          ${isExpanded
            ? 'w-auto px-5'
            : 'w-14'
          }
          ${className}
        `}
      >
        {/* Icon */}
        <span className={`flex-shrink-0 transition-transform ${isExpanded ? '' : 'mx-auto'}`}>
          {icon}
        </span>

        {/* Text - 展开时显示 */}
        <span
          className={`
            whitespace-nowrap overflow-hidden transition-all duration-300 ease-out text-sm
            ${isExpanded ? 'max-w-xs opacity-100 ml-2' : 'max-w-0 opacity-0'}
          `}
        >
          {text}
        </span>
      </button>
    </div>
  );
}

/**
 * FloatingCloseButton - 可关闭的悬浮按钮
 *
 * 带关闭功能的变体
 */
export function FloatingCloseButton({
  icon = <Download className="w-5 h-5" />,
  text = 'Shortcut on your desktop.',
  onClose,
  onMainClick,
  className = ''
}: FloatingButtonProps & { onClose?: () => void; onMainClick?: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`
          relative flex items-center gap-0
          bg-gradient-to-r from-purple-600 to-purple-700
          text-white font-medium rounded-full
          shadow-2xl hover:shadow-purple-500/50
          transition-all duration-300 ease-out
          ${className}
        `}
      >
        {/* Main Button */}
        <button
          onClick={onMainClick}
          className={`
            flex items-center gap-3
            hover:bg-purple-600/50
            transition-all duration-300 ease-out rounded-l-full
            ${isExpanded ? 'pl-5 pr-4 py-4' : 'p-4 rounded-full'}
          `}
        >
          {/* Icon */}
          <span className="flex-shrink-0 transition-transform hover:scale-110">
            {icon}
          </span>

          {/* Text - 展开时显示 */}
          <span
            className={`
              whitespace-nowrap overflow-hidden transition-all duration-300 ease-out
              ${isExpanded ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0'}
            `}
          >
            {text}
          </span>
        </button>

        {/* Close Button - 展开时显示 */}
        {isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
              onClose?.();
            }}
            className="flex-shrink-0 p-4 hover:bg-purple-600/50 rounded-r-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}