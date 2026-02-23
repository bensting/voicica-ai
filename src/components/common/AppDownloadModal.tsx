'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLatestRelease } from '@/actions/admin/app-releases';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=ai.voicica.app';

// Google Play 彩色图标
const GooglePlayIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0">
    <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.609 22.186a2.168 2.168 0 01-.609-1.529V3.343c0-.569.221-1.103.609-1.529z" />
    <path fill="#FBBC04" d="M17.727 8.062L14.839 12l2.888 3.938 4.265-2.472c.793-.459.793-1.472 0-1.931l-4.265-2.473z" />
    <path fill="#34A853" d="M3.609 22.186l10.183-10.186L17.727 15.938 6.044 22.723a2.015 2.015 0 01-2.435-.537z" />
    <path fill="#4285F4" d="M3.609 1.814a2.015 2.015 0 012.435-.537L17.727 8.062 13.792 12 3.609 1.814z" />
  </svg>
);

// 下载箭头图标
const DownloadIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

export default function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const { t } = useLanguage();
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // 获取最新 APK 下载链接
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getLatestRelease('android')
      .then((release) => {
        if (release) setApkUrl(release.downloadUrl);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  // 入场动画
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  // ESC 关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const modal = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${animateIn ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* 弹窗内容 */}
      <div
        className={`relative w-full max-w-[360px] transition-all duration-300 ${animateIn ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 外部光晕 */}
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-purple-500/40 via-white/10 to-cyan-500/30" />

        {/* 内容容器 */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0f0f1a]">
          {/* 背景装饰 - 渐变光斑 */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-cyan-500/15 blur-3xl" />

          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-500 transition-all hover:bg-white/10 hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative px-6 pb-7 pt-8">
            {/* Logo + 标题区域 */}
            <div className="mb-7 flex flex-col items-center">
              <div className="mb-3 h-14 w-14 overflow-hidden rounded-2xl shadow-lg shadow-purple-500/20">
                <Image
                  src="/logo/logo-transparent-256.webp"
                  alt="Voicica"
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              </div>
              <h2 className="text-lg font-bold text-white">
                {t('appDownload.title') || 'Download Voicica App'}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                {t('appDownload.subtitle') || 'Watch videos to earn credits, App exclusive'}
              </p>
            </div>

            {/* ===== 推荐: APK 下载 (Pro) ===== */}
            <a
              href={apkUrl || '#'}
              onClick={(e) => {
                if (!apkUrl || loading) e.preventDefault();
              }}
              className={`group relative block overflow-hidden rounded-2xl p-[1px] transition-all ${
                apkUrl && !loading
                  ? 'hover:shadow-xl hover:shadow-purple-500/20'
                  : 'opacity-50'
              }`}
            >
              {/* 渐变边框 */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" />

              {/* 卡片内容 */}
              <div className="relative rounded-[15px] bg-gradient-to-br from-[#1a1030] to-[#0f0f1a] p-4">
                <div className="flex items-center gap-3.5">
                  {/* 图标 */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/20 ring-1 ring-white/10">
                    <DownloadIcon />
                  </div>

                  {/* 文字内容 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-white">
                        {loading
                          ? (t('appDownload.loading') || 'Loading...')
                          : (t('appDownload.downloadApk') || 'Download APK')}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400">
                      {t('appDownload.unlockAllModels') || 'Unlock All AI Models + Earn Daily Rewards'}
                    </p>
                  </div>

                  {/* Pro 徽章 */}
                  <div className="flex flex-shrink-0 flex-col items-center">
                    <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-500/30">
                      PRO
                    </span>
                  </div>
                </div>
              </div>
            </a>

            {/* 分隔线 */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* ===== 次选: Google Play ===== */}
            <a
              href={GOOGLE_PLAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 transition-all hover:border-white/10 hover:bg-white/[0.06]"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
                <GooglePlayIcon />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">
                  Google Play
                </span>
                <p className="text-[11px] text-gray-600">
                  {t('appDownload.standardVersion') || 'Standard Version'}
                </p>
              </div>
              <svg className="h-4 w-4 flex-shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
