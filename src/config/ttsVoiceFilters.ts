/**
 * TTS Voice Filters Configuration
 *
 * 用于 TTS 语音选择器的筛选选项配置
 */

export interface FilterOption {
  /** 选项值 */
  value: string;
  /** 显示标签 */
  label: string;
}

/**
 * 性别筛选选项
 */
export const TTS_GENDER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

/**
 * TTS 供应商筛选选项
 */
export const TTS_PROVIDER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'Microsoft', label: 'Microsoft' },
  { value: 'Google', label: 'Google' },
];
