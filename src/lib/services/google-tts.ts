/**
 * Google Cloud Text-to-Speech Service
 * 使用 REST API 调用 Google Cloud TTS
 * https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize
 */
import { parseBuffer } from 'music-metadata';

export interface GoogleTtsRequest {
  text: string;
  voiceName: string;
  language?: string; // languageCode，如 'en-US'
  speed?: number; // 语速 0.25 - 4.0，默认 1.0
  pitch?: number; // 音调 -20.0 到 20.0，默认 0
  volume?: number; // 音量增益 -96.0 到 16.0 dB，默认 0
}

export interface GoogleTtsResult {
  audioData: Buffer;
  duration: number;
  format: string;
}

/**
 * Google TTS API 请求体
 */
interface SynthesizeRequest {
  input: {
    text?: string;
    ssml?: string;
  };
  voice: {
    languageCode: string;
    name: string;
    ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  };
  audioConfig: {
    audioEncoding: 'MP3' | 'LINEAR16' | 'OGG_OPUS' | 'MULAW' | 'ALAW';
    speakingRate?: number;
    pitch?: number;
    volumeGainDb?: number;
    sampleRateHertz?: number;
  };
}

/**
 * 从音频 Buffer 中获取准确时长
 */
async function getAudioDuration(audioBuffer: Buffer): Promise<number> {
  try {
    const metadata = await parseBuffer(audioBuffer, { mimeType: 'audio/mpeg' });
    const duration = metadata.format.duration || 0;
    return Math.round(duration * 100) / 100;
  } catch (error) {
    console.error('解析音频时长失败:', error);
    return 0;
  }
}

/**
 * 转换前端参数到 Google TTS 参数
 * 前端 speed: 0.5 - 2.0 -> Google speakingRate: 0.25 - 4.0
 * 前端 pitch: 1 - 100 -> Google pitch: -20.0 - 20.0
 * 前端 volume: 1 - 100 -> Google volumeGainDb: -10 - 10
 */
function convertParams(request: GoogleTtsRequest) {
  const {
    speed = 1.0,
    pitch = 50,
    volume = 50,
  } = request;

  // 语速：前端 0.5-2.0 映射到 Google 0.25-4.0
  // 简单处理：直接使用前端值，Google 支持更宽范围
  const speakingRate = Math.max(0.25, Math.min(4.0, speed));

  // 音调：前端 1-100（中间值50）-> Google -20.0 到 20.0（中间值0）
  // (pitch - 50) / 50 * 20 = (pitch - 50) * 0.4
  const pitchValue = (pitch - 50) * 0.4;

  // 音量：前端 1-100（中间值50）-> Google -10 到 10 dB
  // (volume - 50) / 50 * 10 = (volume - 50) * 0.2
  const volumeGainDb = (volume - 50) * 0.2;

  return { speakingRate, pitch: pitchValue, volumeGainDb };
}

/**
 * 将标准化的 locale 转换回 Google API 需要的原始 locale
 * zh-CN -> cmn-CN, zh-TW -> cmn-TW
 */
function toGoogleLocale(locale: string): string {
  const REVERSE_MAPPING: Record<string, string> = {
    'zh-CN': 'cmn-CN',
    'zh-TW': 'cmn-TW',
  };
  return REVERSE_MAPPING[locale] || locale;
}

/**
 * 解析数据库中存储的语音名称
 * 格式：locale:voiceName（如 zh-CN:cmn-CN-Chirp3-HD-Achernar）-> { locale: 'cmn-CN', voiceName: '...' }
 * 如果没有冒号，则返回原名称
 */
function parseVoiceName(dbName: string): { locale: string | null; voiceName: string } {
  const colonIndex = dbName.indexOf(':');
  if (colonIndex !== -1) {
    const dbLocale = dbName.substring(0, colonIndex);
    return {
      locale: toGoogleLocale(dbLocale), // 转换为 Google API 需要的 locale
      voiceName: dbName.substring(colonIndex + 1),
    };
  }
  return { locale: null, voiceName: dbName };
}

/**
 * 调用 Google Cloud TTS API 合成语音
 */
export async function synthesizeSpeech(request: GoogleTtsRequest): Promise<GoogleTtsResult> {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY 未配置');
  }

  const { text, voiceName: rawVoiceName, language } = request;
  const { speakingRate, pitch, volumeGainDb } = convertParams(request);

  // 解析语音名称（可能是 locale:voiceName 格式）
  const parsed = parseVoiceName(rawVoiceName);
  const actualVoiceName = parsed.voiceName;
  // 优先使用传入的 language（需转换），其次使用从名称解析的 locale，最后默认 en-US
  const languageCode = language ? toGoogleLocale(language) : (parsed.locale || 'en-US');

  const requestBody: SynthesizeRequest = {
    input: {
      text: text,
    },
    voice: {
      languageCode: languageCode,
      name: actualVoiceName,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate,
      pitch,
      volumeGainDb,
    },
  };

  console.log(`🎤 Google TTS: 开始合成, voice=${actualVoiceName}, lang=${languageCode}, text_len=${text.length}`);

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Google TTS 失败: ${response.status} - ${errorText}`);
    throw new Error(`Google TTS 失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.audioContent) {
    throw new Error('Google TTS 返回数据中没有 audioContent');
  }

  // audioContent 是 base64 编码的音频数据
  const audioData = Buffer.from(data.audioContent, 'base64');

  // 获取音频时长
  const duration = await getAudioDuration(audioData);

  console.log(`✅ Google TTS: 合成成功, ${audioData.length} bytes, duration=${duration}s`);

  return {
    audioData,
    duration,
    format: 'mp3',
  };
}