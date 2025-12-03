'use client';

import { FishVoiceDetailDialogState } from './useFishVoiceSync';

interface FishVoiceDetailDialogProps {
  dialog: FishVoiceDetailDialogState;
  onClose: () => void;
  onSync?: (modelId: string) => void;
  syncing?: string | null;
}

/**
 * Fish 语音详情弹窗
 */
export default function FishVoiceDetailDialog({
  dialog,
  onClose,
  onSync,
  syncing,
}: FishVoiceDetailDialogProps) {
  if (!dialog.isOpen || !dialog.voice) return null;

  const voice = dialog.voice;
  const isSyncing = syncing === `single-${voice.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            {voice.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={voice.coverImage}
                alt={voice.title}
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{voice.title}</h3>
              <p className="text-sm text-gray-500">作者: {voice.author}</p>
              <p className="text-xs text-gray-400 mt-1">ID: {voice.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {voice.taskCount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">使用次数</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {voice.likeCount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">点赞数</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {voice.languages.length}
              </div>
              <div className="text-sm text-gray-500">支持语言</div>
            </div>
          </div>

          {/* 描述 */}
          {voice.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">描述</h4>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {voice.description}
              </p>
            </div>
          )}

          {/* 支持语言 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">支持语言</h4>
            <div className="flex flex-wrap gap-2">
              {voice.languages.map((lang) => (
                <span
                  key={lang}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* 标签 */}
          {voice.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">标签</h4>
              <div className="flex flex-wrap gap-2">
                {voice.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 语音样例 */}
          {voice.samples.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">语音样例</h4>
              <div className="space-y-3">
                {voice.samples.map((sample, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {sample.title}
                      </span>
                    </div>
                    {sample.text && (
                      <p className="text-sm text-gray-600 italic">
                        &ldquo;{sample.text.slice(0, 150)}
                        {sample.text.length > 150 ? '...' : ''}&rdquo;
                      </p>
                    )}
                    {sample.audioUrl && (
                      <audio
                        controls
                        className="w-full h-10"
                        src={sample.audioUrl}
                      >
                        您的浏览器不支持音频播放
                      </audio>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
          {onSync && (
            <button
              onClick={() => onSync(voice.id)}
              disabled={syncing !== null}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSyncing ? '同步中...' : '同步到数据库'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}