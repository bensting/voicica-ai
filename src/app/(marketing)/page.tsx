'use client';

import Hero from '@/components/sections/Hero';
import TTSSamples from '@/components/sections/tts-samples';
import FAQ from '@/components/sections/faq';
import CTA from '@/components/sections/CTA';
import AdsterraNativeBannerMarketing from '@/components/ads/AdsterraNativeBannerMarketing';
import AdsterraBanner from '@/components/ads/AdsterraBanner';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Ad: Hero 下方 - Native Banner */}
      <AdsterraNativeBannerMarketing position="Below Hero" />

      {/* TTS Samples Section */}
      <TTSSamples />

      {/* Ad: CTA 上方 - Banner 728x90 */}
      <AdsterraBanner />

      {/* CTA Section */}
      <CTA titleKey="cta.title" />

      {/* FAQ Section */}
      <FAQ />

      {/* Social Bar 广告已在 layout.tsx 中通过 AdsterraSocialBar 组件加载 */}
    </div>
  );
}
