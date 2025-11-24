type TabType = 'text_to_speech' | 'voice_cloning';

interface Tab {
  id: TabType;
  label: string;
}

interface SubscriptionTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: Tab[] = [
  { id: 'text_to_speech', label: 'Text to Voice' },
  { id: 'voice_cloning', label: 'Voice Clone' },
];

export default function SubscriptionTabs({ activeTab, onTabChange }: SubscriptionTabsProps) {
  return (
    <div className="border-b border-gray-200 mb-4">
      <nav className="flex gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}