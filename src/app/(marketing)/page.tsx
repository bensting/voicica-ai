'use client';

import { useRouter } from 'next/navigation';
import { Mic } from 'lucide-react';
import Hero from '@/components/sections/index-hero';
import TTSSamples from '@/components/sections/tts-samples';
import FAQ from '@/components/sections/faq';
import CTA from '@/components/sections/CTA';

// Hero Configuration
const HERO_CONFIG = {
  backgroundVideo: 'https://pub-dc353f0aede3432493780267c47faff7.r2.dev/voice-labs-assets/banner.mp4',
};

// Hero Action Buttons Configuration
const HERO_ACTIONS = [
  {
    text: 'Text to Speech',
    route: '/studio/tts',
    icon: Mic
  }
];

export default function Home() {
  const router = useRouter();

  // Generate action buttons from configuration
  const actionButtons = HERO_ACTIONS.map(action => {
    const Icon = action.icon;
    return {
      text: action.text,
      icon: <Icon className="w-6 h-6" />,
      onClick: () => router.push(action.route)
    };
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero
        brandName="AI Voice Labs"
        title="One Stop AI Voice Solution for"
        highlight="Speech & Cloned Voice"
        description="Everything you need to create high-quality videos with music and voiceovers in one place. No technical skills required. Bring your best ideas to life in VoiceLabsAI now."
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