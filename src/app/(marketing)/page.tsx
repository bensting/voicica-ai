'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Mic } from 'lucide-react';
import Hero from '@/components/sections/index-hero';
import TTSSamples from '@/components/sections/tts-samples';
import FAQ from '@/components/sections/faq';
import CTA from '@/components/sections/CTA';
import { AdBanner } from '@/components/ads';
import { useLanguage } from '@/contexts/LanguageContext';

// Hero Action Buttons Configuration
const HERO_ACTIONS = [
  {
    textKey: 'home.heroCTA',
    route: '/studio/tts',
    icon: Mic
  }
];

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();

  // 打印当前环境信息
  useEffect(() => {
    console.log('=== 环境信息 ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Next.js 环境:', process.env.NEXT_PUBLIC_VERCEL_ENV || 'local');
    console.log('PWA 状态: 已启用');
    console.log('===============');
  }, []);

  // Generate action buttons from configuration
  const actionButtons = HERO_ACTIONS.map(action => {
    const Icon = action.icon;
    return {
      text: t(action.textKey),
      icon: <Icon className="w-6 h-6" />,
      onClick: () => router.push(action.route)
    };
  });

  // TTS Hero features
  const heroFeatures = [
    t('home.heroFeature1'),
    t('home.heroFeature2'),
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section - TTS 变体：渐变背景 + 声波动效 */}
      <Hero
        brandName="Voicica"
        title={t('home.heroTitle')}
        subtitle={t('home.heroSubtitle')}
        features={heroFeatures}
        actionButtons={actionButtons}
        variant="tts"
      />

      {/* TTS Samples Section */}
      <TTSSamples />

      {/* 广告位 - TTS Samples 下方 */}
      <AdBanner slot="HOME_AFTER_SAMPLES" variant="section" />

      {/* CTA Section */}
      <CTA titleKey="cta.title" />

      {/* FAQ Section */}
      <FAQ />
    </div>
  );
}