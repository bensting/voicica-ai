'use client';

import { useEffect, useState } from 'react';

interface CelebrationEffectProps {
  credits: number;
  onComplete?: () => void;
}

/**
 * 庆祝效果组件 - 显示获得积分的动画
 */
export default function CelebrationEffect({ credits, onComplete }: CelebrationEffectProps) {
  const [confetti, setConfetti] = useState<Array<{
    id: number;
    x: number;
    delay: number;
    color: string;
    size: number;
  }>>([]);

  useEffect(() => {
    // 生成随机彩色纸屑
    const colors = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
    }));
    setConfetti(particles);

    // 2.5秒后触发完成回调
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[10001] pointer-events-none overflow-hidden">
      {/* 彩色纸屑动画 */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti"
          style={{
            left: `${particle.x}%`,
            top: '-20px',
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}

      {/* 中心积分显示 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-celebration-pop">
          <div className="relative">
            {/* 光晕效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse scale-150" />

            {/* 主要内容 */}
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-5 rounded-2xl shadow-2xl">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1 animate-bounce">
                  +{credits.toLocaleString()}
                </div>
                <div className="text-sm opacity-90">Credits Earned!</div>
              </div>
            </div>

            {/* 星星装饰 */}
            <div className="absolute -top-3 -left-3 text-2xl animate-spin-slow">✨</div>
            <div className="absolute -top-2 -right-4 text-xl animate-spin-slow" style={{ animationDelay: '0.2s' }}>⭐</div>
            <div className="absolute -bottom-2 -left-2 text-xl animate-spin-slow" style={{ animationDelay: '0.4s' }}>🌟</div>
            <div className="absolute -bottom-3 -right-3 text-2xl animate-spin-slow" style={{ animationDelay: '0.6s' }}>✨</div>
          </div>
        </div>
      </div>
    </div>
  );
}
