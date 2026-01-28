'use client';

import { useState, useEffect, useRef } from 'react';
import { X, MoreVertical, Trash2 } from 'lucide-react';
import type { ImageRecord } from '@/actions/image';
import DetailActionBar from './DetailActionBar';
import DeleteConfirmDialog from '@/components/native/ui/DeleteConfirmDialog';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { handleDownloadWithState } from '@/lib/native-download';

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
  const [showMenu, setShowMenu] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { hide, show } = useBottomNav();

  // 隐藏底部导航
  useEffect(() => {
    hide();
    return () => show();
  }, [hide, show]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleDownload = async () => {
    if (!image.image_url) return;

    const filename = `ai-image-${image.task_id}.png`;
    await handleDownloadWithState(image.image_url, filename, setDownloading, 'image');
  };

  const handleDeleteConfirm = () => {
    onDelete(image);
    setShowDeleteDialog(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a1a] flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-14 flex-shrink-0"
        style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
      >
        <button onClick={onClose} className="p-2 -ml-2 text-white">
          <X size={24} />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-white"
          >
            <MoreVertical size={20} />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 rounded-xl shadow-lg overflow-hidden z-10">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteDialog(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-700 transition-colors"
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

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
          onDownload={handleDownload}
          downloading={downloading}
          downloadDisabled={!image.image_url}
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
