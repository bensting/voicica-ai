'use server';

/**
 * 分享链接 Server Actions
 * 支持生成和访问带有效期的分享链接
 */
import { nanoid } from 'nanoid';
import prisma from '@/lib/prisma';
import { getUserOrAnonymous } from '@/lib/auth-firebase';

// 分享链接有效期（30天）
const SHARE_LINK_EXPIRY_DAYS = 30;

// 支持的资源类型
export type ShareResourceType = 'music' | 'dialogue' | 'tts' | 'cover' | 'video';

/**
 * 创建分享链接
 * 如果同一资源已有未过期的分享链接，返回已有的
 */
export async function createShareLink(
  resourceType: ShareResourceType,
  resourceId: string
): Promise<{ token: string; url: string; expiresAt: Date }> {
  const { user_id: userId } = await getUserOrAnonymous();

  // 检查是否已有未过期的分享链接
  const existingLink = await prisma.share_links.findFirst({
    where: {
      resource_type: resourceType,
      resource_id: resourceId,
      user_id: userId,
      expires_at: { gt: new Date() },
    },
  });

  if (existingLink) {
    // 每次分享都延长有效期
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + SHARE_LINK_EXPIRY_DAYS);

    await prisma.share_links.update({
      where: { id: existingLink.id },
      data: { expires_at: newExpiresAt },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voicica.ai';
    return {
      token: existingLink.token,
      url: `${baseUrl}/s/${existingLink.token}`,
      expiresAt: newExpiresAt,
    };
  }

  // 生成新的分享链接
  const token = nanoid(12); // 12位短token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SHARE_LINK_EXPIRY_DAYS);

  await prisma.share_links.create({
    data: {
      token,
      resource_type: resourceType,
      resource_id: resourceId,
      user_id: userId,
      expires_at: expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voicica.ai';
  return {
    token,
    url: `${baseUrl}/s/${token}`,
    expiresAt,
  };
}

/**
 * 分享的音乐数据
 */
export interface SharedMusicData {
  title: string | null;
  cover_url: string | null;
  audio_url: string | null;
  duration: number | null;
  lyrics: string | null;
  tags: string | null;
  model: string | null;
  created_at: Date;
}

/**
 * 分享的对话数据
 */
export interface SharedDialogueData {
  audio_url: string | null;
  duration: number | null;
  total_characters: number;
  created_at: Date;
}

/**
 * 获取分享内容
 */
export async function getSharedContent(token: string): Promise<{
  type: ShareResourceType;
  data: SharedMusicData | SharedDialogueData | null;
  expired: boolean;
  notFound: boolean;
}> {
  // 查找分享链接
  const shareLink = await prisma.share_links.findUnique({
    where: { token },
  });

  if (!shareLink) {
    return { type: 'music', data: null, expired: false, notFound: true };
  }

  // 检查是否过期
  if (new Date() > shareLink.expires_at) {
    return { type: shareLink.resource_type as ShareResourceType, data: null, expired: true, notFound: false };
  }

  // 增加查看次数
  await prisma.share_links.update({
    where: { id: shareLink.id },
    data: { view_count: { increment: 1 } },
  });

  // 根据资源类型获取数据
  const resourceType = shareLink.resource_type as ShareResourceType;

  if (resourceType === 'music') {
    const record = await prisma.music_records.findUnique({
      where: { task_id: shareLink.resource_id },
      select: {
        title: true,
        cover_url: true,
        audio_url: true,
        duration: true,
        lyrics: true,
        tags: true,
        model: true,
        created_at: true,
      },
    });

    return {
      type: 'music',
      data: record as SharedMusicData | null,
      expired: false,
      notFound: !record,
    };
  }

  if (resourceType === 'dialogue') {
    const record = await prisma.dialogue_records.findUnique({
      where: { task_id: shareLink.resource_id },
      select: {
        audio_url: true,
        duration: true,
        total_characters: true,
        created_at: true,
      },
    });

    return {
      type: 'dialogue',
      data: record as SharedDialogueData | null,
      expired: false,
      notFound: !record,
    };
  }

  // TODO: 支持更多资源类型
  return { type: resourceType, data: null, expired: false, notFound: true };
}

/**
 * 获取用户的分享链接列表
 */
export async function getUserShareLinks(limit: number = 50): Promise<Array<{
  token: string;
  resource_type: string;
  resource_id: string;
  view_count: number;
  expires_at: Date;
  created_at: Date;
}>> {
  const { user_id: userId } = await getUserOrAnonymous();

  const links = await prisma.share_links.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: limit,
    select: {
      token: true,
      resource_type: true,
      resource_id: true,
      view_count: true,
      expires_at: true,
      created_at: true,
    },
  });

  return links;
}

/**
 * 删除分享链接
 */
export async function deleteShareLink(token: string): Promise<boolean> {
  const { user_id: userId } = await getUserOrAnonymous();

  const link = await prisma.share_links.findFirst({
    where: { token, user_id: userId },
  });

  if (!link) {
    return false;
  }

  await prisma.share_links.delete({
    where: { id: link.id },
  });

  return true;
}
