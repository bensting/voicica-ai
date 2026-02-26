'use server';

/**
 * 分享链接 Server Actions
 * 支持生成和访问带有效期的分享链接
 */
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/db';
import { shareLinks, musicRecords, dialogueRecords } from '@/db/schema';
import { eq, and, gt, desc, sql } from 'drizzle-orm';
import { getUserOrAnonymous } from '@/lib/auth-firebase';

// 分享链接有效期（30天）
const SHARE_LINK_EXPIRY_DAYS = 30;

// 支持的资源类型
export type ShareResourceType = 'music' | 'dialogue' | 'tts' | 'cover' | 'video' | 'image';

/**
 * 创建分享链接
 * 如果同一资源已有未过期的分享链接，返回已有的
 */
export async function createShareLink(
  resourceType: ShareResourceType,
  resourceId: string
): Promise<{ token: string; url: string; expiresAt: Date }> {
  const db = await getDb();
  const { user_id: userId } = await getUserOrAnonymous();

  // 检查是否已有未过期的分享链接
  const [existingLink] = await db
    .select()
    .from(shareLinks)
    .where(
      and(
        eq(shareLinks.resourceType, resourceType),
        eq(shareLinks.resourceId, resourceId),
        eq(shareLinks.userId, userId),
        gt(shareLinks.expiresAt, new Date().toISOString())
      )
    )
    .limit(1);

  if (existingLink) {
    // 每次分享都延长有效期
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + SHARE_LINK_EXPIRY_DAYS);

    await db
      .update(shareLinks)
      .set({ expiresAt: newExpiresAt.toISOString() })
      .where(eq(shareLinks.id, existingLink.id));

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

  await db.insert(shareLinks).values({
    token,
    resourceType: resourceType,
    resourceId: resourceId,
    userId,
    expiresAt: expiresAt.toISOString(),
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
  dialogue_json: string;
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
  const db = await getDb();
  // 查找分享链接
  const [shareLink] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.token, token))
    .limit(1);

  if (!shareLink) {
    return { type: 'music', data: null, expired: false, notFound: true };
  }

  // 检查是否过期
  if (new Date() > new Date(shareLink.expiresAt)) {
    return { type: shareLink.resourceType as ShareResourceType, data: null, expired: true, notFound: false };
  }

  // 增加查看次数
  await db
    .update(shareLinks)
    .set({ viewCount: sql`${shareLinks.viewCount} + 1` })
    .where(eq(shareLinks.id, shareLink.id));

  // 根据资源类型获取数据
  const resourceType = shareLink.resourceType as ShareResourceType;

  if (resourceType === 'music') {
    const [record] = await db
      .select({
        title: musicRecords.title,
        cover_url: musicRecords.coverUrl,
        audio_url: musicRecords.audioUrl,
        duration: musicRecords.duration,
        lyrics: musicRecords.lyrics,
        tags: musicRecords.tags,
        model: musicRecords.model,
        created_at: musicRecords.createdAt,
      })
      .from(musicRecords)
      .where(eq(musicRecords.taskId, shareLink.resourceId))
      .limit(1);

    return {
      type: 'music',
      data: record ? { ...record, created_at: new Date(record.created_at) } as SharedMusicData : null,
      expired: false,
      notFound: !record,
    };
  }

  if (resourceType === 'dialogue') {
    const [record] = await db
      .select({
        audio_url: dialogueRecords.audioUrl,
        duration: dialogueRecords.duration,
        total_characters: dialogueRecords.totalCharacters,
        dialogue_json: dialogueRecords.dialogueJson,
        created_at: dialogueRecords.createdAt,
      })
      .from(dialogueRecords)
      .where(eq(dialogueRecords.taskId, shareLink.resourceId))
      .limit(1);

    return {
      type: 'dialogue',
      data: record ? { ...record, created_at: new Date(record.created_at) } as SharedDialogueData : null,
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
  const db = await getDb();
  const { user_id: userId } = await getUserOrAnonymous();

  const links = await db
    .select({
      token: shareLinks.token,
      resource_type: shareLinks.resourceType,
      resource_id: shareLinks.resourceId,
      view_count: shareLinks.viewCount,
      expires_at: shareLinks.expiresAt,
      created_at: shareLinks.createdAt,
    })
    .from(shareLinks)
    .where(eq(shareLinks.userId, userId))
    .orderBy(desc(shareLinks.createdAt))
    .limit(limit);

  return links.map((link) => ({
    ...link,
    expires_at: new Date(link.expires_at),
    created_at: new Date(link.created_at),
  }));
}

/**
 * 删除分享链接
 */
export async function deleteShareLink(token: string): Promise<boolean> {
  const db = await getDb();
  const { user_id: userId } = await getUserOrAnonymous();

  const [link] = await db
    .select()
    .from(shareLinks)
    .where(and(eq(shareLinks.token, token), eq(shareLinks.userId, userId)))
    .limit(1);

  if (!link) {
    return false;
  }

  await db.delete(shareLinks).where(eq(shareLinks.id, link.id));

  return true;
}
