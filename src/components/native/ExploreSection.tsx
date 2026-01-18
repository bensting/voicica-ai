'use client';

import { useState } from 'react';

// Tab 类型
type TabType = 'videos' | 'swap' | 'effects' | 'images';

const tabs: { id: TabType; label: string }[] = [
  { id: 'videos', label: 'Videos' },
  { id: 'swap', label: 'Swap' },
  { id: 'effects', label: 'Effects' },
  { id: 'images', label: 'Images' },
];

// 静态展示数据 - 占位图使用渐变色块
const exploreItems: Record<
  TabType,
  { id: string; user: string; views: number; gradient: string }[]
> = {
  videos: [
    { id: 'v1', user: 'ro****@gmail.c...', views: 71820, gradient: 'from-amber-600 to-orange-700' },
    { id: 'v2', user: 'to****@gmail.c...', views: 69120, gradient: 'from-pink-500 to-rose-600' },
    { id: 'v3', user: 'an****@gmail.c...', views: 54230, gradient: 'from-blue-500 to-cyan-600' },
    { id: 'v4', user: 'mi****@gmail.c...', views: 48900, gradient: 'from-purple-500 to-pink-600' },
    { id: 'v5', user: 'ja****@gmail.c...', views: 42150, gradient: 'from-green-500 to-teal-600' },
    { id: 'v6', user: 'sa****@gmail.c...', views: 38700, gradient: 'from-indigo-500 to-purple-600' },
  ],
  swap: [
    { id: 's1', user: 'ke****@gmail.c...', views: 62100, gradient: 'from-violet-500 to-purple-600' },
    { id: 's2', user: 'li****@gmail.c...', views: 55800, gradient: 'from-rose-500 to-pink-600' },
    { id: 's3', user: 'da****@gmail.c...', views: 49200, gradient: 'from-cyan-500 to-blue-600' },
    { id: 's4', user: 'em****@gmail.c...', views: 43500, gradient: 'from-amber-500 to-orange-600' },
  ],
  effects: [
    { id: 'e1', user: 'ch****@gmail.c...', views: 58400, gradient: 'from-fuchsia-500 to-pink-600' },
    { id: 'e2', user: 'br****@gmail.c...', views: 51200, gradient: 'from-sky-500 to-blue-600' },
    { id: 'e3', user: 'ol****@gmail.c...', views: 47800, gradient: 'from-lime-500 to-green-600' },
    { id: 'e4', user: 'so****@gmail.c...', views: 41300, gradient: 'from-orange-500 to-red-600' },
  ],
  images: [
    { id: 'i1', user: 'al****@gmail.c...', views: 67500, gradient: 'from-emerald-500 to-teal-600' },
    { id: 'i2', user: 'no****@gmail.c...', views: 59800, gradient: 'from-red-500 to-rose-600' },
    { id: 'i3', user: 'is****@gmail.c...', views: 52100, gradient: 'from-blue-500 to-indigo-600' },
    { id: 'i4', user: 'wi****@gmail.c...', views: 46700, gradient: 'from-yellow-500 to-amber-600' },
  ],
};

// 播放图标
const PlayIcon = () => (
  <svg className="w-8 h-8 text-white/80" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

// 浏览量图标
const EyeIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
  </svg>
);

// 格式化数字
function formatViews(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'k';
  }
  return num.toString();
}

/**
 * Explore 区域
 * 包含 Tabs 切换和瀑布流内容展示
 */
export default function ExploreSection() {
  const [activeTab, setActiveTab] = useState<TabType>('videos');

  const items = exploreItems[activeTab];

  return (
    <div className="px-4 pb-24">
      {/* 标题 */}
      <h2 className="text-xl font-bold text-white mb-4">Explore</h2>

      {/* Tabs */}
      <div className="flex gap-6 mb-4 border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 瀑布流网格 */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`relative rounded-2xl overflow-hidden ${
              index % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'
            }`}
          >
            {/* 占位背景 */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`}
            />

            {/* 播放按钮 */}
            {(activeTab === 'videos' || activeTab === 'effects') && (
              <div className="absolute top-3 right-3">
                <PlayIcon />
              </div>
            )}

            {/* 底部信息 */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex items-center justify-between text-xs text-white/80">
                <span className="truncate max-w-[60%]">{item.user}</span>
                <span className="flex items-center gap-1">
                  <EyeIcon />
                  {formatViews(item.views)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
