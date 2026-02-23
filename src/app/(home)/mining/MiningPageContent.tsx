'use client';

import MiningHero from '@/components/features/mining/MiningHero';
import MiningSteps from '@/components/features/mining/MiningSteps';
import MiningDownload from '@/components/features/mining/MiningDownload';
import MiningLiveFeed from '@/components/features/mining/MiningLiveFeed';
import MiningTrust from '@/components/features/mining/MiningTrust';

/**
 * Mining 落地页客户端组装组件
 * 按 section 顺序渲染：Hero → Steps → Download → LiveFeed → Trust
 */
export default function MiningPageContent() {
  return (
    <main className="min-h-screen bg-[#06060f]">
      <MiningHero />
      <MiningSteps />
      <MiningDownload />
      <MiningLiveFeed />
      <MiningTrust />
    </main>
  );
}
