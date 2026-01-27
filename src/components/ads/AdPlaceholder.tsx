'use client';

interface AdPlaceholderProps {
  /** 广告位置标识 */
  position: string;
  /** 高度 */
  height?: number;
  /** 变体样式 */
  variant?: 'banner' | 'native' | 'social-bar';
}

/**
 * 广告占位组件
 * 用于展示广告位置效果，后续替换为真实广告
 */
export default function AdPlaceholder({
  position,
  height = 100,
  variant = 'banner'
}: AdPlaceholderProps) {
  if (variant === 'social-bar') {
    return (
      <div className="w-full bg-gradient-to-r from-gray-100 to-gray-200 border-y border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6v6H9z" />
            </svg>
            <span>Ad · {position}</span>
          </div>
          <div className="flex-1 max-w-md h-10 bg-white/50 rounded-lg border border-dashed border-gray-400 flex items-center justify-center">
            <span className="text-gray-400 text-xs">Social Bar Ad</span>
          </div>
          <button className="text-gray-400 hover:text-gray-600 text-xs">×</button>
        </div>
      </div>
    );
  }

  if (variant === 'native') {
    return (
      <div className="w-full py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 overflow-hidden"
            style={{ minHeight: height }}
          >
            <div className="p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 9h6v6H9z" />
                </svg>
                <span>Sponsored · {position}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-3 border border-gray-200">
                    <div className="w-full aspect-square bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default banner variant
  return (
    <div className="w-full py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="w-full bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-xl border border-dashed border-gray-300 flex items-center justify-center"
          style={{ height }}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6v6H9z" />
              </svg>
              <span>Advertisement</span>
            </div>
            <p className="text-gray-400 text-xs">{position} · {height}px</p>
          </div>
        </div>
      </div>
    </div>
  );
}
