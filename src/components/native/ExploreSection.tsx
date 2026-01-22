'use client';

import { useState, useEffect } from 'react';
import { getPublicMusicRecords, type PublicMusicRecord } from '@/actions/music';

// Tab 类型
type TabType = 'music' | 'voices';

const tabs: { id: TabType; label: string }[] = [
  { id: 'music', label: 'Music' },
  { id: 'voices', label: 'Voices' },
];

// 播放图标
const PlayIcon = () => (
  <svg className="w-8 h-8 text-white/80" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

// 随机渐变色（用于无封面时）
const gradients = [
  'from-purple-600 to-pink-600',
  'from-blue-600 to-cyan-600',
  'from-amber-600 to-orange-600',
  'from-green-600 to-teal-600',
  'from-indigo-600 to-purple-600',
  'from-rose-600 to-pink-600',
];

/**
 * 音乐卡片组件
 */
function MusicCard({ music, index }: { music: PublicMusicRecord; index: number }) {
  const displayTitle = music.title || 'AI Music';
  const gradient = gradients[index % gradients.length];

  return (
    <div className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform aspect-[4/5]">
      {/* 封面图 */}
      {music.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={music.cover_url}
          alt={displayTitle}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      )}

      {/* 播放按钮 */}
      <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
        <PlayIcon />
      </div>

      {/* 底部信息 */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-white text-sm font-medium truncate">{displayTitle}</p>
      </div>
    </div>
  );
}

/**
 * Explore 区域
 * 包含 Music / Voices 两个 Tab
 */
export default function ExploreSection() {
  const [activeTab, setActiveTab] = useState<TabType>('music');
  const [musicList, setMusicList] = useState<PublicMusicRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 加载公开音乐
  useEffect(() => {
    if (activeTab === 'music') {
      setIsLoading(true);
      getPublicMusicRecords(20)
        .then((records) => {
          setMusicList(records);
        })
        .catch((err) => {
          console.error('Failed to load public music:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [activeTab]);

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

      {/* 内容区域 */}
      {activeTab === 'music' ? (
        isLoading ? (
          // 加载骨架屏
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] rounded-2xl bg-gray-800 animate-pulse"
              />
            ))}
          </div>
        ) : musicList.length > 0 ? (
          // 音乐网格
          <div className="grid grid-cols-2 gap-3">
            {musicList.map((music, index) => (
              <MusicCard key={music.id} music={music} index={index} />
            ))}
          </div>
        ) : (
          // 空状态
          <div className="text-center py-12 text-gray-500">
            No public music yet
          </div>
        )
      ) : (
        // Voices Tab
        <div className="text-center py-12 text-gray-500">
          Coming soon...
        </div>
      )}
    </div>
  );
}
