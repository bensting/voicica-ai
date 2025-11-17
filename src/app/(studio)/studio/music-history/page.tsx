'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { Music, Clock, PlayCircle, Download, Trash2 } from 'lucide-react';

// 模拟音乐历史数据
const MOCK_HISTORY = [
  {
    id: '1',
    title: '夜空下的思念',
    theme: '爱情',
    mood: '伤感',
    duration: '2:30',
    createdAt: '2024-01-15 14:30',
    coverUrl: null,
    status: 'completed',
  },
  {
    id: '2',
    title: '青春的旋律',
    theme: '青春',
    mood: '激情',
    duration: '3:00',
    createdAt: '2024-01-14 10:20',
    coverUrl: null,
    status: 'completed',
  },
  {
    id: '3',
    title: '自由之歌',
    theme: '自由',
    mood: '空灵',
    duration: '2:45',
    createdAt: '2024-01-13 16:45',
    coverUrl: null,
    status: 'completed',
  },
];

/**
 * Music History Page
 *
 * 音乐生成历史记录页面
 */
export default function MusicHistoryPage() {
  const { t } = useLanguage();
  const { setTitle } = useStudio();

  useEffect(() => {
    setTitle(t('studio.menu.musicHistory'));
  }, [t, setTitle]);

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-b from-pink-50 to-white">
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">{MOCK_HISTORY.length}</p>
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">8:15</p>
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">3</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-fuchsia-50 flex items-center justify-center">
                  <PlayCircle className="w-6 h-6 text-fuchsia-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {MOCK_HISTORY.length === 0 ? (
            // Empty State
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-50 to-fuchsia-50 rounded-full flex items-center justify-center mb-4">
                <Music className="w-10 h-10 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无音乐记录</h3>
              <p className="text-gray-600 mb-6">开始创作你的第一首 AI 歌曲吧！</p>
              <button
                type="button"
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-xl hover:from-pink-600 hover:to-fuchsia-600 transition-all font-medium"
              >
                开始创作
              </button>
            </div>
          ) : (
            // History Items
            MOCK_HISTORY.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Cover Image Placeholder */}
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-pink-100 to-fuchsia-100 flex items-center justify-center flex-shrink-0">
                    <Music className="w-10 h-10 text-pink-500" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <span className="text-pink-500">🎵</span>
                        <span>主题: {item.theme}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-purple-500">💫</span>
                        <span>情绪: {item.mood}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{item.duration}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500">{item.createdAt}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-2 hover:bg-pink-50 rounded-lg transition-colors group"
                      title="播放"
                    >
                      <PlayCircle className="w-5 h-5 text-gray-600 group-hover:text-pink-500" />
                    </button>
                    <button
                      type="button"
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                      title="下载"
                    >
                      <Download className="w-5 h-5 text-gray-600 group-hover:text-blue-500" />
                    </button>
                    <button
                      type="button"
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                      title="删除"
                    >
                      <Trash2 className="w-5 h-5 text-gray-600 group-hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {MOCK_HISTORY.length > 0 && (
          <div className="mt-8 text-center">
            <button
              type="button"
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              加载更多
            </button>
          </div>
        )}
      </div>
    </div>
  );
}