'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

const MODELS = [
  {
    id: 'veo-3.1-generate-001',
    name: 'Veo 3.1',
    description: 'video.veo31Description',
    badge: 'video.latest',
    recommended: true,
  },
];

/**
 * Video model selector
 */
export default function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
}: ModelSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {t('video.model')}
      </label>
      <div className="space-y-2">
        {MODELS.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => onModelChange(model.id)}
            disabled={disabled}
            className={`
              w-full p-3 rounded-xl border-2 text-left
              transition-all duration-200
              ${selectedModel === model.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${selectedModel === model.id ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className={`font-medium ${selectedModel === model.id ? 'text-purple-700' : 'text-gray-700'}`}>
                  {model.name}
                </span>
              </div>
              {model.recommended && (
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                  {t(model.badge)}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500 ml-6">
              {t(model.description)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}