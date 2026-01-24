import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSharedContent } from '@/actions/share';
import SharedMusicPlayer from '@/components/share/SharedMusicPlayer';
import SharedExpired from '@/components/share/SharedExpired';

interface PageProps {
  params: Promise<{ token: string }>;
}

// 动态生成 metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const { type, data, expired, notFound: isNotFound } = await getSharedContent(token);

  if (isNotFound || expired || !data) {
    return {
      title: 'Shared Content - Voicica AI',
    };
  }

  if (type === 'music' && 'title' in data) {
    return {
      title: `${data.title || 'AI Music'} - Voicica AI`,
      description: data.lyrics ? data.lyrics.slice(0, 160) : 'AI generated music on Voicica AI',
      openGraph: {
        title: `${data.title || 'AI Music'} - Voicica AI`,
        description: data.lyrics ? data.lyrics.slice(0, 160) : 'AI generated music on Voicica AI',
        images: data.cover_url ? [data.cover_url] : [],
        type: 'music.song',
      },
    };
  }

  return {
    title: 'Shared Content - Voicica AI',
  };
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params;
  const { type, data, expired, notFound: isNotFound } = await getSharedContent(token);

  // 404
  if (isNotFound) {
    notFound();
  }

  // 已过期
  if (expired) {
    return <SharedExpired />;
  }

  // 根据类型渲染不同的播放器
  if (type === 'music' && data && 'title' in data) {
    return <SharedMusicPlayer music={data} />;
  }

  // TODO: 支持更多类型
  notFound();
}
