/**
 * Azure Text-to-Speech Service
 * 使用 REST API 调用 Azure Cognitive Services
 */

export interface TtsRequest {
  text: string;
  voiceName: string;
  language?: string;
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
 */
function buildSsml(request: TtsRequest): string {
  const {
    text,
    voiceName,
    language = 'en-US',
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

  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language}">
    <voice name="${voiceName}">
      <prosody rate="${rateStr}" pitch="${pitchStr}" volume="${volumeVal}">
        ${text}
      </prosody>
    </voice>
  </speak>`;
}

/**
 * 估算音频时长（基于字符数和语速）
 */
function estimateDuration(text: string, speed: number): number {
  // 平均每个字符约 0.1 秒
  const baseDuration = text.length * 0.1;
  return Math.round((baseDuration / speed) * 100) / 100;
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

  console.log(`🎤 Azure TTS: 开始合成, voice=${request.voiceName}, text_len=${request.text.length}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
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

  console.log(`✅ Azure TTS: 合成成功, ${audioData.length} bytes`);

  return {
    audioData,
    duration: estimateDuration(request.text, request.speed || 1.0),
    format: 'mp3',
  };
}
