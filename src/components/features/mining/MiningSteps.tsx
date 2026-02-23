'use client';

import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Mining Steps — 三步走（始终横排三列，紧凑）
 */

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const PowerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
  </svg>
);

const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);

export default function MiningSteps() {
  const { t } = useLanguage();

  const steps = [
    { icon: <DownloadIcon />, gradient: 'from-purple-500 to-violet-600', title: t('mining.step1Title'), desc: t('mining.step1Desc') },
    { icon: <PowerIcon />, gradient: 'from-violet-500 to-cyan-500', title: t('mining.step2Title'), desc: t('mining.step2Desc') },
    { icon: <WalletIcon />, gradient: 'from-cyan-500 to-emerald-500', title: t('mining.step3Title'), desc: t('mining.step3Desc') },
  ];

  return (
    <section className="bg-[#06060f] px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="grid grid-cols-3 gap-3">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              {/* 渐变圆形图标 */}
              <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${step.gradient} shadow-lg`}>
                {step.icon}
              </div>
              <h3 className="mt-2 text-xs font-semibold text-white leading-tight">{step.title}</h3>
              <p className="mt-0.5 text-[10px] text-gray-500 leading-tight">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
