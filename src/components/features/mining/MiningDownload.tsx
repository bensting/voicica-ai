'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLatestRelease } from '@/actions/admin/app-releases';

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=ai.voicica.app';

const GooglePlayIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 flex-shrink-0">
    <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.609 22.186a2.168 2.168 0 01-.609-1.529V3.343c0-.569.221-1.103.609-1.529z" />
    <path fill="#FBBC04" d="M17.727 8.062L14.839 12l2.888 3.938 4.265-2.472c.793-.459.793-1.472 0-1.931l-4.265-2.473z" />
    <path fill="#34A853" d="M3.609 22.186l10.183-10.186L17.727 15.938 6.044 22.723a2.015 2.015 0 01-2.435-.537z" />
    <path fill="#4285F4" d="M3.609 1.814a2.015 2.015 0 012.435-.537L17.727 8.062 13.792 12 3.609 1.814z" />
  </svg>
);

/**
 * Mining Download — 核心转化区
 * 外层彩色渐变边框卡片，内部 APK(左) + Google Play(右) 横排
 */
export default function MiningDownload() {
  const { t } = useLanguage();
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestRelease('android')
      .then((release) => {
        if (release) setApkUrl(release.downloadUrl);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-[#06060f] px-4 py-3">
      <div className="mx-auto max-w-md">
        {/* === 外层卡片：彩色渐变边框（紫→粉→青） === */}
        <div className="relative rounded-2xl p-[1.5px]">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/30 via-pink-500/20 to-cyan-400/30" />

          <div className="relative rounded-2xl bg-[#0c0a1a] px-4 py-5">
            {/* 背景光斑 */}
            <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-purple-600/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-8 -right-8 h-20 w-20 rounded-full bg-cyan-500/8 blur-3xl" />

            {/* 横排：APK + Google Play */}
            <div className="relative flex gap-3">
              {/* === APK 主按钮 === */}
              <a
                href={apkUrl || '#'}
                onClick={(e) => { if (!apkUrl || loading) e.preventDefault(); }}
                className={`group relative flex-1 overflow-hidden rounded-xl p-[1.5px] transition-all ${
                  apkUrl && !loading ? 'hover:shadow-xl hover:shadow-purple-500/30' : 'opacity-50'
                }`}
              >
                {/* 渐变边框（紫→橙） */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-purple-500 via-violet-500 to-orange-500" />

                {/* 内容 */}
                <div className="relative flex flex-col items-center rounded-[10px] bg-[#12102a] px-3 py-4">
                  {/* HOT 徽章 */}
                  <span className="mb-2 rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold uppercase text-white leading-none shadow-lg shadow-red-500/30">
                    {t('mining.hot')}
                  </span>
                  {/* 标题 */}
                  <span className="text-sm font-bold text-white text-center leading-snug">
                    {loading ? 'Loading...' : t('mining.downloadApk')}
                  </span>
                  {/* 副文字 */}
                  <p className="mt-1.5 text-[10px] text-gray-400 text-center leading-tight">
                    {t('mining.unlockFeatures')}
                  </p>
                </div>
              </a>

              {/* === Google Play 次按钮 === */}
              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-[120px] flex-shrink-0 flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-4 transition-all hover:border-white/15 hover:bg-white/[0.06]"
              >
                <GooglePlayIcon />
                <span className="mt-2 text-[10px] font-medium text-gray-300 group-hover:text-white text-center leading-tight">
                  {t('mining.googlePlay')}
                </span>
                <span className="mt-0.5 text-[9px] text-gray-600 text-center leading-tight">
                  {t('mining.standardVersion')}
                </span>
              </a>
            </div>

            {/* 底部提示 — 青色渐变 */}
            <p className="relative mt-4 text-center text-[11px] font-medium italic">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                {t('mining.apkTip')}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
