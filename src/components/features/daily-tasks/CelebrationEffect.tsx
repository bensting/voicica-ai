'use client';

import { useEffect, useRef } from 'react';
import ConfettiBurst from '@/components/common/ConfettiBurst';

interface CelebrationEffectProps {
  credits: number;
  onComplete?: () => void;
}

/**
 * 庆祝效果组件 - 喷射撒花 + 积分弹窗
 */
export default function CelebrationEffect({ credits, onComplete }: CelebrationEffectProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = setTimeout(() => {
      onCompleteRef.current?.();
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[10001] pointer-events-none overflow-hidden">
      <ConfettiBurst count={50} />

      {/* 中心积分显示 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-celebration-pop">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse scale-150" />
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-5 rounded-2xl shadow-2xl">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1 animate-bounce">
                  +{credits.toLocaleString()}
                </div>
                <div className="text-sm opacity-90">Credits Earned!</div>
              </div>
            </div>
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
