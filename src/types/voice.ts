/**
 * Voice 相关类型定义
 * 匹配后端 Voice 模型
 */

/**
 * 语音信息（匹配后端 Voice 模型）
 */
/**
 * 语音样本 URL 映射
 * key: style 名称 (如 "default", "calm", "cheerful")
 * value: 对应的音频 URL
 */
export type VoiceSampleUrlMap = Record<string, string>;

export interface Voice {
  id: string;
  name: string;
  display_name: string;
  provider: string;
  locale: string;
  country: string;
  role: string;
  avatar_url: string;
  voice_sample_url: VoiceSampleUrlMap; // {style: url} 格式
  voice_sample_text?: string;
  gender: 'male' | 'female' | 'neutral';
  tags: string[];
  style_list: string[];
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * 语音列表响应
 */
export interface VoiceListResponse {
  voices: Voice[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * 语音过滤参数
 */
export interface VoiceFilters {
  provider?: string;
  country?: string;
  language?: string;
  locale?: string;
  role?: string;
  gender?: string;
  tag?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

/**
 * 获取本地化的语音名称
 *
 * 注意：display_name 现在是单一字符串，不再需要语言代码
 */
export function getLocalizedVoiceName(voice: Voice): string {
  return voice.display_name || voice.name;
}

/**
 * 获取指定风格的语音样本 URL
 * @param voice - 语音对象
 * @param style - 风格名称，默认为 'default'
 * @returns 样本 URL，如果找不到则返回 default 或第一个可用的 URL
 */
export function getVoiceSampleUrl(voice: Voice, style?: string | null): string {
  const sampleUrls = voice.voice_sample_url;

  // 如果是字符串（兼容旧格式），直接返回
  if (typeof sampleUrls === 'string') {
    return sampleUrls;
  }

  // 尝试获取指定 style 的 URL
  if (style && sampleUrls[style]) {
    return sampleUrls[style];
  }

  // 回退到 default
  if (sampleUrls['default']) {
    return sampleUrls['default'];
  }

  // 如果没有 default，返回第一个可用的 URL
  const urls = Object.values(sampleUrls);
  return urls[0] || '';
}

/**
 * 语音查询参数
 */
export interface VoiceQueryParams {
  provider?: string;
  country?: string;
  language?: string;
  locale?: string;
  role?: string;
  gender?: 'male' | 'female' | 'neutral';
  is_active?: boolean;
  limit?: number;
}