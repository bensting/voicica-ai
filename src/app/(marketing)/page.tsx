'use client';

import Hero from '@/components/sections/Hero';
import TTSSamples from '@/components/sections/tts-samples';
import FAQ from '@/components/sections/faq';
import CTA from '@/components/sections/CTA';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* TTS Samples Section */}
      <TTSSamples />

      {/* CTA Section */}
      <CTA titleKey="cta.title" />

      {/* FAQ Section */}
      <FAQ />
    </div>
  );
}
