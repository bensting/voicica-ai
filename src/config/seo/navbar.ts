export interface SeoNavLink {
  id: string;
  path: string; // e.g. 'ai-voice'
}

export const SEO_NAV_LINKS: SeoNavLink[] = [
  { id: 'ai-voice', path: 'ai-voice' },
  { id: 'ai-music', path: 'ai-music' },
  { id: 'ai-image', path: 'ai-image' },
  { id: 'video-downloader', path: 'video-downloader' },
];

export const SEO_NAV_LABELS: Record<string, Record<string, string>> = {
  'ai-voice': {
    en: 'AI Voice',
    ja: 'AI音声',
    'zh-Hant': 'AI語音',
    ko: 'AI 보이스',
    th: 'AI เสียง',
  },
  'ai-music': {
    en: 'AI Music',
    ja: 'AI音楽',
    'zh-Hant': 'AI音樂',
    ko: 'AI 음악',
    th: 'AI เพลง',
  },
  'ai-image': {
    en: 'AI Image',
    ja: 'AI画像',
    'zh-Hant': 'AI圖片',
    ko: 'AI 이미지',
    th: 'AI รูปภาพ',
  },
  'video-downloader': {
    en: 'Video Downloader',
    ja: '動画ダウンロード',
    'zh-Hant': '影片下載',
    ko: '동영상 다운로드',
    th: 'ดาวน์โหลดวิดีโอ',
  },
};

export const SEO_LANGUAGE_LABEL: Record<string, string> = {
  en: 'Language',
  ja: '言語',
  'zh-Hant': '語言',
  ko: '언어',
  th: 'ภาษา',
};
