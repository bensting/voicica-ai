'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { RiDownloadCloud2Fill, RiFlashlightFill, RiWallet3Fill } from 'react-icons/ri';

/**
 * Mining Steps — 三步走
 * 暗色卡片 + 渐变圆形图标 + 标题，无描述
 */
export default function MiningSteps() {
  const { t } = useLanguage();

  const steps = [
    { icon: <RiDownloadCloud2Fill className="w-6 h-6 text-white" />, gradient: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/25', title: t('mining.step1Title') },
    { icon: <RiFlashlightFill className="w-6 h-6 text-white" />, gradient: 'from-violet-500 to-cyan-500', shadow: 'shadow-violet-500/25', title: t('mining.step2Title') },
    { icon: <RiWallet3Fill className="w-6 h-6 text-white" />, gradient: 'from-cyan-500 to-emerald-500', shadow: 'shadow-cyan-500/25', title: t('mining.step3Title') },
  ];

  return (
    <section className="bg-[#06060f] px-4 py-3">
      <div className="mx-auto max-w-md">
        <div className="grid grid-cols-3 gap-2.5">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex aspect-square flex-col items-center rounded-2xl bg-[#12121f] px-2 pt-5 pb-3 text-center"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${step.gradient} shadow-lg ${step.shadow}`}>
                {step.icon}
              </div>
              <h3 className="mt-auto text-[11px] font-semibold text-white leading-tight">{step.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
