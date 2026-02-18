'use client';

export interface RulesSheetProps {
  open: boolean;
  onClose: () => void;
  prize: string;
  totalSlots: number;
  creditsPerPurchase: number;
  stripePriceCents: number;
  cryptoPriceCents: number;
  chainName: string | null;
}

export default function RulesSheet({
  open,
  onClose,
  prize,
  totalSlots,
  creditsPerPurchase,
  stripePriceCents,
  cryptoPriceCents,
  chainName,
}: RulesSheetProps) {
  if (!open) return null;

  const stripePriceUsd = stripePriceCents / 100;
  const cryptoPriceUsd = cryptoPriceCents / 100;

  return (
    <>
      <div
        className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-[10001] bg-[#111127] rounded-t-3xl animate-slide-up max-h-[70vh] flex flex-col"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        <div className="px-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-lg">Rules & Terms</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
            <div>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">Credit Packs</h4>
              <ul className="space-y-1.5 text-gray-400 text-xs">
                <li>Each credit pack contains {creditsPerPurchase} AI credits, priced at ${cryptoPriceUsd.toFixed(2)} (crypto) or ${stripePriceUsd.toFixed(2)} + $0.30 fee (card).</li>
                <li>Every pack purchase includes a FREE lucky draw entry.</li>
                <li>Maximum {totalSlots.toLocaleString()} packs per draw round.</li>
                <li>No limit per user — more packs, more credits, higher win probability.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">Draw Mechanism</h4>
              <ul className="space-y-1.5 text-gray-400 text-xs">
                <li>Draw triggers automatically when all {totalSlots.toLocaleString()} entries are sold.</li>
                <li>Winner is determined by: <span className="text-white font-mono">blockHash % {totalSlots.toLocaleString()}</span></li>
                <li>The result is recorded on-chain ({chainName}) and publicly verifiable.</li>
                <li>No one — including the platform — can influence or predict the outcome.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">Prize</h4>
              <ul className="space-y-1.5 text-gray-400 text-xs">
                <li>Current prize: {prize}.</li>
                <li>Winner will be contacted via registered email within 48 hours.</li>
                <li>Prize is non-transferable and cannot be exchanged for cash.</li>
                <li>Shipping is free worldwide.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">AI Credits</h4>
              <ul className="space-y-1.5 text-gray-400 text-xs">
                <li>Credits are delivered instantly to your account after purchase.</li>
                <li>Credits can be used for all AI features: TTS, voice cloning, image, music, and video generation.</li>
                <li>Credits do not expire.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
