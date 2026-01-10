'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** 最大高度，默认 85vh */
  maxHeight?: string;
}

/**
 * Bottom Sheet 组件
 * - 从底部滑出的抽屉
 * - 支持下滑手势关闭
 * - 点击遮罩关闭
 */
export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = '85vh',
}: BottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentTranslateY = useRef(0);

  // 打开/关闭动画
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // 延迟一帧以触发动画
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // 动画时长
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    currentTranslateY.current = 0;
  };

  // 触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null || !sheetRef.current) return;

    const deltaY = e.touches[0].clientY - dragStartY.current;

    // 只允许向下拖动
    if (deltaY > 0) {
      currentTranslateY.current = deltaY;
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  // 触摸结束
  const handleTouchEnd = () => {
    if (!sheetRef.current) return;

    // 如果下拉超过 100px，关闭
    if (currentTranslateY.current > 100) {
      onClose();
    } else {
      // 回弹
      sheetRef.current.style.transform = '';
    }

    dragStartY.current = null;
    currentTranslateY.current = 0;
  };

  if (!isVisible) return null;

  const content = (
    <div
      className={`fixed inset-0 z-[10000] transition-colors duration-300 ${
        isAnimating ? 'bg-black/50' : 'bg-transparent'
      }`}
      onClick={onClose}
    >
      {/* Sheet Container */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{ maxHeight: title ? `calc(${maxHeight} - 80px)` : `calc(${maxHeight} - 40px)` }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
}