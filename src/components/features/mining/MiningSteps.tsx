'use client';

import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Mining Steps — 第二屏：三步走
 * 桌面横排三列、移动竖排，步骤间有连接线
 */

/* Step 图标 SVG */
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const PowerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);

export default function MiningSteps() {
  const { t } = useLanguage();

  const steps = [
    {
      icon: <DownloadIcon />,
      gradient: 'from-purple-500 to-violet-600',
      title: t('mining.step1Title'),
      desc: t('mining.step1Desc'),
    },
    {
      icon: <PowerIcon />,
      gradient: 'from-violet-500 to-cyan-500',
      title: t('mining.step2Title'),
      desc: t('mining.step2Desc'),
    },
    {
      icon: <WalletIcon />,
      gradient: 'from-cyan-500 to-emerald-500',
      title: t('mining.step3Title'),
      desc: t('mining.step3Desc'),
    },
  ];

  return (
    <section className="relative bg-[#06060f] px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
          {/* 桌面端连接线 */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-px border-t border-dashed border-purple-500/30" />

          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              {/* 渐变圆形图标 */}
              <div className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${step.gradient} shadow-lg`}>
                {step.icon}
                {/* 步骤编号 */}
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#06060f] text-xs font-bold text-purple-400 ring-2 ring-purple-500/40">
                  {i + 1}
                </span>
              </div>

              {/* 标题 */}
              <h3 className="mt-5 text-lg font-bold text-white">{step.title}</h3>

              {/* 描述 */}
              <p className="mt-2 text-sm text-gray-400 max-w-[220px] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
