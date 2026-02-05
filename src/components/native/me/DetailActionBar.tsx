'use client';

import { useState, useEffect, useRef } from 'react';
import { Pencil, Download } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import GradientButton from '@/components/native/common/GradientButton';
import { handleDownloadWithState, type FileType } from '@/lib/native-download';
import { useInterstitialAd } from '@/hooks/useInterstitialAd';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface DetailActionBarProps {
  /** 是否显示 Recreate 按钮 */
  showRecreate?: boolean;
  /** Recreate 回调 */
  onRecreate?: () => void;
  /** 是否显示 Download 按钮 */
  showDownload?: boolean;
  /** 文件 URL（用于下载和浏览器打开）- 新 API */
  fileUrl?: string;
  /** 下载文件名 - 新 API */
  fileName?: string;
  /** 文件类型 - 决定保存位置：image/video→相册, music→Music目录, audio→Documents */
  fileType?: FileType;
  /** Download 按钮文字 */
  downloadText?: string;
  /** 是否在弹出下载选项后显示插页式广告 */
  showInterstitialOnDownload?: boolean;
  /** @deprecated 旧 API - 直接下载回调（向后兼容） */
  onDownload?: () => void;
  /** @deprecated 旧 API - 是否禁用下载（向后兼容） */
  downloadDisabled?: boolean;
  /** @deprecated 旧 API - 是否正在下载（向后兼容） */
  downloading?: boolean;
}

/**
 * 统一的详情页底部操作栏
 * 用于 Video、Music、Image 等详情页
 * 内置下载选项弹窗（保存到设备 / 在浏览器打开）
 */
export default function DetailActionBar({
  showRecreate = true,
  onRecreate,
  showDownload = true,
  fileUrl,
  fileName = 'download',
  fileType = 'audio',
  downloadText = 'Download',
  showInterstitialOnDownload = true,
  // 向后兼容的旧 API
  onDownload,
  downloadDisabled,
  downloading: externalDownloading,
}: DetailActionBarProps) {
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [internalDownloading, setInternalDownloading] = useState(false);
  const hasShownAdRef = useRef(false);

  // 插页式广告 hook
  const { showInterstitialAd, isNative } = useInterstitialAd();

  // 订阅状态（订阅用户不显示广告）
  const { isSubscribed } = useSubscription();

  // 使用新 API 还是旧 API
  const useNewApi = !onDownload && fileUrl;
  const downloading = useNewApi ? internalDownloading : (externalDownloading || false);
  const isDisabled = useNewApi ? !fileUrl : (downloadDisabled || false);

  // 当 action sheet 打开时显示插页式广告（仅非订阅用户）
  useEffect(() => {
    if (showActionSheet && showInterstitialOnDownload && isNative && !isSubscribed && !hasShownAdRef.current) {
      hasShownAdRef.current = true;
      // 延迟 300ms 让 action sheet 动画完成后再显示广告
      const timer = setTimeout(() => {
        showInterstitialAd();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showActionSheet, showInterstitialOnDownload, isNative, isSubscribed, showInterstitialAd]);

  // action sheet 关闭时重置广告标记
  useEffect(() => {
    if (!showActionSheet) {
      hasShownAdRef.current = false;
    }
  }, [showActionSheet]);

  // 根据文件类型获取保存位置描述
  const getSaveLocationText = () => {
    switch (fileType) {
      case 'image':
      case 'video':
        return 'Save to Photos';
      case 'music':
        return 'Save to Music folder';
      default:
        return 'Save to Documents folder';
    }
  };

  const handleDownloadClick = () => {
    if (useNewApi) {
      // 新 API: 显示 Action Sheet
      setShowActionSheet(true);
    } else if (onDownload) {
      // 旧 API: 直接调用回调
      onDownload();
    }
  };

  const handleDownloadToDevice = async () => {
    if (!fileUrl) return;
    setShowActionSheet(false);
    await handleDownloadWithState(fileUrl, fileName, setInternalDownloading, fileType);
  };

  const handleOpenInBrowser = async () => {
    if (!fileUrl) return;
    setShowActionSheet(false);
    try {
      await Browser.open({ url: fileUrl });
    } catch (error) {
      console.error('Failed to open browser:', error);
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <>
      <div className="flex gap-2.5">
        {showRecreate && onRecreate && (
          <button
            onClick={onRecreate}
            className="flex-[1] flex items-center justify-center gap-1.5 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white text-sm font-medium hover:bg-gray-700 transition-all"
          >
            <Pencil size={14} />
            Recreate
          </button>
        )}
        {showDownload && (fileUrl || onDownload) && (
          <GradientButton
            icon={downloading ? undefined : Download}
            iconPosition="left"
            iconSize={15}
            onClick={handleDownloadClick}
            disabled={isDisabled || downloading}
            className={`${showRecreate ? 'flex-[2]' : 'flex-1'} !w-auto`}
          >
            {downloading ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Downloading...</span>
              </div>
            ) : (
              downloadText
            )}
          </GradientButton>
        )}
      </div>

      {/* Download Action Sheet - 仅新 API 使用 */}
      {useNewApi && showActionSheet && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-[9998]"
            onClick={() => setShowActionSheet(false)}
          />

          {/* Action Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-gray-900 rounded-t-2xl animate-slide-up"
            style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)' }}
          >
            <div className="p-4">
              {/* Handle */}
              <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />

              {/* Title */}
              <h3 className="text-white text-lg font-semibold text-center mb-4">
                Download Options
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {/* Download to Device */}
                <button
                  onClick={handleDownloadToDevice}
                  disabled={downloading}
                  className="w-full flex items-center gap-4 p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-purple-600 rounded-full">
                    {downloading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">Save to Device</div>
                    <div className="text-gray-400 text-sm">{getSaveLocationText()}</div>
                  </div>
                </button>

                {/* Open in Browser */}
                <button
                  onClick={handleOpenInBrowser}
                  className="w-full flex items-center gap-4 p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-600 rounded-full">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">Open in Browser</div>
                    <div className="text-gray-400 text-sm">View or save from browser</div>
                  </div>
                </button>
              </div>

              {/* Cancel */}
              <button
                onClick={() => setShowActionSheet(false)}
                className="w-full mt-4 p-4 bg-gray-800 rounded-xl text-gray-400 font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          <style jsx>{`
            @keyframes slide-up {
              from {
                transform: translateY(100%);
              }
              to {
                transform: translateY(0);
              }
            }
            .animate-slide-up {
              animation: slide-up 0.3s ease-out;
            }
          `}</style>
        </>
      )}
    </>
  );
}
