import Link from 'next/link';
import { HOMEPAGE_CONTENT } from '@/config/seo/homepage';
import SeoAppBadges from './SeoAppBadges';

const CTA_LABELS: Record<string, { title: string; button: string }> = {
  en: { title: 'Start Creating with AI Now', button: 'Try Voicica AI Free' },
  ja: { title: '今すぐAIで作成を始めよう', button: 'Voicica AIを無料で試す' },
  'zh-Hant': { title: '立即開始用AI創作', button: '免費試用 Voicica AI' },
  ko: { title: '지금 AI로 만들기 시작', button: 'Voicica AI 무료 체험' },
  th: { title: 'เริ่มสร้างด้วย AI เลย', button: 'ลอง Voicica AI ฟรี' },
};

interface HomepageContentProps {
  locale: string;
}

export default function HomepageContent({ locale }: HomepageContentProps) {
  const content = HOMEPAGE_CONTENT[locale] || HOMEPAGE_CONTENT.en;

  return (
    <section className="bg-gray-950 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-5xl space-y-12 text-gray-300">
        <h1 className="text-center text-3xl font-bold text-white md:text-4xl">
          {content.h1}
        </h1>

        <div className="grid gap-10 md:grid-cols-2">
          {content.features.map((feature) => (
            <div key={feature.title}>
              <h2 className="mb-2 text-xl font-semibold text-white">
                {feature.title}
              </h2>
              <p className="text-sm leading-relaxed text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA + Download */}
        <div className="pt-4 text-center">
          <h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">
            {(CTA_LABELS[locale] || CTA_LABELS.en).title}
          </h2>
          <Link
            href="/native"
            className="inline-block rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {(CTA_LABELS[locale] || CTA_LABELS.en).button}
          </Link>
          <SeoAppBadges />
        </div>
      </div>
    </section>
  );
}
