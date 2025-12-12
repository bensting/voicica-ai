'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Smartphone, Download } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLatestRelease } from '@/actions/admin/app-releases';

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
  const [apkDownloadUrl, setApkDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 客户端挂载检测
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取最新版本下载链接
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getLatestRelease('android')
        .then((release) => {
          if (release) {
            setApkDownloadUrl(release.download_url);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

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

  // 处理 APK 下载
  const handleApkDownload = () => {
    if (apkDownloadUrl) {
      window.open(apkDownloadUrl, '_blank');
    }
  };

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

        {/* 顶部标题 - 紧凑版 */}
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

        {/* 下载选项 - 紧凑版 */}
        <div className="px-4 py-4 space-y-4">
          {/* Android 区域 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded bg-[#3DDC84] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor">
                  <path d="M17.523 15.341c-.5 0-.908.406-.908.905s.408.906.908.906c.5 0 .906-.407.906-.906s-.406-.905-.906-.905zm-11.046 0c-.5 0-.908.406-.908.905s.408.906.908.906c.5 0 .908-.407.908-.906s-.408-.905-.908-.905zm11.4-6.029l1.96-3.395a.407.407 0 00-.704-.407l-1.984 3.438c-1.47-.67-3.12-1.043-4.896-1.043s-3.426.373-4.896 1.043L5.373 5.51a.407.407 0 00-.704.407l1.96 3.395C3.571 11.018 1.6 14.018 1.6 17.497h20.8c0-3.479-1.971-6.479-5.023-8.185z"/>
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-sm">Android</span>
            </div>

            <div className="space-y-2">
              {/* 官网 APK 下载 - 可用 */}
              <button
                onClick={handleApkDownload}
                disabled={loading || !apkDownloadUrl}
                className="w-full flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm">
                    {t('appDownload.officialApk') || '官网直接下载'}
                  </div>
                  <div className="text-xs text-white/70">
                    {loading ? (t('appDownload.loading') || '加载中...') : 'APK'}
                  </div>
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* APKPure - 已上线 */}
              <button
                onClick={() => window.open('https://apkpure.com/p/ai.voicica.app', '_blank')}
                className="w-full flex items-center gap-2.5 p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors border border-gray-200"
              >
                <div className="w-9 h-9 rounded-lg bg-[#C5E21A]/20 flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/images/stores/apkpure.svg"
                    alt="APKPure"
                    width={20}
                    height={20}
                  />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm">APKPure</div>
                  <div className="text-xs text-gray-500">APK</div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Google Play - Coming Soon */}
              <button
                disabled
                className="w-full flex items-center gap-2.5 p-2.5 bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/images/stores/google-play.svg"
                    alt="Google Play"
                    width={20}
                    height={20}
                    className="opacity-40"
                  />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm">Google Play</div>
                  <div className="text-xs">{t('appDownload.comingSoon') || 'Coming Soon'}</div>
                </div>
              </button>
            </div>
          </div>

          {/* iOS 区域 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded bg-gray-800 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-sm">iOS</span>
            </div>

            <div className="space-y-2">
              {/* App Store - Coming Soon */}
              <button
                disabled
                className="w-full flex items-center gap-2.5 p-2.5 bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/images/stores/app-store.svg"
                    alt="App Store"
                    width={20}
                    height={20}
                    className="opacity-40"
                  />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm">App Store</div>
                  <div className="text-xs">{t('appDownload.comingSoon') || 'Coming Soon'}</div>
                </div>
              </button>
            </div>
          </div>
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