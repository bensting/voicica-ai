'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLatestRelease } from '@/actions/admin/app-releases';

interface AppDownloadButtonsProps {
  /** 显示模式：modal 用于弹窗内，dark 用于深色背景页面 */
  variant?: 'modal' | 'dark';
  /** 是否显示区域标题（Android / iOS） */
  showSectionHeaders?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * App 下载按钮组件
 * 统一管理 Android 和 iOS 的下载入口
 */
export default function AppDownloadButtons({
  variant = 'modal',
  showSectionHeaders = true,
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
      container: 'space-y-4',
      sectionHeader: 'flex items-center gap-1.5 mb-2',
      sectionTitle: 'font-semibold text-gray-900 text-sm',
      buttonGroup: 'space-y-2',
      primaryButton: 'w-full flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md',
      secondaryButton: 'w-full flex items-center gap-2.5 p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors border border-gray-200',
      disabledButton: 'w-full flex items-center gap-2.5 p-2.5 bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed',
      iconContainer: 'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
      primaryIconBg: 'bg-white/20',
      textPrimary: 'font-semibold text-sm',
      textSecondary: 'text-xs',
      arrow: 'w-4 h-4',
    },
    dark: {
      container: 'space-y-4',
      sectionHeader: 'flex items-center gap-1.5 mb-2',
      sectionTitle: 'font-semibold text-white text-sm',
      buttonGroup: 'space-y-2',
      primaryButton: 'w-full flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20',
      secondaryButton: 'w-full flex items-center gap-2.5 p-2.5 bg-gray-800/80 hover:bg-gray-700 text-white rounded-xl transition-colors border border-gray-700',
      disabledButton: 'w-full flex items-center gap-2.5 p-2.5 bg-gray-800/50 text-gray-500 rounded-xl cursor-not-allowed border border-gray-700/50',
      iconContainer: 'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
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
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor">
                <path d="M17.523 15.341c-.5 0-.908.406-.908.905s.408.906.908.906c.5 0 .906-.407.906-.906s-.406-.905-.906-.905zm-11.046 0c-.5 0-.908.406-.908.905s.408.906.908.906c.5 0 .908-.407.908-.906s-.408-.905-.908-.905zm11.4-6.029l1.96-3.395a.407.407 0 00-.704-.407l-1.984 3.438c-1.47-.67-3.12-1.043-4.896-1.043s-3.426.373-4.896 1.043L5.373 5.51a.407.407 0 00-.704.407l1.96 3.395C3.571 11.018 1.6 14.018 1.6 17.497h20.8c0-3.479-1.971-6.479-5.023-8.185z"/>
              </svg>
            </div>
            <span className={s.sectionTitle}>Android</span>
          </div>
        )}

        <div className={s.buttonGroup}>
          {/* 官网 APK 下载 - 主推 */}
          <button
            onClick={handleApkDownload}
            disabled={loading || !apkDownloadUrl}
            className={s.primaryButton}
          >
            <div className={`${s.iconContainer} ${s.primaryIconBg}`}>
              <Download className="w-4 h-4" />
            </div>
            <div className="text-left flex-1">
              <div className={s.textPrimary}>
                {t('appDownload.officialApk') || '官网直接下载'}
              </div>
              <div className={`${s.textSecondary} ${variant === 'modal' ? 'text-white/70' : 'text-white/70'}`}>
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
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="url(#apkpureGradBtn)">
                <defs>
                  <linearGradient id="apkpureGradBtn" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#54D989' }} />
                    <stop offset="100%" style={{ stopColor: '#2ECC71' }} />
                  </linearGradient>
                </defs>
                <path d="M12 2L2 22h6l1.5-4h5l1.5 4h6L12 2zm0 7l2.5 7h-5L12 9z"/>
              </svg>
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
              <Image
                src="/images/stores/google-play.svg"
                alt="Google Play"
                width={20}
                height={20}
                className="opacity-40"
              />
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
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <span className={s.sectionTitle}>iOS</span>
          </div>
        )}

        <div className={s.buttonGroup}>
          {/* App Store - Coming Soon */}
          <button disabled className={s.disabledButton}>
            <div className={`${s.iconContainer} ${variant === 'modal' ? 'bg-gray-200' : 'bg-gray-700'}`}>
              <Image
                src="/images/stores/app-store.svg"
                alt="App Store"
                width={20}
                height={20}
                className="opacity-40"
              />
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