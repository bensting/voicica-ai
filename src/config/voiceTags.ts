/**
 * Voice Tags Configuration
 *
 * 语音标签配置，用于 Voices 页面的筛选功能
 * 支持国际化 (i18n keys)
 */

export interface VoiceTag {
  /** 标签唯一标识 */
  id: string;
  /** 国际化 key */
  labelKey: string;
  /** 图标（可选，可以使用 emoji 或 lucide-react 图标名称） */
  icon?: string;
  /** 是否为特殊标签（如 "All"、"My Clone" 等） */
  isSpecial?: boolean;
}

/**
 * 语音标签列表
 */
export const VOICE_TAGS: VoiceTag[] = [
  // 特殊标签
  {
    id: 'all',
    labelKey: 'voices.tags.all',
    isSpecial: true,
  },
  {
    id: 'my-clone',
    labelKey: 'voices.tags.myClone',
    isSpecial: true,
  },
  {
    id: 'used',
    labelKey: 'voices.tags.used',
    isSpecial: true,
  },

  // 用途分类
  {
    id: 'social-media',
    labelKey: 'voices.tags.socialMedia',
    icon: '📱',
  },
  {
    id: 'celebrities',
    labelKey: 'voices.tags.celebrities',
    icon: '⭐',
  },
  {
    id: 'animation',
    labelKey: 'voices.tags.animation',
    icon: '🎬',
  },
  {
    id: 'movies-tv',
    labelKey: 'voices.tags.moviesTV',
    icon: '🎥',
  },
  {
    id: 'games',
    labelKey: 'voices.tags.games',
    icon: '🎮',
  },
  {
    id: 'festivals',
    labelKey: 'voices.tags.festivals',
    icon: '🎉',
  },
  {
    id: 'narration',
    labelKey: 'voices.tags.narration',
    icon: '📖',
  },
  {
    id: 'new',
    labelKey: 'voices.tags.new',
    icon: '✨',
  },

  // 其他常用标签
  {
    id: 'commercial',
    labelKey: 'voices.tags.commercial',
    icon: '💼',
  },
  {
    id: 'audiobook',
    labelKey: 'voices.tags.audiobook',
    icon: '📚',
  },
  {
    id: 'podcast',
    labelKey: 'voices.tags.podcast',
    icon: '🎙️',
  },
  {
    id: 'education',
    labelKey: 'voices.tags.education',
    icon: '🎓',
  },
];

/**
 * 获取特殊标签（显示在顶部）
 */
export function getSpecialTags(): VoiceTag[] {
  return VOICE_TAGS.filter((tag) => tag.isSpecial);
}

/**
 * 获取普通标签（分类标签）
 */
export function getNormalTags(): VoiceTag[] {
  return VOICE_TAGS.filter((tag) => !tag.isSpecial);
}

/**
 * 根据 ID 获取标签
 */
export function getTagById(id: string): VoiceTag | undefined {
  return VOICE_TAGS.find((tag) => tag.id === id);
}