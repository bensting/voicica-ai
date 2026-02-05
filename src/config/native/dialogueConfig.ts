/**
 * ElevenLabs Dialogue 配置
 *
 * 包含支持的语言、情绪标签和声音列表
 * 数据来源: kie.ai text-to-dialogue-v3 API
 */

// ==================== 情绪标签配置 ====================

export interface DialogueEmotion {
  tag: string;
  label: string;
}

/**
 * 情绪标签列表
 */
export const DIALOGUE_EMOTIONS: DialogueEmotion[] = [
  { tag: '[excitedly]', label: 'excitedly' },
  { tag: '[whispers]', label: 'whispers' },
  { tag: '[laughs]', label: 'laughs' },
  { tag: '[sarcastic]', label: 'sarcastic' },
  { tag: '[sighs]', label: 'sighs' },
  { tag: '[sad]', label: 'sad' },
  { tag: '[angry]', label: 'angry' },
];

// ==================== 语言配置 ====================

export interface DialogueLanguage {
  code: string;
  name: string; // 英文名称
  nativeName: string; // 原生语言名称
}

/**
 * 支持的语言列表 (76种)
 */
export const DIALOGUE_LANGUAGES: DialogueLanguage[] = [
  { code: 'auto', name: 'Auto', nativeName: 'Auto' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català' },
  { code: 'ceb', name: 'Cebuano', nativeName: 'Cebuano' },
  { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша' },
  { code: 'ky', name: 'Kirghiz', nativeName: 'Кыргызча' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'ln', name: 'Lingala', nativeName: 'Lingála' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'zh', name: 'Mandarin Chinese', nativeName: '中文' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },
];

// ==================== 声音配置 ====================

export interface DialogueVoice {
  id: string; // voice ID，用于 API 调用
  name: string; // 显示名称
  gender: 'male' | 'female';
}

/**
 * 标准声音列表 (20个，可直接用名字传参)
 */
export const DIALOGUE_STANDARD_VOICES: DialogueVoice[] = [
  { id: 'Adam', name: 'Adam', gender: 'male' },
  { id: 'Alice', name: 'Alice', gender: 'female' },
  { id: 'Bill', name: 'Bill', gender: 'male' },
  { id: 'Brian', name: 'Brian', gender: 'male' },
  { id: 'Callum', name: 'Callum', gender: 'male' },
  { id: 'Charlie', name: 'Charlie', gender: 'male' },
  { id: 'Chris', name: 'Chris', gender: 'male' },
  { id: 'Daniel', name: 'Daniel', gender: 'male' },
  { id: 'Eric', name: 'Eric', gender: 'male' },
  { id: 'George', name: 'George', gender: 'male' },
  { id: 'Harry', name: 'Harry', gender: 'male' },
  { id: 'Jessica', name: 'Jessica', gender: 'female' },
  { id: 'Laura', name: 'Laura', gender: 'female' },
  { id: 'Liam', name: 'Liam', gender: 'male' },
  { id: 'Lily', name: 'Lily', gender: 'female' },
  { id: 'Matilda', name: 'Matilda', gender: 'female' },
  { id: 'River', name: 'River', gender: 'male' },
  { id: 'Roger', name: 'Roger', gender: 'male' },
  { id: 'Sarah', name: 'Sarah', gender: 'female' },
  { id: 'Will', name: 'Will', gender: 'male' },
];

/**
 * 高级声音列表 (使用 voice_id)
 */
export const DIALOGUE_PREMIUM_VOICES: DialogueVoice[] = [
  { id: 'BIvP0GN1cAtSRTxNHnWS', name: 'Ellen - Serious, Direct and Confident', gender: 'female' },
  { id: 'aMSt68OGf4xUZAnLpTU8', name: 'Juniper - Grounded and Professional', gender: 'female' },
  { id: 'RILOU7YmBhvwJGDGjNmP', name: 'Jane - Professional Audiobook Reader', gender: 'female' },
  { id: 'EkK5I93UQWFDigLMpZcX', name: 'James - Husky, Engaging and Bold', gender: 'male' },
  { id: 'Z3R5wn05IrDiVCyEkUrK', name: 'Arabella - Mysterious and Emotive', gender: 'female' },
  { id: 'tnSpp4vdxKPjI9w0GnoV', name: 'Hope - upbeat and clear', gender: 'female' },
  { id: 'NNl6r8mD7vthiJatiJt1', name: 'Bradford - Expressive and Articulate', gender: 'male' },
  { id: 'YOq2y2Up4RgXP2HyXjE5', name: 'Xavier - Dominating, Metalic Announcer', gender: 'male' },
  { id: 'Bj9UqZbhQsanLzgalpEG', name: 'Austin - Deep, Raspy and Authentic', gender: 'male' },
  { id: 'c6SfcYrb2t09NHXiT80T', name: 'Jarnathan - Confident and Versatile', gender: 'male' },
  { id: 'B8gJV1IhpuegLxdpXFOE', name: 'Kuon - Cheerful, Clear and Steady', gender: 'male' },
  { id: 'exsUS4vynmxd379XN4yO', name: 'Blondie - Conversational', gender: 'female' },
  { id: 'BpjGufoPiobT79j2vtj4', name: 'Priyanka - Calm, Neutral and Relaxed', gender: 'female' },
  { id: '2zRM7PkgwBPiau2jvVXc', name: 'Monika Sogam - Deep and Natural', gender: 'female' },
  { id: '1SM7GgM6IMuvQlz2BwM3', name: 'Mark - Casual, Relaxed and Light', gender: 'male' },
  { id: 'ouL9IsyrSnUkCmfnD02u', name: 'Grimblewood Thornwhisker - Snarky Gnome', gender: 'male' },
  { id: '5l5f8iK3YPeGga21rQIX', name: 'Adeline - Feminine and Conversational', gender: 'female' },
  { id: 'scOwDtmlUjD3prqpp97I', name: 'Sam - Support Agent', gender: 'male' },
  { id: 'NOpBlnGInO9m6vDvFkFC', name: 'Spuds Oxley - Wise and Approachable', gender: 'male' },
  { id: 'BZgkqPqms7Kj9ulSkVzn', name: 'Eve - Authentic, Energetic and Happy', gender: 'female' },
  { id: 'wo6udizrrtpIxWGp2qJk', name: 'Northern Terry', gender: 'male' },
  { id: 'yjJ45q8TVCrtMhEKurxY', name: 'Dr. Von - Quirky, Mad Scientist', gender: 'male' },
  { id: 'gU0LNdkMOQCOrPrwtbee', name: 'British Football Announcer', gender: 'male' },
  { id: 'DGzg6RaUqxGRTHSBjfgF', name: 'Brock - Commanding and Loud Sergeant', gender: 'male' },
  { id: 'DGTOOUoGpoP6UZ9uSWfA', name: 'Célian - Documentary Narrator', gender: 'male' },
  { id: 'x70vRnQBMBu4FAYhjJbO', name: 'Nathan - Virtual Radio Host', gender: 'male' },
  { id: 'Sm1seazb4gs7RSlUVw7c', name: 'Premium Voice', gender: 'male' },
  { id: 'P1bg08DkjqiVEzOn76yG', name: 'Viraj - Rich and Soft', gender: 'male' },
  { id: 'qDuRKMlYmrm8trt5QyBn', name: 'Taksh - Calm, Serious and Smooth', gender: 'male' },
  { id: 'kUUTqKQ05NMGulF08DDf', name: 'Guadeloupe Merryweather - Emotional', gender: 'female' },
  { id: 'qXpMhyvQqiRxWQs4qSSB', name: 'Horatius - Energetic Character Voice', gender: 'male' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam - Energetic, Social Media Creator', gender: 'male' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris - Charming, Down-to-Earth', gender: 'male' },
  { id: 'SOYHLrjzK2X1ezoPC6cr', name: 'Harry - Fierce Warrior', gender: 'male' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum - Husky Trickster', gender: 'male' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura - Enthusiast, Quirky Attitude', gender: 'female' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', gender: 'female' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica - Playful, Bright, Warm', gender: 'female' },
  { id: 'MnUw1cSnpiLoLhpd3Hqp', name: 'Heather Rey - Rushed and Friendly', gender: 'female' },
  { id: 'kPzsL2i3teMYv0FxEYQ6', name: 'Brittney - Social Media Voice', gender: 'female' },
  { id: 'UgBBYS2sOqTuMpoF3BR0', name: 'Mark - Natural Conversations', gender: 'male' },
  { id: 'IjnA9kwZJHJ20Fp7Vmy6', name: 'Matthew - Casual, Friendly and Smooth', gender: 'male' },
  { id: 'KoQQbl9zjAdLgKZjm8Ol', name: 'Pro Narrator - Convincing story teller', gender: 'male' },
  { id: 'hpp4J3VqNfWAUOO0d1Us', name: 'Bella - Professional, Bright, Warm', gender: 'female' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam - Dominant, Firm', gender: 'male' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian - Deep, Resonant and Comforting', gender: 'male' },
  { id: 'L0Dsvb3SLTyegXwtm47J', name: 'Archer', gender: 'male' },
  { id: 'uYXf8XasLslADfZ2MB4u', name: 'Hope - Bubbly, Gossipy and Girly', gender: 'female' },
  { id: 'gs0tAILXbY5DNrJrsM6F', name: 'Jeff - Classy, Resonating and Strong', gender: 'male' },
  { id: 'DTKMou8ccj1ZaWGBiotd', name: 'Jamahal - Young, Vibrant, and Natural', gender: 'male' },
  { id: 'vBKc2FfBKJfcZNyEt1n6', name: 'Finn - Youthful, Eager and Energetic', gender: 'male' },
  { id: 'TmNe0cCqkZBMwPWOd3RD', name: 'Smith - Mellow, Spontaneous, and Bassy', gender: 'male' },
  { id: 'DYkrAHD8iwork3YSUBbs', name: 'Tom - Conversations & Books', gender: 'male' },
  { id: '56AoDkrOh6qfVPDXZ7Pt', name: 'Cassidy - Crisp, Direct and Clear', gender: 'female' },
  { id: 'eR40ATw9ArzDf9h3v7t7', name: 'Addison 2.0 - Australian Audiobook', gender: 'female' },
  { id: 'g6xIsTj2HwM6VR4iXFCw', name: 'Jessica Anne Bogart - Chatty and Friendly', gender: 'female' },
  { id: 'lcMyyd2HUfFzxdCaC4Ta', name: 'Lucy - Fresh & Casual', gender: 'female' },
  { id: '6aDn1KB0hjpdcocrUkmq', name: 'Tiffany - Natural and Welcoming', gender: 'female' },
  { id: 'Sq93GQT4X1lKDXsQcixO', name: 'Felix - Warm, positive & contemporary RP', gender: 'male' },
  { id: 'vfaqCOvlrKi4Zp7C2IAm', name: 'Malyx - Echoey, Menacing and Deep Demon', gender: 'male' },
  { id: 'piI8Kku0DcvcL6TTSeQt', name: 'Flicker - Cheerful Fairy', gender: 'female' },
  { id: 'KTPVrSVAEUSJRClDzBw7', name: 'Bob - Rugged and Warm Cowboy', gender: 'male' },
  { id: 'flHkNRp1BlvT73UL6gyz', name: 'Jessica Anne Bogart - Eloquent Villain', gender: 'female' },
  { id: '9yzdeviXkFddZ4Oz8Mok', name: 'Lutz - Chuckling, Giggly and Cheerful', gender: 'male' },
  { id: 'pPdl9cQBQq4p6mRkZy2Z', name: 'Emma - Adorable and Upbeat', gender: 'female' },
  { id: '0SpgpJ4D3MpHCiWdyTg3', name: 'Matthew Schmitz - Elitist, Arrogant Tyrant', gender: 'male' },
  { id: 'UFO0Yv86wqRxAt1DmXUu', name: 'Sarcastic and Sultry Villain', gender: 'female' },
  { id: 'oR4uRy4fHDUGGISL0Rev', name: 'Myrrdin - Wise and Magical Narrator', gender: 'male' },
  { id: 'zYcjlYFOd3taleS0gkk3', name: 'Edward - Loud, Confident and Cocky', gender: 'male' },
  { id: 'nzeAacJi50IvxcyDnMXa', name: 'Marshal - Friendly, Funny Professor', gender: 'male' },
  { id: 'ruirxsoakN0GWmGNIo04', name: 'John Morgan - Gritty, Rugged Cowboy', gender: 'male' },
  { id: '1KFdM0QCwQn4rmn5nn9C', name: 'Parasyte - Whispers from the Deep Dark', gender: 'male' },
  { id: 'TC0Zp7WVFzhA8zpTlRqV', name: 'Aria - Sultry Villain', gender: 'female' },
  { id: 'ljo9gAlSqKOvF6D8sOsX', name: 'Viking Bjorn - Epic Medieval Raider', gender: 'male' },
  { id: 'PPzYpIqttlTYA83688JI', name: 'Pirate Marshal', gender: 'male' },
  { id: 'ZF6FPAbjXT4488VcRRnw', name: 'Amelia - Enthusiastic and Expressive', gender: 'female' },
  { id: '8JVbfL6oEdmuxKn5DK2C', name: 'Johnny Kid - Serious and Calm Narrator', gender: 'male' },
  { id: 'iCrDUkL56s3C8sCRl7wb', name: 'Hope - Poetic, Romantic and Captivating', gender: 'female' },
  { id: '1hlpeD1ydbI2ow0Tt3EW', name: 'Olivia - Smooth, Warm and Engaging', gender: 'female' },
  { id: 'wJqPPQ618aTW29mptyoc', name: 'Ana Rita - Smooth, Expressive and Bright', gender: 'female' },
  { id: 'EiNlNiXeDU1pqqOPrYMO', name: 'John Doe - Deep', gender: 'male' },
  { id: 'FUfBrNit0NNZAwb58KWH', name: 'Angela - Conversational and Friendly', gender: 'female' },
  { id: '4YYIPFl9wE5c4L2eu2Gb', name: 'Burt Reynolds - Deep, Smooth and clear', gender: 'male' },
  { id: 'OYWwCdDHouzDwiZJWOOu', name: 'David - Gruff Cowboy', gender: 'male' },
  { id: '6F5Zhi321D3Oq7v1oNT4', name: 'Hank - Deep and Engaging Narrator', gender: 'male' },
  { id: 'qNkzaJoHLLdpvgh5tISm', name: 'Carter - Rich, Smooth and Rugged', gender: 'male' },
  { id: 'YXpFCvM1S3JbWEJhoskW', name: 'Wyatt - Wise Rustic Cowboy', gender: 'male' },
  { id: '9PVP7ENhDskL0KYHAKtD', name: 'Jerry B. - Southern/Cowboy', gender: 'male' },
  { id: 'LG95yZDEHg6fCZdQjLqj', name: 'Phil - Explosive, Passionate Announcer', gender: 'male' },
  { id: 'CeNX9CMwmxDxUF5Q2Inm', name: 'Johnny Dynamite - Vintage Radio DJ', gender: 'male' },
  { id: 'st7NwhTPEzqo2riw7qWC', name: 'Blondie - Radio Host', gender: 'female' },
  { id: 'aD6riP1btT197c6dACmy', name: 'Rachel M - Pro British Radio Presenter', gender: 'female' },
  { id: 'FF7KdobWPaiR0vkcALHF', name: 'David - Movie Trailer Narrator', gender: 'male' },
  { id: 'mtrellq69YZsNwzUSyXh', name: 'Rex Thunder - Deep N Tough', gender: 'male' },
  { id: 'dHd5gvgSOzSfduK4CvEg', name: 'Ed - Late Night Announcer', gender: 'male' },
  { id: 'cTNP6ZM2mLTKj2BFhxEh', name: 'Paul French - Podcaster', gender: 'male' },
  { id: 'eVItLK1UvXctxuaRV2Oq', name: 'Jean - Alluring and Playful Femme Fatale', gender: 'female' },
  { id: 'U1Vk2oyatMdYs096Ety7', name: 'Michael - Deep, Dark and Urban', gender: 'male' },
  { id: 'esy0r39YPLQjOczyOib8', name: 'Britney - Calm and Calculative Villain', gender: 'female' },
  { id: 'bwCXcoVxWNYMlC6Esa8u', name: 'Matthew Schmitz - Gravel, Deep Anti-Hero', gender: 'male' },
  { id: 'D2jw4N9m4xePLTQ3IHjU', name: 'Ian - Strange and Distorted Alien', gender: 'male' },
  { id: 'Tsns2HvNFKfGiNjllgqo', name: 'Sven - Emotional and Nice', gender: 'male' },
  { id: 'Atp5cNFg1Wj5gyKD7HWV', name: 'Natasha - Gentle Meditation', gender: 'female' },
  { id: '1cxc5c3E9K6F1wlqOJGV', name: 'Emily - Gentile, Soft and Meditative', gender: 'female' },
  { id: '1U02n4nD6AdIZ9CjF053', name: 'Viraj - Smooth and Gentle', gender: 'male' },
  { id: 'HgyIHe81F3nXywNwkraY', name: 'Nate - Sultry, Whispery and Seductive', gender: 'male' },
  { id: 'AeRdCCKzvd23BpJoofzx', name: 'Nathaniel - Engaging, British and Calm', gender: 'male' },
  { id: 'LruHrtVF6PSyGItzMNHS', name: 'Benjamin - Deep, Warm, Calming', gender: 'male' },
  { id: 'Qggl4b0xRMiqOwhPtVWT', name: 'Clara - Relaxing, Calm and Soothing', gender: 'female' },
  { id: 'zA6D7RyKdc2EClouEMkP', name: 'AImee - Tranquil ASMR and Meditation', gender: 'female' },
  { id: '1wGbFxmAM3Fgw63G1zZJ', name: 'Allison - Calm, Soothing and Meditative', gender: 'female' },
  { id: 'hqfrgApggtO1785R4Fsn', name: 'Theodore HQ - Serene and Grounded', gender: 'male' },
  { id: 'sH0WdfE5fsKuM2otdQZr', name: 'Koraly - Soft-spoken and Gentle', gender: 'female' },
  { id: 'MJ0RnG71ty4LH3dvNfSd', name: 'Leon - Soothing and Grounded', gender: 'male' },
];

/**
 * 所有声音列表
 */
export const DIALOGUE_ALL_VOICES: DialogueVoice[] = [
  ...DIALOGUE_STANDARD_VOICES,
  ...DIALOGUE_PREMIUM_VOICES,
];

/**
 * 获取声音的样例音频 URL
 */
export function getVoiceSampleUrl(voiceId: string): string {
  return `https://static.aiquickdraw.com/elevenlabs/voice/${voiceId.toLowerCase()}.mp3`;
}
