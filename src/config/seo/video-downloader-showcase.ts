export interface PlatformInfo {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  features: string[];
}

export const PLATFORMS: PlatformInfo[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20',
    features: ['4K Video', 'Audio', 'Shorts'],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10 border-pink-500/20',
    features: ['No Watermark', 'Audio', 'HD'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    features: ['Reels', 'Stories', 'Audio'],
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10 border-sky-500/20',
    features: ['Video', 'GIF', 'Audio'],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    features: ['Video', 'Reels', 'Audio'],
  },
];

export const SHOWCASE_LABELS: Record<
  string,
  {
    title: string;
    placeholder: string;
    button: string;
    supported: string;
  }
> = {
  en: {
    title: 'Paste a Video URL to Download',
    placeholder: 'https://www.youtube.com/watch?v=...',
    button: 'Parse Video',
    supported: 'Supported Platforms',
  },
  ja: {
    title: '動画URLを貼り付けてダウンロード',
    placeholder: 'https://www.youtube.com/watch?v=...',
    button: '動画を解析',
    supported: '対応プラットフォーム',
  },
  'zh-Hant': {
    title: '貼上影片網址即可下載',
    placeholder: 'https://www.youtube.com/watch?v=...',
    button: '解析影片',
    supported: '支援平台',
  },
  ko: {
    title: '영상 URL을 붙여넣어 다운로드',
    placeholder: 'https://www.youtube.com/watch?v=...',
    button: '영상 분석',
    supported: '지원 플랫폼',
  },
  th: {
    title: 'วาง URL วิดีโอเพื่อดาวน์โหลด',
    placeholder: 'https://www.youtube.com/watch?v=...',
    button: 'วิเคราะห์วิดีโอ',
    supported: 'แพลตฟอร์มที่รองรับ',
  },
};
