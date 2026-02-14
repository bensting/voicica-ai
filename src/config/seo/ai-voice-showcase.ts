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
    avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Sarah&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
    gender: 'female',
    provider: 'ElevenLabs',
    country: 'US',
    language: 'English',
    text: 'Welcome to Voicica AI, the most powerful free text to speech platform with over 3,200 natural voices.',
    audioUrl: 'https://cdn.voicica.ai/dialogue_audio/dialogue_b6938107-7a6d-4cda-bf92-bfd0a3f9ab60.mp3',
    duration: 8,
  },
  {
    id: 'v2',
    displayName: 'Takumi',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ja-JP%3Aja-JP-Neural2-C',
    gender: 'male',
    provider: 'ElevenLabs',
    country: 'JP',
    language: '日本語',
    text: 'AIの力で、テキストを自然な音声に変換しましょう。190以上の言語に対応しています。',
    audioUrl: 'https://cdn.voicica.ai/tts_audio/vtEyZ69jh3YfkGlyweAnJR6fhR13/1eb520ab-f62b-4ee8-8237-f667d8869a9e.mp3',
    duration: 6,
  },
  {
    id: 'v3',
    displayName: 'Arabella',
    avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Jessica&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
    gender: 'female',
    provider: 'ElevenLabs',
    country: 'GB',
    language: 'English (UK)',
    text: 'Create stunning voiceovers for your videos, podcasts, and e-learning content in seconds.',
    audioUrl: 'https://cdn.voicica.ai/dialogue_audio/dialogue_2fbf0dfe-88be-48bb-a8f2-e90efd3b80cc.mp3',
    duration: 7,
  },
  {
    id: 'v4',
    displayName: 'Yuna',
    avatarUrl: 'https://api.dicebear.com/7.x/lorelei/svg?seed=d099bcb',
    gender: 'female',
    provider: 'Google',
    country: 'KR',
    language: '한국어',
    text: 'AI 음성 기술로 자연스러운 나레이션을 만들어 보세요. 무료로 시작할 수 있습니다.',
    audioUrl: 'https://cdn.voicica.ai/tts_audio/vtEyZ69jh3YfkGlyweAnJR6fhR13/de0bb5a2-0d86-4d88-8d88-d7f1ad36405c.mp3',
    duration: 5,
  },
];

export const DIALOGUE_SAMPLES: DialogueSample[] = [
  {
    id: 'd1',
    speakers: ['Alice', 'Adam'],
    previewText: 'I\'m stuck. Can you help me find inspiration for my new story?...',
    audioUrl: 'https://cdn.voicica.ai/dialogue_audio/dialogue_c77d7b90-cc00-4b68-bc05-5117da50766c.mp3',
    duration: 25,
  },
  {
    id: 'd2',
    speakers: ['Liam', 'Jessica'],
    previewText: '亲爱的，你还好吗？...',
    audioUrl: 'https://cdn.voicica.ai/dialogue_audio/dialogue_0869edb6-c59d-4fbd-ba09-29554dc519b2.mp3',
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
