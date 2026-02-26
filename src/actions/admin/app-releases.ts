'use server';

/**
 * App Releases 管理 Server Actions
 * 管理 Android APK 和 iOS 应用版本发布
 */
import { getDb } from '@/lib/db';
import { appReleases } from '@/db/schema';
import { eq, and, asc, desc, sql } from 'drizzle-orm';
import { uploadApk, deleteApk, generateApkUploadUrl } from '@/lib/services/r2-storage';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

export interface AppRelease {
  id: number;
  platform: string;
  version: string;
  versionCode: number;
  downloadUrl: string;
  fileSize: number | null;
  releaseNotes: string | null;
  isLatest: boolean;
  isForceUpdate: boolean;
  isActive: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string | null;
}

interface ActionResult {
  success: boolean;
  message: string;
}

/**
 * 获取所有应用版本列表
 */
export async function getAppReleases(params?: {
  platform?: string;
  isActive?: boolean;
}): Promise<AppRelease[]> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  const conditions = [];
  if (params?.platform) conditions.push(eq(appReleases.platform, params.platform));
  if (params?.isActive !== undefined) conditions.push(eq(appReleases.isActive, params.isActive));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const releases = await db.select().from(appReleases)
    .where(whereClause)
    .orderBy(asc(appReleases.platform), desc(appReleases.versionCode));

  return releases;
}

/**
 * 获取最新版本（公开接口，用于前台获取下载链接）
 */
export async function getLatestRelease(platform: string): Promise<{
  version: string;
  versionCode: number;
  downloadUrl: string;
  releaseNotes: string | null;
  isForceUpdate: boolean;
} | null> {
  const db = await getDb();
  const [release] = await db.select({
    version: appReleases.version,
    versionCode: appReleases.versionCode,
    downloadUrl: appReleases.downloadUrl,
    releaseNotes: appReleases.releaseNotes,
    isForceUpdate: appReleases.isForceUpdate,
  }).from(appReleases)
    .where(and(
      eq(appReleases.platform, platform),
      eq(appReleases.isLatest, true),
      eq(appReleases.isActive, true),
    ))
    .limit(1);

  return release || null;
}

/**
 * 检查应用更新（公开接口，供 App 调用）
 *
 * @param platform 平台 (android/ios)
 * @param currentVersionCode 当前 App 的 version_code
 * @returns 更新信息，如果不需要更新则返回 null
 */
export async function checkAppUpdate(
  platform: string,
  currentVersionCode: number
): Promise<{
  hasUpdate: boolean;
  isForceUpdate: boolean;
  latestVersion: string;
  latestVersionCode: number;
  downloadUrl: string;
  releaseNotes: string | null;
} | null> {
  const db = await getDb();
  try {
    const [latest] = await db.select({
      version: appReleases.version,
      versionCode: appReleases.versionCode,
      downloadUrl: appReleases.downloadUrl,
      releaseNotes: appReleases.releaseNotes,
      isForceUpdate: appReleases.isForceUpdate,
    }).from(appReleases)
      .where(and(
        eq(appReleases.platform, platform),
        eq(appReleases.isLatest, true),
        eq(appReleases.isActive, true),
      ))
      .limit(1);

    if (!latest) {
      return null;
    }

    const hasUpdate = latest.versionCode > currentVersionCode;

    return {
      hasUpdate,
      isForceUpdate: hasUpdate && latest.isForceUpdate,
      latestVersion: latest.version,
      latestVersionCode: latest.versionCode,
      downloadUrl: latest.downloadUrl,
      releaseNotes: latest.releaseNotes,
    };
  } catch (error) {
    console.error('检查更新失败:', error);
    return null;
  }
}

/**
 * 上传新版本 APK
 */
export async function uploadAppRelease(formData: FormData): Promise<ActionResult & { release?: AppRelease }> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const file = formData.get('file') as File;
    const platform = formData.get('platform') as string;
    const version = formData.get('version') as string;
    const versionCode = parseInt(formData.get('version_code') as string, 10);
    const releaseNotes = formData.get('release_notes') as string | null;
    const isForceUpdate = formData.get('is_force_update') === 'true';
    const setAsLatest = formData.get('set_as_latest') === 'true';

    if (!file || !platform || !version || !versionCode) {
      return { success: false, message: '缺少必要参数' };
    }

    // 检查版本是否已存在
    const [existing] = await db.select().from(appReleases)
      .where(and(eq(appReleases.platform, platform), eq(appReleases.version, version)))
      .limit(1);

    if (existing) {
      return { success: false, message: `版本 ${version} 已存在` };
    }

    // 上传文件到 R2
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `voicica-v${version}-${versionCode}.apk`;
    const downloadUrl = await uploadApk(buffer, fileName);

    // 如果设为最新版本，先将其他版本的 is_latest 设为 false
    if (setAsLatest) {
      await db.update(appReleases).set({ isLatest: false })
        .where(and(eq(appReleases.platform, platform), eq(appReleases.isLatest, true)));
    }

    // 创建数据库记录
    const [release] = await db.insert(appReleases).values({
      platform,
      version,
      versionCode,
      downloadUrl,
      fileSize: buffer.length,
      releaseNotes: releaseNotes || null,
      isLatest: setAsLatest,
      isForceUpdate,
      isActive: true,
      downloadCount: 0,
    }).returning();

    console.log(`✅ APK 上传成功: ${platform} v${version}`);

    return {
      success: true,
      message: `版本 ${version} 上传成功`,
      release,
    };
  } catch (error) {
    console.error('上传 APK 失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '上传失败',
    };
  }
}

/**
 * 更新版本信息
 */
export async function updateAppRelease(
  id: number,
  data: {
    release_notes?: string;
    is_force_update?: boolean;
    is_active?: boolean;
  }
): Promise<ActionResult> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    await db.update(appReleases).set({
      ...(data.release_notes !== undefined && { releaseNotes: data.release_notes }),
      ...(data.is_force_update !== undefined && { isForceUpdate: data.is_force_update }),
      ...(data.is_active !== undefined && { isActive: data.is_active }),
    }).where(eq(appReleases.id, id));

    return { success: true, message: '更新成功' };
  } catch (error) {
    console.error('更新版本失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败',
    };
  }
}

/**
 * 设置为最新版本
 */
export async function setLatestRelease(id: number): Promise<ActionResult> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    // 获取当前版本信息
    const [release] = await db.select().from(appReleases).where(eq(appReleases.id, id)).limit(1);

    if (!release) {
      return { success: false, message: '版本不存在' };
    }

    // 将同平台的其他版本设为非最新
    await db.update(appReleases).set({ isLatest: false })
      .where(and(eq(appReleases.platform, release.platform), eq(appReleases.isLatest, true)));

    // 设置当前版本为最新
    await db.update(appReleases).set({ isLatest: true }).where(eq(appReleases.id, id));

    return { success: true, message: `已设置 v${release.version} 为最新版本` };
  } catch (error) {
    console.error('设置最新版本失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '设置失败',
    };
  }
}

/**
 * 删除版本
 */
export async function deleteAppRelease(id: number): Promise<ActionResult> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const [release] = await db.select().from(appReleases).where(eq(appReleases.id, id)).limit(1);

    if (!release) {
      return { success: false, message: '版本不存在' };
    }

    // 从 R2 删除文件
    const key = release.downloadUrl.split('/').slice(-2).join('/'); // app_releases/filename.apk
    await deleteApk(key);

    // 删除数据库记录
    await db.delete(appReleases).where(eq(appReleases.id, id));

    console.log(`✅ APK 删除成功: ${release.platform} v${release.version}`);

    return { success: true, message: `版本 ${release.version} 已删除` };
  } catch (error) {
    console.error('删除版本失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}

/**
 * 增加下载计数（公开接口）
 */
export async function incrementDownloadCount(id: number): Promise<void> {
  const db = await getDb();
  try {
    await db.update(appReleases).set({
      downloadCount: sql`${appReleases.downloadCount} + 1`,
    }).where(eq(appReleases.id, id));
  } catch (error) {
    console.error('增加下载计数失败:', error);
  }
}

/**
 * 通过平台和版本增加下载计数（公开接口）
 */
export async function incrementDownloadCountByVersion(
  platform: string,
  version: string
): Promise<void> {
  const db = await getDb();
  try {
    await db.update(appReleases).set({
      downloadCount: sql`${appReleases.downloadCount} + 1`,
    }).where(and(eq(appReleases.platform, platform), eq(appReleases.version, version)));
  } catch (error) {
    console.error('增加下载计数失败:', error);
  }
}

// ==================== 预签名 URL 上传相关 ====================

/**
 * 获取 APK 上传预签名 URL
 * 用于绕过 Vercel Server Action 4.5MB 限制
 */
export async function getApkUploadUrl(params: {
  platform: string;
  version: string;
  versionCode: number;
}): Promise<
  ActionResult & {
    uploadUrl?: string;
    publicUrl?: string;
    key?: string;
  }
> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const { platform, version, versionCode } = params;

    if (!platform || !version || !versionCode) {
      return { success: false, message: '缺少必要参数' };
    }

    // 检查版本是否已存在
    const [existing] = await db.select().from(appReleases)
      .where(and(eq(appReleases.platform, platform), eq(appReleases.version, version)))
      .limit(1);

    if (existing) {
      return { success: false, message: `版本 ${version} 已存在` };
    }

    // 生成预签名 URL
    const fileName = `voicica-v${version}-${versionCode}.apk`;
    const { uploadUrl, publicUrl, key } = await generateApkUploadUrl(fileName);

    return {
      success: true,
      message: '预签名 URL 生成成功',
      uploadUrl,
      publicUrl,
      key,
    };
  } catch (error) {
    console.error('生成预签名 URL 失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '生成预签名 URL 失败',
    };
  }
}

/**
 * 保存 APK 版本信息（在客户端直传 R2 成功后调用）
 */
export async function saveAppReleaseMetadata(params: {
  platform: string;
  version: string;
  versionCode: number;
  downloadUrl: string;
  fileSize: number;
  releaseNotes?: string;
  isForceUpdate?: boolean;
  setAsLatest?: boolean;
}): Promise<ActionResult & { release?: AppRelease }> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const {
      platform,
      version,
      versionCode,
      downloadUrl,
      fileSize,
      releaseNotes,
      isForceUpdate = false,
      setAsLatest = true,
    } = params;

    // 再次检查版本是否已存在（防止并发问题）
    const [existing] = await db.select().from(appReleases)
      .where(and(eq(appReleases.platform, platform), eq(appReleases.version, version)))
      .limit(1);

    if (existing) {
      return { success: false, message: `版本 ${version} 已存在` };
    }

    // 如果设为最新版本，先将其他版本的 is_latest 设为 false
    if (setAsLatest) {
      await db.update(appReleases).set({ isLatest: false })
        .where(and(eq(appReleases.platform, platform), eq(appReleases.isLatest, true)));
    }

    // 创建数据库记录
    const [release] = await db.insert(appReleases).values({
      platform,
      version,
      versionCode,
      downloadUrl,
      fileSize,
      releaseNotes: releaseNotes || null,
      isLatest: setAsLatest,
      isForceUpdate,
      isActive: true,
      downloadCount: 0,
    }).returning();

    console.log(`✅ APK 元数据保存成功: ${platform} v${version}`);

    return {
      success: true,
      message: `版本 ${version} 发布成功`,
      release,
    };
  } catch (error) {
    console.error('保存 APK 元数据失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '保存失败',
    };
  }
}
