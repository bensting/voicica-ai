export interface HomepageLocaleContent {
  h1: string;
  features: { title: string; description: string }[];
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
  jsonLdFeatureList: string[];
}

export const HOMEPAGE_CONTENT: Record<string, HomepageLocaleContent> = {
  en: {
    h1: 'Free AI Voice Generator, Music Creator & Image Tools',
    features: [
      {
        title: 'AI Text to Speech',
        description:
          'Convert any text to natural-sounding speech with over 3,200 AI voices in 190+ languages. Our free online text to speech generator produces studio-quality voiceovers in seconds — perfect for videos, podcasts, and e-learning.',
      },
      {
        title: 'AI Music Generator',
        description:
          'Create original music tracks with AI. Describe the mood, genre, or style you want and get a royalty-free composition instantly. Ideal for content creators, filmmakers, and game developers.',
      },
      {
        title: 'AI Image Creator',
        description:
          'Generate stunning AI images from text prompts. From concept art to social media graphics, our AI image generator turns your ideas into high-quality visuals in seconds.',
      },
      {
        title: 'Free Video Downloader',
        description:
          'Download videos from TikTok, YouTube, and more. Save your favorite content in high quality — no watermark, no signup required. Fast, free, and easy to use.',
      },
      {
        title: 'HD Image Upscaler',
        description:
          'Enhance and upscale images to HD quality using AI. Restore blurry photos, increase resolution, and sharpen details with a single click — completely free.',
      },
      {
        title: 'Background Remover',
        description:
          'Remove image backgrounds instantly with AI. Get clean, transparent cutouts for product photos, portraits, and design projects — no manual editing needed.',
      },
    ],
    metadata: {
      title: 'Voicica AI - Free AI Voice Generator, Music & Image Tools',
      description:
        'Free AI platform: Text to speech with 3200+ voices, AI music generator, AI image creator, video downloader, HD upscaler, background remover.',
      keywords: [
        'AI voice',
        'text to speech',
        'AI music generator',
        'AI image generator',
        'video downloader',
        'image upscaler',
        'background remover',
        'free AI tools',
      ],
    },
    jsonLdFeatureList: [
      'AI Text to Speech with 3200+ voices',
      'AI Music Generator',
      'AI Image Creator',
      'Free Video Downloader',
      'HD Image Upscaler',
      'Background Remover',
    ],
  },
  ja: {
    h1: '無料AI音声ジェネレーター、音楽クリエイター＆画像ツール',
    features: [
      {
        title: 'AIテキスト読み上げ',
        description:
          '190以上の言語に対応した3,200以上のAI音声で、あらゆるテキストを自然な音声に変換します。無料のオンラインテキスト読み上げジェネレーターで、動画、ポッドキャスト、eラーニングに最適なスタジオ品質のナレーションを数秒で作成できます。',
      },
      {
        title: 'AI音楽ジェネレーター',
        description:
          'AIでオリジナルの音楽トラックを作成。ムード、ジャンル、スタイルを指定するだけで、ロイヤリティフリーの楽曲を即座に生成します。コンテンツクリエイター、映像制作者、ゲーム開発者に最適です。',
      },
      {
        title: 'AI画像クリエイター',
        description:
          'テキストプロンプトから美しいAI画像を生成。コンセプトアートからSNS用グラフィックまで、AIイメージジェネレーターがあなたのアイデアを数秒で高品質なビジュアルに変えます。',
      },
      {
        title: '無料動画ダウンローダー',
        description:
          'TikTok、YouTubeなどから動画をダウンロード。お気に入りのコンテンツを高画質で保存できます。ウォーターマークなし、登録不要。高速、無料、簡単に使えます。',
      },
      {
        title: 'HD画像アップスケーラー',
        description:
          'AIを使って画像をHD画質に高画質化・拡大。ぼやけた写真の復元、解像度の向上、ディテールの鮮明化をワンクリックで実現。完全無料でご利用いただけます。',
      },
      {
        title: '背景削除ツール',
        description:
          'AIで画像の背景を瞬時に削除。商品写真、ポートレート、デザインプロジェクトに使える透過切り抜きを取得できます。手動編集は不要です。',
      },
    ],
    metadata: {
      title: 'Voicica AI - 無料AI音声生成、音楽・画像作成ツール',
      description:
        '無料AIプラットフォーム：3200以上の音声でテキスト読み上げ、AI音楽生成、AI画像作成、動画ダウンロード、HD高画質化、背景削除。',
      keywords: [
        'AI音声',
        'テキスト読み上げ',
        'AI音楽生成',
        'AI画像生成',
        '動画ダウンロード',
        '画像高画質化',
        '背景削除',
        '無料AIツール',
      ],
    },
    jsonLdFeatureList: [
      '3200以上の音声によるAIテキスト読み上げ',
      'AI音楽ジェネレーター',
      'AI画像クリエイター',
      '無料動画ダウンローダー',
      'HD画像アップスケーラー',
      '背景削除ツール',
    ],
  },
  'zh-Hant': {
    h1: '免費AI語音生成器、音樂創作與圖片工具',
    features: [
      {
        title: 'AI文字轉語音',
        description:
          '使用超過3,200種AI語音，支援190多種語言，將任何文字轉換為自然流暢的語音。我們的免費線上文字轉語音生成器，能在數秒內產出錄音室品質的旁白——完美適用於影片、Podcast及線上課程。',
      },
      {
        title: 'AI音樂生成器',
        description:
          '用AI創作原創音樂。描述你想要的氛圍、曲風或風格，即可即時獲得免版稅的樂曲。非常適合內容創作者、影片製作人和遊戲開發者。',
      },
      {
        title: 'AI圖片創作器',
        description:
          '透過文字提示生成令人驚豔的AI圖片。從概念藝術到社群媒體圖片，我們的AI圖片生成器能在數秒內將你的想法化為高品質視覺作品。',
      },
      {
        title: '免費影片下載器',
        description:
          '從TikTok、YouTube等平台下載影片。以高畫質保存你喜愛的內容——無浮水印、無需註冊。快速、免費、簡單易用。',
      },
      {
        title: 'HD圖片高畫質化',
        description:
          '使用AI將圖片提升至HD畫質。一鍵修復模糊照片、提高解析度、銳化細節——完全免費使用。',
      },
      {
        title: '背景移除工具',
        description:
          '用AI即時移除圖片背景。為商品照片、人像和設計專案取得乾淨的透明去背——無需手動編輯。',
      },
    ],
    metadata: {
      title: 'Voicica AI - 免費AI語音生成、音樂與圖片創作工具',
      description:
        '免費AI平台：3200+語音文字轉語音、AI音樂生成、AI圖片創作、影片下載、HD高畫質化、背景移除。',
      keywords: [
        'AI語音',
        '文字轉語音',
        'AI音樂生成',
        'AI圖片生成',
        '影片下載',
        '圖片高畫質化',
        '背景移除',
        '免費AI工具',
      ],
    },
    jsonLdFeatureList: [
      '3200+語音的AI文字轉語音',
      'AI音樂生成器',
      'AI圖片創作器',
      '免費影片下載器',
      'HD圖片高畫質化',
      '背景移除工具',
    ],
  },
  ko: {
    h1: '무료 AI 음성 생성기, 음악 크리에이터 & 이미지 도구',
    features: [
      {
        title: 'AI 텍스트 음성 변환',
        description:
          '190개 이상의 언어를 지원하는 3,200개 이상의 AI 음성으로 텍스트를 자연스러운 음성으로 변환하세요. 무료 온라인 텍스트 음성 변환 생성기로 영상, 팟캐스트, e러닝에 적합한 스튜디오급 나레이션을 몇 초 만에 만들 수 있습니다.',
      },
      {
        title: 'AI 음악 생성기',
        description:
          'AI로 오리지널 음악 트랙을 만드세요. 원하는 분위기, 장르, 스타일을 설명하면 저작권료 없는 곡을 즉시 생성합니다. 콘텐츠 크리에이터, 영화 제작자, 게임 개발자에게 이상적입니다.',
      },
      {
        title: 'AI 이미지 생성기',
        description:
          '텍스트 프롬프트로 멋진 AI 이미지를 생성하세요. 컨셉 아트부터 소셜 미디어 그래픽까지, AI 이미지 생성기가 아이디어를 몇 초 만에 고품질 비주얼로 바꿔줍니다.',
      },
      {
        title: '무료 동영상 다운로더',
        description:
          'TikTok, YouTube 등에서 동영상을 다운로드하세요. 좋아하는 콘텐츠를 고화질로 저장 — 워터마크 없음, 가입 불필요. 빠르고, 무료이며, 사용이 간편합니다.',
      },
      {
        title: 'HD 이미지 업스케일러',
        description:
          'AI를 사용하여 이미지를 HD 화질로 향상 및 확대하세요. 흐릿한 사진 복원, 해상도 증가, 디테일 선명화를 원클릭으로 — 완전 무료입니다.',
      },
      {
        title: '배경 제거 도구',
        description:
          'AI로 이미지 배경을 즉시 제거하세요. 상품 사진, 인물 사진, 디자인 프로젝트에 깔끔한 투명 배경을 얻을 수 있습니다 — 수동 편집이 필요 없습니다.',
      },
    ],
    metadata: {
      title: 'Voicica AI - 무료 AI 음성 생성, 음악 & 이미지 도구',
      description:
        '무료 AI 플랫폼: 3200+ 음성 텍스트 음성 변환, AI 음악 생성, AI 이미지 생성, 동영상 다운로드, HD 업스케일러, 배경 제거.',
      keywords: [
        'AI 음성',
        '텍스트 음성 변환',
        'AI 음악 생성기',
        'AI 이미지 생성기',
        '동영상 다운로더',
        '이미지 업스케일러',
        '배경 제거',
        '무료 AI 도구',
      ],
    },
    jsonLdFeatureList: [
      '3200+ 음성 AI 텍스트 음성 변환',
      'AI 음악 생성기',
      'AI 이미지 생성기',
      '무료 동영상 다운로더',
      'HD 이미지 업스케일러',
      '배경 제거 도구',
    ],
  },
  th: {
    h1: 'เครื่องสร้างเสียง AI ฟรี, สร้างเพลง & เครื่องมือรูปภาพ',
    features: [
      {
        title: 'AI แปลงข้อความเป็นเสียง',
        description:
          'แปลงข้อความใดก็ได้เป็นเสียงพูดที่เป็นธรรมชาติด้วยเสียง AI กว่า 3,200 เสียงใน 190+ ภาษา เครื่องมือแปลงข้อความเป็นเสียงออนไลน์ฟรีของเราสร้างเสียงบรรยายคุณภาพสตูดิโอได้ในไม่กี่วินาที เหมาะสำหรับวิดีโอ พอดแคสต์ และ e-learning',
      },
      {
        title: 'AI สร้างเพลง',
        description:
          'สร้างเพลงต้นฉบับด้วย AI อธิบายอารมณ์ แนวเพลง หรือสไตล์ที่ต้องการ แล้วรับเพลงปลอดค่าลิขสิทธิ์ทันที เหมาะสำหรับครีเอเตอร์ ผู้สร้างภาพยนตร์ และนักพัฒนาเกม',
      },
      {
        title: 'AI สร้างรูปภาพ',
        description:
          'สร้างรูปภาพ AI สวยงามจากข้อความ ตั้งแต่คอนเซ็ปต์อาร์ตไปจนถึงกราฟิกโซเชียลมีเดีย เครื่องสร้างรูปภาพ AI ของเราเปลี่ยนไอเดียของคุณเป็นภาพคุณภาพสูงในไม่กี่วินาที',
      },
      {
        title: 'ดาวน์โหลดวิดีโอฟรี',
        description:
          'ดาวน์โหลดวิดีโอจาก TikTok, YouTube และอื่นๆ บันทึกเนื้อหาที่ชอบในคุณภาพสูง ไม่มีลายน้ำ ไม่ต้องสมัคร รวดเร็ว ฟรี และใช้งานง่าย',
      },
      {
        title: 'HD อัปสเกลรูปภาพ',
        description:
          'เพิ่มคุณภาพและขยายรูปภาพเป็น HD ด้วย AI กู้คืนภาพเบลอ เพิ่มความละเอียด และเพิ่มความคมชัดด้วยคลิกเดียว ฟรีทั้งหมด',
      },
      {
        title: 'ลบพื้นหลัง',
        description:
          'ลบพื้นหลังรูปภาพทันทีด้วย AI รับภาพตัดออกโปร่งใสสะอาดสำหรับภาพสินค้า ภาพบุคคล และโปรเจกต์ออกแบบ ไม่ต้องแก้ไขด้วยมือ',
      },
    ],
    metadata: {
      title: 'Voicica AI - เครื่องสร้างเสียง AI ฟรี, เพลง & เครื่องมือรูปภาพ',
      description:
        'แพลตฟอร์ม AI ฟรี: แปลงข้อความเป็นเสียง 3200+ เสียง, สร้างเพลง AI, สร้างรูปภาพ AI, ดาวน์โหลดวิดีโอ, HD อัปสเกล, ลบพื้นหลัง',
      keywords: [
        'AI เสียง',
        'แปลงข้อความเป็นเสียง',
        'AI สร้างเพลง',
        'AI สร้างรูปภาพ',
        'ดาวน์โหลดวิดีโอ',
        'อัปสเกลรูปภาพ',
        'ลบพื้นหลัง',
        'เครื่องมือ AI ฟรี',
      ],
    },
    jsonLdFeatureList: [
      'AI แปลงข้อความเป็นเสียง 3200+ เสียง',
      'AI สร้างเพลง',
      'AI สร้างรูปภาพ',
      'ดาวน์โหลดวิดีโอฟรี',
      'HD อัปสเกลรูปภาพ',
      'ลบพื้นหลัง',
    ],
  },
};
