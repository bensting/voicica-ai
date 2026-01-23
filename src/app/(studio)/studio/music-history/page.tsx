'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import {
  Music,
  Clock,
  PlayCircle,
  Download,
  Trash2,
  Play,
  Pause,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { getMusicRecords, deleteMusicRecord, type MusicRecord } from '@/actions/music';

/**
 * 格式化时间 (秒 -> mm:ss)
 */
function formatTime(seconds: number | null): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 格式化日期
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Music History Page
 *
 * 音乐生成历史记录页面
 */
export default function MusicHistoryPage() {
  const { t } = useLanguage();
  const { setTitle } = useStudio();
  const router = useRouter();

  // 数据状态
  const [records, setRecords] = useState<MusicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 播放器状态
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingVersion, setPlayingVersion] = useState<1 | 2>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 删除确认
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setTitle(t('studio.menu.musicHistory'));
  }, [t, setTitle]);

  // 加载数据
  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMusicRecords(100);
      setRecords(data);
    } catch (err) {
      console.error('加载音乐记录失败:', err);
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // 计算统计数据
  const completedRecords = records.filter((r) => r.status === 'SUCCESS');
  const totalDuration = completedRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
  const thisMonthCount = completedRecords.filter((r) => {
    const recordDate = new Date(r.created_at);
    const now = new Date();
    return (
      recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear()
    );
  }).length;

  // 播放器控制
  const handlePlay = (record: MusicRecord, version: 1 | 2 = 1) => {
    const audioUrl = version === 1 ? record.audio_url : record.audio_url_2;
    if (!audioUrl) return;

    // 如果点击的是当前正在播放的歌曲，切换播放/暂停
    if (playingId === record.task_id && playingVersion === version) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      setIsPlaying(!isPlaying);
      return;
    }

    // 切换到新歌曲
    setPlayingId(record.task_id);
    setPlayingVersion(version);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);

    // 等待音频元素更新后播放
    setTimeout(() => {
      audioRef.current?.play();
    }, 100);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audioRef.current.currentTime = percent * duration;
    setCurrentTime(percent * duration);
  };

  // 下载
  const handleDownload = async (record: MusicRecord, version: 1 | 2 = 1) => {
    const audioUrl = version === 1 ? record.audio_url : record.audio_url_2;
    if (!audioUrl) return;

    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${record.title || 'AI Music'}${record.audio_url_2 ? ` (v${version})` : ''}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  // 删除
  const handleDelete = async (recordId: number) => {
    try {
      await deleteMusicRecord(recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      setDeletingId(null);
      // 如果删除的是正在播放的歌曲，停止播放
      const deletedRecord = records.find((r) => r.id === recordId);
      if (deletedRecord && playingId === deletedRecord.task_id) {
        setPlayingId(null);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  // 获取当前播放的歌曲
  const currentPlayingRecord = records.find((r) => r.task_id === playingId);
  const currentAudioUrl = currentPlayingRecord
    ? playingVersion === 1
      ? currentPlayingRecord.audio_url
      : currentPlayingRecord.audio_url_2
    : null;

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-b from-pink-50 to-white">
      {/* 隐藏的音频元素 */}
      {currentAudioUrl && (
        <audio
          ref={audioRef}
          src={currentAudioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">音乐历史</h1>
              <p className="text-gray-600 mt-1">查看和管理你创作的所有音乐</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总创作数</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{completedRecords.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-pink-50 flex items-center justify-center">
                  <Music className="w-6 h-6 text-pink-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总时长</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {Math.floor(totalDuration / 60)}:{String(Math.floor(totalDuration % 60)).padStart(2, '0')}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">本月创作</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{thisMonthCount}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-fuchsia-50 flex items-center justify-center">
                  <PlayCircle className="w-6 h-6 text-fuchsia-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-red-600">{error}</p>
            <button
              type="button"
              onClick={loadRecords}
              className="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            >
              重试
            </button>
          </div>
        )}

        {/* History List */}
        {!loading && !error && (
          <div className="space-y-4">
            {records.length === 0 ? (
              // Empty State
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-50 to-fuchsia-50 rounded-full flex items-center justify-center mb-4">
                  <Music className="w-10 h-10 text-pink-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无音乐记录</h3>
                <p className="text-gray-600 mb-6">开始创作你的第一首 AI 歌曲吧！</p>
                <button
                  type="button"
                  onClick={() => router.push('/studio/ai-song')}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-xl hover:from-pink-600 hover:to-fuchsia-600 transition-all font-medium"
                >
                  开始创作
                </button>
              </div>
            ) : (
              // History Items
              records.map((record) => {
                const isCurrentPlaying = playingId === record.task_id;
                const isProcessing = record.status === 'PROCESSING' || record.status === 'PENDING';
                const isFailed = record.status === 'FAILURE';
                const hasVersion2 = !!record.audio_url_2;

                return (
                  <div
                    key={record.id}
                    className={`bg-white rounded-xl border p-4 transition-all ${
                      isCurrentPlaying ? 'border-pink-300 shadow-md' : 'border-gray-200 hover:shadow-md'
                    }`}
                  >
                    {/* Mobile Layout */}
                    <div className="flex gap-3">
                      {/* Cover Image */}
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
                        {record.cover_url ? (
                          <Image
                            src={record.cover_url}
                            alt={record.title || 'Cover'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-fuchsia-100 flex items-center justify-center">
                            <Music className="w-8 h-8 text-pink-500" />
                          </div>
                        )}
                        {/* 状态指示器 */}
                        {isProcessing && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-center text-white">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                              <span className="text-[10px] mt-0.5 block">{record.progress}%</span>
                            </div>
                          </div>
                        )}
                        {isFailed && (
                          <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {record.title || 'AI Music'}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {formatTime(record.duration)}
                          </span>
                          {hasVersion2 && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[10px]">
                              2版本
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-1">{formatDate(record.created_at)}</p>
                      </div>

                      {/* Actions - Desktop */}
                      <div className="hidden md:flex items-center gap-1">
                        {/* 版本切换 */}
                        {hasVersion2 && record.status === 'SUCCESS' && (
                          <div className="flex gap-1 mr-1">
                            <button
                              type="button"
                              onClick={() => handlePlay(record, 1)}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                isCurrentPlaying && playingVersion === 1
                                  ? 'bg-pink-500 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              V1
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePlay(record, 2)}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                isCurrentPlaying && playingVersion === 2
                                  ? 'bg-pink-500 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              V2
                            </button>
                          </div>
                        )}

                        {record.status === 'SUCCESS' && (
                          <button
                            type="button"
                            onClick={() => handlePlay(record, hasVersion2 ? playingVersion : 1)}
                            className="p-2 hover:bg-pink-50 rounded-lg transition-colors group"
                            title="播放"
                          >
                            {isCurrentPlaying && isPlaying ? (
                              <Pause className="w-5 h-5 text-pink-500" />
                            ) : (
                              <Play className="w-5 h-5 text-gray-600 group-hover:text-pink-500" />
                            )}
                          </button>
                        )}

                        {record.status === 'SUCCESS' && (
                          <button
                            type="button"
                            onClick={() => handleDownload(record, isCurrentPlaying ? playingVersion : 1)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                            title="下载"
                          >
                            <Download className="w-5 h-5 text-gray-600 group-hover:text-blue-500" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDeletingId(record.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                          title="删除"
                        >
                          <Trash2 className="w-5 h-5 text-gray-600 group-hover:text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Mini Player - 当前播放 */}
                    {isCurrentPlaying && (
                      <div className="mt-3 flex items-center gap-2">
                        <div
                          className="flex-1 h-1.5 bg-gray-200 rounded-full cursor-pointer"
                          onClick={handleSeek}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-full"
                            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>
                    )}

                    {/* Actions - Mobile */}
                    <div className="flex md:hidden items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      {/* 版本切换 - Mobile */}
                      <div className="flex gap-1">
                        {hasVersion2 && record.status === 'SUCCESS' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePlay(record, 1)}
                              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                isCurrentPlaying && playingVersion === 1
                                  ? 'bg-pink-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              版本1
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePlay(record, 2)}
                              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                isCurrentPlaying && playingVersion === 2
                                  ? 'bg-pink-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              版本2
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {isProcessing ? '生成中...' : isFailed ? '生成失败' : ''}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons - Mobile */}
                      <div className="flex items-center gap-1">
                        {record.status === 'SUCCESS' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePlay(record, hasVersion2 ? playingVersion : 1)}
                              className="p-2 hover:bg-pink-50 rounded-lg transition-colors"
                            >
                              {isCurrentPlaying && isPlaying ? (
                                <Pause className="w-5 h-5 text-pink-500" />
                              ) : (
                                <Play className="w-5 h-5 text-gray-500" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownload(record, isCurrentPlaying ? playingVersion : 1)}
                              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Download className="w-5 h-5 text-gray-500" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeletingId(record.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">确认删除</h3>
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">确定要删除这首歌曲吗？此操作无法撤销。</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
