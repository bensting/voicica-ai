export interface VideoDownloaderLocaleContent {
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

export const VIDEO_DOWNLOADER_CONTENT: Record<
  string,
  VideoDownloaderLocaleContent
> = {
  en: {
    hero: {
      title: 'Free Video Downloader — YouTube, TikTok & More',
      subtitle:
        'Download videos from YouTube, TikTok, Instagram, X, and Facebook in one click. Multiple quality options, audio extraction, no watermarks.',
    },
    features: [
      {
        title: '5 Platforms Supported',
        description:
          'Download from YouTube, TikTok, Instagram, X (Twitter), and Facebook — all in one tool. Supports standard videos, Shorts, Reels, and Stories.',
      },
      {
        title: 'Multiple Quality Options',
        description:
          'Choose your preferred resolution and codec — from 360p to 4K. See file size before downloading so you know exactly what you get.',
      },
      {
        title: 'No Watermarks',
        description:
          'Download TikTok and Instagram videos without platform watermarks. Get clean, original-quality files ready to use.',
      },
      {
        title: 'Audio Extraction',
        description:
          'Extract audio from any video — perfect for saving music, podcasts, or voiceovers. Download as high-quality audio files.',
      },
      {
        title: 'Video Only Mode',
        description:
          'Download video without audio for editing projects. Add your own voiceover, music, or sound effects in post-production.',
      },
      {
        title: 'Fast & Reliable',
        description:
          'Paste a link, pick a quality, and download. No registration required, no complex settings — just fast, reliable video downloads.',
      },
    ],
    cta: {
      title: 'Start Downloading Videos Now',
      buttonText: 'Try Free Video Downloader',
    },
    seoText:
      'Voicica Video Downloader lets you save videos from YouTube, TikTok, Instagram, X (Twitter), and Facebook in seconds. Simply paste the video URL, choose your preferred quality and format, and download — no registration required. Support for video with audio, video only, and audio-only extraction. Download TikTok videos without watermarks, save YouTube videos in up to 4K resolution, and extract audio from any platform. Free credits every day for instant downloads.',
    metadata: {
      title:
        'Free Video Downloader — YouTube, TikTok, Instagram | Voicica AI',
      description:
        'Download videos from YouTube, TikTok, Instagram, X & Facebook for free. No watermarks, multiple quality options, audio extraction. Fast & easy online video downloader.',
      keywords: [
        'video downloader',
        'YouTube downloader',
        'TikTok downloader',
        'Instagram video downloader',
        'free video downloader',
        'download video no watermark',
        'online video downloader',
        'video downloader free',
      ],
    },
  },
  ja: {
    hero: {
      title: '無料動画ダウンローダー — YouTube、TikTok対応',
      subtitle:
        'YouTube、TikTok、Instagram、X、Facebookの動画をワンクリックでダウンロード。複数の画質オプション、音声抽出、ウォーターマークなし。',
    },
    features: [
      {
        title: '5つのプラットフォーム対応',
        description:
          'YouTube、TikTok、Instagram、X（Twitter）、Facebook — すべて1つのツールで。通常動画、Shorts、Reels、Storiesに対応。',
      },
      {
        title: '複数の画質オプション',
        description:
          '希望の解像度とコーデックを選択 — 360pから4Kまで。ダウンロード前にファイルサイズを確認できます。',
      },
      {
        title: 'ウォーターマークなし',
        description:
          'TikTokやInstagramの動画をプラットフォームのウォーターマークなしでダウンロード。クリーンで高品質なファイルを入手。',
      },
      {
        title: '音声抽出',
        description:
          'あらゆる動画から音声を抽出 — 音楽、ポッドキャスト、ナレーションの保存に最適。高品質な音声ファイルとしてダウンロード。',
      },
      {
        title: '映像のみモード',
        description:
          '編集プロジェクト用に音声なしの映像をダウンロード。後から自分のナレーション、音楽、効果音を追加できます。',
      },
      {
        title: '高速＆安定',
        description:
          'リンクを貼り付け、画質を選び、ダウンロード。登録不要、複雑な設定なし — 高速で安定した動画ダウンロード。',
      },
    ],
    cta: {
      title: '今すぐ動画をダウンロード',
      buttonText: '無料動画ダウンローダーを試す',
    },
    seoText:
      'Voicica動画ダウンローダーなら、YouTube、TikTok、Instagram、X（Twitter）、Facebookの動画を数秒で保存できます。動画URLを貼り付けて、画質とフォーマットを選んでダウンロード — 登録不要。音声付き動画、映像のみ、音声のみの抽出に対応。TikTok動画をウォーターマークなしでダウンロード、YouTube動画を最大4K解像度で保存、あらゆるプラットフォームから音声を抽出。毎日無料クレジットで即座にダウンロード。',
    metadata: {
      title: '無料動画ダウンローダー — YouTube、TikTok、Instagram | Voicica AI',
      description:
        'YouTube、TikTok、Instagram、X、Facebookから無料で動画をダウンロード。ウォーターマークなし、複数画質、音声抽出。高速＆簡単オンライン動画ダウンローダー。',
      keywords: [
        '動画ダウンローダー',
        'YouTubeダウンロード',
        'TikTokダウンロード',
        'Instagram動画ダウンロード',
        '無料動画ダウンロード',
        'ウォーターマークなし',
        'オンライン動画ダウンローダー',
        '動画保存',
      ],
    },
  },
  'zh-Hant': {
    hero: {
      title: '免費影片下載器 — YouTube、TikTok 一鍵下載',
      subtitle:
        '一鍵下載 YouTube、TikTok、Instagram、X、Facebook 影片。多種畫質選項、音訊擷取、無浮水印。',
    },
    features: [
      {
        title: '支援5大平台',
        description:
          'YouTube、TikTok、Instagram、X（Twitter）、Facebook — 一個工具搞定。支援一般影片、Shorts、Reels、限時動態。',
      },
      {
        title: '多種畫質選項',
        description:
          '選擇偏好的解析度和編碼格式 — 從360p到4K。下載前可預覽檔案大小。',
      },
      {
        title: '無浮水印',
        description:
          '下載 TikTok 和 Instagram 影片不帶平台浮水印。取得乾淨的原始品質檔案。',
      },
      {
        title: '音訊擷取',
        description:
          '從任何影片擷取音訊 — 適合儲存音樂、Podcast 或旁白。以高品質音訊檔案下載。',
      },
      {
        title: '純影像模式',
        description:
          '下載無音訊的純影像用於剪輯專案。後製時加入自己的配音、音樂或音效。',
      },
      {
        title: '快速穩定',
        description:
          '貼上連結、選擇畫質、下載。無需註冊、無複雜設定 — 快速穩定的影片下載體驗。',
      },
    ],
    cta: {
      title: '立即開始下載影片',
      buttonText: '免費試用影片下載器',
    },
    seoText:
      'Voicica 影片下載器讓你數秒內儲存 YouTube、TikTok、Instagram、X（Twitter）、Facebook 影片。只需貼上影片網址，選擇偏好的畫質和格式，即可下載——無需註冊。支援含音訊影片、純影像及純音訊擷取。TikTok 影片無浮水印下載、YouTube 影片最高4K解析度儲存、從任何平台擷取音訊。每天免費額度，即時下載。',
    metadata: {
      title: '免費影片下載器 — YouTube、TikTok、Instagram | Voicica AI',
      description:
        '免費下載 YouTube、TikTok、Instagram、X、Facebook 影片。無浮水印、多種畫質、音訊擷取。快速簡單的線上影片下載工具。',
      keywords: [
        '影片下載器',
        'YouTube下載',
        'TikTok下載',
        'Instagram影片下載',
        '免費影片下載',
        '無浮水印下載',
        '線上影片下載器',
        '影片儲存',
      ],
    },
  },
  ko: {
    hero: {
      title: '무료 비디오 다운로더 — YouTube, TikTok 등 지원',
      subtitle:
        'YouTube, TikTok, Instagram, X, Facebook 영상을 원클릭으로 다운로드. 다양한 화질 옵션, 오디오 추출, 워터마크 없음.',
    },
    features: [
      {
        title: '5개 플랫폼 지원',
        description:
          'YouTube, TikTok, Instagram, X(Twitter), Facebook — 하나의 도구로 모두 해결. 일반 영상, Shorts, Reels, Stories 지원.',
      },
      {
        title: '다양한 화질 옵션',
        description:
          '원하는 해상도와 코덱을 선택 — 360p부터 4K까지. 다운로드 전 파일 크기를 확인할 수 있습니다.',
      },
      {
        title: '워터마크 없음',
        description:
          'TikTok 및 Instagram 영상을 플랫폼 워터마크 없이 다운로드. 깨끗한 원본 품질 파일을 받으세요.',
      },
      {
        title: '오디오 추출',
        description:
          '모든 영상에서 오디오를 추출 — 음악, 팟캐스트, 나레이션 저장에 최적. 고품질 오디오 파일로 다운로드.',
      },
      {
        title: '영상 전용 모드',
        description:
          '편집 프로젝트를 위해 오디오 없이 영상만 다운로드. 후반 작업에서 직접 나레이션, 음악, 효과음을 추가하세요.',
      },
      {
        title: '빠르고 안정적',
        description:
          '링크를 붙여넣고, 화질을 선택하고, 다운로드. 가입 불필요, 복잡한 설정 없음 — 빠르고 안정적인 영상 다운로드.',
      },
    ],
    cta: {
      title: '지금 영상 다운로드 시작',
      buttonText: '무료 비디오 다운로더 체험',
    },
    seoText:
      'Voicica 비디오 다운로더로 YouTube, TikTok, Instagram, X(Twitter), Facebook 영상을 몇 초 만에 저장하세요. 영상 URL을 붙여넣고, 원하는 화질과 형식을 선택해 다운로드 — 가입 불필요. 오디오 포함 영상, 영상 전용, 오디오 전용 추출을 지원합니다. TikTok 영상 워터마크 없이 다운로드, YouTube 영상 최대 4K 해상도 저장, 모든 플랫폼에서 오디오 추출.',
    metadata: {
      title: '무료 비디오 다운로더 — YouTube, TikTok, Instagram | Voicica AI',
      description:
        'YouTube, TikTok, Instagram, X, Facebook 영상을 무료로 다운로드. 워터마크 없음, 다양한 화질, 오디오 추출. 빠르고 간편한 온라인 비디오 다운로더.',
      keywords: [
        '비디오 다운로더',
        'YouTube 다운로드',
        'TikTok 다운로드',
        'Instagram 영상 다운로드',
        '무료 영상 다운로드',
        '워터마크 없는 다운로드',
        '온라인 비디오 다운로더',
        '영상 저장',
      ],
    },
  },
  th: {
    hero: {
      title: 'ดาวน์โหลดวิดีโอฟรี — YouTube, TikTok และอื่นๆ',
      subtitle:
        'ดาวน์โหลดวิดีโอจาก YouTube, TikTok, Instagram, X, Facebook ในคลิกเดียว หลายตัวเลือกคุณภาพ แยกเสียง ไม่มีลายน้ำ',
    },
    features: [
      {
        title: 'รองรับ 5 แพลตฟอร์ม',
        description:
          'YouTube, TikTok, Instagram, X (Twitter), Facebook — ทุกอย่างในเครื่องมือเดียว รองรับวิดีโอปกติ, Shorts, Reels และ Stories',
      },
      {
        title: 'หลายตัวเลือกคุณภาพ',
        description:
          'เลือกความละเอียดและโคเดกที่ต้องการ — ตั้งแต่ 360p ถึง 4K ดูขนาดไฟล์ก่อนดาวน์โหลด',
      },
      {
        title: 'ไม่มีลายน้ำ',
        description:
          'ดาวน์โหลดวิดีโอ TikTok และ Instagram โดยไม่มีลายน้ำแพลตฟอร์ม ได้ไฟล์สะอาดคุณภาพต้นฉบับ',
      },
      {
        title: 'แยกเสียง',
        description:
          'แยกเสียงจากวิดีโอใดก็ได้ — เหมาะสำหรับบันทึกเพลง พอดแคสต์ หรือเสียงบรรยาย ดาวน์โหลดเป็นไฟล์เสียงคุณภาพสูง',
      },
      {
        title: 'โหมดวิดีโอเท่านั้น',
        description:
          'ดาวน์โหลดวิดีโอไม่มีเสียงสำหรับโปรเจกต์ตัดต่อ เพิ่มเสียงบรรยาย เพลง หรือเอฟเฟกต์เสียงของคุณเองในภายหลัง',
      },
      {
        title: 'เร็วและเสถียร',
        description:
          'วางลิงก์ เลือกคุณภาพ แล้วดาวน์โหลด ไม่ต้องสมัคร ไม่มีการตั้งค่าซับซ้อน — ดาวน์โหลดวิดีโอเร็วและเสถียร',
      },
    ],
    cta: {
      title: 'เริ่มดาวน์โหลดวิดีโอเลย',
      buttonText: 'ลองเครื่องดาวน์โหลดวิดีโอฟรี',
    },
    seoText:
      'Voicica ดาวน์โหลดวิดีโอ ให้คุณบันทึกวิดีโอจาก YouTube, TikTok, Instagram, X (Twitter), Facebook ในไม่กี่วินาที แค่วางลิงก์วิดีโอ เลือกคุณภาพและรูปแบบที่ต้องการ แล้วดาวน์โหลด — ไม่ต้องสมัคร รองรับวิดีโอพร้อมเสียง วิดีโอเท่านั้น และแยกเสียงอย่างเดียว ดาวน์โหลดวิดีโอ TikTok ไม่มีลายน้ำ บันทึกวิดีโอ YouTube ความละเอียดสูงสุด 4K แยกเสียงจากทุกแพลตฟอร์ม',
    metadata: {
      title: 'ดาวน์โหลดวิดีโอฟรี — YouTube, TikTok, Instagram | Voicica AI',
      description:
        'ดาวน์โหลดวิดีโอจาก YouTube, TikTok, Instagram, X, Facebook ฟรี ไม่มีลายน้ำ หลายตัวเลือกคุณภาพ แยกเสียง เครื่องดาวน์โหลดวิดีโอออนไลน์เร็วและง่าย',
      keywords: [
        'ดาวน์โหลดวิดีโอ',
        'ดาวน์โหลด YouTube',
        'ดาวน์โหลด TikTok',
        'ดาวน์โหลดวิดีโอ Instagram',
        'ดาวน์โหลดวิดีโอฟรี',
        'ไม่มีลายน้ำ',
        'ดาวน์โหลดวิดีโอออนไลน์',
        'บันทึกวิดีโอ',
      ],
    },
  },
};
