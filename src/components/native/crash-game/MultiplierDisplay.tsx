'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface MultiplierDisplayProps {
  active: boolean;
  speed: number;
  startedAt: string;
  maxDurationSeconds: number;
  crashPoint?: number;
  onCrash?: (multiplier: number) => void;
  onExpire?: () => void;
  onMultiplierUpdate?: (multiplier: number) => void;
  displayState: 'idle' | 'playing' | 'win' | 'lose';
  finalMultiplier?: number;
}

const SIZE = 180;
const CENTER = SIZE / 2;
const OUTER_R = 82;
const INNER_R = 72;
const OUTER_CIRCUM = 2 * Math.PI * OUTER_R;

export default function MultiplierDisplay({
  active,
  speed,
  startedAt,
  maxDurationSeconds,
  crashPoint,
  onCrash,
  onExpire,
  onMultiplierUpdate,
  displayState,
  finalMultiplier,
}: MultiplierDisplayProps) {
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const rafRef = useRef<number>(0);
  const crashedRef = useRef(false);

  const animate = useCallback(() => {
    if (!active || !startedAt) return;
    const now = Date.now();
    const started = new Date(startedAt).getTime();
    const elapsedMs = now - started;
    if (elapsedMs < 0) { rafRef.current = requestAnimationFrame(animate); return; }

    const multiplier = Math.exp(speed * elapsedMs);
    const rounded = Math.floor(multiplier * 100) / 100;
    setCurrentMultiplier(rounded);
    setElapsedSeconds(elapsedMs / 1000);
    onMultiplierUpdate?.(rounded);

    // Check time expiration first
    if (maxDurationSeconds > 0 && elapsedMs >= maxDurationSeconds * 1000 && !crashedRef.current) {
      crashedRef.current = true;
      onExpire?.();
      return;
    }

    if (crashPoint && rounded >= crashPoint && !crashedRef.current) {
      crashedRef.current = true;
      onCrash?.(rounded);
      return;
    }
    rafRef.current = requestAnimationFrame(animate);
  }, [active, speed, startedAt, maxDurationSeconds, crashPoint, onCrash, onExpire, onMultiplierUpdate]);

  useEffect(() => {
    if (active) { crashedRef.current = false; rafRef.current = requestAnimationFrame(animate); }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, animate]);

  useEffect(() => {
    if (displayState === 'idle') { setCurrentMultiplier(1.00); setElapsedSeconds(0); }
  }, [displayState]);

  const displayMultiplier = displayState === 'playing' ? currentMultiplier : (finalMultiplier ?? currentMultiplier);
  const remaining = Math.max(0, maxDurationSeconds - elapsedSeconds);
  const progress = maxDurationSeconds > 0 ? remaining / maxDurationSeconds : 1;
  const strokeDashoffset = OUTER_CIRCUM * (1 - progress);
  const glowIntensity = Math.min(1, (displayMultiplier - 1) / 5);

  // Multiplier text color
  const getTextColor = () => {
    if (displayState === 'win') return '#4ade80';
    if (displayState === 'lose') return '#f87171';
    if (displayMultiplier >= 10) return '#facc15';
    if (displayMultiplier >= 5) return '#e879f9';
    if (displayMultiplier >= 2) return '#c084fc';
    return '#ffffff';
  };

  // Text glow color
  const getTextShadow = () => {
    const c = getTextColor();
    return `0 0 20px ${c}80, 0 0 40px ${c}40`;
  };

  // Progress ring gradient ID + colors
  const ringId = 'countdown-grad';
  const getRingColors = () => {
    if (displayState === 'lose') return ['#ef4444', '#dc2626'];
    if (displayState === 'win') return ['#4ade80', '#22c55e'];
    if (remaining < 10) return ['#ef4444', '#f97316'];
    if (remaining < 30) return ['#f97316', '#eab308'];
    return ['#a855f7', '#ec4899'];
  };
  const [ringC1, ringC2] = getRingColors();

  // Inner ball gradient
  const getBallGradient = () => {
    if (displayState === 'lose') return 'url(#ball-lose)';
    if (displayState === 'win') return 'url(#ball-win)';
    return 'url(#ball-play)';
  };

  // Inner ring glow color
  const getInnerStroke = () => {
    if (displayState === 'lose') return 'rgba(239,68,68,0.4)';
    if (displayState === 'win') return 'rgba(74,222,128,0.4)';
    if (displayMultiplier >= 5) return 'rgba(232,121,249,0.5)';
    return 'rgba(168,85,247,0.3)';
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* Outer ambient glow */}
      <div
        className="absolute rounded-full transition-all duration-500"
        style={{
          width: `${180 + glowIntensity * 60}px`,
          height: `${180 + glowIntensity * 60}px`,
          background: displayState === 'lose'
            ? `radial-gradient(circle, rgba(239,68,68,0.25) 0%, transparent 70%)`
            : displayState === 'win'
            ? `radial-gradient(circle, rgba(74,222,128,0.25) 0%, transparent 70%)`
            : `radial-gradient(circle, rgba(168,85,247,${0.15 + glowIntensity * 0.25}) 0%, rgba(236,72,153,${0.08 + glowIntensity * 0.15}) 50%, transparent 70%)`,
          filter: `blur(${30 + glowIntensity * 20}px)`,
        }}
      />

      {/* SVG orb */}
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="relative z-10">
        <defs>
          {/* Progress ring gradient */}
          <linearGradient id={ringId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ringC1} />
            <stop offset="100%" stopColor={ringC2} />
          </linearGradient>

          {/* Ball fill gradients */}
          <radialGradient id="ball-play" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="rgba(168,85,247,0.15)" />
            <stop offset="50%" stopColor="rgba(109,40,217,0.08)" />
            <stop offset="100%" stopColor="rgba(15,10,40,0.3)" />
          </radialGradient>
          <radialGradient id="ball-win" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="rgba(74,222,128,0.2)" />
            <stop offset="100%" stopColor="rgba(10,40,20,0.3)" />
          </radialGradient>
          <radialGradient id="ball-lose" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="rgba(239,68,68,0.2)" />
            <stop offset="100%" stopColor="rgba(40,10,10,0.3)" />
          </radialGradient>

          {/* Glass highlight */}
          <linearGradient id="glass-shine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* Ring glow filter */}
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring track */}
        <circle
          cx={CENTER} cy={CENTER} r={OUTER_R}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"
        />

        {/* Outer ring progress (countdown) */}
        {displayState === 'playing' && (
          <circle
            cx={CENTER} cy={CENTER} r={OUTER_R}
            fill="none"
            stroke={`url(#${ringId})`}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={OUTER_CIRCUM}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            filter="url(#ring-glow)"
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        )}

        {/* Inner glowing ring */}
        <circle
          cx={CENTER} cy={CENTER} r={INNER_R}
          fill={getBallGradient()}
          stroke={getInnerStroke()}
          strokeWidth="2"
          style={{ transition: 'stroke 0.3s, fill 0.3s' }}
        />

        {/* Glass highlight arc (top-left shine) */}
        <ellipse
          cx={CENTER - 8} cy={CENTER - 18}
          rx="32" ry="18"
          fill="url(#glass-shine)"
          transform={`rotate(-20 ${CENTER - 8} ${CENTER - 18})`}
        />
      </svg>

      {/* Center text overlay */}
      <div className="absolute z-20 flex flex-col items-center justify-center" style={{ width: SIZE, height: SIZE }}>
        {/* Multiplier */}
        <span
          className="text-[2.5rem] font-black tabular-nums leading-none transition-colors duration-200"
          style={{ color: getTextColor(), textShadow: getTextShadow() }}
        >
          {displayMultiplier.toFixed(2)}x
        </span>

        {/* Countdown */}
        {displayState === 'playing' && (
          <span
            className={`text-xs font-mono mt-1.5 tabular-nums transition-colors ${
              remaining < 10 ? 'text-red-400' : remaining < 30 ? 'text-orange-400' : 'text-white/35'
            }`}
          >
            {formatTime(remaining)}
          </span>
        )}
      </div>

      {/* Pulsing ring during play */}
      {displayState === 'playing' && (
        <div
          className="absolute z-0 rounded-full border border-purple-500/20 animate-ping"
          style={{
            width: `${SIZE + 20 + glowIntensity * 30}px`,
            height: `${SIZE + 20 + glowIntensity * 30}px`,
            animationDuration: `${Math.max(0.8, 2.5 - glowIntensity * 1.5)}s`,
          }}
        />
      )}
    </div>
  );
}
