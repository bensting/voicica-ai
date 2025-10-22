'use client';

import { Mic, Coins, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StudioToolbarProps {
  title: string;
  credits: number;
  onUpgradeClick?: () => void;
}

/**
 * Studio Toolbar Component
 *
 * Displays:
 * - Studio feature title with icon
 * - User credits
 * - Upgrade button
 */
export default function StudioToolbar({
  title,
  credits,
  onUpgradeClick,
}: StudioToolbarProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
        {/* Left: Icon + Text */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>

        {/* Right: Credits + Upgrade */}
        <div className="flex items-center gap-4">
          {/* Credits Display */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
              <Coins className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-blue-900">{credits}</span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300"></div>

          {/* Upgrade Button */}
          <button
            onClick={onUpgradeClick}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm"
          >
            <Star className="w-4 h-4" />
            <span className="text-sm">{t('studio.upgrade') || '购买/升级'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}