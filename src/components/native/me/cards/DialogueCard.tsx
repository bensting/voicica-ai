'use client';

import type { DialogueRecord } from '@/actions/dialogue';
import { formatTime } from '../utils';

interface DialogueCardProps {
  dialogue: DialogueRecord;
  onClick: () => void;
}

export default function DialogueCard({ dialogue, onClick }: DialogueCardProps) {
  const isProcessing = dialogue.status === 'PENDING' || dialogue.status === 'PROCESSING';
  const isSuccess = dialogue.status === 'SUCCESS';
  const isFailed = dialogue.status === 'FAILURE';

  // 解析 dialogue_json 获取预览文本
  let previewText = 'Dialogue Audio';
  let speakerCount = 0;
  try {
    const dialogueData = JSON.parse(dialogue.dialogue_json);
    if (Array.isArray(dialogueData) && dialogueData.length > 0) {
      previewText = dialogueData[0].text?.substring(0, 30) || 'Dialogue Audio';
      // 统计不同的声音数量
      const voices = new Set(dialogueData.map((d: { voice: string }) => d.voice));
      speakerCount = voices.size;
    }
  } catch {
    // ignore
  }

  const displaySubtitle = speakerCount > 0 ? `${speakerCount} speakers` : `${dialogue.total_characters} chars`;

  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full py-3">
      {/* 图标 */}
      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
        {isProcessing && (
          <div className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-[9px] font-medium">{dialogue.progress}%</span>
          </div>
        )}
        {isFailed && (
          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        )}
        {isSuccess && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-pink-900">
            {/* 对话图标 */}
            <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
              <path d="M8 9h8M8 13h4" />
            </svg>
          </div>
        )}
        {!isProcessing && !isFailed && !isSuccess && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-pink-900">
            <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
              <path d="M8 9h8M8 13h4" />
            </svg>
          </div>
        )}
        {/* 状态标签 */}
        {isProcessing && (
          <div className="absolute top-0.5 left-0.5 px-1 py-0.5 bg-purple-500/80 rounded">
            <span className="text-white text-[8px] font-medium">Processing</span>
          </div>
        )}
        {/* 时长标签 */}
        {isSuccess && dialogue.duration && (
          <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-black/60 rounded">
            <span className="text-white text-[9px]">{formatTime(dialogue.duration)}</span>
          </div>
        )}
      </div>

      {/* 文字内容 */}
      <div className="flex-1 text-left min-w-0">
        <h4 className="text-white font-medium text-base truncate">{previewText}</h4>
        <p className="text-gray-500 text-sm truncate">{displaySubtitle}</p>
      </div>
    </button>
  );
}
