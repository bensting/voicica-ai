import { getEnabledProductTypeTabs } from '@/config/subscription';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ProductType } from '@/config/subscription';

export type TabType = ProductType;

interface SubscriptionTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function SubscriptionTabs({ activeTab, onTabChange }: SubscriptionTabsProps) {
  const { t } = useLanguage();
  const enabledTabs = getEnabledProductTypeTabs();

  return (
    <div className="border-b border-gray-200 mb-4">
      <nav className="flex gap-4">
        {enabledTabs.map((tab) => (
          <button
            key={tab.type}
            onClick={() => onTabChange(tab.type)}
            className={`
              px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${
                activeTab === tab.type
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </nav>
    </div>
  );
}