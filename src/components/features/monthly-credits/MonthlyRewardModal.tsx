'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Gift, LogIn, Download, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useMonthlyCredits, isAndroidDevice } from '@/hooks/useMonthlyCredits';
import { useDeviceFingerprint } from '@/components/providers/DeviceFingerprintProvider';
import LoginModal from '@/components/features/auth/LoginModal';
import { getLatestRelease, incrementDownloadCountByVersion } from '@/actions/admin/app-releases';

interface MonthlyRewardModalProps {
  /** 是否显示 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 月度福利弹窗组件
 *
 * 根据用户状态显示不同内容：
 * - 匿名用户：登录引导 + 游客领取选项
 * - 已登录未领取：登录福利领取
 * - 已登录已领取 + 移动端：APP福利领取
 */
export default function MonthlyRewardModal({ isOpen, onClose }: MonthlyRewardModalProps) {
  const { t } = useLanguage();
  const { user } = useFirebaseAuth();
  const { deviceFingerprint } = useDeviceFingerprint();
  const {
    status,
    config,
    claiming,
    popupType,
    claimAnonymous,
    claimLogin,
    claimAppDownload,
    markPopupShown,
    refresh,
  } = useMonthlyCredits();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimedCredits, setClaimedCredits] = useState(0);
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [apkVersion, setApkVersion] = useState<string | null>(null);

  // 加载 APK 信息
  useEffect(() => {
    if (popupType === 'app_download') {
      getLatestRelease('android').then((release) => {
        if (release) {
          setApkUrl(release.download_url);
          setApkVersion(release.version);
        }
      });
    }
  }, [popupType]);

  // 标记弹窗已显示
  useEffect(() => {
    if (isOpen) {
      markPopupShown();
    }
  }, [isOpen, markPopupShown]);

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

  // 处理匿名领取
  const handleClaimAnonymous = async () => {
    if (!deviceFingerprint) return;
    const result = await claimAnonymous(deviceFingerprint);
    if (result.success) {
      setClaimSuccess(true);
      setClaimedCredits(result.credits || 0);
    }
  };

  // 处理登录福利领取
  const handleClaimLogin = async () => {
    const result = await claimLogin();
    if (result.success) {
      setClaimSuccess(true);
      setClaimedCredits(result.credits || 0);
    }
  };

  // 处理APP福利领取
  const handleClaimAppDownload = async () => {
    const result = await claimAppDownload();
    if (result.success) {
      setClaimSuccess(true);
      setClaimedCredits(result.credits || 0);
      // 触发下载
      if (apkUrl && apkVersion) {
        await incrementDownloadCountByVersion('android', apkVersion);
        window.open(apkUrl, '_blank');
      }
    }
  };

  // 登录成功后刷新状态
  useEffect(() => {
    if (user && showLoginModal) {
      setShowLoginModal(false);
      refresh();
    }
  }, [user, showLoginModal, refresh]);

  // 关闭成功提示
  const handleCloseSuccess = () => {
    setClaimSuccess(false);
    setClaimedCredits(0);
    onClose();
  };

  if (!isOpen || !config?.enabled) return null;

  // 格式化积分数字
  const formatCredits = (credits: number) => {
    return credits.toLocaleString();
  };

  // 渲染成功状态
  const renderSuccessContent = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
        <Check className="w-10 h-10 text-green-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        {t('monthlyReward.claimSuccess')}
      </h3>
      <p className="text-4xl font-bold text-purple-600 mb-2">
        +{formatCredits(claimedCredits)}
      </p>
      <p className="text-gray-500 mb-8">
        {t('monthlyReward.creditsAdded')}
      </p>
      <button
        onClick={handleCloseSuccess}
        className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
      >
        {t('monthlyReward.startUsing')}
      </button>
    </div>
  );

  // 渲染匿名用户内容（登录引导）
  const renderAnonymousContent = () => (
    <div className="text-center">
      {/* 标题 */}
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
        <Gift className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        {t('monthlyReward.title')}
      </h3>
      <p className="text-gray-500 mb-6">
        {t('monthlyReward.subtitle')}
      </p>

      {/* 主推：登录领取 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <LogIn className="w-5 h-5 text-purple-600" />
          <span className="text-lg font-semibold text-purple-600">
            {t('monthlyReward.loginToGet')}
          </span>
        </div>
        <p className="text-3xl font-bold text-purple-600 mb-4">
          {formatCredits(config?.login_credits || 50000)} {t('monthlyReward.credits')}
        </p>
        <button
          onClick={() => setShowLoginModal(true)}
          className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
        >
          {t('monthlyReward.loginNow')}
        </button>
      </div>

      {/* 分隔线 */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-400">
            {t('monthlyReward.or')}
          </span>
        </div>
      </div>

      {/* 次要：游客领取 */}
      <div className="text-center">
        <p className="text-gray-500 mb-3">
          {t('monthlyReward.guestGetPrefix')} {formatCredits(config?.anonymous_credits || 2000)} {t('monthlyReward.guestGetSuffix')}
        </p>
        <button
          onClick={handleClaimAnonymous}
          disabled={claiming || !deviceFingerprint}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {claiming ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('monthlyReward.claiming')}
            </span>
          ) : (
            t('monthlyReward.guestClaim')
          )}
        </button>
      </div>
    </div>
  );

  // 渲染登录福利内容
  const renderLoginRewardContent = () => (
    <div className="text-center">
      {/* 标题 */}
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
        <Gift className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        {t('monthlyReward.loginRewardTitle')}
      </h3>
      <p className="text-gray-500 mb-6">
        {t('monthlyReward.loginRewardSubtitle')}
      </p>

      {/* 积分展示 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-6">
        <p className="text-5xl font-bold text-purple-600 mb-2">
          {formatCredits(config?.login_credits || 50000)}
        </p>
        <p className="text-gray-500">{t('monthlyReward.credits')}</p>
      </div>

      {/* 领取按钮 */}
      <button
        onClick={handleClaimLogin}
        disabled={claiming}
        className="w-full py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {claiming ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('monthlyReward.claiming')}
          </span>
        ) : (
          t('monthlyReward.claimNow')
        )}
      </button>
    </div>
  );

  // 渲染APP福利内容
  const renderAppRewardContent = () => (
    <div className="text-center">
      {/* 标题 */}
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
        <Download className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        {t('monthlyReward.appRewardTitle')}
      </h3>
      <p className="text-gray-500 mb-6">
        {t('monthlyReward.appRewardSubtitle')}
      </p>

      {/* 积分展示 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 mb-6">
        <p className="text-5xl font-bold text-green-600 mb-2">
          {formatCredits(config?.app_download_credits || 50000)}
        </p>
        <p className="text-gray-500">{t('monthlyReward.credits')}</p>
      </div>

      {/* APP优势 */}
      <div className="text-left mb-6 space-y-2">
        <div className="flex items-center gap-2 text-gray-600">
          <Check className="w-4 h-4 text-green-500" />
          <span>{t('monthlyReward.appFeature1')}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Check className="w-4 h-4 text-green-500" />
          <span>{t('monthlyReward.appFeature2')}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Check className="w-4 h-4 text-green-500" />
          <span>{t('monthlyReward.appFeature3')}</span>
        </div>
      </div>

      {/* 下载并领取按钮 */}
      <button
        onClick={handleClaimAppDownload}
        disabled={claiming || !apkUrl}
        className="w-full py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {claiming ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('monthlyReward.claiming')}
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            {t('monthlyReward.downloadAndClaim')}
          </span>
        )}
      </button>
    </div>
  );

  // 根据类型渲染内容
  const renderContent = () => {
    if (claimSuccess) {
      return renderSuccessContent();
    }

    switch (popupType) {
      case 'anonymous':
        return renderAnonymousContent();
      case 'login':
        return renderLoginRewardContent();
      case 'app_download':
        return renderAppRewardContent();
      default:
        return null;
    }
  };

  const modalContent = (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      >
        {/* 弹窗内容 */}
        <div
          className="relative w-full max-w-[420px] mx-4 bg-white rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 内容区域 */}
          <div className="p-8">
            {renderContent()}
          </div>

          {/* 底部提示 */}
          {!claimSuccess && (
            <div className="px-8 pb-6 text-center">
              <p className="text-xs text-gray-400">
                {t('monthlyReward.validThisMonth')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}