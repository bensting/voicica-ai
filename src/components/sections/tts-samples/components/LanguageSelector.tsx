import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { LocaleOption } from '@/types/config';
import { useLanguage } from '@/contexts/LanguageContext';
import FlagIcon from './FlagIcon';

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
}

/**
 * 语言选择器组件
 *
 * 功能：
 * - 显示当前选中的语言（国旗 + 名称）
 * - 点击展开下拉菜单选择其他语言
 * - 支持多语言配置
 * - 底部显示高级功能 CTA
 *
 * 优化：
 * - 使用图片国旗代替 emoji，桌面端兼容性更好
 * - 隐藏滚动条，保持界面美观
 * - 添加解锁更多语言的 CTA 按钮
 */
export default function LanguageSelector({
  selectedLocale,
  availableLocales,
  onSelect,
  isOpen,
  onToggle,
}: LanguageSelectorProps) {
  const router = useRouter();
  const { t } = useLanguage();
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
    router.push('/studio/tts');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* 选择按钮 - 与 VoiceSelector 相同高度 */}
      <button
        onClick={onToggle}
        className="w-full h-[66px] flex items-center gap-2 px-4 bg-white border border-pink-200 rounded-xl hover:bg-pink-50 transition-colors"
      >
        {selectedLocale ? (
          <>
            <FlagIcon countryCode={selectedLocale.countryCode} size="md" />
            <span className="text-gray-900 text-sm whitespace-nowrap">{selectedLocale.name}</span>
          </>
        ) : (
          <span className="text-gray-400 text-sm">{t('ttsSamples.languageSelector.placeholder')}</span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && availableLocales.length > 0 && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-pink-200 rounded-xl shadow-lg z-10 overflow-hidden">
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
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-pink-50 transition-colors ${
                  selectedLocale?.code === locale.code ? 'bg-pink-50' : ''
                }`}
              >
                <FlagIcon countryCode={locale.countryCode} size="md" />
                <span className="text-gray-900 text-sm">{locale.name}</span>
              </button>
            ))}
          </div>

          {/* 解锁更多语言 CTA */}
          <div
            onClick={handleUnlockClick}
            className="bg-gradient-to-r from-pink-400 to-rose-400 p-4 text-center cursor-pointer hover:from-pink-500 hover:to-rose-500 transition-all"
          >
            <div className="text-white font-bold text-sm mb-1">{t('ttsSamples.languageSelector.unlockTitle')}</div>
            <div className="text-pink-100 text-xs">{t('ttsSamples.languageSelector.unlockSubtitle')}</div>
          </div>
        </div>
      )}
    </div>
  );
}