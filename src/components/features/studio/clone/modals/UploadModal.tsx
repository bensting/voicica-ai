'use client';

import { useEffect } from 'react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocalUpload: () => void;
  onRecordAudio: () => void;
}

/**
 * Upload Modal Component - Bottom Sheet
 *
 * Displays a bottom sheet modal with two upload options:
 * 1. Local Upload - Upload files from device
 * 2. Record Audio - Record audio directly
 */
export default function UploadModal({
  isOpen,
  onClose,
  onLocalUpload,
  onRecordAudio,
}: UploadModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-white rounded-t-3xl shadow-xl max-w-md mx-auto">
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 pt-4 pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Upload video or audio files
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="px-6 py-6 space-y-4">
            {/* Local Upload Option */}
            <button
              onClick={() => {
                onLocalUpload();
                onClose();
              }}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <span className="text-base font-medium text-gray-900">
                  Local Upload
                </span>
              </div>
              <div className="bg-purple-600 text-white px-5 py-2 rounded-lg font-medium text-sm">
                Start
              </div>
            </button>

            {/* Record Audio Option */}
            <button
              onClick={() => {
                onRecordAudio();
                onClose();
              }}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg
                    className="w-6 h-6 text-purple-600"
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
                <span className="text-base font-medium text-gray-900">
                  Record Audio
                </span>
              </div>
              <div className="bg-purple-600 text-white px-5 py-2 rounded-lg font-medium text-sm">
                Start
              </div>
            </button>
          </div>

          {/* Bottom padding for safe area */}
          <div className="h-6" />
        </div>
      </div>
    </>
  );
}