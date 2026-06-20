'use client';

export default function NativeBannerAd() {
  return (
    <div className="mx-4">
      <div className="relative rounded-2xl overflow-hidden bg-[#0b0b20] border border-purple-800/30 p-5">
        {/* Background glow blobs */}
        <div className="absolute top-0 left-1/4 w-48 h-24 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-700/20 rounded-full blur-2xl pointer-events-none" />

        {/* ∞ Forever Free badge — top right */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/50 bg-purple-950/70 backdrop-blur-sm">
          <span className="text-purple-300 text-sm leading-none">∞</span>
          <span className="text-purple-300 text-xs font-medium">Forever Free</span>
        </div>

        {/* FOREVER FREE */}
        <div
          className="mt-8"
          style={{ filter: 'drop-shadow(0 0 18px rgba(167,139,250,0.7)) drop-shadow(0 0 40px rgba(139,92,246,0.35))' }}
        >
          <h1
            className="text-4xl font-black leading-none tracking-tight whitespace-nowrap text-center w-full"
            style={{
              background: 'linear-gradient(to bottom, #ffffff 20%, #ddd6fe 60%, #c4b5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            FOREVER FREE
          </h1>
        </div>
        <p className="text-white/75 font-semibold text-base mt-1.5 text-center">AI Creator Tools</p>

        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          {/* AI Voice */}
          <div className="flex items-center gap-2.5 bg-purple-900/40 border border-purple-700/30 rounded-xl px-3 py-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
              <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">AI Voice</p>
              <p className="text-gray-400 text-xs mt-0.5 leading-tight">Create Voices</p>
            </div>
          </div>

          {/* AI Images */}
          <div className="flex items-center gap-2.5 bg-blue-900/40 border border-blue-700/30 rounded-xl px-3 py-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
              <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">AI Images</p>
              <p className="text-gray-400 text-xs mt-0.5 leading-tight">Generate Images</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
