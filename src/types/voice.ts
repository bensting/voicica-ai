/**
 * Voice 相关类型定义
 * 匹配后端 Voice 模型
 */

/**
 * 语音信息（匹配后端 Voice 模型）
 */
export interface Voice {
  id: string;
  name: string;
  display_name: string;
  provider: string;
  locale: string;
  country: string;
  role: string;
  avatar_url: string;
  voice_sample_url: string;
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
 * 获取本地化的语音名称
 *
 * 注意：display_name 现在是单一字符串，不再需要语言代码
 */
export function getLocalizedVoiceName(voice: Voice): string {
  return voice.display_name || voice.name;
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