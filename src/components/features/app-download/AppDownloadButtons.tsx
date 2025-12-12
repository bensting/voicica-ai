'use client';

import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLatestRelease } from '@/actions/admin/app-releases';

interface AppDownloadButtonsProps {
  /** 显示模式：modal 用于弹窗内，dark 用于深色背景页面 */
  variant?: 'modal' | 'dark';
  /** 是否显示区域标题（Android / iOS） */
  showSectionHeaders?: boolean;
  /** 紧凑模式 - 减少间距 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
}

// Google Play 彩色图标
const GooglePlayIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.609 22.186a2.168 2.168 0 01-.609-1.529V3.343c0-.569.221-1.103.609-1.529z"/>
    <path fill="#FBBC04" d="M17.727 8.062L14.839 12l2.888 3.938 4.265-2.472c.793-.459.793-1.472 0-1.931l-4.265-2.473z"/>
    <path fill="#34A853" d="M3.609 22.186l10.183-10.186L17.727 15.938 6.044 22.723a2.015 2.015 0 01-2.435-.537z"/>
    <path fill="#4285F4" d="M3.609 1.814a2.015 2.015 0 012.435-.537L17.727 8.062 13.792 12 3.609 1.814z"/>
  </svg>
);

// App Store 图标
const AppStoreIcon = ({ className = 'w-5 h-5', color = 'currentColor' }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color}>
    <path d="M8.286 6.562L6.876 9l-.626-1.084a.625.625 0 10-1.083.625l.625 1.084H4.125a.625.625 0 100 1.25h2.75l1.625 2.813-2.875 4.978H3.25a.625.625 0 100 1.25h1.042l-.876 1.517a.625.625 0 101.083.625l4.5-7.793.001-.001 1.626-2.817L8.286 6.562zM19.875 18.666h-3.584l1.709-2.959 1.083 1.876a.625.625 0 101.083-.625l-5.75-9.959a.625.625 0 10-1.083.625l1.959 3.392-3.584 6.208a.625.625 0 000 .625l.542.938.54-.936h6.085l.542.938a.625.625 0 001.083-.625l-.542-.938h1.917a.625.625 0 100-1.25v-.31z"/>
  </svg>
);

// APKPure 图标
const APKPureIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="apkpureGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#54D989' }} />
        <stop offset="100%" style={{ stopColor: '#2ECC71' }} />
      </linearGradient>
    </defs>
    <path fill="url(#apkpureGrad)" d="M12 2L2 22h6l1.5-4h5l1.5 4h6L12 2zm0 7l2.5 7h-5L12 9z"/>
  </svg>
);

// Android 图标
const AndroidIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor">
    <path d="M17.523 15.341c-.5 0-.908.406-.908.905s.408.906.908.906c.5 0 .906-.407.906-.906s-.406-.905-.906-.905zm-11.046 0c-.5 0-.908.406-.908.905s.408.906.908.906c.5 0 .908-.407.908-.906s-.408-.905-.908-.905zm11.4-6.029l1.96-3.395a.407.407 0 00-.704-.407l-1.984 3.438c-1.47-.67-3.12-1.043-4.896-1.043s-3.426.373-4.896 1.043L5.373 5.51a.407.407 0 00-.704.407l1.96 3.395C3.571 11.018 1.6 14.018 1.6 17.497h20.8c0-3.479-1.971-6.479-5.023-8.185z"/>
  </svg>
);

// Apple 图标
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

/**
 * App 下载按钮组件
 * 统一管理 Android 和 iOS 的下载入口
 */
export default function AppDownloadButtons({
  variant = 'modal',
  showSectionHeaders = true,
  compact = false,
  className = '',
}: AppDownloadButtonsProps) {
  const { t } = useLanguage();
  const [apkDownloadUrl, setApkDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取最新版本下载链接
  useEffect(() => {
    setLoading(true);
    getLatestRelease('android')
      .then((release) => {
        if (release) {
          setApkDownloadUrl(release.download_url);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // 处理 APK 下载
  const handleApkDownload = () => {
    if (apkDownloadUrl) {
      window.open(apkDownloadUrl, '_blank');
    }
  };

  // 样式配置
  const styles = {
    modal: {
      container: compact ? 'space-y-2' : 'space-y-3',
      sectionHeader: 'flex items-center gap-1.5 mb-1.5',
      sectionTitle: 'font-semibold text-gray-900 text-sm',
      buttonGroup: compact ? 'space-y-1.5' : 'space-y-2',
      primaryButton: `w-full flex items-center gap-2 ${compact ? 'p-2' : 'p-2.5'} bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md`,
      secondaryButton: `w-full flex items-center gap-2 ${compact ? 'p-2' : 'p-2.5'} bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors border border-gray-200`,
      disabledButton: `w-full flex items-center gap-2 ${compact ? 'p-2' : 'p-2.5'} bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed`,
      iconContainer: `${compact ? 'w-8 h-8' : 'w-9 h-9'} rounded-lg flex items-center justify-center flex-shrink-0`,
      primaryIconBg: 'bg-white/20',
      textPrimary: 'font-semibold text-sm',
      textSecondary: 'text-xs',
      arrow: 'w-4 h-4',
    },
    dark: {
      container: compact ? 'space-y-2' : 'space-y-3',
      sectionHeader: 'flex items-center gap-1.5 mb-1.5',
      sectionTitle: 'font-semibold text-white text-sm',
      buttonGroup: compact ? 'space-y-1.5' : 'space-y-2',
      primaryButton: `w-full flex items-center gap-2 ${compact ? 'p-2' : 'p-2.5'} bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20`,
      secondaryButton: `w-full flex items-center gap-2 ${compact ? 'p-2' : 'p-2.5'} bg-gray-800/80 hover:bg-gray-700 text-white rounded-xl transition-colors border border-gray-700`,
      disabledButton: `w-full flex items-center gap-2 ${compact ? 'p-2' : 'p-2.5'} bg-gray-800/50 text-gray-500 rounded-xl cursor-not-allowed border border-gray-700/50`,
      iconContainer: `${compact ? 'w-8 h-8' : 'w-9 h-9'} rounded-lg flex items-center justify-center flex-shrink-0`,
      primaryIconBg: 'bg-white/20',
      textPrimary: 'font-semibold text-sm',
      textSecondary: 'text-xs',
      arrow: 'w-4 h-4',
    },
  };

  const s = styles[variant];

  return (
    <div className={`${s.container} ${className}`}>
      {/* Android 区域 */}
      <div>
        {showSectionHeaders && (
          <div className={s.sectionHeader}>
            <div className="w-5 h-5 rounded bg-[#3DDC84] flex items-center justify-center">
              <AndroidIcon />
            </div>
            <span className={s.sectionTitle}>Android</span>
          </div>
        )}

        <div className={s.buttonGroup}>
          {/* 官网 APK 下载 - 主推，使用手机图标 */}
          <button
            onClick={handleApkDownload}
            disabled={loading || !apkDownloadUrl}
            className={s.primaryButton}
          >
            <div className={`${s.iconContainer} ${s.primaryIconBg}`}>
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="text-left flex-1">
              <div className={s.textPrimary}>
                {t('appDownload.officialApk') || '官网直接下载'}
              </div>
              <div className={`${s.textSecondary} text-white/70`}>
                {loading ? (t('appDownload.loading') || '加载中...') : 'APK'}
              </div>
            </div>
            <svg className={s.arrow} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* APKPure */}
          <button
            onClick={() => window.open('https://apkpure.com/p/ai.voicica.app', '_blank')}
            className={s.secondaryButton}
          >
            <div className={`${s.iconContainer} bg-[#2ECC71]/15`}>
              <APKPureIcon />
            </div>
            <div className="text-left flex-1">
              <div className={s.textPrimary}>APKPure</div>
              <div className={`${s.textSecondary} ${variant === 'modal' ? 'text-gray-500' : 'text-gray-400'}`}>APK</div>
            </div>
            <svg className={`${s.arrow} ${variant === 'modal' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Google Play - Coming Soon */}
          <button disabled className={s.disabledButton}>
            <div className={`${s.iconContainer} ${variant === 'modal' ? 'bg-gray-200' : 'bg-gray-700'}`}>
              <GooglePlayIcon className="w-5 h-5 opacity-50" />
            </div>
            <div className="text-left flex-1">
              <div className={s.textPrimary}>Google Play</div>
              <div className={s.textSecondary}>{t('appDownload.comingSoon') || 'Coming Soon'}</div>
            </div>
          </button>
        </div>
      </div>

      {/* iOS 区域 */}
      <div>
        {showSectionHeaders && (
          <div className={s.sectionHeader}>
            <div className="w-5 h-5 rounded bg-gray-800 flex items-center justify-center">
              <AppleIcon />
            </div>
            <span className={s.sectionTitle}>iOS</span>
          </div>
        )}

        <div className={s.buttonGroup}>
          {/* App Store - Coming Soon */}
          <button disabled className={s.disabledButton}>
            <div className={`${s.iconContainer} ${variant === 'modal' ? 'bg-gray-200' : 'bg-gray-700'}`}>
              <AppStoreIcon className="w-5 h-5 opacity-50" color={variant === 'modal' ? '#9CA3AF' : '#6B7280'} />
            </div>
            <div className="text-left flex-1">
              <div className={s.textPrimary}>App Store</div>
              <div className={s.textSecondary}>{t('appDownload.comingSoon') || 'Coming Soon'}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}