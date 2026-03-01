'use client';

import { createPortal } from 'react-dom';

/**
 * 品牌化全屏导航 loading 遮罩
 * Logo + 渐变进度条动画，与 splash 统一风格
 */
export default function NativeLoadingOverlay({ visible }: { visible: boolean }) {
  if (!visible || typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#060613]/90 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center">
        {/* Logo + 光环 */}
        <div className="relative">
          <div
            className="absolute inset-0 -m-2 rounded-full border border-purple-500/20 animate-ping"
            style={{ animationDuration: '2s' }}
          />
          <picture>
            <source srcSet="/logo/logo-transparent-256.webp" type="image/webp" />
            <img src="/logo/logo-transparent.png" alt="" width={48} height={48} className="w-12 h-12" />
          </picture>
        </div>
        {/* 渐变进度条动画 */}
        <div className="w-24 h-0.5 bg-white/10 rounded-full overflow-hidden mt-5">
          <div className="h-full bg-gradient-to-r from-purple-500 to-amber-400 rounded-full animate-[nav-loading_1.5s_ease-in-out_infinite]" />
        </div>
        {/* Tagline */}
        <p className="mt-4 text-[10px] text-white/20 font-medium tracking-widest uppercase">VOICICA PRINTS MONEY</p>
      </div>
    </div>,
    document.body,
  );
}
