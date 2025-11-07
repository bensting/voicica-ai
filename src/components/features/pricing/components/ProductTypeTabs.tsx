'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export type ProductType = 'text_to_speech' | 'voice_cloning';

interface ProductTypeTabsProps {
  activeType: ProductType;
  onChange: (type: ProductType) => void;
}

/**
 * Product type tabs component
 * Allows switching between Text to Voice and Voice Clone subscription types
 */
export default function ProductTypeTabs({ activeType, onChange }: ProductTypeTabsProps) {
  const { t } = useLanguage();

  const tabs: { type: ProductType; labelKey: string }[] = [
    { type: 'text_to_speech', labelKey: 'upgrade.tabs.textToVoice' },
    { type: 'voice_cloning', labelKey: 'upgrade.tabs.voiceClone' },
  ];

  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex bg-gray-100 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.type}
            onClick={() => onChange(tab.type)}
            className={`
              px-6 py-2.5 rounded-md font-medium transition-all duration-200
              ${
                activeType === tab.type
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}