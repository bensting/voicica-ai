'use client';

import { useEffect, useRef, useCallback } from 'react';

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

// Color thresholds
function getTextColor(m: number, state: string) {
  if (state === 'win') return '#4ade80';
  if (state === 'lose') return '#f87171';
  if (m >= 10) return '#facc15';
  if (m >= 5) return '#e879f9';
  if (m >= 2) return '#c084fc';
  return '#ffffff';
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

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
  const rafRef = useRef<number>(0);
  const crashedRef = useRef(false);
  const lastParentUpdateRef = useRef(0);

  // DOM refs for direct manipulation (no re-render)
  const multiplierTextRef = useRef<HTMLSpanElement>(null);
  const countdownTextRef = useRef<HTMLSpanElement>(null);
  const progressRingRef = useRef<SVGCircleElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  // Stable refs for callbacks to avoid re-creating animate
  const onCrashRef = useRef(onCrash);
  onCrashRef.current = onCrash;
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const onMultiplierUpdateRef = useRef(onMultiplierUpdate);
  onMultiplierUpdateRef.current = onMultiplierUpdate;

  const animate = useCallback(() => {
    if (!active || !startedAt) return;
    const now = Date.now();
    const started = new Date(startedAt).getTime();
    const elapsedMs = now - started;
    if (elapsedMs < 0) { rafRef.current = requestAnimationFrame(animate); return; }

    const multiplier = Math.exp(speed * elapsedMs);
    const rounded = Math.floor(multiplier * 100) / 100;
    const elapsedSec = elapsedMs / 1000;
    const remaining = Math.max(0, maxDurationSeconds - elapsedSec);

    // Direct DOM updates — no setState, no re-render
    if (multiplierTextRef.current) {
      const color = getTextColor(rounded, 'playing');
      multiplierTextRef.current.textContent = `${rounded.toFixed(2)}x`;
      multiplierTextRef.current.style.color = color;
      multiplierTextRef.current.style.textShadow = `0 0 20px ${color}80, 0 0 40px ${color}40`;
    }
    if (countdownTextRef.current) {
      countdownTextRef.current.textContent = formatTime(remaining);
      countdownTextRef.current.style.color = remaining < 10 ? '#f87171' : remaining < 30 ? '#fb923c' : 'rgba(255,255,255,0.35)';
    }
    if (progressRingRef.current) {
      const progress = maxDurationSeconds > 0 ? remaining / maxDurationSeconds : 1;
      progressRingRef.current.style.strokeDashoffset = String(OUTER_CIRCUM * (1 - progress));
    }

    // Throttle parent callback to ~20fps (every 50ms)
    if (now - lastParentUpdateRef.current > 50) {
      lastParentUpdateRef.current = now;
      onMultiplierUpdateRef.current?.(rounded);
    }

    // Check time expiration
    if (maxDurationSeconds > 0 && elapsedMs >= maxDurationSeconds * 1000 && !crashedRef.current) {
      crashedRef.current = true;
      onExpireRef.current?.();
      return;
    }

    // Check crash point
    if (crashPoint && rounded >= crashPoint && !crashedRef.current) {
      crashedRef.current = true;
      onCrashRef.current?.(rounded);
      return;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [active, speed, startedAt, maxDurationSeconds, crashPoint]);

  useEffect(() => {
    if (active) {
      crashedRef.current = false;
      lastParentUpdateRef.current = 0;
      rafRef.current = requestAnimationFrame(animate);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, animate]);

  // Static display values (for non-playing states)
  const displayMultiplier = finalMultiplier ?? 1.00;
  const textColor = getTextColor(displayMultiplier, displayState);
  const textShadow = `0 0 20px ${textColor}80, 0 0 40px ${textColor}40`;

  const getBallGradient = () => {
    if (displayState === 'lose') return 'url(#ball-lose)';
    if (displayState === 'win') return 'url(#ball-win)';
    return 'url(#ball-play)';
  };

  const getInnerStroke = () => {
    if (displayState === 'lose') return 'rgba(239,68,68,0.4)';
    if (displayState === 'win') return 'rgba(74,222,128,0.4)';
    return 'rgba(168,85,247,0.3)';
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* Outer ambient glow */}
      <div
        ref={glowRef}
        className={`absolute rounded-full transition-all duration-500 ${displayState === 'idle' ? 'idle-glow' : ''}`}
        style={{
          width: 200, height: 200,
          background: displayState === 'lose'
            ? 'radial-gradient(circle, rgba(239,68,68,0.25) 0%, transparent 70%)'
            : displayState === 'win'
            ? 'radial-gradient(circle, rgba(74,222,128,0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(236,72,153,0.12) 50%, transparent 70%)',
          filter: 'blur(35px)',
        }}
      />

      {/* SVG orb */}
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className={`relative z-10 ${displayState === 'idle' ? 'idle-breathe' : ''}`}>
        <defs>
          <linearGradient id="countdown-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
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
          <linearGradient id="glass-shine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring track */}
        <circle cx={CENTER} cy={CENTER} r={OUTER_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />

        {/* Outer ring progress (countdown) */}
        <circle
          ref={progressRingRef}
          cx={CENTER} cy={CENTER} r={OUTER_R}
          fill="none"
          stroke="url(#countdown-grad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={OUTER_CIRCUM}
          strokeDashoffset={displayState === 'playing' ? 0 : OUTER_CIRCUM}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          filter="url(#ring-glow)"
          style={{ display: displayState === 'playing' ? undefined : 'none' }}
        />

        {/* Inner glowing ring */}
        <circle
          cx={CENTER} cy={CENTER} r={INNER_R}
          fill={getBallGradient()}
          stroke={getInnerStroke()}
          strokeWidth="2"
          style={{ transition: 'stroke 0.3s, fill 0.3s' }}
        />

        {/* Glass highlight arc */}
        <ellipse
          cx={CENTER - 8} cy={CENTER - 18}
          rx="32" ry="18"
          fill="url(#glass-shine)"
          transform={`rotate(-20 ${CENTER - 8} ${CENTER - 18})`}
        />
      </svg>

      {/* Center text overlay */}
      <div className="absolute z-20 flex flex-col items-center justify-center" style={{ width: SIZE, height: SIZE }}>
        {/* Multiplier — during playing, updated via ref; otherwise static */}
        <span
          ref={multiplierTextRef}
          className="text-[2.5rem] font-black tabular-nums leading-none"
          style={{
            color: displayState === 'playing' ? '#ffffff' : textColor,
            textShadow: displayState === 'playing' ? '0 0 20px rgba(255,255,255,0.5)' : textShadow,
          }}
        >
          {displayState === 'playing' ? '1.00x' : `${displayMultiplier.toFixed(2)}x`}
        </span>

        {/* Countdown — updated via ref */}
        <span
          ref={countdownTextRef}
          className="text-xs font-mono mt-1.5 tabular-nums"
          style={{
            color: 'rgba(255,255,255,0.35)',
            display: displayState === 'playing' ? undefined : 'none',
          }}
        >
          {formatTime(maxDurationSeconds)}
        </span>
      </div>

      {/* Pulsing ring during play */}
      {displayState === 'playing' && (
        <div
          className="absolute z-0 rounded-full border border-purple-500/20 animate-ping pointer-events-none"
          style={{ width: 210, height: 210, animationDuration: '2s' }}
        />
      )}

      {/* Idle breathing animation */}
      {displayState === 'idle' && (
        <style>{`
          @keyframes idle-breathe {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.04); opacity: 0.85; }
          }
          @keyframes idle-glow {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
          .idle-breathe { animation: idle-breathe 3s ease-in-out infinite; }
          .idle-glow { animation: idle-glow 3s ease-in-out infinite; }
        `}</style>
      )}
    </div>
  );
}
