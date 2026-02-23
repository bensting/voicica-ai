import MiningHero from '@/components/features/mining/MiningHero';
import MiningSteps from '@/components/features/mining/MiningSteps';
import MiningDownload from '@/components/features/mining/MiningDownload';
import MiningLiveFeed from '@/components/features/mining/MiningLiveFeed';
import MiningTrust from '@/components/features/mining/MiningTrust';
import { MINING_CONTENT } from '@/config/seo/mining';

/**
 * Mining 落地页组装组件
 * 按 section 顺序渲染：Hero → Steps → Download → LiveFeed → Trust
 */
export default function MiningPageContent({ locale }: { locale: string }) {
  const content = MINING_CONTENT[locale] || MINING_CONTENT.en;

  return (
    <main className="min-h-screen bg-[#06060f]">
      <MiningHero content={content.hero} />
      <MiningSteps steps={content.steps} />
      <MiningDownload content={content.download} />
      <MiningLiveFeed />
      <MiningTrust content={content.trust} />
    </main>
  );
}
