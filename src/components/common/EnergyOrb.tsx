'use client';

/**
 * 挖矿能量球特效
 * 多层辉光 + 旋转光环 + 漂浮粒子 + 脉动核心
 */
export default function EnergyOrb() {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* === 最底层：大范围柔和辉光 === */}
      <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-2xl animate-pulse" />

      {/* === 旋转光环 1：外圈（蓝紫色，慢速） === */}
      <div
        className="absolute inset-0 rounded-full animate-spin"
        style={{ animationDuration: '8s' }}
      >
        <div className="absolute inset-0 rounded-full border border-purple-500/40" />
        {/* 光环上的亮点 */}
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_2px_rgba(168,85,247,0.6)]" />
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400/60 shadow-[0_0_6px_2px_rgba(96,165,250,0.4)]" />
      </div>

      {/* === 旋转光环 2：中圈（琥珀色，中速，反向） === */}
      <div
        className="absolute inset-3 rounded-full"
        style={{ animation: 'spin 5s linear infinite reverse' }}
      >
        <div className="absolute inset-0 rounded-full border border-amber-500/30" />
        <div className="absolute top-0 right-2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_2px_rgba(245,158,11,0.5)]" />
        <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-orange-400/60" />
      </div>

      {/* === 旋转光环 3：内圈虚线（快速） === */}
      <div
        className="absolute inset-5 rounded-full border border-dashed border-amber-400/20 animate-spin"
        style={{ animationDuration: '3s' }}
      />

      {/* === 核心外发光层 === */}
      <div className="absolute inset-6 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-600/30 blur-md animate-pulse" />

      {/* === 核心球体 === */}
      <div className="relative w-14 h-14 rounded-full overflow-hidden">
        {/* 底色渐变 */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600" />
        {/* 高光 */}
        <div className="absolute top-1 left-2 w-6 h-4 rounded-full bg-white/30 blur-sm rotate-[-20deg]" />
        {/* 内部能量流动 */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-spin"
          style={{ animationDuration: '2s' }}
        />
        {/* 边缘光晕 */}
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_12px_2px_rgba(255,255,255,0.2)]" />
      </div>

      {/* === 外层光晕脉动 === */}
      <div
        className="absolute inset-4 rounded-full shadow-[0_0_20px_4px_rgba(245,158,11,0.25)]"
        style={{ animation: 'pulse 2s ease-in-out infinite' }}
      />

      {/* === 漂浮粒子 === */}
      {[...Array(6)].map((_, i) => {
        const angle = (360 / 6) * i;
        const delay = i * 0.4;
        const size = i % 2 === 0 ? 'w-1 h-1' : 'w-1.5 h-1.5';
        const color = i % 3 === 0 ? 'bg-amber-400' : i % 3 === 1 ? 'bg-purple-400' : 'bg-blue-400';
        return (
          <div
            key={i}
            className={`absolute ${size} rounded-full ${color} animate-float-particle`}
            style={{
              top: '50%',
              left: '50%',
              '--float-angle': `${angle}deg`,
              '--float-delay': `${delay}s`,
              animationDelay: `${delay}s`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
