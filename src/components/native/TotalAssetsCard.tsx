'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCredits } from '@/utils/formatCredits';
import { useCredits } from '@/contexts/CreditsContext';
export default function TotalAssetsCard() {
  const { t } = useLanguage();
  const { credits, loading } = useCredits();

  return (
    <div className="mx-4 mt-2 rounded-2xl bg-gradient-to-br from-purple-900/40 via-[#1e1e3a]/80 to-[#1a1a35]/80 border border-purple-500/15 backdrop-blur-sm overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <p className="text-gray-400 text-sm font-medium">
          {t('native.totalAssets.title')}
        </p>
      </div>

      <div className="px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-500/25 flex items-center justify-center overflow-hidden">
              <Image src="/logo/voicica-token.png" alt="VOICICA" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="text-gray-300 text-sm font-medium">$VOICICA</span>
          </div>
          <span className="text-white text-sm font-semibold">
            {loading ? '...' : formatCredits(credits)}
          </span>
        </div>
      </div>
    </div>
  );
}
