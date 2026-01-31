'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { showToast } from '@/lib/native-toast';
import { reportContent } from '@/actions/report';

export type ReportReason =
  | 'copyright'
  | 'illegal'
  | 'inappropriate'
  | 'offensive'
  | 'spam'
  | 'other';

interface ReportOption {
  value: ReportReason;
  label: string;
}

const REPORT_OPTIONS: ReportOption[] = [
  { value: 'copyright', label: 'Copyright issues' },
  { value: 'illegal', label: 'Illegal content' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'offensive', label: 'Offensive content' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 被举报的内容类型 */
  contentType: 'music' | 'video' | 'image' | 'tts';
  /** 内容 ID（用于后端记录） */
  contentId?: string;
  /** 举报成功回调 */
  onReportSuccess?: () => void;
}

/**
 * Report Modal - 内容举报弹窗（底部弹出样式）
 * 用于举报 AI 生成的内容（符合 Google Play AI Generated Content 政策）
 */
export default function ReportModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  onReportSuccess,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedReason || !contentId) return;

    setIsSubmitting(true);
    try {
      const result = await reportContent({
        contentType,
        contentId,
        reason: selectedReason,
      });

      if (result.success) {
        if (result.alreadyReported) {
          showToast({ text: 'You have already reported this content', duration: 'short' });
        } else {
          showToast({ text: 'Report submitted successfully', duration: 'short' });
        }
        onReportSuccess?.();
        onClose();
        setSelectedReason(null);
      } else {
        showToast({ text: result.error || 'Failed to submit report', duration: 'long' });
      }
    } catch (error) {
      console.error('Report failed:', error);
      showToast({ text: 'Failed to submit report', duration: 'long' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedReason(null);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[10000]"
        onClick={handleCancel}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[10001] bg-gray-900 rounded-t-2xl animate-slide-up"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="p-4">
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center bg-red-500/20 rounded-full">
              <Flag className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Report Content</h3>
              <p className="text-gray-400 text-sm">Why are you reporting this?</p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2 mb-4">
            {REPORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedReason(option.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  selectedReason === option.value
                    ? 'bg-red-500/20 border border-red-500'
                    : 'bg-gray-800 border border-transparent hover:bg-gray-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedReason === option.value
                      ? 'border-red-500 bg-red-500'
                      : 'border-gray-500'
                  }`}
                >
                  {selectedReason === option.value && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className="text-white text-sm">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 bg-gray-800 rounded-xl text-gray-300 font-medium hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedReason || isSubmitting}
              className="flex-1 py-3 bg-red-500 rounded-xl text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </div>
              ) : (
                'Confirm'
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
