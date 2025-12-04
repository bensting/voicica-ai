'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface TextExpandModalProps {
  isOpen: boolean;
  text: string;
  onClose: () => void;
}

export default function TextExpandModal({ isOpen, text, onClose }: TextExpandModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content - Fixed 50% height */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] w-full h-[50vh] bg-white rounded-t-2xl animate-slide-up shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-white rounded-t-2xl border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Generated Text</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
            {text}
          </p>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}