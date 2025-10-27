'use client';

import { useRouter } from 'next/navigation';
import { Mic } from 'lucide-react';
import Hero from '@/components/sections/Hero';
import TTSSamples from '@/components/sections/tts-samples';
import FAQ from '@/components/sections/FAQ';

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
        description="Everything you need to create high-quality videos with music and voiceovers in one place. No technical skills required. Bring your best ideas to life in TopMediAi now."
        actionButtons={actionButtons}
        // backgroundVideo="/videos/hero-background.mp4" // 如果有视频可以添加
        // backgroundImage="/images/hero-bg.jpg" // 或者使用图片
      />

      {/* TTS Samples Section */}
      <TTSSamples />

      {/* FAQ Section */}
      <FAQ />

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-purple-800">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of creators using AI Voice Labs today.
          </p>
          <button className="px-8 py-3 bg-white text-purple-600 rounded-full font-medium hover:bg-gray-100 transition-colors shadow-lg">
            Start Free Trial
          </button>
        </div>
      </section>
    </div>
  );
}