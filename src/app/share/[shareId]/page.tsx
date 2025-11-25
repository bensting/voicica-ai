import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getSharedTtsRecord } from '@/actions/tts';
import SharePageClient from './SharePageClient';

interface SharePageProps {
  params: Promise<{
    shareId: string;
  }>;
}

/**
 * 生成页面元数据（用于 SEO 和社交分享）
 */
export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { shareId } = await params;
  const record = await getSharedTtsRecord(shareId);

  if (!record) {
    return {
      title: 'Content Not Found - AI Voice Labs',
    };
  }

  const textPreview = record.text.length > 100
    ? record.text.substring(0, 100) + '...'
    : record.text;

  return {
    title: `AI Voice - ${textPreview}`,
    description: `Listen to AI-generated voice: "${textPreview}"`,
    openGraph: {
      title: `AI Voice - ${textPreview}`,
      description: `Listen to AI-generated voice: "${textPreview}"`,
      type: 'website',
    },
  };
}

/**
 * 公开分享页面
 *
 * 用于展示用户分享的 TTS 生成内容
 * 包含文本和语音播放器
 */
export default async function SharePage({ params }: SharePageProps) {
  const { shareId } = await params;

  // 获取分享记录
  const record = await getSharedTtsRecord(shareId);

  // 记录不存在或不可访问
  if (!record) {
    notFound();
  }

  return <SharePageClient record={record} />;
}