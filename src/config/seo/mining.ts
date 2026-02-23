export interface MiningLocaleContent {
  hero: { title: string; subtitle: string };
  steps: { title: string }[];
  download: {
    apk: string;
    unlockFeatures: string;
    googlePlay: string;
    standardVersion: string;
    apkTip: string;
    hot: string;
  };
  trust: { poweredBy: string; secureNode: string; ddosProtected: string };
  metadata: { title: string; description: string; keywords: string[] };
}

export const MINING_CONTENT: Record<string, MiningLocaleContent> = {
  en: {
    hero: {
      title: 'Decentralized AI Power',
      subtitle: 'Turn Your Phone into an AI Compute Node & Earn Daily',
    },
    steps: [
      { title: 'Download & Setup' },
      { title: 'Activate Node' },
      { title: 'Withdraw Rewards' },
    ],
    download: {
      apk: 'Download Voicica Pro APK',
      unlockFeatures: 'Unlock All Features + High Yield',
      googlePlay: 'Get it on Google Play',
      standardVersion: 'Standard Version',
      apkTip: 'Direct APK offers full access & mining & rewards',
      hot: 'HOT',
    },
    trust: {
      poweredBy: 'Powered by',
      secureNode: 'Secure Node Tech',
      ddosProtected: 'DDoS Protected',
    },
    metadata: {
      title: 'AI Mining — Decentralized AI Compute Power | Voicica',
      description:
        'Turn your phone into an AI compute node and earn daily rewards. Download Voicica Pro to join the decentralized AI power network.',
      keywords: [
        'AI mining',
        'decentralized AI',
        'compute node',
        'earn crypto',
        'Voicica Pro',
        'AI power network',
        'mobile mining',
      ],
    },
  },
  ja: {
    hero: {
      title: '分散型AIパワー',
      subtitle: 'スマホをAI計算ノードに変えて毎日稼ごう',
    },
    steps: [
      { title: 'ダウンロード＆セットアップ' },
      { title: 'ノードを有効化' },
      { title: '報酬を引き出す' },
    ],
    download: {
      apk: 'Voicica Pro APKをダウンロード',
      unlockFeatures: '全機能アンロック + 高リターン',
      googlePlay: 'Google Playで入手',
      standardVersion: 'スタンダード版',
      apkTip: 'APK直接インストールで全機能・マイニング・報酬にアクセス',
      hot: '注目',
    },
    trust: {
      poweredBy: '提供元',
      secureNode: 'セキュアノード技術',
      ddosProtected: 'DDoS保護済み',
    },
    metadata: {
      title: 'AIマイニング — 分散型AI計算パワー | Voicica',
      description:
        'スマホをAI計算ノードに変えて毎日報酬を獲得。Voicica Proをダウンロードして分散型AIパワーネットワークに参加しよう。',
      keywords: [
        'AIマイニング',
        '分散型AI',
        '計算ノード',
        '仮想通貨',
        'Voicica Pro',
        'AIパワーネットワーク',
        'モバイルマイニング',
      ],
    },
  },
  'zh-Hant': {
    hero: {
      title: '去中心化 AI 算力',
      subtitle: '將手機變為 AI 算力節點，每日賺取收益',
    },
    steps: [
      { title: '下載安裝' },
      { title: '啟動節點' },
      { title: '提取獎勵' },
    ],
    download: {
      apk: '下載 Voicica Pro APK',
      unlockFeatures: '解鎖全部功能 + 高收益',
      googlePlay: '在 Google Play 下載',
      standardVersion: '標準版',
      apkTip: '直接安裝 APK 享受完整功能、挖礦與獎勵',
      hot: '熱門',
    },
    trust: {
      poweredBy: '技術支持',
      secureNode: '安全節點技術',
      ddosProtected: 'DDoS 防護',
    },
    metadata: {
      title: 'AI 挖礦 — 去中心化 AI 算力 | Voicica',
      description:
        '將手機變為 AI 算力節點，每日賺取收益。下載 Voicica Pro 加入去中心化 AI 算力網路。',
      keywords: [
        'AI 挖礦',
        '去中心化 AI',
        '算力節點',
        '賺取加密貨幣',
        'Voicica Pro',
        'AI 算力網路',
        '手機挖礦',
      ],
    },
  },
  ko: {
    hero: {
      title: '분산형 AI 컴퓨팅 파워',
      subtitle: '스마트폰을 AI 컴퓨팅 노드로 전환하고 매일 수익을 얻으세요',
    },
    steps: [
      { title: '다운로드 및 설정' },
      { title: '노드 활성화' },
      { title: '보상 인출' },
    ],
    download: {
      apk: 'Voicica Pro APK 다운로드',
      unlockFeatures: '모든 기능 잠금 해제 + 높은 수익',
      googlePlay: 'Google Play에서 다운로드',
      standardVersion: '표준 버전',
      apkTip: 'APK 직접 설치로 전체 기능, 마이닝, 보상 이용 가능',
      hot: '인기',
    },
    trust: {
      poweredBy: '기술 제공',
      secureNode: '보안 노드 기술',
      ddosProtected: 'DDoS 보호',
    },
    metadata: {
      title: 'AI 마이닝 — 분산형 AI 컴퓨팅 파워 | Voicica',
      description:
        '스마트폰을 AI 컴퓨팅 노드로 전환하고 매일 보상을 받으세요. Voicica Pro를 다운로드하여 분산형 AI 파워 네트워크에 참여하세요.',
      keywords: [
        'AI 마이닝',
        '분산형 AI',
        '컴퓨팅 노드',
        '암호화폐',
        'Voicica Pro',
        'AI 파워 네트워크',
        '모바일 마이닝',
      ],
    },
  },
  th: {
    hero: {
      title: 'พลัง AI แบบกระจายศูนย์',
      subtitle: 'เปลี่ยนมือถือของคุณเป็นโหนดประมวลผล AI และรับรายได้ทุกวัน',
    },
    steps: [
      { title: 'ดาวน์โหลดและติดตั้ง' },
      { title: 'เปิดใช้งานโหนด' },
      { title: 'ถอนรางวัล' },
    ],
    download: {
      apk: 'ดาวน์โหลด Voicica Pro APK',
      unlockFeatures: 'ปลดล็อคฟีเจอร์ทั้งหมด + ผลตอบแทนสูง',
      googlePlay: 'ดาวน์โหลดบน Google Play',
      standardVersion: 'เวอร์ชันมาตรฐาน',
      apkTip: 'APK โดยตรงให้การเข้าถึงเต็มรูปแบบ การขุด และรางวัล',
      hot: 'มาแรง',
    },
    trust: {
      poweredBy: 'ขับเคลื่อนโดย',
      secureNode: 'เทคโนโลยีโหนดปลอดภัย',
      ddosProtected: 'ป้องกัน DDoS',
    },
    metadata: {
      title: 'AI Mining — พลัง AI แบบกระจายศูนย์ | Voicica',
      description:
        'เปลี่ยนมือถือเป็นโหนดประมวลผล AI และรับรายได้ทุกวัน ดาวน์โหลด Voicica Pro เพื่อเข้าร่วมเครือข่าย AI แบบกระจายศูนย์',
      keywords: [
        'AI mining',
        'AI แบบกระจายศูนย์',
        'โหนดประมวลผล',
        'คริปโต',
        'Voicica Pro',
        'เครือข่าย AI',
        'ขุดมือถือ',
      ],
    },
  },
  es: {
    hero: {
      title: 'Poder de IA Descentralizado',
      subtitle: 'Convierte tu móvil en un nodo de computación IA y gana a diario',
    },
    steps: [
      { title: 'Descargar e Instalar' },
      { title: 'Activar Nodo' },
      { title: 'Retirar Recompensas' },
    ],
    download: {
      apk: 'Descargar Voicica Pro APK',
      unlockFeatures: 'Desbloquea todas las funciones + Alto rendimiento',
      googlePlay: 'Disponible en Google Play',
      standardVersion: 'Versión estándar',
      apkTip: 'El APK directo ofrece acceso completo, minería y recompensas',
      hot: 'POPULAR',
    },
    trust: {
      poweredBy: 'Desarrollado por',
      secureNode: 'Tecnología de Nodo Seguro',
      ddosProtected: 'Protección DDoS',
    },
    metadata: {
      title: 'AI Mining — Poder de Computación IA Descentralizado | Voicica',
      description:
        'Convierte tu móvil en un nodo de computación IA y gana recompensas diarias. Descarga Voicica Pro para unirte a la red de poder IA descentralizado.',
      keywords: [
        'AI mining',
        'IA descentralizada',
        'nodo de computación',
        'ganar cripto',
        'Voicica Pro',
        'red de poder IA',
        'minería móvil',
      ],
    },
  },
};
