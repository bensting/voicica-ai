'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReferralDetectModalProps {
  isOpen: boolean;
  code: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * 推荐码检测确认弹窗
 * App 启动后检测到剪贴板中的推荐码时弹出
 */
export default function ReferralDetectModal({
  isOpen,
  code,
  onConfirm,
  onDismiss,
}: ReferralDetectModalProps) {
  const { t } = useLanguage();

  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onDismiss}
      />

      {/* 弹窗内容 — 底部弹出 */}
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="mx-3 mb-3 rounded-2xl bg-[#1a1a2e] border border-white/10 p-6">
          {/* 图标 + 标题 */}
          <div className="flex flex-col items-center mb-4">
            <span className="text-4xl mb-2">🎁</span>
            <h3 className="text-lg font-bold text-white">
              {t('native.referral.detect.title')}
            </h3>
          </div>

          {/* 描述 */}
          <p className="text-center text-sm text-gray-300 mb-3">
            {t('native.referral.detect.message')}
          </p>

          {/* 推荐码展示 */}
          <div className="flex justify-center mb-5">
            <span className="rounded-lg bg-purple-500/20 px-4 py-2 font-mono text-lg font-bold tracking-widest text-purple-300">
              {code}
            </span>
          </div>

          {/* 按钮区域 */}
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 active:bg-white/15"
            >
              {t('native.referral.detect.skip')}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:opacity-80"
            >
              {t('native.referral.detect.accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
