'use client';

import Link from 'next/link';

/**
 * Mining 诱饵横幅 — 引导用户前往 /mining 了解更多
 * 深色科技渐变背景 + 能量球视觉 + CTA
 */
export default function MiningBanner() {
  return (
    <section className="bg-gray-950 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/mining" className="group block">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c0c20] via-[#10102a] to-[#0a1628] border border-white/[0.06] p-6 md:p-8">
            {/* 背景效果 */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {/* 底部青蓝光晕 */}
              <div className="absolute -bottom-10 right-0 h-40 w-60 rounded-full bg-cyan-500/8 blur-[80px]" />
              <div className="absolute -bottom-10 left-1/3 h-32 w-40 rounded-full bg-blue-600/8 blur-[60px]" />
              {/* 桌面端流动线条 */}
              <svg className="absolute right-0 bottom-0 h-full w-2/3 opacity-[0.15] hidden md:block" viewBox="0 0 400 200" fill="none">
                <path d="M0 150 C100 120, 200 180, 400 100" stroke="url(#ml1)" strokeWidth="1" />
                <path d="M0 130 C150 100, 250 160, 400 80" stroke="url(#ml2)" strokeWidth="0.8" />
                <path d="M0 170 C120 140, 280 190, 400 120" stroke="url(#ml3)" strokeWidth="0.6" />
                <defs>
                  <linearGradient id="ml1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="40%" stopColor="#a855f7" />
                    <stop offset="70%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                  <linearGradient id="ml2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="30%" stopColor="#7c3aed" />
                    <stop offset="80%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                  <linearGradient id="ml3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="90%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* ===== 移动端布局 ===== */}
            <div className="relative md:hidden">
              <h3 className="text-[22px] font-extrabold leading-tight">
                <span className="bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
                  Turn Your Phone into an AI Power Node
                </span>
              </h3>
              <p className="mt-3 text-[13px] text-gray-400/90 leading-relaxed">
                Join the Voicica ecosystem. Earn $VOICICA rewards while powering the future of AI Voice.
              </p>
              <div className="mt-5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 via-violet-500 to-cyan-400 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(139,92,246,0.3)]">
                  Learn More & Join
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                {/* 右下角迷你装饰粒子 */}
                <div className="flex gap-1 opacity-40">
                  <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
              </div>
            </div>

            {/* ===== 桌面端布局 ===== */}
            <div className="relative hidden md:flex md:items-center md:gap-8">
              {/* 迷你能量球 */}
              <div className="shrink-0">
                <div className="relative h-24 w-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-xl animate-pulse" />
                  <div className="absolute inset-1 rounded-full animate-spin" style={{ animationDuration: '8s' }}>
                    <div className="absolute inset-0 rounded-full border border-purple-500/30" />
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_2px_rgba(168,85,247,0.5)]" />
                  </div>
                  <div className="absolute inset-3 rounded-full" style={{ animation: 'spin 5s linear infinite reverse' }}>
                    <div className="absolute inset-0 rounded-full border border-cyan-500/25" />
                    <div className="absolute top-0 right-1 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.5)]" />
                  </div>
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-[0_0_20px_4px_rgba(139,92,246,0.3)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-violet-500 to-cyan-500" />
                    <div className="absolute top-1 left-1.5 w-4 h-3 rounded-full bg-white/25 blur-sm rotate-[-20deg]" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                </div>
              </div>

              {/* 文案 */}
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-white leading-snug">
                  Turn Your Phone into an AI Power Node
                </h3>
                <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">
                  Join the Voicica ecosystem. Earn $VOICICA rewards while powering the future of AI Voice.
                </p>
              </div>

              {/* CTA */}
              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-cyan-400 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all group-hover:shadow-purple-500/40 group-hover:-translate-y-0.5">
                  Learn More & Join
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>

          </div>
        </Link>
      </div>
    </section>
  );
}
