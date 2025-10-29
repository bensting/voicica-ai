import { useState, useEffect } from 'react';
import { Search, X, Globe } from 'lucide-react';
import { LocaleOption } from '@/types/config';
import FlagIcon from '@/components/sections/tts-samples/components/FlagIcon';

interface LanguageSelectorModalProps {
  /** 是否显示模态框 */
  isOpen: boolean;
  /** 关闭模态框回调 */
  onClose: () => void;
  /** 当前选中的语言 */
  selectedLocale: LocaleOption | null;
  /** 可用的语言选项列表 */
  availableLocales: LocaleOption[];
  /** 语言选择回调 */
  onSelect: (locale: LocaleOption) => void;
  /** 模态框标题 */
  title?: string;
  /** 搜索占位符 */
  searchPlaceholder?: string;
  /** 是否显示"All"选项 */
  showAllOption?: boolean;
}

/**
 * 语言选择器模态框组件（升级版）
 *
 * 功能：
 * - 全屏模态框展示所有语言选项
 * - 支持搜索过滤语言
 * - 显示国旗和语言名称
 * - 支持"All"选项（显示所有语言的内容）
 * - 响应式设计，移动端友好
 *
 * 使用场景：
 * - Voices 页面的语言筛选
 * - 任何需要选择语言/口音的场景
 */
export default function LanguageSelectorModal({
  isOpen,
  onClose,
  selectedLocale,
  availableLocales,
  onSelect,
  title = 'Select Language & Accent',
  searchPlaceholder = 'Select Language & Accent...',
  showAllOption = true,
}: LanguageSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocales, setFilteredLocales] = useState(availableLocales);

  // 搜索过滤逻辑
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLocales(availableLocales);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = availableLocales.filter((locale) =>
      locale.name.toLowerCase().includes(query)
    );
    setFilteredLocales(filtered);
  }, [searchQuery, availableLocales]);

  // 重置搜索
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // 处理选择
  const handleSelect = (locale: LocaleOption | null) => {
    if (locale) {
      onSelect(locale);
    }
    onClose();
  };

  // 处理"All"选项点击
  const handleAllClick = () => {
    // 这里可以传递一个特殊的 locale 值，或者直接关闭模态框
    // 根据实际需求调整
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* 模态框 - 从底部弹出 */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slideUp">
        <div
          className="bg-white rounded-t-3xl shadow-2xl w-full max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 拖动指示器 */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 搜索框 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* 语言列表 */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* "All" 选项 */}
            {showAllOption && !searchQuery && (
              <button
                onClick={handleAllClick}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Globe className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">All</span>
              </button>
            )}

            {/* 语言选项列表 */}
            {filteredLocales.length > 0 ? (
              <div className="space-y-1">
                {filteredLocales.map((locale) => (
                  <button
                    key={locale.code}
                    onClick={() => handleSelect(locale)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
                      selectedLocale?.code === locale.code
                        ? 'bg-purple-50 hover:bg-purple-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <FlagIcon countryCode={locale.countryCode} size="md" />
                    <span
                      className={`text-sm font-medium ${
                        selectedLocale?.code === locale.code
                          ? 'text-purple-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {locale.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 font-medium">No languages found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
              </div>
            )}
          </div>

          {/* 底部安全区域（适配iOS底部导航栏） */}
          <div className="h-safe-area-inset-bottom" />
        </div>
      </div>

      {/* 添加动画样式 */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}