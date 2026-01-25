'use client';

import { useEffect } from 'react';
import { VideoModel, videoModels } from '@/config/native/videoModels';

interface ModelSelectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModelId: string;
  onSelect: (model: VideoModel) => void;
}

// Google 图标
const GoogleIcon = () => (
  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
    <svg className="w-7 h-7" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  </div>
);

// OpenAI 图标
const OpenAIIcon = () => (
  <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center">
    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.6 8.3829l2.02-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  </div>
);

// Topix 图标
const TopixIcon = () => (
  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
    <span className="text-white font-bold text-lg">Ai</span>
  </div>
);

// Vidu 图标
const ViduIcon = () => (
  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  </div>
);

// Pixverse 图标
const PixverseIcon = () => (
  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
    </svg>
  </div>
);

// Wan 图标
const WanIcon = () => (
  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  </div>
);

// Kling 图标
const KlingIcon = () => (
  <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center border border-gray-700">
    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  </div>
);

// Seedance (ByteDance) 图标
const SeedanceIcon = () => (
  <div className="w-12 h-12 rounded-xl bg-[#1a2634] flex items-center justify-center">
    <svg className="w-7 h-7" viewBox="0 0 384 384" fill="white">
      <rect x="30" y="95" width="55" height="250" />
      <rect x="110" y="150" width="55" height="195" />
      <rect x="200" y="35" width="55" height="310" />
      <rect x="295" y="95" width="55" height="250" />
    </svg>
  </div>
);

// 图标映射
const iconComponents: Record<string, React.FC> = {
  google: GoogleIcon,
  openai: OpenAIIcon,
  topix: TopixIcon,
  vidu: ViduIcon,
  pixverse: PixverseIcon,
  wan: WanIcon,
  kling: KlingIcon,
  seedance: SeedanceIcon,
};

/**
 * 模型选择底部弹窗
 */
export default function ModelSelectorSheet({
  isOpen,
  onClose,
  selectedModelId,
  onSelect,
}: ModelSelectorSheetProps) {
  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (model: VideoModel) => {
    onSelect(model);
    onClose();
  };

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet 内容 */}
      <div className="fixed left-0 right-0 bottom-0 z-50 bg-gray-900 rounded-t-3xl animate-slide-up max-h-[80vh] overflow-hidden flex flex-col">
        {/* 拖动条 */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* 标题 */}
        <h2 className="text-white text-lg font-semibold text-center mb-4 flex-shrink-0">
          Select Model
        </h2>

        {/* 模型列表 */}
        <div className="flex-1 overflow-auto px-4 pb-6" style={{ paddingBottom: 'calc(24px + var(--safe-area-inset-bottom, 0px))' }}>
          <div className="space-y-3">
            {videoModels.map((model) => {
              const IconComponent = iconComponents[model.icon];
              const isSelected = model.id === selectedModelId;

              return (
                <button
                  key={model.id}
                  onClick={() => handleSelect(model)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                    isSelected
                      ? 'bg-gray-700/80 border border-gray-600'
                      : 'bg-gray-800/60 hover:bg-gray-700/60'
                  }`}
                >
                  {IconComponent && <IconComponent />}
                  <div className="flex-1 text-left">
                    <h3 className="text-white font-medium">{model.name}</h3>
                    <p className="text-sm text-gray-400">{model.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
