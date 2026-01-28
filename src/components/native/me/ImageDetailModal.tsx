'use client';

import { useState, useEffect } from 'react';
import type { ImageRecord } from '@/actions/image';
import { createShareLink } from '@/actions/share';
import DetailModalHeader from './DetailModalHeader';
import DetailActionBar from './DetailActionBar';
import DeleteConfirmDialog from '@/components/native/ui/DeleteConfirmDialog';
import { useBottomNav } from '@/contexts/BottomNavContext';

interface ImageDetailModalProps {
  image: ImageRecord;
  onClose: () => void;
  onRecreate: (image: ImageRecord) => void;
  onDelete: (image: ImageRecord) => void;
}

// 模型名称映射
const modelDisplayNames: Record<string, string> = {
  'nano-banana-pro': 'Nano Banana Pro',
  'seedream/4.5-text-to-image': 'Seedream 4.5',
  'seedream/4.5-edit': 'Seedream 4.5',
  'flux-2': 'Flux.2',
  'flux-2/flex-text-to-image': 'Flux.2',
  'flux-2/flex-image-to-image': 'Flux.2',
  'z-image': 'Z-Image',
};

function getModelDisplayName(modelId: string): string {
  return modelDisplayNames[modelId] || modelId;
}

export default function ImageDetailModal({
  image,
  onClose,
  onRecreate,
  onDelete,
}: ImageDetailModalProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { hide, show } = useBottomNav();

  // 隐藏底部导航
  useEffect(() => {
    hide();
    return () => show();
  }, [hide, show]);

  // 预先生成分享链接（用于"在浏览器打开"功能）
  useEffect(() => {
    if (image.task_id) {
      createShareLink('image', image.task_id)
        .then((result) => setShareUrl(result.url))
        .catch((err) => console.error('Failed to create share link:', err));
    }
  }, [image.task_id]);

  const handleDeleteConfirm = () => {
    onDelete(image);
    setShowDeleteDialog(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a1a] flex flex-col">
      {/* Header */}
      <DetailModalHeader
        onClose={onClose}
        onDelete={() => setShowDeleteDialog(true)}
        browserUrl={shareUrl || undefined}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Image */}
        <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-800 mb-4">
          {image.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.image_url}
              alt={image.prompt}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          {/* Model & Settings */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="px-2 py-1 bg-gray-800 rounded">{getModelDisplayName(image.model)}</span>
            <span className="px-2 py-1 bg-gray-800 rounded">{image.aspect_ratio}</span>
            {image.quality && (
              <span className="px-2 py-1 bg-gray-800 rounded">{image.quality}</span>
            )}
          </div>

          {/* Prompt */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Prompt</h3>
            <p className="text-white text-sm leading-relaxed">{image.prompt}</p>
          </div>

          {/* Credits Used */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Credits used</span>
            <span className="text-white">{image.credits_used}</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-[#0a0a1a]/95 backdrop-blur-sm border-t border-gray-800"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <DetailActionBar
          onRecreate={() => onRecreate(image)}
          fileUrl={image.image_url || undefined}
          fileName={`voicica_image_${image.task_id}.png`}
          fileType="image"
        />
      </div>

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete this image?"
      />
    </div>
  );
}
