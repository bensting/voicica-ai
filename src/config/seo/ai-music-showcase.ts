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
    coverUrl: 'https://musicfile.kie.ai/M2YxNjBhODMtZGIxNi00N2VjLTk0YTAtYTczNTg0ZjQzNmE5.jpeg',
    audioUrl: 'https://cdn.voicica.ai/music_audio/8ea1b93d-6530-4f59-88c8-61bf31d76dbc.mp3',
    duration: 180,
  },
  {
    id: 'm2',
    title: 'Chill Lo-Fi Beats',
    style: 'Lo-Fi, Chill, Hip-Hop',
    coverUrl: 'https://musicfile.kie.ai/Mzg3YzU2ZGMtM2JiNi00YjExLWI2NzQtODM2ZTIyMGFmOTUz.jpeg',
    audioUrl: 'https://cdn.voicica.ai/music_audio/ed86b54c-19fc-4080-b68e-0657a83c9617.mp3',
    duration: 210,
  },
  {
    id: 'm3',
    title: 'Summer Pop',
    style: 'Pop, Upbeat, Vocal',
    coverUrl: 'https://musicfile.kie.ai/ZGFkMjQxZDUtZGFmNS00ODcxLWJmMjItZTQ3ZjBkNTBiMzBk.jpeg',
    audioUrl: 'https://cdn.voicica.ai/music_audio/11fd2565-7df9-448f-88da-a9aca9cb33a0.mp3',
    duration: 195,
  },
  {
    id: 'm4',
    title: 'Dark Electronic',
    style: 'Electronic, Dark, Synthwave',
    coverUrl: 'https://musicfile.kie.ai/Y2EzMDBjYmUtZTNmMi00YjU4LWExOGItMGJiZTY5ODk4N2Ew.jpeg',
    audioUrl: 'https://cdn.voicica.ai/music_audio/c73641f1-9e87-4125-aad7-58a0cded0a7d.mp3',
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
