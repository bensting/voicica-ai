'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import { getPublicMusicRecords, type PublicMusicRecord } from '@/actions/music';
import StudioMusicPlayerModal from './StudioMusicPlayerModal';

// 随机渐变色（用于无封面时）
const gradients = [
  'from-pink-500 to-rose-500',
  'from-purple-500 to-pink-500',
  'from-rose-500 to-orange-500',
  'from-fuchsia-500 to-pink-500',
  'from-pink-400 to-rose-400',
  'from-rose-400 to-pink-400',
];

/**
 * 音乐卡片组件
 */
function MusicCard({ music, index, onClick }: { music: PublicMusicRecord; index: number; onClick: () => void }) {
  const displayTitle = music.title || 'AI Music';
  const gradient = gradients[index % gradients.length];

  return (
    <div
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform shadow-sm hover:shadow-lg group"
    >
      {/* 封面图 - 16:9 比例 */}
      <div className="aspect-video relative">
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
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-7 h-7 text-pink-600 ml-1" fill="currentColor" />
          </div>
        </div>

        {/* 底部渐变遮罩 */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* 标题 */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white text-sm font-medium truncate">{displayTitle}</p>
      </div>
    </div>
  );
}

/**
 * Studio Explore 区域
 * 展示公开的音乐作品
 */
export default function StudioExploreSection() {
  const router = useRouter();
  const [musicList, setMusicList] = useState<PublicMusicRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMusic, setSelectedMusic] = useState<PublicMusicRecord | null>(null);

  // 处理 Recreate
  const handleRecreate = (music: PublicMusicRecord) => {
    const params = new URLSearchParams();
    if (music.prompt) params.set('prompt', music.prompt);
    if (music.model) params.set('model', music.model);
    router.push(`/studio/ai-music?${params.toString()}`);
    setSelectedMusic(null);
  };

  // 加载公开音乐
  useEffect(() => {
    setIsLoading(true);
    getPublicMusicRecords(12)
      .then((records) => {
        setMusicList(records);
      })
      .catch((err) => {
        console.error('Failed to load public music:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="py-6">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Explore</h2>
        <button
          onClick={() => router.push('/studio/ai-music')}
          className="text-sm text-pink-600 hover:text-pink-700 font-medium"
        >
          Create yours →
        </button>
      </div>

      {/* 内容区域 */}
      {isLoading ? (
        // 加载骨架屏
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br ${gradients[i % gradients.length]}`}
            >
              {/* 播放按钮占位 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/30 animate-pulse" />
              </div>
              {/* 底部加载动画 */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                <div className="h-4 w-24 bg-white/30 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : musicList.length > 0 ? (
        // 音乐网格
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {musicList.map((music, index) => (
            <MusicCard
              key={music.id}
              music={music}
              index={index}
              onClick={() => setSelectedMusic(music)}
            />
          ))}
        </div>
      ) : (
        // 空状态
        <div className="text-center py-12 bg-pink-50 rounded-2xl">
          <p className="text-gray-500 mb-4">No public music yet</p>
          <button
            onClick={() => router.push('/studio/ai-music')}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Create the first one
          </button>
        </div>
      )}

      {/* 音乐播放器弹窗 */}
      {selectedMusic && (
        <StudioMusicPlayerModal
          music={{
            title: selectedMusic.title,
            cover_url: selectedMusic.cover_url,
            audio_url: selectedMusic.audio_url,
            duration: selectedMusic.duration,
            tags: selectedMusic.tags,
            lyrics: selectedMusic.lyrics,
            prompt: selectedMusic.prompt,
            model: selectedMusic.model,
          }}
          onClose={() => setSelectedMusic(null)}
          taskId={selectedMusic.task_id}
          showRecreateOnly
          onRecreate={() => handleRecreate(selectedMusic)}
        />
      )}
    </div>
  );
}
