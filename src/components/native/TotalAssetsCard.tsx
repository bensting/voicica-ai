'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCredits } from '@/utils/formatCredits';
import { useCredits } from '@/contexts/CreditsContext';

interface TotalAssetsCardProps {
  claimThreshold?: number;
  onClaim?: () => void;
}

export default function TotalAssetsCard({ claimThreshold, onClaim }: TotalAssetsCardProps) {
  const { t } = useLanguage();
  const { credits, loading } = useCredits();

  const isLow = !loading && claimThreshold !== undefined && credits < claimThreshold;

  return (
    <div className="mx-4 mt-2 rounded-2xl bg-gradient-to-br from-purple-900/40 via-[#1e1e3a]/80 to-[#1a1a35]/80 border border-purple-500/15 backdrop-blur-sm overflow-hidden">
      <div className="px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-500/25 flex items-center justify-center overflow-hidden">
            <Image src="/logo/voicica-token.png" alt="VOICICA" width={28} height={28} className="w-full h-full object-cover" />
          </div>
          <span className="text-gray-400 text-sm">{t('native.totalAssets.title')}</span>
        </div>
        <span className="text-white text-sm font-semibold">
          {loading ? '...' : formatCredits(credits)}
        </span>
      </div>

      {isLow && onClaim && (
        <button
          onClick={onClaim}
          className="w-full flex items-center justify-between px-5 py-2.5 border-t border-purple-500/15 hover:bg-purple-500/5 transition-colors"
        >
          <span className="flex items-center gap-1.5 text-amber-400 text-xs">
            <span>🎁</span>
            <span>{t('native.totalAssets.lowCredits')}</span>
          </span>
          <span className="text-purple-400 text-xs font-medium flex items-center gap-0.5">
            {t('native.totalAssets.claimNow')}
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
