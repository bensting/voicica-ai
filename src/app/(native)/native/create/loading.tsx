/**
 * Create 子页面通用 loading skeleton
 * 在 <Link> 客户端导航时立即显示，避免页面"卡住"
 */
export default function CreateLoading() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header skeleton */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="w-6 h-6 rounded bg-white/10 animate-pulse" />
        <div className="h-5 w-32 rounded bg-white/10 animate-pulse" />
      </div>

      {/* Credits bar skeleton */}
      <div className="mx-4 mt-3 mb-4 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white/10 animate-pulse" />
            <div className="h-4 w-20 rounded bg-white/10 animate-pulse" />
          </div>
          <div className="h-4 w-16 rounded bg-white/10 animate-pulse" />
        </div>
      </div>

      {/* Content area skeleton */}
      <div className="px-4 space-y-4">
        {/* Input area */}
        <div className="h-32 rounded-2xl bg-white/5 animate-pulse" />

        {/* Selector row */}
        <div className="flex gap-3">
          <div className="flex-1 h-14 rounded-xl bg-white/5 animate-pulse" />
          <div className="w-14 h-14 rounded-xl bg-white/5 animate-pulse" />
        </div>

        {/* Button */}
        <div className="h-12 rounded-xl bg-purple-500/10 animate-pulse" />
      </div>
    </div>
  );
}
