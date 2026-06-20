'use client';

export default function NativeBannerAd() {
  return (
    <div className="mx-4">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/60 via-indigo-900/60 to-blue-900/60 border border-purple-500/20 px-5 py-4 flex items-center gap-4">
        {/* 装饰光晕 */}
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* 图标 */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </div>

        {/* 文字 */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-base leading-tight">Forever Free AI Voice Tools</p>
          <p className="text-purple-300 text-xs mt-0.5">Text to speech · Voice clone · No subscription needed</p>
        </div>

        {/* Free 角标 */}
        <div className="flex-shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
          <span className="text-emerald-400 text-xs font-bold">FREE</span>
        </div>
      </div>
    </div>
  );
}
