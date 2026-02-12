export interface VoiceSample {
  id: string;
  displayName: string;
  avatarUrl: string;
  gender: 'male' | 'female';
  provider: string;
  country: string;
  language: string;
  text: string;
  audioUrl: string;
  duration: number;
}

export interface DialogueSample {
  id: string;
  speakers: string[];
  previewText: string;
  audioUrl: string;
  duration: number;
}

export const VOICE_SAMPLES: VoiceSample[] = [
  {
    id: 'v1',
    displayName: 'Sarah',
    avatarUrl: 'https://storage.googleapis.com/eleven-public-prod/custom/voices/kKkMzsbGIsJCMYfvJwjN/HFbLlrfsOhsOsPpsSFmo.png',
    gender: 'female',
    provider: 'ElevenLabs',
    country: 'US',
    language: 'English',
    text: 'Welcome to Voicica AI, the most powerful free text to speech platform with over 3,200 natural voices.',
    audioUrl: 'https://cdn.voicica.ai/dialogue_audio/dialogue_c77d7b90-cc00-4b68-bc05-5117da50766c.mp3',
    duration: 8,
  },
  {
    id: 'v2',
    displayName: 'Takumi',
    avatarUrl: 'https://storage.googleapis.com/eleven-public-prod/custom/voices/aEO01A4wXwd1O8GPgGlF/cHBqRSpnenJEAX5BKOVI.png',
    gender: 'male',
    provider: 'ElevenLabs',
    country: 'JP',
    language: '日本語',
    text: 'AIの力で、テキストを自然な音声に変換しましょう。190以上の言語に対応しています。',
    audioUrl: 'https://cdn.voicica.ai/dialogue_audio/dialogue_c77d7b90-cc00-4b68-bc05-5117da50766c.mp3',
    duration: 6,
  },
  {
    id: 'v3',
    displayName: 'Aria',
    avatarUrl: 'https://storage.googleapis.com/eleven-public-prod/custom/voices/9BWtsMINqrJLrRacOk9x/zYRMnsfLrHROm0VWTfEv.png',
    gender: 'female',
    provider: 'ElevenLabs',
    country: 'GB',
    language: 'English (UK)',
    text: 'Create stunning voiceovers for your videos, podcasts, and e-learning content in seconds.',
    audioUrl: 'https://cdn.voicica.ai/dialogue_audio/dialogue_c77d7b90-cc00-4b68-bc05-5117da50766c.mp3',
    duration: 7,
  },
  {
    id: 'v4',
    displayName: 'Yuna',
    avatarUrl: 'https://storage.googleapis.com/eleven-public-prod/custom/voices/pFZP5JQG7iQjIQuC4Bku/mFXyxGXSuCPX42VzQXHp.png',
    gender: 'female',
    provider: 'Google',
    country: 'KR',
    language: '한국어',
    text: 'AI 음성 기술로 자연스러운 나레이션을 만들어 보세요. 무료로 시작할 수 있습니다.',
    audioUrl: 'https://cdn.voicica.ai/dialogue_audio/dialogue_c77d7b90-cc00-4b68-bc05-5117da50766c.mp3',
    duration: 5,
  },
];

export const DIALOGUE_SAMPLES: DialogueSample[] = [
  {
    id: 'd1',
    speakers: ['Emma', 'James'],
    previewText: 'Hey James, have you tried the new AI voice generator?',
    audioUrl: 'https://cdn.voicica.ai/dialogue_audio/dialogue_c77d7b90-cc00-4b68-bc05-5117da50766c.mp3',
    duration: 25,
  },
  {
    id: 'd2',
    speakers: ['Narrator', 'Character A', 'Character B'],
    previewText: 'In a world where technology meets creativity...',
    audioUrl: 'https://cdn.voicica.ai/dialogue_audio/dialogue_c77d7b90-cc00-4b68-bc05-5117da50766c.mp3',
    duration: 42,
  },
];

export const SHOWCASE_LABELS: Record<string, { voices: string; dialogues: string }> = {
  en: { voices: 'Voice Samples', dialogues: 'Dialogue Samples' },
  ja: { voices: '音声サンプル', dialogues: '対話サンプル' },
  'zh-Hant': { voices: '語音樣本', dialogues: '對話樣本' },
  ko: { voices: '음성 샘플', dialogues: '대화 샘플' },
  th: { voices: 'ตัวอย่างเสียง', dialogues: 'ตัวอย่างบทสนทนา' },
};
