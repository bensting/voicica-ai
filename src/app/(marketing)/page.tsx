'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Mic } from 'lucide-react';
import Hero from '@/components/sections/index-hero';
import TTSSamples from '@/components/sections/tts-samples';
import FAQ from '@/components/sections/faq';
import CTA from '@/components/sections/CTA';
import { useLanguage } from '@/contexts/LanguageContext';

// Hero Configuration
const HERO_CONFIG = {
  backgroundVideo: 'https://pub-dc353f0aede3432493780267c47faff7.r2.dev/voice-labs-assets/banner.mp4',
};

// Hero Action Buttons Configuration
const HERO_ACTIONS = [
  {
    textKey: 'studio.tts',
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero
        brandName="Voicica"
        title={t('home.heroTitle')}
        highlight={t('home.heroTitleHighlight')}
        description={t('home.heroDescription')}
        actionButtons={actionButtons}
        backgroundVideo={HERO_CONFIG.backgroundVideo}
      />

      {/* TTS Samples Section */}
      <TTSSamples />
      {/* CTA Section */}
      <CTA titleKey="cta.title" />

      {/* FAQ Section */}
      <FAQ />
    </div>
  );
}