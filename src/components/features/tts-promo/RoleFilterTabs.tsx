'use client';

export interface RoleOption {
  code: string;
  name: string;
  icon: string;
}

interface RoleFilterTabsProps {
  options: RoleOption[];
  selected: string;
  onSelect: (code: string) => void;
}

/**
 * Role Filter Tabs - 角色筛选标签
 *
 * 用于 TTS 落地页的角色过滤（全部/明星/专业）
 */
export default function RoleFilterTabs({
  options,
  selected,
  onSelect,
}: RoleFilterTabsProps) {
  return (
    <>
      {options.map((role) => (
        <button
          key={role.code}
          onClick={() => onSelect(role.code)}
          className={`flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-all rounded-full whitespace-nowrap ${
            selected === role.code
              ? 'text-yellow-400 bg-gray-700/50'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
          }`}
        >
          <span className={selected === role.code ? '' : 'opacity-60'}>{role.icon}</span>
          <span>{role.name}</span>
        </button>
      ))}
    </>
  );
}