'use client';

interface OptionCardProps {
  icon: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

/**
 * Option Card Component
 *
 * 可选择的选项卡片（用于主题、情绪、声线等选择）
 */
export default function OptionCard({ icon, label, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl border-2 transition-all duration-200
        flex items-center gap-3
        ${
          selected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
        }
      `}
    >
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <span className={`text-left font-medium ${selected ? 'text-blue-600' : 'text-gray-700'}`}>
        {label}
      </span>

      {/* Selection Indicator */}
      <div className="ml-auto flex-shrink-0">
        <div
          className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}
          `}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}