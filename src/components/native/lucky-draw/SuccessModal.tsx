'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const CONFETTI_COLORS = ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#f43f5e', '#facc15', '#22d3ee'];

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  drift: number;
}

function generateConfetti(count: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1.5,
    size: 4 + Math.random() * 6,
    drift: (Math.random() - 0.5) * 60,
  }));
}

export interface SuccessModalProps {
  info: { credits: number; draws: number } | null;
  onClose: () => void;
}

export default function SuccessModal({ info, onClose }: SuccessModalProps) {
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cleanup = useCallback(() => {
    setConfetti([]);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (info) {
      setConfetti(generateConfetti(60));
      timerRef.current = setTimeout(() => setConfetti([]), 3500);
    } else {
      cleanup();
    }
    return cleanup;
  }, [info, cleanup]);

  const handleClose = () => {
    cleanup();
    onClose();
  };

  if (!info) return null;

  return (
    <>
      <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm" />

      {/* Confetti layer */}
      <div className="fixed inset-0 z-[10002] pointer-events-none overflow-hidden">
        {confetti.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 animate-[confettiFall_var(--dur)_ease-out_var(--delay)_forwards]"
            style={{
              left: `${p.x}%`,
              '--delay': `${p.delay}s`,
              '--dur': `${p.duration}s`,
              '--drift': `${p.drift}px`,
            } as React.CSSProperties}
          >
            <div
              className="rounded-sm animate-[confettiSpin_0.6s_linear_infinite]"
              style={{
                width: p.size,
                height: p.size * 0.6,
                backgroundColor: p.color,
              }}
            />
          </div>
        ))}
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
            onClick={handleClose}
            className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </>
  );
}
