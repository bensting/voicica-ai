import { Mic } from 'lucide-react';

interface PageLoadingProps {
  /**
   * 是否显示加载动画
   * @default true
   */
  show?: boolean;
}

/**
 * PageLoading - 页面加载动画
 * 小巧可爱的加载指示器，显示在页面中间，不遮挡页面内容
 *
 * @example
 * ```tsx
 * // 简单使用
 * {isLoading && <PageLoading />}
 *
 * // 使用 show 属性
 * <PageLoading show={isLoading} />
 * ```
 */
export default function PageLoading({ show = true }: PageLoadingProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-xl border border-purple-100">
        {/* 麦克风图标 - 脉动效果 */}
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
          <Mic className="w-4 h-4 text-white" />
        </div>

        {/* 跳动的点 */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-bounce"
            style={{ animationDelay: '-0.3s' }}
          ></div>
          <div
            className="w-2 h-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-bounce"
            style={{ animationDelay: '-0.15s' }}
          ></div>
          <div className="w-2 h-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}