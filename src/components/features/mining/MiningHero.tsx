'use client';

import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Mining Hero — 标题 + 副标题 + 晶体动画
 * 紧凑布局：标题在上，晶体在下
 */
export default function MiningHero() {
  const { t } = useLanguage();

  return (
    <section className="relative flex flex-col items-center overflow-hidden bg-[#06060f] px-4 pt-8 pb-6">
      {/* 背景：微弱 radial-gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(120,80,255,0.1)_0%,_transparent_60%)]" />
      </div>

      {/* 标题 */}
      <h1 className="relative text-center text-3xl md:text-5xl font-extrabold leading-tight">
        <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
          {t('mining.heroTitle')}
        </span>
      </h1>

      {/* 副标题 */}
      <p className="relative mt-2 max-w-sm text-center text-sm text-gray-400 leading-relaxed">
        {t('mining.heroSubtitle')}
      </p>

      {/* 晶体动画 */}
      <div className="relative mt-6 animate-crystal-float">
        {/* 外围旋转光环 — 单圈 */}
        <div
          className="absolute -inset-6 rounded-full animate-spin"
          style={{ animationDuration: '12s' }}
        >
          <div className="absolute inset-0 rounded-full border border-purple-500/25" />
          {/* 轨道上的亮点 */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.6)]" />
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_2px_rgba(244,114,182,0.5)]" />
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-purple-300 shadow-[0_0_6px_2px_rgba(196,181,253,0.4)]" />
        </div>

        {/* 脉动光晕 */}
        <div className="absolute -inset-10 rounded-full bg-purple-500/8 blur-3xl animate-pulse" />

        {/* 晶体本体 — 六边形 */}
        <div
          className="relative w-[160px] h-[160px] md:w-[200px] md:h-[200px]"
          style={{
            clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-violet-500 to-cyan-400" />
          <div
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-spin"
            style={{ animationDuration: '5s' }}
          />
          <div className="absolute top-4 left-6 w-12 h-8 rounded-full bg-white/20 blur-md rotate-[-20deg]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.12)_0%,_transparent_60%)]" />
        </div>
      </div>
    </section>
  );
}
