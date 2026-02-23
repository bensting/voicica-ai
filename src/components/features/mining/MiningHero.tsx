import EnergyOrb from '@/components/common/EnergyOrb';

/**
 * Mining Hero — 标题左对齐一行 + 副标题一行 + 小能量球居中
 */
export default function MiningHero({
  content,
}: {
  content: { title: string; subtitle: string };
}) {
  return (
    <section className="relative overflow-hidden bg-[#06060f] px-4 pt-20 pb-2">
      {/* 背景层 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_60%,_rgba(120,60,255,0.12)_0%,_transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-md">
        {/* 标题 — 左对齐一行 */}
        <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">
          <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            {content.title}
          </span>
        </h1>

        {/* 副标题 — 左对齐一行 */}
        <p className="mt-1 text-xs md:text-sm text-gray-400">
          {content.subtitle}
        </p>

        {/* 能量球居中 */}
        <div className="mt-4 flex justify-center animate-crystal-float">
          <EnergyOrb />
        </div>
      </div>
    </section>
  );
}
