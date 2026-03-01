/**
 * Tools 子页面通用 loading skeleton
 */
export default function ToolsLoading() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header skeleton */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="w-6 h-6 rounded bg-white/10 animate-pulse" />
        <div className="h-5 w-32 rounded bg-white/10 animate-pulse" />
      </div>

      {/* Content area skeleton */}
      <div className="px-4 mt-4 space-y-4">
        <div className="h-32 rounded-2xl bg-white/5 animate-pulse" />
        <div className="h-14 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-12 rounded-xl bg-purple-500/10 animate-pulse" />
      </div>
    </div>
  );
}
