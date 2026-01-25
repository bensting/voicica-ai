'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPublicMusicRecords, type PublicMusicRecord } from '@/actions/music';
import MusicPlayerModal from './MusicPlayerModal';
import NativeVoiceSelectorSheet from './create/voice/VoiceSelectorSheet';
import type { Voice } from '@/types/voice';

// Tab 类型
type TabType = 'voices' | 'music' | 'video';

// 公开视频类型
interface PublicVideo {
  id: number;
  taskId: string;
  prompt: string;
  aspectRatio: string;
  videoUrl: string;
  thumbnailUrl?: string;
  viewCount: number;
  user: string;
  createdAt: string;
}

const tabs: { id: TabType; label: string }[] = [
  { id: 'voices', label: 'Voices' },
  { id: 'music', label: 'Music' },
  { id: 'video', label: 'Video' },
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
function MusicCard({ music, index, onClick }: { music: PublicMusicRecord; index: number; onClick: () => void }) {
  const displayTitle = music.title || 'AI Music';
  const gradient = gradients[index % gradients.length];

  return (
    <div
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform aspect-square"
    >
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
 * 视频卡片组件
 */
function ExploreVideoCard({ video, index, onClick }: { video: PublicVideo; index: number; onClick: () => void }) {
  const [frameLoaded, setFrameLoaded] = useState(false);
  const displayTitle = video.prompt?.substring(0, 30) || 'AI Video';
  const gradient = gradients[index % gradients.length];

  return (
    <div
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform aspect-square"
    >
      {/* 视频预览帧 */}
      {video.videoUrl ? (
        <>
          <video
            src={video.videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setFrameLoaded(true)}
          />
          {!frameLoaded && (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
          )}
        </>
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
 * 包含 Voices / Music / Video 三个 Tab
 */
export default function ExploreSection() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('music');
  const [musicList, setMusicList] = useState<PublicMusicRecord[]>([]);
  const [videoList, setVideoList] = useState<PublicVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<PublicMusicRecord | null>(null);
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);

  // 处理声音选择，跳转到 TTS 页面
  const handleVoiceSelect = (voice: Voice) => {
    // 保存选中的声音到 localStorage，TTS 页面会读取
    localStorage.setItem('tts_draft_voice', JSON.stringify(voice));
    // 先跳转页面，选择器会随着页面切换自动关闭
    router.push('/native/create/voice');
  };

  // 处理 Recreate
  const handleRecreate = (music: PublicMusicRecord) => {
    const params = new URLSearchParams();
    if (music.prompt) params.set('prompt', music.prompt);
    if (music.model) params.set('model', music.model);
    router.push(`/native/create/music?${params.toString()}`);
    setSelectedMusic(null);
  };

  // 加载公开内容
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
    } else if (activeTab === 'video') {
      setIsLoading(true);
      fetch('/api/v1/native/explore/videos?limit=20')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setVideoList(data.videos || []);
          }
        })
        .catch((err) => {
          console.error('Failed to load public videos:', err);
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
            onClick={() => {
              if (tab.id === 'voices') {
                setIsVoiceSelectorOpen(true);
              } else {
                setActiveTab(tab.id);
              }
            }}
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
          // 加载骨架屏 - 带渐变背景
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br ${gradients[i % gradients.length]}`}
              >
                {/* 播放按钮占位 */}
                <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <PlayIcon />
                </div>
                {/* 底部加载动画 */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : musicList.length > 0 ? (
          // 音乐网格
          <div className="grid grid-cols-2 gap-3">
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
          <div className="text-center py-12 text-gray-500">
            No public music yet
          </div>
        )
      ) : activeTab === 'video' ? (
        isLoading ? (
          // 加载骨架屏
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br ${gradients[i % gradients.length]}`}
              >
                <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <PlayIcon />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : videoList.length > 0 ? (
          // 视频网格
          <div className="grid grid-cols-2 gap-3">
            {videoList.map((video, index) => (
              <ExploreVideoCard
                key={video.id}
                video={video}
                index={index}
                onClick={() => router.push(`/native/video/play/${video.taskId}`)}
              />
            ))}
          </div>
        ) : (
          // 空状态
          <div className="text-center py-12 text-gray-500">
            No public videos yet
          </div>
        )
      ) : (
        // Voices Tab - 点击时打开选择器，这里不显示内容
        <div className="text-center py-12 text-gray-500">
          Click &quot;Voices&quot; to browse voices
        </div>
      )}

      {/* 音乐播放器弹窗 */}
      {selectedMusic && (
        <MusicPlayerModal
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

      {/* 声音选择器 */}
      <NativeVoiceSelectorSheet
        isOpen={isVoiceSelectorOpen}
        onClose={() => setIsVoiceSelectorOpen(false)}
        selectedVoice={null}
        onSelect={handleVoiceSelect}
      />
    </div>
  );
}
