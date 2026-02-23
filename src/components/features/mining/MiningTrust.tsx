'use client';

import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Mining Trust — 第四屏：背书墙
 * 灰色低对比度，三个标识横排居中
 */

/* AppLovin MAX 图标 */
const AppLovinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 12l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* 安全节点图标 */
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

/* DDoS 防护图标 */
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

export default function MiningTrust() {
  const { t } = useLanguage();

  const badges = [
    { icon: <AppLovinIcon />, label: 'AppLovin MAX' },
    { icon: <ShieldIcon />, label: t('mining.secureNode') },
    { icon: <LockIcon />, label: t('mining.ddosProtected') },
  ];

  return (
    <section className="bg-[#06060f] px-4 py-16">
      <div className="mx-auto max-w-3xl">
        {/* "Powered by" 小字 */}
        <p className="mb-6 text-center text-xs uppercase tracking-widest text-gray-600">
          {t('mining.poweredBy')}
        </p>

        {/* 三个标识横排 */}
        <div className="flex flex-wrap items-center justify-center gap-8">
          {badges.map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-gray-500">
              {badge.icon}
              <span className="text-sm font-medium">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
