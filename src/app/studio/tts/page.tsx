'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserCredits } from '@/hooks/useUserCredits';
import TTSGenerator from '@/components/features/studio/TTSGenerator';
import StudioToolbar from '@/components/features/studio/StudioToolbar';

/**
 * Studio TTS Page
 *
 * Text-to-Speech generation page with:
 * - Dynamic user credits display
 * - Internationalization support
 * - Upgrade navigation
 */
export default function StudioTTSPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { credits } = useUserCredits();

  const handleUpgradeClick = () => {
    router.push('/subscription');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 pt-16">
      {/* Studio Toolbar */}
      <StudioToolbar
        title={t('studio.tts')}
        credits={credits}
        onUpgradeClick={handleUpgradeClick}
      />

      {/* TTS Generator Section */}
      <section className="pb-12">
        <TTSGenerator maxCharacters={500} />
      </section>
    </div>
  );
}