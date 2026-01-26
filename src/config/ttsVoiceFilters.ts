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

/**
 * TTS 允许的供应商列表（用于默认筛选）
 * 当选择 "All" 时，只显示这些供应商的语音
 */
export const TTS_ALLOWED_PROVIDERS = ['Microsoft', 'Google'];

/**
 * 检查供应商是否在 TTS 允许列表中（大小写不敏感）
 */
export function isTTSProvider(provider: string): boolean {
  return TTS_ALLOWED_PROVIDERS.some(
    p => p.toLowerCase() === provider.toLowerCase()
  );
}
