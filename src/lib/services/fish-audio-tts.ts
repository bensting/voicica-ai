/**
 * Fish Audio Text-to-Speech Service
 * https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech
 */
import { parseBuffer } from 'music-metadata';

/** 输出音频格式 */
export type FishAudioFormat = 'wav' | 'pcm' | 'mp3' | 'opus';

/** MP3 比特率选项 */
export type FishAudioMp3Bitrate = 64 | 128 | 192;

/** Opus 比特率选项 (-1000 表示自动) */
export type FishAudioOpusBitrate = -1000 | 24 | 32 | 48 | 64;

/** 延迟模式 */
export type FishAudioLatency = 'normal' | 'balanced';

/** 模型选项 */
export type FishAudioModel = 's1' | 'speech-1.6' | 'speech-1.5';

/** 语速和音量调节 */
export interface FishAudioProsody {
  speed?: number; // 语速调节，默认 1.0
  volume?: number; // 音量调节，默认 0
}

/** 参考音频（用于语音克隆） */
export interface FishAudioReference {
  audio: string; // Base64 编码的音频数据
  text: string; // 音频对应的文本
}

/**
 * Fish Audio TTS 请求参数
 */
export interface FishAudioTtsRequest {
  /** 要转换的文本内容 */
  text: string;

  /** 预上传的参考模型 ID（语音 ID） */
  reference_id?: string;

  /** 参考音频列表（用于实时语音克隆，与 reference_id 二选一） */
  references?: FishAudioReference[];

  /** 输出格式，默认 mp3 */
  format?: FishAudioFormat;

  /** MP3 比特率，默认 128 */
  mp3_bitrate?: FishAudioMp3Bitrate;

  /** Opus 比特率，默认 32 */
  opus_bitrate?: FishAudioOpusBitrate;

  /** 延迟模式，默认 normal */
  latency?: FishAudioLatency;

  /** 生成随机性 0-1，默认 0.9（仅用于 s1 模型） */
  temperature?: number;

  /** 核采样多样性 0-1，默认 0.9（仅用于 s1 模型） */
  top_p?: number;

  /** 处理块长度 100-300，默认 200 */
  chunk_length?: number;

  /** 是否规范化数字/日期以减少延迟，默认 true */
  normalize?: boolean;

  /** 语速和音量调节 */
  prosody?: FishAudioProsody;

  /** 模型选择，默认 s1 */
  model?: FishAudioModel;
}

/**
 * Fish Audio TTS 结果
 */
export interface FishAudioTtsResult {
  /** 音频数据 */
  audioData: Buffer;

  /** 音频时长（秒） */
  duration: number;

  /** 输出格式 */
  format: string;
}

/**
 * 从音频 Buffer 中获取准确时长
 */
async function getAudioDuration(audioBuffer: Buffer, format: string): Promise<number> {
  try {
    const mimeType = format === 'mp3' ? 'audio/mpeg' : `audio/${format}`;
    const metadata = await parseBuffer(audioBuffer, { mimeType });
    const duration = metadata.format.duration || 0;
    return Math.round(duration * 100) / 100;
  } catch (error) {
    console.error('解析音频时长失败:', error);
    return 0;
  }
}

/**
 * 调用 Fish Audio TTS API 合成语音
 */
export async function synthesizeSpeech(request: FishAudioTtsRequest): Promise<FishAudioTtsResult> {
  const apiKey = process.env.FISH_AUDIO_API_KEY;

  if (!apiKey) {
    throw new Error('FISH_AUDIO_API_KEY 未配置');
  }

  const endpoint = 'https://api.fish.audio/v1/tts';
  const format = request.format || 'mp3';
  const model = request.model || 's1';

  // 构建请求体
  const body: Record<string, unknown> = {
    text: request.text,
    format,
    mp3_bitrate: request.mp3_bitrate ?? 128,
    latency: request.latency ?? 'normal',
    normalize: request.normalize ?? true,
  };

  // 语音参考（二选一）
  if (request.reference_id) {
    body.reference_id = request.reference_id;
  } else if (request.references && request.references.length > 0) {
    body.references = request.references;
  }

  // s1 模型特有参数
  if (model === 's1') {
    body.temperature = request.temperature ?? 0.9;
    body.top_p = request.top_p ?? 0.9;
    body.chunk_length = request.chunk_length ?? 200;
  }

  // 语速和音量调节
  if (request.prosody) {
    body.prosody = request.prosody;
  }

  // Opus 特有参数
  if (format === 'opus' && request.opus_bitrate !== undefined) {
    body.opus_bitrate = request.opus_bitrate;
  }

  console.log(
    `🐟 Fish Audio TTS: 开始合成, model=${model}, format=${format}, reference_id=${request.reference_id || 'none'}, text_len=${request.text.length}`
  );

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      model: model,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Fish Audio TTS 失败: ${response.status} - ${errorText}`);
    throw new Error(`Fish Audio TTS 失败: ${response.status} - ${errorText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const audioData = Buffer.from(audioBuffer);

  // 从音频 Buffer 中获取准确时长
  const duration = await getAudioDuration(audioData, format);

  console.log(`✅ Fish Audio TTS: 合成成功, ${audioData.length} bytes, duration=${duration}s`);

  return {
    audioData,
    duration,
    format,
  };
}

/**
 * 便捷方法：使用预设语音 ID 合成
 */
export async function synthesizeWithVoiceId(
  text: string,
  voiceId: string,
  options?: Partial<Omit<FishAudioTtsRequest, 'text' | 'reference_id'>>
): Promise<FishAudioTtsResult> {
  return synthesizeSpeech({
    text,
    reference_id: voiceId,
    ...options,
  });
}

/**
 * 便捷方法：使用参考音频实时克隆
 */
export async function synthesizeWithReference(
  text: string,
  referenceAudio: Buffer,
  referenceText: string,
  options?: Partial<Omit<FishAudioTtsRequest, 'text' | 'references'>>
): Promise<FishAudioTtsResult> {
  return synthesizeSpeech({
    text,
    references: [
      {
        audio: referenceAudio.toString('base64'),
        text: referenceText,
      },
    ],
    ...options,
  });
}