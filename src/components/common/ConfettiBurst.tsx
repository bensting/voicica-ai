'use client';

import { useMemo } from 'react';

const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

interface ConfettiBurstProps {
  /** 粒子数量，默认 30 */
  count?: number;
  /** 喷射中心 x 位置，默认 '50%' */
  cx?: string;
  /** 喷射中心 y 位置，默认 '45%' */
  cy?: string;
}

/**
 * 喷射撒花组件 — 从中心向四周爆炸
 * 使用 globals.css 中的 animate-confetti-burst 动画
 */
export default function ConfettiBurst({ count = 30, cx = '50%', cy = '45%' }: ConfettiBurstProps) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const dist = 80 + Math.random() * 120;
      return {
        id: i,
        w: Math.random() * 6 + 4,
        h: Math.random() * 6 + 4,
        color: COLORS[i % COLORS.length],
        round: i % 2 === 0,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist - 40,
        rot: Math.random() * 720 - 360,
        delay: Math.random() * 0.15,
      };
    }), [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-burst"
          style={{
            left: cx,
            top: cy,
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
            borderRadius: p.round ? '50%' : '2px',
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--rot': `${p.rot}deg`,
            animationDelay: `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
