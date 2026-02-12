export interface MusicSample {
  id: string;
  title: string;
  style: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
}

export const MUSIC_SAMPLES: MusicSample[] = [
  {
    id: 'm1',
    title: 'Epic Cinematic',
    style: 'Cinematic, Orchestral, Epic',
    coverUrl: 'https://cdn.voicica.ai/music_covers/7cb88535-0c3f-4c70-924e-0132b97922c9.jpg',
    audioUrl: 'https://cdn.voicica.ai/music_audio/7cb88535-0c3f-4c70-924e-0132b97922c9.mp3',
    duration: 180,
  },
  {
    id: 'm2',
    title: 'Chill Lo-Fi Beats',
    style: 'Lo-Fi, Chill, Hip-Hop',
    coverUrl: 'https://cdn.voicica.ai/music_covers/7cb88535-0c3f-4c70-924e-0132b97922c9.jpg',
    audioUrl: 'https://cdn.voicica.ai/music_audio/7cb88535-0c3f-4c70-924e-0132b97922c9.mp3',
    duration: 210,
  },
  {
    id: 'm3',
    title: 'Summer Pop',
    style: 'Pop, Upbeat, Vocal',
    coverUrl: 'https://cdn.voicica.ai/music_covers/7cb88535-0c3f-4c70-924e-0132b97922c9.jpg',
    audioUrl: 'https://cdn.voicica.ai/music_audio/7cb88535-0c3f-4c70-924e-0132b97922c9.mp3',
    duration: 195,
  },
  {
    id: 'm4',
    title: 'Dark Electronic',
    style: 'Electronic, Dark, Synthwave',
    coverUrl: 'https://cdn.voicica.ai/music_covers/7cb88535-0c3f-4c70-924e-0132b97922c9.jpg',
    audioUrl: 'https://cdn.voicica.ai/music_audio/7cb88535-0c3f-4c70-924e-0132b97922c9.mp3',
    duration: 165,
  },
];

export const MUSIC_SHOWCASE_LABELS: Record<string, string> = {
  en: 'Music Samples',
  ja: '音楽サンプル',
  'zh-Hant': '音樂樣本',
  ko: '음악 샘플',
  th: 'ตัวอย่างเพลง',
};
