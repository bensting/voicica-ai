'use client';

import Hero from '@/components/sections/Hero';
import TTSSamples from '@/components/sections/tts-samples';
import FAQ from '@/components/sections/faq';
import CTA from '@/components/sections/CTA';
import AdsterraNativeBannerMarketing from '@/components/ads/AdsterraNativeBannerMarketing';
import AdsterraBanner from '@/components/ads/AdsterraBanner';
import AdsterraSocialBar from '@/components/ads/AdsterraSocialBar';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* TTS Samples Section */}
      <TTSSamples />

      {/* Ad: CTA 上方 - Banner 728x90 */}
      <AdsterraBanner />

      {/* CTA Section */}
      <CTA titleKey="cta.title" />

      {/* FAQ Section */}
      <FAQ />

      {/* Ad: 底部 - Native Banner */}
      <AdsterraNativeBannerMarketing position="Bottom" />

      {/* Adsterra Social Bar - 固定底部广告 */}
      <AdsterraSocialBar />
    </div>
  );
}
