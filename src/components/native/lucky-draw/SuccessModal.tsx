'use client';

import ConfettiBurst from '@/components/common/ConfettiBurst';

export interface SuccessModalProps {
  info: { credits: number; draws: number } | null;
  onClose: () => void;
}

export default function SuccessModal({ info, onClose }: SuccessModalProps) {
  if (!info) return null;

  return (
    <>
      <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm" />

      {/* Confetti layer */}
      <div className="fixed inset-0 z-[10002]">
        <ConfettiBurst count={50} />
      </div>

      {/* Modal card */}
      <div className="fixed inset-0 z-[10001] flex items-center justify-center px-8">
        <div className="bg-[#111127] rounded-3xl p-6 w-full max-w-sm text-center animate-[successPop_0.4s_ease-out]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h3 className="text-white font-bold text-xl mb-1">Purchase Complete!</h3>
          <p className="text-gray-400 text-sm mb-5">Your credits and draw entries are ready</p>

          <div className="bg-white/5 rounded-2xl p-4 mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">AI Credits</span>
              <span className="text-white font-bold text-lg">+{info.credits.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Free Draw Entries</span>
              <span className="text-emerald-400 font-bold text-lg">+{info.draws}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </>
  );
}
