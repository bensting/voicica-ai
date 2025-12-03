/**
 * Google Cloud Text-to-Speech Service
 * 使用 REST API 调用 Google Cloud TTS
 * https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize
 */
import { parseBuffer } from 'music-metadata';

// Google TTS 单句字节限制
// 根据实测，Google 对单句限制比较严格（泰语等无标点语言约 300-500 字节）
// 设为 500 字节（约 150-170 个泰语字符）
const MAX_SENTENCE_BYTES = 500;

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
 * 获取字符串的字节长度（UTF-8）
 */
function getByteLength(str: string): number {
  return Buffer.byteLength(str, 'utf8');
}

/**
 * 智能分割文本为多个片段
 * 支持各种语言，包括没有空格分词的语言（如泰语、中文、日语）
 *
 * 分割策略：
 * 1. 优先按句子结束符分割（。！？.!? 等）
 * 2. 其次按逗号、空格、换行等分隔符分割
 * 3. 对于无分隔符的长句，按固定字节数强制分割
 */
function splitTextIntoChunks(text: string, maxBytes: number = MAX_SENTENCE_BYTES): string[] {
  if (getByteLength(text) <= maxBytes) {
    return [text];
  }

  const chunks: string[] = [];

  // 句子分隔符（各种语言的句号、感叹号、问号，换行，以及泰语特殊符号）
  // ๆ (mai yamok) 是泰语重复符号，常出现在短语结尾
  // ฯ (paiyannoi) 是泰语缩写符号
  const sentenceEndRegex = /([。！？.!?；;\r\nๆฯ]+)/;
  // 次级分隔符（逗号、顿号、空格等）
  const secondaryDelimiterRegex = /([，,、：:\s]+)/;

  // 先按句子分隔
  const sentences = text.split(sentenceEndRegex);

  let currentChunk = '';

  for (let i = 0; i < sentences.length; i++) {
    const part = sentences[i];
    if (!part) continue;

    const testChunk = currentChunk + part;
    const testBytes = getByteLength(testChunk);

    if (testBytes <= maxBytes) {
      currentChunk = testChunk;
    } else if (currentChunk) {
      // 当前块已满，保存并开始新块
      chunks.push(currentChunk.trim());

      // 检查新部分是否也超长
      if (getByteLength(part) > maxBytes) {
        // 递归处理超长部分
        const subChunks = splitLongSegment(part, maxBytes, secondaryDelimiterRegex);
        chunks.push(...subChunks.slice(0, -1));
        currentChunk = subChunks[subChunks.length - 1] || '';
      } else {
        currentChunk = part;
      }
    } else {
      // currentChunk 为空但单个 part 就超长
      const subChunks = splitLongSegment(part, maxBytes, secondaryDelimiterRegex);
      chunks.push(...subChunks.slice(0, -1));
      currentChunk = subChunks[subChunks.length - 1] || '';
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length > 0);
}

/**
 * 分割单个超长片段
 */
function splitLongSegment(
  segment: string,
  maxBytes: number,
  delimiterRegex: RegExp
): string[] {
  if (getByteLength(segment) <= maxBytes) {
    return [segment];
  }

  const chunks: string[] = [];

  // 尝试按次级分隔符分割
  const parts = segment.split(delimiterRegex);
  let currentChunk = '';

  for (const part of parts) {
    if (!part) continue;

    const testChunk = currentChunk + part;
    if (getByteLength(testChunk) <= maxBytes) {
      currentChunk = testChunk;
    } else if (currentChunk) {
      chunks.push(currentChunk.trim());

      if (getByteLength(part) > maxBytes) {
        // 强制按字符数分割
        const forceSplit = forceChunkByBytes(part, maxBytes);
        chunks.push(...forceSplit.slice(0, -1));
        currentChunk = forceSplit[forceSplit.length - 1] || '';
      } else {
        currentChunk = part;
      }
    } else {
      // 强制分割
      const forceSplit = forceChunkByBytes(part, maxBytes);
      chunks.push(...forceSplit.slice(0, -1));
      currentChunk = forceSplit[forceSplit.length - 1] || '';
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length > 0);
}

/**
 * 强制按字节数分割（用于没有任何分隔符的文本）
 */
function forceChunkByBytes(text: string, maxBytes: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  for (const char of text) {
    const testChunk = currentChunk + char;
    if (getByteLength(testChunk) <= maxBytes) {
      currentChunk = testChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = char;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * 合并多个音频 Buffer（简单拼接，适用于 MP3）
 */
function mergeAudioBuffers(buffers: Buffer[]): Buffer {
  return Buffer.concat(buffers);
}

/**
 * 检查文本是否以句子结束符结尾
 */
function endsWithSentenceMarker(text: string): boolean {
  return /[。！？.!?；;]$/.test(text.trim());
}

/**
 * 确保文本以句号结尾（解决 Google TTS "sentence too long" 问题）
 * Google TTS 会检测句子边界，没有句号的长文本会被视为一个超长句子
 */
function ensureSentenceEnding(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (endsWithSentenceMarker(trimmed)) return trimmed;
  // 添加句号让 Google 认为这是一个完整句子
  return trimmed + '。';
}

/**
 * 合成单个文本片段（内部函数）
 */
async function synthesizeChunk(
  apiKey: string,
  text: string,
  voiceName: string,
  languageCode: string,
  speakingRate: number,
  pitch: number,
  volumeGainDb: number
): Promise<Buffer> {
  // 确保文本以句号结尾，避免 "sentence too long" 错误
  const processedText = ensureSentenceEnding(text);

  const requestBody: SynthesizeRequest = {
    input: {
      text: processedText,
    },
    voice: {
      languageCode: languageCode,
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate,
      pitch,
      volumeGainDb,
    },
  };

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

  return Buffer.from(data.audioContent, 'base64');
}

/**
 * 调用 Google Cloud TTS API 合成语音
 * 自动处理长文本分割，支持各种语言（包括泰语、中文等无空格语言）
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

  // 智能分割文本
  const chunks = splitTextIntoChunks(text);

  console.log(`🎤 Google TTS: 开始合成, voice=${actualVoiceName}, lang=${languageCode}, text_len=${text.length}, chunks=${chunks.length}`);

  if (chunks.length === 1) {
    // 单个片段，直接合成
    const audioData = await synthesizeChunk(
      apiKey,
      chunks[0],
      actualVoiceName,
      languageCode,
      speakingRate,
      pitch,
      volumeGainDb
    );

    const duration = await getAudioDuration(audioData);
    console.log(`✅ Google TTS: 合成成功, ${audioData.length} bytes, duration=${duration}s`);

    return {
      audioData,
      duration,
      format: 'mp3',
    };
  }

  // 多个片段，逐个合成后合并
  console.log(`📝 Google TTS: 文本被分割为 ${chunks.length} 个片段`);

  const audioBuffers: Buffer[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`🎤 Google TTS: 合成片段 ${i + 1}/${chunks.length}, bytes=${getByteLength(chunk)}`);

    const buffer = await synthesizeChunk(
      apiKey,
      chunk,
      actualVoiceName,
      languageCode,
      speakingRate,
      pitch,
      volumeGainDb
    );

    audioBuffers.push(buffer);
  }

  // 合并所有音频
  const audioData = mergeAudioBuffers(audioBuffers);
  const duration = await getAudioDuration(audioData);

  console.log(`✅ Google TTS: 合成成功（${chunks.length} 片段合并）, ${audioData.length} bytes, duration=${duration}s`);

  return {
    audioData,
    duration,
    format: 'mp3',
  };
}