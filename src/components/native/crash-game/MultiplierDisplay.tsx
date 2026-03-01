'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface MultiplierDisplayProps {
  /** Game is running */
  active: boolean;
  /** Speed parameter for e^(speed * elapsedMs) */
  speed: number;
  /** Game start time (ISO string) */
  startedAt: string;
  /** Crash point - stop animation here when reached */
  crashPoint?: number;
  /** Called when multiplier exceeds crash point */
  onCrash?: (multiplier: number) => void;
  /** Called with current multiplier on each frame */
  onMultiplierUpdate?: (multiplier: number) => void;
  /** Display state: 'idle' | 'playing' | 'win' | 'lose' */
  displayState: 'idle' | 'playing' | 'win' | 'lose';
  /** Final multiplier to show on result */
  finalMultiplier?: number;
}

/**
 * Core multiplier display with energy ball animation
 */
export default function MultiplierDisplay({
  active,
  speed,
  startedAt,
  crashPoint,
  onCrash,
  onMultiplierUpdate,
  displayState,
  finalMultiplier,
}: MultiplierDisplayProps) {
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const rafRef = useRef<number>(0);
  const crashedRef = useRef(false);

  const animate = useCallback(() => {
    if (!active || !startedAt) return;

    const now = Date.now();
    const started = new Date(startedAt).getTime();
    const elapsedMs = now - started;

    if (elapsedMs < 0) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    const multiplier = Math.exp(speed * elapsedMs);
    const rounded = Math.floor(multiplier * 100) / 100;

    setCurrentMultiplier(rounded);
    onMultiplierUpdate?.(rounded);

    // Check if crashed
    if (crashPoint && rounded >= crashPoint && !crashedRef.current) {
      crashedRef.current = true;
      onCrash?.(rounded);
      return;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [active, speed, startedAt, crashPoint, onCrash, onMultiplierUpdate]);

  useEffect(() => {
    if (active) {
      crashedRef.current = false;
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [active, animate]);

  // Reset on idle
  useEffect(() => {
    if (displayState === 'idle') {
      setCurrentMultiplier(1.00);
    }
  }, [displayState]);

  const displayMultiplier = displayState === 'playing'
    ? currentMultiplier
    : (finalMultiplier ?? currentMultiplier);

  // Color based on state and multiplier
  const getColor = () => {
    if (displayState === 'win') return 'text-green-400';
    if (displayState === 'lose') return 'text-red-400';
    if (displayMultiplier >= 5) return 'text-yellow-400';
    if (displayMultiplier >= 2) return 'text-purple-300';
    return 'text-white';
  };

  // Glow intensity scales with multiplier
  const glowIntensity = Math.min(1, (displayMultiplier - 1) / 5);

  return (
    <div className="relative flex flex-col items-center justify-center py-12">
      {/* Energy ball glow */}
      <div
        className="absolute rounded-full transition-all duration-300"
        style={{
          width: `${120 + glowIntensity * 80}px`,
          height: `${120 + glowIntensity * 80}px`,
          background: displayState === 'lose'
            ? `radial-gradient(circle, rgba(239,68,68,${0.3 + glowIntensity * 0.3}) 0%, transparent 70%)`
            : displayState === 'win'
            ? `radial-gradient(circle, rgba(74,222,128,${0.3 + glowIntensity * 0.3}) 0%, transparent 70%)`
            : `radial-gradient(circle, rgba(168,85,247,${0.2 + glowIntensity * 0.4}) 0%, rgba(236,72,153,${0.1 + glowIntensity * 0.2}) 50%, transparent 70%)`,
          filter: `blur(${20 + glowIntensity * 20}px)`,
        }}
      />

      {/* Energy ball core */}
      <div
        className={`relative z-10 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
          displayState === 'lose'
            ? 'border-red-500/50 bg-red-500/10'
            : displayState === 'win'
            ? 'border-green-500/50 bg-green-500/10'
            : 'border-purple-500/50 bg-purple-500/10'
        }`}
        style={{
          width: `${100 + glowIntensity * 40}px`,
          height: `${100 + glowIntensity * 40}px`,
        }}
      >
        {/* Multiplier text */}
        <span className={`text-4xl font-black tabular-nums ${getColor()} transition-colors`}>
          {displayMultiplier.toFixed(2)}x
        </span>
      </div>

      {/* Pulsing ring during play */}
      {displayState === 'playing' && (
        <div
          className="absolute rounded-full border border-purple-400/30 animate-ping"
          style={{
            width: `${140 + glowIntensity * 60}px`,
            height: `${140 + glowIntensity * 60}px`,
            animationDuration: `${Math.max(0.5, 2 - glowIntensity)}s`,
          }}
        />
      )}
    </div>
  );
}
