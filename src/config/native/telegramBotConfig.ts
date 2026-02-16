/**
 * Telegram Bot (@VoicicaAI) 配置
 * /start → 英文欢迎词 + 语言按钮直接跳转 App
 */

export const TELEGRAM_APP_BASE_URL = 'https://voicica.ai/native';

export const WELCOME_TEXT = `👋 Welcome to Voicica!

🎯 Your one-stop AI creative platform.
Free AI Voice, Music, Video, Image & more tools.

🌍 Choose your language to get started:`;

export interface TelegramLanguageConfig {
  code: string;
  flag: string;
  nativeName: string;
}

export const telegramLanguages: TelegramLanguageConfig[] = [
  { code: 'en-US', flag: '🇺🇸', nativeName: 'English' },
  { code: 'zh-CN', flag: '🇨🇳', nativeName: '简体中文' },
  { code: 'zh-TW', flag: '🇹🇼', nativeName: '繁體中文' },
  { code: 'ja-JP', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'th-TH', flag: '🇹🇭', nativeName: 'ภาษาไทย' },
  { code: 'vi-VN', flag: '🇻🇳', nativeName: 'Tiếng Việt' },
  { code: 'my-MM', flag: '🇲🇲', nativeName: 'မြန်မာဘာသာ' },
  { code: 'id-ID', flag: '🇮🇩', nativeName: 'Bahasa Indonesia' },
  { code: 'es-ES', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'pt-BR', flag: '🇧🇷', nativeName: 'Português' },
  { code: 'hi-IN', flag: '🇮🇳', nativeName: 'हिन्दी' },
  { code: 'ar-SA', flag: '🇸🇦', nativeName: 'العربية' },
];
