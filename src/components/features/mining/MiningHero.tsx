'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import EnergyOrb from '@/components/common/EnergyOrb';

/**
 * Mining Hero — 标题 + 副标题 + 放大版 EnergyOrb
 * 紧凑布局：标题在上，能量球在下
 */
export default function MiningHero() {
  const { t } = useLanguage();

  return (
    <section className="relative flex flex-col items-center overflow-hidden bg-[#06060f] px-4 pt-16 pb-6">
      {/* 背景层 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_60%,_rgba(120,60,255,0.12)_0%,_transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(34,211,238,0.05)_0%,_transparent_40%)]" />
        {/* 星空微粒 */}
        {[
          [8,12],[15,78],[22,45],[31,88],[38,23],[45,56],[52,67],[58,34],
          [65,91],[72,8],[78,42],[85,73],[92,19],[12,61],[27,85],[43,37],
          [57,52],[68,14],[33,76],[48,29],[62,64],[76,47],[88,83],[19,70],[55,5],
        ].map(([top, left], i) => {
          const size = [1,1.5,1,2,1,1.5,1,1,1.5,1,2,1,1.5,1,1,2,1,1.5,1,1,1,1.5,1,1,2][i];
          const delay = [0,1.2,0.5,2.1,0.8,1.5,0.3,2.5,1.8,0.6,1.1,2.3,0.9,1.7,0.2,2.8,1.3,0.4,2.0,1.6,0.7,2.4,1.0,1.9,0.1][i];
          const dur = [3,4,3.5,2.5,4,3,3.5,4,2.5,3.5,3,4,2.5,3.5,4,3,2.5,3.5,4,3,3.5,2.5,4,3,3.5][i];
          return (
            <div
              key={i}
              className="absolute rounded-full bg-white/30"
              style={{
                width: `${size}px`, height: `${size}px`,
                top: `${top}%`, left: `${left}%`,
                animation: `pulse ${dur}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      {/* 标题 */}
      <h1 className="relative text-center text-3xl md:text-5xl font-extrabold leading-tight">
        <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
          {t('mining.heroTitle')}
        </span>
      </h1>

      {/* 副标题 */}
      <p className="relative mt-2 text-center text-sm text-gray-400 leading-relaxed whitespace-nowrap">
        {t('mining.heroSubtitle')}
      </p>

      {/* 放大版 EnergyOrb */}
      <div className="relative mt-6 scale-[1.8] animate-crystal-float">
        <EnergyOrb />
      </div>
      {/* scale-[1.8] 撑出的空间补偿 */}
      <div className="h-16" />
    </section>
  );
}
