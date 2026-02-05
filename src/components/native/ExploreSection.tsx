'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getPublicMusicRecords, type PublicMusicRecord } from '@/actions/music';
import MusicPlayerModal from './MusicPlayerModal';
import VideoPlayerModal, { type PublicVideoData } from './VideoPlayerModal';
import VoicePlayerModal, { type PublicVoiceData } from './VoicePlayerModal';
import {
  getAvailableExploreTabs,
  getDefaultExploreTab,
  type ExploreTabId,
} from '@/config/native/exploreTabsConfig';
import ProviderIcon from '@/components/ui/icons/ProviderIcon';
import { getCountryFlag } from '@/utils/countryFlags';
import { User, UserRound } from 'lucide-react';
import NativeAdCard from './NativeAdCard';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { isNativeAdEnabled, getNativeAdPosition } from '@/config/ads';

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
 * 语音卡片组件 - 紧凑设计（2列布局）
 * 显示头像、性别图标、国家旗帜、供应商图标
 */
function VoiceCard({ voice, index, onClick }: { voice: PublicVoiceData; index: number; onClick: () => void }) {
  const gradient = gradients[index % gradients.length];
  const voiceDetails = voice.voice;
  const displayName = voiceDetails?.displayName || voice.voiceName;

  return (
    <div
      onClick={onClick}
      className="relative rounded-xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform bg-gray-800/50 border border-gray-700/50 p-2.5"
    >
      {/* 顶部：头像 + (名称+图标) + 播放按钮 */}
      <div className="flex items-center gap-2 mb-2">
        {/* 头像 */}
        <div className={`w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ${!voiceDetails?.avatarUrl ? `bg-gradient-to-br ${gradient}` : ''}`}>
          {voiceDetails?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={voiceDetails.avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
            </div>
          )}
        </div>

        {/* 名称 + 图标（垂直排列） */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">{displayName}</p>
          {/* 图标行：国家 · 性别 · 供应商 */}
          <div className="flex items-center gap-1 mt-0.5">
            {voiceDetails?.country && (
              <span className="text-xs leading-none">{getCountryFlag(voiceDetails.country)}</span>
            )}
            {voiceDetails?.gender && (
              voiceDetails.gender === 'male' ? (
                <User className="w-3 h-3 text-blue-400" />
              ) : voiceDetails.gender === 'female' ? (
                <UserRound className="w-3 h-3 text-pink-400" />
              ) : null
            )}
            {voiceDetails?.provider && (
              <ProviderIcon provider={voiceDetails.provider.toLowerCase()} className="w-3 h-3" />
            )}
          </div>
        </div>

        {/* 播放按钮 */}
        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-white/80 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* 文本内容 */}
      <p className="text-gray-400 text-[11px] truncate">{voice.text}</p>
    </div>
  );
}

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
function ExploreVideoCard({ video, index, onClick }: { video: PublicVideoData; index: number; onClick: () => void }) {
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [frameError, setFrameError] = useState(false);
  const displayTitle = video.prompt?.substring(0, 30) || 'AI Video';
  const gradient = gradients[index % gradients.length];

  // 优先使用缩略图，否则用视频 URL 加载第一帧
  const previewUrl = video.thumbnailUrl || video.videoUrl;
  const useVideoFrame = !video.thumbnailUrl && video.videoUrl;

  return (
    <div
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform aspect-square"
    >
      {/* 视频预览帧 */}
      {previewUrl && !frameError ? (
        <>
          {useVideoFrame ? (
            <video
              src={`${previewUrl}#t=0.1`}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
              onLoadedData={() => setFrameLoaded(true)}
              onError={() => setFrameError(true)}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={displayTitle}
              className="absolute inset-0 w-full h-full object-cover"
              onLoad={() => setFrameLoaded(true)}
              onError={() => setFrameError(true)}
            />
          )}
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
  const availableTabs = useMemo(() => getAvailableExploreTabs(), []);
  const defaultTab = useMemo(() => getDefaultExploreTab(), []);
  const [activeTab, setActiveTab] = useState<ExploreTabId>(defaultTab);
  const [voiceList, setVoiceList] = useState<PublicVoiceData[]>([]);
  const [musicList, setMusicList] = useState<PublicMusicRecord[]>([]);
  const [videoList, setVideoList] = useState<PublicVideoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<PublicVoiceData | null>(null);
  const [selectedMusic, setSelectedMusic] = useState<PublicMusicRecord | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<PublicVideoData | null>(null);

  // 订阅状态（订阅用户不显示广告）
  const { isSubscribed } = useSubscription();

  // 原生广告配置
  const showNativeAd = isNativeAdEnabled() && !isSubscribed;
  const nativeAdPosition = getNativeAdPosition();

  // 处理 Voice Recreate
  const handleVoiceRecreate = (voice: PublicVoiceData) => {
    // 保存文本和语音名称到 localStorage，TTS 页面会读取
    localStorage.setItem('tts_draft_text', voice.text);
    localStorage.setItem('tts_draft_voice_name', voice.voiceName);
    router.push('/native/create/voice');
    setSelectedVoice(null);
  };

  // 处理 Music Recreate
  const handleMusicRecreate = (music: PublicMusicRecord) => {
    const params = new URLSearchParams();
    if (music.prompt) params.set('prompt', music.prompt);
    if (music.model) params.set('model', music.model);
    router.push(`/native/create/music?${params.toString()}`);
    setSelectedMusic(null);
  };

  // 处理 Video Recreate
  const handleVideoRecreate = (video: PublicVideoData) => {
    const params = new URLSearchParams();
    if (video.prompt) params.set('prompt', video.prompt);
    if (video.model) params.set('model', video.model);
    if (video.aspectRatio) params.set('aspectRatio', video.aspectRatio);
    router.push(`/native/create/video?${params.toString()}`);
    setSelectedVideo(null);
  };

  // 加载公开内容（已加载过的数据会被缓存，切换 Tab 时不重复请求）
  useEffect(() => {
    if (activeTab === 'voices') {
      // 如果已有数据，不重复加载
      if (voiceList.length > 0) return;
      setIsLoading(true);
      fetch('/api/v1/native/explore/voices?limit=20')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setVoiceList(data.voices || []);
          }
        })
        .catch((err) => {
          console.error('Failed to load public voices:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (activeTab === 'music') {
      // 如果已有数据，不重复加载
      if (musicList.length > 0) return;
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
      // 如果已有数据，不重复加载
      if (videoList.length > 0) return;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 如果没有可用的标签，不渲染
  if (availableTabs.length === 0) {
    return null;
  }

  return (
    <div className="px-4 pb-24">
      {/* 标题 */}
      <h2 className="text-xl font-bold text-white mb-4">Explore</h2>

      {/* Tabs - 只在有多个标签时显示 */}
      {availableTabs.length > 1 && (
        <div className="flex gap-6 mb-4 border-b border-gray-800">
          {availableTabs.map((tab) => (
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
      )}

      {/* 内容区域 */}
      {activeTab === 'voices' ? (
        isLoading ? (
          // 加载骨架屏 - 2列紧凑设计
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700/50 p-2.5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradients[i % gradients.length]}`} />
                  <div className="flex-1">
                    <div className="h-3 w-16 bg-gray-700 rounded animate-pulse mb-1" />
                    <div className="h-2.5 w-12 bg-gray-700/50 rounded animate-pulse" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/10" />
                </div>
                <div className="h-2.5 w-full bg-gray-700/30 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : voiceList.length > 0 ? (
          // 语音网格 - 2列布局（包含原生广告）
          <div className="grid grid-cols-2 gap-2.5">
            {voiceList.map((voice, index) => {
              // 计算实际位置（考虑广告插入）
              const actualIndex = showNativeAd && index >= nativeAdPosition ? index + 1 : index;

              return (
                <React.Fragment key={voice.id}>
                  {/* 在指定位置插入原生广告 */}
                  {showNativeAd && index === nativeAdPosition && (
                    <NativeAdCard index={nativeAdPosition} />
                  )}
                  <VoiceCard
                    voice={voice}
                    index={actualIndex}
                    onClick={() => setSelectedVoice(voice)}
                  />
                </React.Fragment>
              );
            })}
            {/* 如果广告位置在列表末尾 */}
            {showNativeAd && nativeAdPosition >= voiceList.length && (
              <NativeAdCard index={nativeAdPosition} />
            )}
          </div>
        ) : (
          // 空状态
          <div className="text-center py-12 text-gray-500">
            No public voices yet
          </div>
        )
      ) : activeTab === 'music' ? (
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
                onClick={() => setSelectedVideo(video)}
              />
            ))}
          </div>
        ) : (
          // 空状态
          <div className="text-center py-12 text-gray-500">
            No public videos yet
          </div>
        )
      ) : null}

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
          onRecreate={() => handleMusicRecreate(selectedMusic)}
        />
      )}

      {/* 视频播放器弹窗 */}
      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onRecreate={() => handleVideoRecreate(selectedVideo)}
        />
      )}

      {/* 语音播放器弹窗 */}
      {selectedVoice && (
        <VoicePlayerModal
          voice={selectedVoice}
          onClose={() => setSelectedVoice(null)}
          onRecreate={() => handleVoiceRecreate(selectedVoice)}
        />
      )}
    </div>
  );
}
