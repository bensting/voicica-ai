'use client';

import { X } from 'lucide-react';
import type { Generation } from '@/types/tts';
import { TaskStatus } from '@/types/tts';
import GenerationRecordCard from '../GenerationRecordCard';
import { useLanguage } from '@/contexts/LanguageContext';

interface GeneratingRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  generation: Generation | null;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
}

/**
 * 移动端生成记录底部抽屉
 *
 * 显示刚刚生成的记录，实时更新进度
 */
export default function GeneratingRecordModal({
  isOpen,
  onClose,
  generation,
  onDelete,
  onDownload,
}: GeneratingRecordModalProps) {
  const { t } = useLanguage();

  if (!isOpen || !generation) return null;

  const isProcessing = generation.status === TaskStatus.PROCESSING || generation.status === TaskStatus.PENDING;
  const isSuccess = generation.status === TaskStatus.SUCCESS;
  const isFailed = generation.status === TaskStatus.FAILURE;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <div className="bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {isProcessing && (
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
              )}
              {isSuccess && (
                <div className="w-2 h-2 bg-green-600 rounded-full" />
              )}
              {isFailed && (
                <div className="w-2 h-2 bg-red-600 rounded-full" />
              )}
              <h2 className="text-lg font-semibold text-gray-900">
                {isProcessing && t('tts.generating')}
                {isSuccess && t('tts.generationComplete')}
                {isFailed && t('tts.generationFailed')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Status Message */}
            {isProcessing && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-sm text-purple-700 font-medium">
                  {t('tts.processingMessage')}
                </p>
              </div>
            )}

            {isSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-700 font-medium">
                  ✓ {t('tts.successMessage')}
                </p>
              </div>
            )}

            {isFailed && generation.errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700 font-medium">
                  ✗ {generation.errorMessage}
                </p>
              </div>
            )}

            {/* Generation Record Card */}
            <GenerationRecordCard
              generation={generation}
              onDelete={onDelete}
              onDownload={onDownload}
              showActions={!isProcessing}
              size="large"
            />

            {/* Tips */}
            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-600 text-center">
                {isProcessing && t('tts.generatingTip')}
                {isSuccess && t('tts.successTip')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}