import { useLanguage } from '@/contexts/LanguageContext';
import { VOICE_TAGS, type VoiceTag } from '@/config/voiceTags';

interface VoiceTagSelectorProps {
  /** 当前选中的标签ID */
  selectedTagId: string;
  /** 标签选择回调 */
  onTagSelect: (tagId: string) => void;
}

/**
 * Voice Tag Selector Component
 *
 * 语音标签选择器组件 - 用于 Voices 页面左侧筛选
 * - 支持国际化
 * - 特殊标签（All, My Clone, Used）显示在顶部
 * - 普通分类标签显示在下方
 * - 选中状态高亮显示
 */
export default function VoiceTagSelector({
  selectedTagId,
  onTagSelect,
}: VoiceTagSelectorProps) {
  const { t } = useLanguage();

  // 渲染标签项
  const renderTagItem = (tag: VoiceTag) => {
    const isSelected = selectedTagId === tag.id;
    const isSpecial = tag.isSpecial;

    return (
      <button
        key={tag.id}
        onClick={() => onTagSelect(tag.id)}
        className={`
          w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all
          ${
            isSelected
              ? isSpecial
                ? 'bg-purple-50 text-purple-600 border-l-4 border-purple-600'
                : 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
              : 'text-gray-700 hover:bg-gray-100'
          }
        `}
      >
        <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
          {tag.icon && <span className="text-sm flex-shrink-0">{tag.icon}</span>}
          <span className="truncate">{t(tag.labelKey)}</span>
        </div>
      </button>
    );
  };

  // 分离特殊标签和普通标签
  const specialTags = VOICE_TAGS.filter((tag) => tag.isSpecial);
  const normalTags = VOICE_TAGS.filter((tag) => !tag.isSpecial);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 w-[140px]">
      <div className="py-3 space-y-1.5">
        {/* 特殊标签区域 */}
        {specialTags.length > 0 && (
          <div className="px-2 space-y-0.5">
            {specialTags.map(renderTagItem)}
          </div>
        )}

        {/* 分隔线 */}
        {specialTags.length > 0 && normalTags.length > 0 && (
          <div className="px-2 py-1.5">
            <div className="h-px bg-gray-200" />
          </div>
        )}

        {/* 普通标签区域 */}
        {normalTags.length > 0 && (
          <div className="px-2 space-y-0.5">
            {normalTags.map(renderTagItem)}
          </div>
        )}
      </div>
    </div>
  );
}