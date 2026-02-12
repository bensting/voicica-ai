export interface AiVoiceLocaleContent {
  hero: {
    title: string;
    subtitle: string;
  };
  features: { title: string; description: string }[];
  cta: {
    title: string;
    buttonText: string;
  };
  seoText: string;
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export const AI_VOICE_CONTENT: Record<string, AiVoiceLocaleContent> = {
  en: {
    hero: {
      title: 'AI Voice Generator — Natural Text to Speech Online',
      subtitle:
        'Transform text into lifelike speech with 3,200+ AI voices across 190+ languages. Free, fast, and studio-quality.',
    },
    features: [
      {
        title: '3,200+ AI Voices',
        description:
          'Choose from thousands of unique voices — male, female, child, elderly, and character voices in every major language.',
      },
      {
        title: '190+ Languages & Accents',
        description:
          'Generate speech in English, Japanese, Chinese, Korean, Thai, Spanish, French, German, Arabic, and many more.',
      },
      {
        title: 'Studio-Quality Output',
        description:
          'Crystal-clear audio at up to 48 kHz. Perfect for YouTube videos, podcasts, audiobooks, and professional presentations.',
      },
      {
        title: 'Voice Cloning',
        description:
          'Clone any voice with a short audio sample. Create a digital twin of your own voice or generate custom character voices.',
      },
      {
        title: 'Emotion & Style Control',
        description:
          'Adjust tone, speed, pitch, and emotion. Make your AI voice sound happy, sad, excited, calm, or professional.',
      },
      {
        title: '100% Free to Start',
        description:
          'No credit card required. Get free credits every day to generate AI speech — upgrade anytime for higher limits.',
      },
    ],
    cta: {
      title: 'Start Generating AI Voices Now',
      buttonText: 'Try Free AI Voice Generator',
    },
    seoText:
      'Voicica AI is the leading free AI voice generator and text to speech platform. Whether you need voiceovers for YouTube, TikTok, podcasts, e-learning courses, or business presentations, our AI TTS engine delivers natural-sounding results in seconds. Powered by cutting-edge neural networks, Voicica supports over 3,200 voices and 190 languages — making it the most comprehensive AI voice tool available online.',
    metadata: {
      title: 'AI Voice Generator — Free Text to Speech Online | Voicica AI',
      description:
        'Generate natural AI voices from text with 3200+ voices in 190+ languages. Free online text to speech tool for videos, podcasts, and more.',
      keywords: [
        'AI voice generator',
        'text to speech',
        'TTS',
        'AI voice',
        'text to speech online',
        'free voice generator',
        'AI narration',
        'voice cloning',
      ],
    },
  },
  ja: {
    hero: {
      title: 'AI音声ジェネレーター — オンライン自然テキスト読み上げ',
      subtitle:
        '190以上の言語で3,200以上のAI音声を使い、テキストをリアルな音声に変換。無料、高速、スタジオ品質。',
    },
    features: [
      {
        title: '3,200以上のAI音声',
        description:
          '男性、女性、子供、高齢者、キャラクターボイスなど、あらゆる主要言語で数千のユニークな音声から選べます。',
      },
      {
        title: '190以上の言語とアクセント',
        description:
          '英語、日本語、中国語、韓国語、タイ語、スペイン語、フランス語、ドイツ語、アラビア語など多数の言語で音声を生成。',
      },
      {
        title: 'スタジオ品質の出力',
        description:
          '最大48kHzのクリスタルクリアな音質。YouTube動画、ポッドキャスト、オーディオブック、プレゼンテーションに最適です。',
      },
      {
        title: 'ボイスクローニング',
        description:
          '短い音声サンプルで任意の声をクローン。自分の声のデジタルツインを作成したり、カスタムキャラクターボイスを生成できます。',
      },
      {
        title: '感情とスタイルの制御',
        description:
          'トーン、スピード、ピッチ、感情を調整。AI音声を嬉しい、悲しい、興奮、穏やか、プロフェッショナルに変化させられます。',
      },
      {
        title: '完全無料でスタート',
        description:
          'クレジットカード不要。毎日無料クレジットでAI音声を生成 — いつでもアップグレードして制限を拡大できます。',
      },
    ],
    cta: {
      title: '今すぐAI音声を生成',
      buttonText: '無料AI音声ジェネレーターを試す',
    },
    seoText:
      'Voicica AIは最先端の無料AI音声ジェネレーター＆テキスト読み上げプラットフォームです。YouTube、TikTok、ポッドキャスト、eラーニング、ビジネスプレゼンテーション用のナレーションが必要な方に、自然な音声を数秒で提供します。最先端のニューラルネットワーク技術により、3,200以上の音声と190以上の言語をサポート。オンラインで最も包括的なAI音声ツールです。',
    metadata: {
      title: 'AI音声ジェネレーター — 無料テキスト読み上げ | Voicica AI',
      description:
        '190以上の言語で3200以上の音声による自然なAI音声をテキストから生成。動画、ポッドキャストなどに最適な無料オンラインTTSツール。',
      keywords: [
        'AI音声ジェネレーター',
        'テキスト読み上げ',
        'TTS',
        'AI音声',
        'テキスト音声変換',
        '無料音声生成',
        'AIナレーション',
        'ボイスクローニング',
      ],
    },
  },
  'zh-Hant': {
    hero: {
      title: 'AI語音生成器 — 免費線上文字轉語音',
      subtitle:
        '使用3,200+種AI語音，支援190+種語言，將文字轉為逼真語音。免費、快速、錄音室品質。',
    },
    features: [
      {
        title: '3,200+ AI語音',
        description:
          '從男聲、女聲、童聲、長者聲到角色配音，涵蓋所有主要語言的數千種獨特語音供您選擇。',
      },
      {
        title: '190+種語言與口音',
        description:
          '支援英語、日語、中文、韓語、泰語、西班牙語、法語、德語、阿拉伯語等多種語言的語音生成。',
      },
      {
        title: '錄音室品質輸出',
        description:
          '高達48kHz的清晰音質。完美適用於YouTube影片、Podcast、有聲書及專業簡報。',
      },
      {
        title: '語音克隆',
        description:
          '只需一段短音訊即可克隆任何聲音。創建自己聲音的數位分身或生成自訂角色語音。',
      },
      {
        title: '情感與風格控制',
        description:
          '調整語調、語速、音高與情感。讓AI語音呈現開心、悲傷、興奮、平靜或專業的效果。',
      },
      {
        title: '100%免費開始',
        description:
          '無需信用卡。每天獲得免費額度生成AI語音——隨時升級以獲得更高限額。',
      },
    ],
    cta: {
      title: '立即開始生成AI語音',
      buttonText: '免費試用AI語音生成器',
    },
    seoText:
      'Voicica AI是領先的免費AI語音生成器與文字轉語音平台。無論您需要YouTube、TikTok、Podcast、線上課程或商業簡報的旁白，我們的AI TTS引擎都能在數秒內提供自然流暢的語音。採用最先進的神經網路技術，Voicica支援超過3,200種語音和190種語言，是線上最全面的AI語音工具。',
    metadata: {
      title: 'AI語音生成器 — 免費文字轉語音 | Voicica AI',
      description:
        '使用3200+種語音、190+種語言生成自然AI語音。免費線上文字轉語音工具，適用於影片、Podcast等。',
      keywords: [
        'AI語音生成器',
        '文字轉語音',
        'TTS',
        'AI語音',
        '線上文字轉語音',
        '免費語音生成',
        'AI旁白',
        '語音克隆',
      ],
    },
  },
  ko: {
    hero: {
      title: 'AI 음성 생성기 — 무료 온라인 텍스트 음성 변환',
      subtitle:
        '190개 이상의 언어에서 3,200개 이상의 AI 음성으로 텍스트를 생생한 음성으로 변환하세요. 무료, 빠르고, 스튜디오 품질.',
    },
    features: [
      {
        title: '3,200+ AI 음성',
        description:
          '남성, 여성, 어린이, 노인, 캐릭터 음성 등 모든 주요 언어에서 수천 가지 고유한 음성을 선택하세요.',
      },
      {
        title: '190+ 언어 및 억양',
        description:
          '영어, 일본어, 중국어, 한국어, 태국어, 스페인어, 프랑스어, 독일어, 아랍어 등 다양한 언어로 음성을 생성하세요.',
      },
      {
        title: '스튜디오 품질 출력',
        description:
          '최대 48kHz의 선명한 오디오. YouTube 영상, 팟캐스트, 오디오북, 전문 프레젠테이션에 완벽합니다.',
      },
      {
        title: '음성 클로닝',
        description:
          '짧은 오디오 샘플로 원하는 음성을 복제하세요. 자신의 음성 디지털 트윈을 만들거나 커스텀 캐릭터 음성을 생성하세요.',
      },
      {
        title: '감정 및 스타일 제어',
        description:
          '톤, 속도, 피치, 감정을 조절하세요. AI 음성을 기쁨, 슬픔, 흥분, 차분함, 전문적인 톤으로 변경할 수 있습니다.',
      },
      {
        title: '100% 무료 시작',
        description:
          '신용카드 불필요. 매일 무료 크레딧으로 AI 음성을 생성하세요 — 언제든 업그레이드하여 한도를 늘릴 수 있습니다.',
      },
    ],
    cta: {
      title: '지금 AI 음성 생성 시작',
      buttonText: '무료 AI 음성 생성기 체험',
    },
    seoText:
      'Voicica AI는 최고의 무료 AI 음성 생성기이자 텍스트 음성 변환 플랫폼입니다. YouTube, TikTok, 팟캐스트, e러닝 과정, 비즈니스 프레젠테이션을 위한 나레이션이 필요하든, 우리의 AI TTS 엔진은 몇 초 만에 자연스러운 결과를 제공합니다. 최첨단 신경망 기술로 구동되며, Voicica는 3,200개 이상의 음성과 190개 언어를 지원합니다.',
    metadata: {
      title: 'AI 음성 생성기 — 무료 텍스트 음성 변환 | Voicica AI',
      description:
        '190개 이상의 언어에서 3200개 이상의 음성으로 자연스러운 AI 음성을 생성하세요. 영상, 팟캐스트 등을 위한 무료 온라인 TTS 도구.',
      keywords: [
        'AI 음성 생성기',
        '텍스트 음성 변환',
        'TTS',
        'AI 음성',
        '온라인 텍스트 음성 변환',
        '무료 음성 생성기',
        'AI 나레이션',
        '음성 클로닝',
      ],
    },
  },
  th: {
    hero: {
      title: 'AI สร้างเสียง — แปลงข้อความเป็นเสียงออนไลน์ฟรี',
      subtitle:
        'แปลงข้อความเป็นเสียงพูดสมจริงด้วยเสียง AI กว่า 3,200 เสียงใน 190+ ภาษา ฟรี รวดเร็ว คุณภาพสตูดิโอ',
    },
    features: [
      {
        title: '3,200+ เสียง AI',
        description:
          'เลือกจากเสียงที่ไม่ซ้ำกันนับพัน — เสียงผู้ชาย ผู้หญิง เด็ก ผู้สูงอายุ และเสียงตัวละครในทุกภาษาหลัก',
      },
      {
        title: '190+ ภาษาและสำเนียง',
        description:
          'สร้างเสียงพูดเป็นภาษาอังกฤษ ญี่ปุ่น จีน เกาหลี ไทย สเปน ฝรั่งเศส เยอรมัน อาหรับ และอื่นๆ อีกมากมาย',
      },
      {
        title: 'คุณภาพเสียงระดับสตูดิโอ',
        description:
          'เสียงคมชัดสูงสุด 48 kHz เหมาะสำหรับวิดีโอ YouTube พอดแคสต์ หนังสือเสียง และการนำเสนอระดับมืออาชีพ',
      },
      {
        title: 'โคลนเสียง',
        description:
          'โคลนเสียงใดก็ได้ด้วยตัวอย่างเสียงสั้นๆ สร้างเสียงดิจิทัลของตัวเองหรือสร้างเสียงตัวละครแบบกำหนดเอง',
      },
      {
        title: 'ควบคุมอารมณ์และสไตล์',
        description:
          'ปรับโทน ความเร็ว ระดับเสียง และอารมณ์ ทำให้เสียง AI ฟังดูมีความสุข เศร้า ตื่นเต้น สงบ หรือเป็นมืออาชีพ',
      },
      {
        title: 'เริ่มใช้ฟรี 100%',
        description:
          'ไม่ต้องใช้บัตรเครดิต รับเครดิตฟรีทุกวันเพื่อสร้างเสียง AI — อัปเกรดเมื่อไหร่ก็ได้เพื่อเพิ่มโควตา',
      },
    ],
    cta: {
      title: 'เริ่มสร้างเสียง AI เลย',
      buttonText: 'ลองเครื่องสร้างเสียง AI ฟรี',
    },
    seoText:
      'Voicica AI คือเครื่องสร้างเสียง AI ฟรีชั้นนำและแพลตฟอร์มแปลงข้อความเป็นเสียง ไม่ว่าคุณจะต้องการเสียงบรรยายสำหรับ YouTube, TikTok, พอดแคสต์, คอร์สออนไลน์ หรือการนำเสนอทางธุรกิจ เครื่องยนต์ AI TTS ของเราให้ผลลัพธ์เสียงธรรมชาติในไม่กี่วินาที ขับเคลื่อนด้วยเทคโนโลยีเครือข่ายประสาทเทียมล้ำสมัย Voicica รองรับกว่า 3,200 เสียงและ 190 ภาษา',
    metadata: {
      title: 'AI สร้างเสียง — แปลงข้อความเป็นเสียงฟรี | Voicica AI',
      description:
        'สร้างเสียง AI ธรรมชาติจากข้อความด้วย 3200+ เสียงใน 190+ ภาษา เครื่องมือ TTS ออนไลน์ฟรีสำหรับวิดีโอ พอดแคสต์ และอื่นๆ',
      keywords: [
        'AI สร้างเสียง',
        'แปลงข้อความเป็นเสียง',
        'TTS',
        'AI เสียง',
        'แปลงข้อความเป็นเสียงออนไลน์',
        'สร้างเสียงฟรี',
        'AI บรรยาย',
        'โคลนเสียง',
      ],
    },
  },
};
