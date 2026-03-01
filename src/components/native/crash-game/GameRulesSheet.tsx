'use client';

interface GameRulesSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GameRulesSheet({ isOpen, onClose }: GameRulesSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="mx-auto max-w-[430px] rounded-t-2xl bg-slate-900 border-t border-white/10 max-h-[70vh] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Fixed title */}
          <h2 className="text-lg font-bold text-white px-5 pb-3">Crash Game Rules</h2>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5">
            <div className="space-y-4 text-sm text-white/70 leading-relaxed">
              <div>
                <h3 className="text-white font-semibold mb-1">How to Play</h3>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Enter your bet amount in $VOICICA and tap Start</li>
                  <li>Watch the multiplier rise from 1.00x</li>
                  <li>Tap Cash Out before the crash to lock in your winnings</li>
                  <li>If you don&apos;t cash out in time, you lose your bet</li>
                </ol>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-1">Winnings</h3>
                <p>Your payout = Bet Amount × Cash Out Multiplier</p>
                <p className="text-white/40 text-xs mt-1">Example: Bet 100, cash out at 2.50x → receive 250 $VOICICA</p>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-1">Provably Fair</h3>
                <p>Each round&apos;s crash point is determined before the game starts. A SHA-256 hash is shown during the game. After the round, the seed is revealed so you can verify:</p>
                <p className="font-mono text-xs text-purple-400 mt-1">SHA-256(seed) = displayed hash</p>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-1">Limits</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>One active game at a time</li>
                  <li>Game auto-expires after the max duration</li>
                  <li>The crash point can be as low as 1.00x (instant crash)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Fixed bottom button */}
          <div className="px-5 pt-3 pb-8">
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-white/10 py-3 text-white font-medium text-sm hover:bg-white/15 transition"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
