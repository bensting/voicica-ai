/**
 * TTS Promo 落地页公共组件
 */

// 组件
export { default as VoiceSampleGrid } from './VoiceSampleGrid';
export { default as VoiceSelectorSection } from './VoiceSelectorSection';
export { default as VoiceSamplesSection } from './VoiceSamplesSection';
export { default as LanguageDropdown } from './LanguageDropdown';
export { default as RoleFilterTabs } from './RoleFilterTabs';
export type { RoleOption } from './RoleFilterTabs';
export { default as LanguageExploreGrid } from './LanguageExploreGrid';
export type { LanguageCardItem } from './LanguageExploreGrid';
export { default as TTSHeroSection } from './TTSHeroSection';
export { default as TTSCTASection } from './TTSCTASection';

// 配置
export {
  ALL_LANGUAGES,
  EXPLORE_LANGUAGE_PAGES,
  STATS_VALUES,
  getLanguageOptions,
  type LanguageOption,
  type LanguagePageItem,
} from './languageConfig';