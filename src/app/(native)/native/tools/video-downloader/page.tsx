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
import { detectVideoPlatform } from '@/lib/services/youtube-downloader';
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
import { Link2 } from 'lucide-react';

/**
 * Video Downloader 页面 (Native) - 多平台
 * 支持 YouTube, TikTok, Instagram, Twitter/X, Facebook
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
    return calculateProductCreditsCost(ProductType.VIDEO_DOWNLOADER);
  }, []);

  // 检测当前输入 URL 的平台
  const detectedPlatform = useMemo(() => {
    if (!url.trim()) return null;
    return detectVideoPlatform(url);
  }, [url]);

  const handleClear = useCallback(() => {
    setUrl('');
    setError(null);
  }, []);

  const handleParse = useCallback(async () => {
    if (!url.trim()) {
      setError(t('videoDownloader.errors.emptyUrl'));
      return;
    }
    if (!detectVideoPlatform(url)) {
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
              <div className="pl-4 text-gray-500 flex-shrink-0">
                <Link2 size={16} />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                placeholder={t('videoDownloader.urlPlaceholder')}
                className="flex-1 bg-transparent text-white placeholder-gray-500 pl-2.5 pr-5 py-3.5 text-sm focus:outline-none min-w-0"
              />
              {url && (
                <button onClick={handleClear} className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* 平台标识 */}
            {detectedPlatform && !isGeneratingModalOpen && !videoInfo && (
              <p className="mt-2 ml-4 text-xs text-purple-400">
                {detectedPlatform.charAt(0).toUpperCase() + detectedPlatform.slice(1)} {t('videoDownloader.detected')}
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
            <div className="flex flex-col items-center pt-8 gap-6">
              <div className="text-center px-4">
                <h3 className="text-white text-lg font-semibold mb-2">{t('videoDownloader.emptyTitle')}</h3>
                <p className="text-sm text-gray-500">{t('videoDownloader.emptyDescription')}</p>
              </div>

              {/* Supported platform logos */}
              <div className="w-full">
                <p className="text-[11px] text-gray-600 text-center mb-4 uppercase tracking-wider font-medium">
                  {t('videoDownloader.supportedPlatforms')}
                </p>
                <div className="flex justify-center items-start gap-5">
                  {/* YouTube */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 18">
                        <rect width="24" height="18" rx="4" fill="#FF0000" />
                        <path d="M9.5 4.5L16.5 9L9.5 13.5V4.5Z" fill="white" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-gray-500">YouTube</span>
                  </div>

                  {/* TikTok */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05c-3.56 0-6.45 2.89-6.45 6.45s2.89 6.45 6.45 6.45 6.45-2.89 6.45-6.45V8.98a8.32 8.32 0 004.87 1.56V7.09a4.84 4.84 0 01-1.22-.4z" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-gray-500">TikTok</span>
                  </div>

                  {/* Instagram */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#igGrad)" strokeWidth="2" />
                        <circle cx="12" cy="12" r="5" stroke="url(#igGrad)" strokeWidth="2" />
                        <circle cx="18" cy="6" r="1.5" fill="url(#igGrad)" />
                        <defs>
                          <linearGradient id="igGrad" x1="2" y1="22" x2="22" y2="2">
                            <stop stopColor="#F58529" />
                            <stop offset="0.5" stopColor="#DD2A7B" />
                            <stop offset="1" stopColor="#8134AF" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <span className="text-[10px] text-gray-500">Instagram</span>
                  </div>

                  {/* X (Twitter) */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-gray-500">X</span>
                  </div>

                  {/* Facebook */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-gray-500">Facebook</span>
                  </div>
                </div>
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
          videoUrl={url}
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
