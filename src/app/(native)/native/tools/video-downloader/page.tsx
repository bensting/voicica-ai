'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import {
  parseVideoUrl,
  type ParseResponse,
} from '@/actions/video-downloader';
import { isYouTubeUrl } from '@/lib/services/youtube-downloader';
import { getVideoParseErrorMessage } from '@/lib/services/video-downloader-utils';
import { calculateProductCreditsCost } from '@/config/creditsCost';
import { ProductType } from '@/config/productType';
import { checkCreditsBeforeGenerate } from '@/lib/credits-check';
import { adConfig } from '@/config/native/adConfig';
import CreatePageHeader from '@/components/native/common/CreatePageHeader';
import GeneratingModal, { type GeneratingStatus } from '@/components/native/common/GeneratingModal';
import VideoDownloaderDetailModal from '@/components/native/me/VideoDownloaderDetailModal';
import LoginModal from '@/components/native/LoginModal';
import InsufficientCreditsModal from '@/components/native/common/InsufficientCreditsModal';
import NativeDailyTasksModal from '@/components/native/NativeDailyTasksModal';
import CreditsInfoBar from '@/components/native/common/CreditsInfoBar';
import GradientButton from '@/components/native/common/GradientButton';
import CreditsIcon from '@/components/native/common/CreditsIcon';

/**
 * Video Downloader 页面 (Native) - YouTube only
 * 暗色风格，pill 搜索栏，GeneratingModal + VideoDownloaderDetailModal 流程
 */
export default function VideoDownloaderPage() {
  const { t } = useLanguage();
  const { user } = useFirebaseAuth();
  const { credits, refreshCredits } = useCredits();
  const { isSubscribed } = useSubscription();
  const { showRewardedAd } = useRewardedAd();

  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<ParseResponse | null>(null);

  // Modal 状态
  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<GeneratingStatus>('generating');
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [adWatched, setAdWatched] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Login / Credits 弹窗
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isInsufficientCreditsModalOpen, setIsInsufficientCreditsModalOpen] = useState(false);
  const [isDailyTasksModalOpen, setIsDailyTasksModalOpen] = useState(false);
  const [insufficientCreditsInfo, setInsufficientCreditsInfo] = useState<{ required: number; current: number } | null>(null);

  // 积分成本
  const creditCost = useMemo(() => {
    return calculateProductCreditsCost(ProductType.YOUTUBE_DOWNLOADER);
  }, []);

  const handleClear = useCallback(() => {
    setUrl('');
    setError(null);
  }, []);

  const handleParse = useCallback(async () => {
    if (!url.trim()) {
      setError(t('videoDownloader.errors.emptyUrl'));
      return;
    }
    if (!isYouTubeUrl(url)) {
      setError(t('videoDownloader.errors.invalidUrl'));
      return;
    }

    // 登录检查
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    // 积分检查
    const hasEnoughCredits = checkCreditsBeforeGenerate({
      currentCredits: credits,
      requiredCredits: creditCost,
      onInsufficientCredits: () => {
        setInsufficientCreditsInfo({ required: creditCost, current: credits });
        setIsInsufficientCreditsModalOpen(true);
      },
    });
    if (!hasEnoughCredits) return;

    // 打开 GeneratingModal
    setIsGeneratingModalOpen(true);
    setGeneratingStatus('generating');
    setGeneratingError(null);
    setError(null);
    setAdWatched(false);

    try {
      // 60s 客户端超时，防止服务端卡死时前端无限等待
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 60000)
      );
      const result = await Promise.race([parseVideoUrl(url), timeoutPromise]);

      if (!result.success || !result.data) {
        const errorCode = result.errorCode || 'UNKNOWN_ERROR';
        setGeneratingStatus('error');
        setGeneratingError(getVideoParseErrorMessage(errorCode, result.errorData, t, 'videoDownloader'));
        return;
      }

      setVideoInfo(result.data);
      await refreshCredits();

      // 关闭 GeneratingModal，打开 DetailModal
      setIsGeneratingModalOpen(false);
      setIsDetailModalOpen(true);
    } catch (err) {
      setGeneratingStatus('error');
      setGeneratingError(
        err instanceof Error && err.message === 'TIMEOUT'
          ? t('videoDownloader.errors.parseFailed')
          : t('videoDownloader.errors.unknownError')
      );
    }
  }, [url, t, refreshCredits, user, credits, creditCost]);

  // 关闭生成弹窗
  const handleCloseGeneratingModal = () => {
    setIsGeneratingModalOpen(false);
    setGeneratingStatus('generating');
    setGeneratingError(null);
  };

  // 非订阅用户：解析开始后自动弹出激励广告
  useEffect(() => {
    if (!isGeneratingModalOpen || generatingStatus !== 'generating' || isSubscribed || adWatched) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await showRewardedAd();
        if (result.success) {
          setAdWatched(true);
        }
      } catch (err) {
        console.error('[VideoDownloader] Ad error:', err);
      }
    }, adConfig.rewardedAdDelayMs);

    return () => clearTimeout(timer);
  }, [isGeneratingModalOpen, generatingStatus, isSubscribed, adWatched, showRewardedAd]);

  return (
    <div className="flex flex-col min-h-screen">
      <CreatePageHeader title={t('videoDownloader.title')} showCreateSheet={true} />

      <div
        className="flex-1 overflow-y-auto px-4 pt-4"
        style={{ paddingBottom: 'calc(100px + var(--safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex flex-col gap-4">

          {/* ====== 搜索栏 (Pill Shape) ====== */}
          <div>
            <div className="flex items-center bg-white/5 border border-purple-500/30 rounded-full overflow-hidden focus-within:border-purple-500/60 transition-colors">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                placeholder={t('videoDownloader.urlPlaceholder')}
                className="flex-1 bg-transparent text-white placeholder-gray-500 px-5 py-3.5 text-sm focus:outline-none min-w-0"
              />
              {url && (
                <button onClick={handleClear} className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* YouTube 标识 */}
            {url.trim() && isYouTubeUrl(url) && !isGeneratingModalOpen && !videoInfo && (
              <p className="mt-2 ml-4 text-xs text-purple-400">
                YouTube {t('videoDownloader.detected')}
              </p>
            )}
          </div>

          {/* ====== 页面内错误提示（URL 验证错误） ====== */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* ====== 空状态 ====== */}
          {!error && (
            <div className="flex flex-col items-center py-16 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <polygon points="10,6 16,10 10,14" fill="currentColor" stroke="none" />
                  <path d="M12 17v4m-3 0h6" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-center px-6">
                <h3 className="text-white font-medium mb-1">{t('videoDownloader.emptyTitle')}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t('videoDownloader.emptyDescription')}</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Fixed Bottom Section */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-3 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <CreditsInfoBar
          credits={credits}
          creditRules={[{ name: t('videoDownloader.parseVideoButton'), credits: 1 }]}
          className="mb-3"
        />

        <GradientButton
          onClick={() => void handleParse()}
          disabled={isGeneratingModalOpen || !url.trim()}
        >
          <span>{t('videoDownloader.parseVideoButton')}</span>
          <CreditsIcon className="w-3.5 h-3.5" />
          <span>1</span>
        </GradientButton>
      </div>

      {/* ====== Modals ====== */}

      {/* Generating Modal */}
      <GeneratingModal
        isOpen={isGeneratingModalOpen}
        status={generatingStatus}
        type="download"
        error={generatingError}
        credits={credits}
        onClose={handleCloseGeneratingModal}
        onCreateAnother={handleCloseGeneratingModal}
        onTryAgain={() => {
          handleCloseGeneratingModal();
          void handleParse();
        }}
        showAdPrompt={!isSubscribed}
        adWatched={adWatched}
      />

      {/* Video Detail Modal */}
      {isDetailModalOpen && videoInfo && (
        <VideoDownloaderDetailModal
          videoInfo={videoInfo}
          onClose={() => setIsDetailModalOpen(false)}
          onSearchAnother={() => {
            setIsDetailModalOpen(false);
            setVideoInfo(null);
            setUrl('');
          }}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => setIsLoginModalOpen(false)}
      />

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={isInsufficientCreditsModalOpen}
        onClose={() => setIsInsufficientCreditsModalOpen(false)}
        onGetFreeCredits={() => {
          setIsInsufficientCreditsModalOpen(false);
          setIsDailyTasksModalOpen(true);
        }}
        requiredCredits={insufficientCreditsInfo?.required}
        currentCredits={insufficientCreditsInfo?.current}
      />

      {/* Daily Tasks Modal */}
      <NativeDailyTasksModal
        isOpen={isDailyTasksModalOpen}
        onClose={() => setIsDailyTasksModalOpen(false)}
      />
    </div>
  );
}
