'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLatestRelease } from '@/actions/admin/app-releases';

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=ai.voicica.app';

/* Android 机器人图标 */
const AndroidIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#3DDC84">
    <path d="M17.523 15.341c-.5 0-.908.406-.908.905s.408.906.908.906c.5 0 .906-.407.906-.906s-.406-.905-.906-.905zm-11.046 0c-.5 0-.908.406-.908.905s.408.906.908.906c.5 0 .908-.407.908-.906s-.408-.905-.908-.905zm11.4-6.029l1.96-3.395a.407.407 0 00-.704-.407l-1.984 3.438c-1.47-.67-3.12-1.043-4.896-1.043s-3.426.373-4.896 1.043L5.373 5.51a.407.407 0 00-.704.407l1.96 3.395C3.571 11.018 1.6 14.018 1.6 17.497h20.8c0-3.479-1.971-6.479-5.023-8.185z" />
  </svg>
);

/* Google Play 彩色图标 */
const GooglePlayIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0">
    <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.609 22.186a2.168 2.168 0 01-.609-1.529V3.343c0-.569.221-1.103.609-1.529z" />
    <path fill="#FBBC04" d="M17.727 8.062L14.839 12l2.888 3.938 4.265-2.472c.793-.459.793-1.472 0-1.931l-4.265-2.473z" />
    <path fill="#34A853" d="M3.609 22.186l10.183-10.186L17.727 15.938 6.044 22.723a2.015 2.015 0 01-2.435-.537z" />
    <path fill="#4285F4" d="M3.609 1.814a2.015 2.015 0 012.435-.537L17.727 8.062 13.792 12 3.609 1.814z" />
  </svg>
);

/**
 * Mining Download — 第三屏：核心转化区
 * APK 主按钮 + Google Play 次按钮 + 底部提示
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
    <section className="relative bg-[#06060f] px-4 py-16">
      <div className="mx-auto max-w-md">
        {/* 深紫色高亮卡片 — 渐变边框发光 */}
        <div className="relative rounded-3xl p-[1px]">
          {/* 渐变边框 */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-purple-500/50 via-violet-500/30 to-cyan-500/40" />

          {/* 内容容器 */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#12102a] to-[#0a0a18]">
            {/* 背景装饰 */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-purple-600/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative px-6 py-8">
              {/* ===== 主按钮：APK 下载 ===== */}
              <a
                href={apkUrl || '#'}
                onClick={(e) => {
                  if (!apkUrl || loading) e.preventDefault();
                }}
                className={`group relative block overflow-hidden rounded-2xl p-[1px] transition-all ${
                  apkUrl && !loading
                    ? 'hover:shadow-xl hover:shadow-purple-500/25'
                    : 'opacity-50'
                }`}
              >
                {/* 渐变边框 */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" />

                {/* 卡片内容 */}
                <div className="relative rounded-[15px] bg-gradient-to-br from-[#1a1030] to-[#0f0f1a] p-4">
                  <div className="flex items-center gap-3.5">
                    {/* 图标 */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#3DDC84]/15 ring-1 ring-[#3DDC84]/30">
                      <AndroidIcon />
                    </div>

                    {/* 文字 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-white">
                          {loading ? 'Loading...' : t('mining.downloadApk')}
                        </span>
                        {/* HOT 红色徽章 */}
                        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white leading-none">
                          {t('mining.hot')}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400">
                        {t('mining.unlockFeatures')}
                      </p>
                    </div>
                  </div>
                </div>
              </a>

              {/* 分隔线 */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              {/* ===== 次按钮：Google Play ===== */}
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
                    {t('mining.standardVersion')}
                  </p>
                </div>
                <svg className="h-4 w-4 flex-shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>

              {/* 底部提示 */}
              <p className="mt-5 text-center text-xs text-purple-300/70">
                {t('mining.apkTip')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
