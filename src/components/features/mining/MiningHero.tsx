'use client';

import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Mining Hero — 第一屏：视觉冲击 + 利益钩子
 * 大型 CSS 晶体动画 + 渐变标题 + 深色星空背景
 */
export default function MiningHero() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-[#06060f] px-4 py-20">
      {/* 背景：radial-gradient 星空粒子点阵 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(120,80,255,0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(0,200,200,0.06)_0%,_transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(160,80,255,0.05)_0%,_transparent_40%)]" />
        {/* 星空粒子点 */}
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* 中心晶体动画 */}
      <div className="relative mb-10 animate-crystal-float">
        {/* 外围旋转光环 */}
        <div
          className="absolute -inset-8 rounded-full animate-spin"
          style={{ animationDuration: '10s' }}
        >
          <div className="absolute inset-0 rounded-full border border-purple-500/30" />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_12px_3px_rgba(168,85,247,0.6)]" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400/70 shadow-[0_0_10px_3px_rgba(34,211,238,0.5)]" />
        </div>

        {/* 脉动光晕 */}
        <div className="absolute -inset-12 rounded-full bg-purple-500/10 blur-3xl animate-pulse" />
        <div className="absolute -inset-6 rounded-full bg-cyan-500/8 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* 晶体本体 — 六边形 */}
        <div
          className="relative w-[200px] h-[200px] md:w-[240px] md:h-[240px]"
          style={{
            clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
          }}
        >
          {/* 底色渐变 */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-violet-500 to-cyan-400" />
          {/* 内部能量流动 */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent animate-spin"
            style={{ animationDuration: '4s' }}
          />
          {/* 高光 */}
          <div className="absolute top-6 left-8 w-16 h-10 rounded-full bg-white/20 blur-md rotate-[-20deg]" />
          {/* 内部光晕 */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
        </div>

        {/* 漂浮粒子 */}
        {[...Array(8)].map((_, i) => {
          const angle = (360 / 8) * i;
          const delay = i * 0.35;
          const size = i % 2 === 0 ? 'w-1.5 h-1.5' : 'w-1 h-1';
          const color = i % 3 === 0 ? 'bg-purple-400' : i % 3 === 1 ? 'bg-cyan-400' : 'bg-violet-300';
          return (
            <div
              key={i}
              className={`absolute ${size} rounded-full ${color} animate-float-particle`}
              style={{
                top: '50%',
                left: '50%',
                '--float-angle': `${angle}deg`,
                '--float-delay': `${delay}s`,
                animationDelay: `${delay}s`,
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      {/* 标题 */}
      <h1 className="relative text-center text-4xl md:text-6xl font-extrabold leading-tight">
        <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
          {t('mining.heroTitle')}
        </span>
      </h1>

      {/* 副标题 */}
      <p className="relative mt-4 max-w-lg text-center text-base md:text-lg text-gray-400 leading-relaxed">
        {t('mining.heroSubtitle')}
      </p>
    </section>
  );
}
