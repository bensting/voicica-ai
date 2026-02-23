export interface SeoNavLink {
  id: string;
  path: string; // e.g. 'ai-voice'
}

export const SEO_NAV_LINKS: SeoNavLink[] = [
  { id: 'ai-voice', path: 'ai-voice' },
  { id: 'ai-music', path: 'ai-music' },
  { id: 'ai-image', path: 'ai-image' },
  { id: 'ai-video', path: 'ai-video' },
  { id: 'image-tools', path: 'image-tools' },
  { id: 'video-downloader', path: 'video-downloader' },
  { id: 'mining', path: 'mining' },
];

export const SEO_NAV_LABELS: Record<string, Record<string, string>> = {
  'ai-voice': {
    en: 'AI Voice',
    ja: 'AI音声',
    'zh-Hant': 'AI語音',
    ko: 'AI 보이스',
    th: 'AI เสียง',
    es: 'AI Voz',
  },
  'ai-music': {
    en: 'AI Music',
    ja: 'AI音楽',
    'zh-Hant': 'AI音樂',
    ko: 'AI 음악',
    th: 'AI เพลง',
    es: 'AI Música',
  },
  'ai-image': {
    en: 'AI Image',
    ja: 'AI画像',
    'zh-Hant': 'AI圖片',
    ko: 'AI 이미지',
    th: 'AI รูปภาพ',
    es: 'AI Imagen',
  },
  'ai-video': {
    en: 'AI Video',
    ja: 'AI動画',
    'zh-Hant': 'AI影片',
    ko: 'AI 비디오',
    th: 'AI วิดีโอ',
    es: 'AI Video',
  },
  'image-tools': {
    en: 'Image Tools',
    ja: '画像ツール',
    'zh-Hant': '圖片工具',
    ko: '이미지 도구',
    th: 'เครื่องมือรูปภาพ',
    es: 'Herramientas',
  },
  'video-downloader': {
    en: 'Video Downloader',
    ja: '動画ダウンロード',
    'zh-Hant': '影片下載',
    ko: '동영상 다운로드',
    th: 'ดาวน์โหลดวิดีโอ',
    es: 'Descargar Video',
  },
  'mining': {
    en: 'Mining',
    ja: 'マイニング',
    'zh-Hant': '挖礦',
    ko: '마이닝',
    th: 'ขุดเหรียญ',
    es: 'Minería',
  },
};

export const SEO_LANGUAGE_LABEL: Record<string, string> = {
  en: 'Language',
  ja: '言語',
  'zh-Hant': '語言',
  ko: '언어',
  th: 'ภาษา',
  es: 'Idioma',
};
