import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { LocaleOption } from '@/types/config';
import FlagIcon from '@/components/sections/tts-samples/components/FlagIcon';

interface LanguageSelectorProps {
  /** 当前选中的语言选项 */
  selectedLocale: LocaleOption | null;
  /** 可用的语言选项列表 */
  availableLocales: LocaleOption[];
  /** 语言选择回调 */
  onSelect: (locale: LocaleOption) => void;
  /** 是否显示下拉菜单 */
  isOpen: boolean;
  /** 切换下拉菜单 */
  onToggle: () => void;
  /** 主题模式 */
  theme?: 'light' | 'dark';
  /** 是否显示解锁CTA */
  showUnlockCTA?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 自定义高度 */
  height?: string;
}

/**
 * 语言选择器组件（公共组件）
 *
 * 功能：
 * - 显示当前选中的语言（国旗 + 名称）
 * - 点击展开下拉菜单选择其他语言
 * - 支持 light/dark 主题模式
 * - 支持多语言配置
 * - 可选显示解锁更多语言的 CTA
 *
 * 使用场景：
 * - TTS 样本区域（dark 模式）
 * - Voices 页面（light 模式）
 * - 其他需要语言选择的场景
 */
export default function LanguageSelector({
  selectedLocale,
  availableLocales,
  onSelect,
  isOpen,
  onToggle,
  theme = 'light',
  showUnlockCTA = false,
  placeholder = 'Select Language',
  height = 'h-[66px]',
}: LanguageSelectorProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  // 处理解锁CTA点击
  const handleUnlockClick = () => {
    router.push('/native/create/voice');
  };

  // 主题样式配置
  const themeStyles = {
    light: {
      button: 'bg-white border-gray-200 hover:bg-gray-50',
      text: 'text-gray-900',
      placeholder: 'text-gray-400',
      icon: 'text-gray-600',
      dropdown: 'bg-white border-gray-200 shadow-lg',
      item: 'hover:bg-gray-100',
      itemSelected: 'bg-gray-100',
      itemText: 'text-gray-900',
    },
    dark: {
      button: 'bg-gray-900/90 border-gray-700 hover:bg-gray-800',
      text: 'text-white',
      placeholder: 'text-gray-400',
      icon: 'text-gray-400',
      dropdown: 'bg-gray-800 border-gray-700 shadow-lg',
      item: 'hover:bg-gray-700',
      itemSelected: 'bg-gray-700',
      itemText: 'text-white',
    },
  };

  const styles = themeStyles[theme];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* 选择按钮 */}
      <button
        onClick={onToggle}
        className={`w-full ${height} flex items-center justify-between gap-2 px-4 border rounded-xl transition-colors ${styles.button}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedLocale ? (
            <>
              <FlagIcon countryCode={selectedLocale.countryCode} size="md" />
              <span className={`text-sm whitespace-nowrap truncate ${styles.text}`}>
                {selectedLocale.name}
              </span>
            </>
          ) : (
            <span className={`text-sm ${styles.placeholder}`}>{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform ${styles.icon} ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && availableLocales.length > 0 && (
        <div className={`absolute right-0 mt-2 w-64 border rounded-xl z-10 overflow-hidden ${styles.dropdown}`}>
          {/* 语言列表 - 隐藏滚动条 */}
          <div
            className="max-h-64 overflow-y-auto scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {availableLocales.map((locale) => (
              <button
                key={locale.code}
                onClick={() => {
                  onSelect(locale);
                  onToggle();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${styles.item} ${
                  selectedLocale?.code === locale.code ? styles.itemSelected : ''
                }`}
              >
                <FlagIcon countryCode={locale.countryCode} size="md" />
                <span className={`text-sm ${styles.itemText}`}>{locale.name}</span>
              </button>
            ))}
          </div>

          {/* 解锁更多语言 CTA（可选） */}
          {showUnlockCTA && (
            <div
              onClick={handleUnlockClick}
              className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-center cursor-pointer hover:from-purple-500 hover:to-purple-600 transition-all"
            >
              <div className="text-white font-bold text-sm mb-1">解鎖更多免費聲音</div>
              <div className="text-purple-100 text-xs">190+種語言和口音</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}