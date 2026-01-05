'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppDownloadButtons } from '@/components/features/app-download';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * App 下载引导弹窗
 * 在 Web 端点击"观看广告"时显示，引导用户下载 App
 */
export default function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  // 客户端挂载检测
  useEffect(() => {
    setMounted(true);
  }, []);

  // 按 ESC 键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[10000]"
      onClick={onClose}
    >
      {/* 弹窗内容 */}
      <div
        className="relative w-full max-w-[380px] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 顶部标题 */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 pt-8 pb-5 px-5 text-center text-white">
          <div className="w-12 h-12 mx-auto mb-2 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">
            {t('appDownload.title') || '下载 Voicica App'}
          </h2>
          <p className="text-white/80 text-xs mt-0.5">
            {t('appDownload.subtitle') || '观看视频赚积分，仅限 App 用户'}
          </p>
        </div>

        {/* 下载按钮组 */}
        <div className="px-4 py-4">
          <AppDownloadButtons variant="modal" showSectionHeaders={true} />
        </div>

        {/* 底部提示 */}
        <div className="px-4 pb-4 text-center">
          <p className="text-xs text-gray-400">
            {t('appDownload.tip') || '下载 App 观看视频即可获得积分奖励'}
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}