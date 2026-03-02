'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface ProvablyFairSheetProps {
  isOpen: boolean;
  onClose: () => void;
  seed: string;
  seedHash: string;
  crashPoint: number;
}

export default function ProvablyFairSheet({ isOpen, onClose, seed, seedHash, crashPoint }: ProvablyFairSheetProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="mx-auto max-w-[430px] rounded-t-2xl bg-slate-900 border-t border-white/10 px-5 pt-4 pb-8 max-h-[70vh] overflow-y-auto">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <h2 className="text-lg font-bold text-white mb-4">{t('native.crashGame.provablyFair')}</h2>

          <div className="rounded-xl bg-white/5 p-4 text-xs space-y-3 border border-white/10">
            <div>
              <span className="text-white/40">{t('native.crashGame.seedLabel')}</span>
              <p className="text-white/70 font-mono break-all mt-0.5">{seed}</p>
            </div>
            <div>
              <span className="text-white/40">{t('native.crashGame.hashLabel')}</span>
              <p className="text-white/70 font-mono break-all mt-0.5">{seedHash}</p>
            </div>
            <div>
              <span className="text-white/40">{t('native.crashGame.crashPointLabel')}</span>
              <p className="text-white/70 font-mono mt-0.5">{crashPoint.toFixed(2)}x</p>
            </div>
          </div>

          <p className="text-white/30 text-[10px] mt-3 px-1">
            {t('native.crashGame.fairnessNote')}
          </p>

          <button
            onClick={onClose}
            className="mt-4 w-full rounded-xl bg-white/10 py-3 text-white font-medium text-sm hover:bg-white/15 transition"
          >
            {t('native.crashGame.gotIt')}
          </button>
        </div>
      </div>
    </>
  );
}
