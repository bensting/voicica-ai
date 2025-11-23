/**
 * Azure Text-to-Speech Service
 * 使用 REST API 调用 Azure Cognitive Services
 */
import { parseBuffer } from 'music-metadata';

export interface TtsRequest {
  text: string;
  voiceName: string;
  language?: string;
  style?: string; // 语音风格，如 "calm", "cheerful" 等
  speed?: number;
  pitch?: number;
  volume?: number;
}

export interface TtsResult {
  audioData: Buffer;
  duration: number;
  format: string;
}

/**
 * 构建 SSML (Speech Synthesis Markup Language)
 * 支持 Azure 特有的 mstts:express-as 标签用于设置语音风格
 */
function buildSsml(request: TtsRequest): string {
  const {
    text,
    voiceName,
    language = 'en-US',
    style,
    speed = 1.0,   // 0.5 - 2.0，默认 1.0 倍速
    pitch = 50,    // 1 - 100，默认 50（中间值）
    volume = 50,   // 1 - 100，默认 50（中间值）
  } = request;

  // 语速转换：0.5 -> -50%, 1.0 -> 0%, 2.0 -> +100%
  const rate = Math.round((speed - 1.0) * 100);
  const rateStr = rate > 0 ? `+${rate}%` : `${rate}%`;

  // 音调转换：1 -> -50%, 50 -> 0%, 100 -> +50%
  // 前端范围 1-100，中间值 50 对应 0%
  const pitchVal = Math.round((pitch - 50));
  const pitchStr = pitchVal > 0 ? `+${pitchVal}%` : `${pitchVal}%`;

  // 音量：前端 1-100，直接使用
  const volumeVal = Math.round(volume);

  // 构建内容部分（带或不带 style）
  const prosodyContent = `<prosody rate="${rateStr}" pitch="${pitchStr}" volume="${volumeVal}">${text}</prosody>`;

  // 如果指定了 style 且不是 default，使用 mstts:express-as 包裹
  const voiceContent = style && style !== 'default'
    ? `<mstts:express-as style="${style}">${prosodyContent}</mstts:express-as>`
    : prosodyContent;

  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${language}">
    <voice name="${voiceName}">
      ${voiceContent}
    </voice>
  </speak>`;
}

/**
 * 从音频 Buffer 中获取准确时长
 */
async function getAudioDuration(audioBuffer: Buffer): Promise<number> {
  try {
    const metadata = await parseBuffer(audioBuffer, { mimeType: 'audio/mpeg' });
    const duration = metadata.format.duration || 0;
    // 保留两位小数
    return Math.round(duration * 100) / 100;
  } catch (error) {
    console.error('解析音频时长失败:', error);
    return 0;
  }
}

/**
 * 调用 Azure TTS API 合成语音
 */
export async function synthesizeSpeech(request: TtsRequest): Promise<TtsResult> {
  const apiKey = process.env.MICROSOFT_TTS_API_KEY;
  const region = process.env.MICROSOFT_TTS_REGION || 'eastus';

  if (!apiKey) {
    throw new Error('MICROSOFT_TTS_API_KEY 未配置');
  }

  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const ssml = buildSsml(request);

  console.log(`🎤 Azure TTS: 开始合成, voice=${request.voiceName}, style=${request.style || 'default'}, text_len=${request.text.length}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/ssml+xml',
      // 使用 48kHz 192kbps MP3 格式，更高质量，iOS/Android 完美兼容
      'X-Microsoft-OutputFormat': 'audio-48khz-192kbitrate-mono-mp3',
      'User-Agent': 'ai-voice-labs',
    },
    body: ssml,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Azure TTS 失败: ${response.status} - ${errorText}`);
    throw new Error(`Azure TTS 失败: ${response.status} - ${errorText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const audioData = Buffer.from(audioBuffer);

  // 从音频 Buffer 中获取准确时长
  const duration = await getAudioDuration(audioData);

  console.log(`✅ Azure TTS: 合成成功, ${audioData.length} bytes, duration=${duration}s`);

  return {
    audioData,
    duration,
    format: 'mp3',
  };
}
