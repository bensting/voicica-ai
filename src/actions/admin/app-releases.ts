'use server';

/**
 * App Releases 管理 Server Actions
 * 管理 Android APK 和 iOS 应用版本发布
 */
import prisma from '@/lib/prisma';
import { uploadApk, deleteApk } from '@/lib/services/r2-storage';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

export interface AppRelease {
  id: number;
  platform: string;
  version: string;
  version_code: number;
  download_url: string;
  file_size: bigint | null;
  release_notes: string | null;
  is_latest: boolean;
  is_force_update: boolean;
  is_active: boolean;
  download_count: number;
  created_at: Date;
  updated_at: Date | null;
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
  await verifyAdminWithoutDb();

  const where: { platform?: string; is_active?: boolean } = {};
  if (params?.platform) where.platform = params.platform;
  if (params?.isActive !== undefined) where.is_active = params.isActive;

  const releases = await prisma.app_releases.findMany({
    where,
    orderBy: [{ platform: 'asc' }, { version_code: 'desc' }],
  });

  return releases;
}

/**
 * 获取最新版本（公开接口，用于前台获取下载链接）
 */
export async function getLatestRelease(platform: string): Promise<{
  version: string;
  download_url: string;
  release_notes: string | null;
  is_force_update: boolean;
} | null> {
  const release = await prisma.app_releases.findFirst({
    where: {
      platform,
      is_latest: true,
      is_active: true,
    },
    select: {
      version: true,
      download_url: true,
      release_notes: true,
      is_force_update: true,
    },
  });

  return release;
}

/**
 * 上传新版本 APK
 */
export async function uploadAppRelease(formData: FormData): Promise<ActionResult & { release?: AppRelease }> {
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
    const existing = await prisma.app_releases.findUnique({
      where: {
        platform_version: { platform, version },
      },
    });

    if (existing) {
      return { success: false, message: `版本 ${version} 已存在` };
    }

    // 检查 version_code 是否唯一
    const existingCode = await prisma.app_releases.findFirst({
      where: { platform, version_code: versionCode },
    });

    if (existingCode) {
      return { success: false, message: `版本号 ${versionCode} 已被使用` };
    }

    // 上传文件到 R2
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${platform}-v${version}-${versionCode}.apk`;
    const downloadUrl = await uploadApk(buffer, fileName);

    // 如果设为最新版本，先将其他版本的 is_latest 设为 false
    if (setAsLatest) {
      await prisma.app_releases.updateMany({
        where: { platform, is_latest: true },
        data: { is_latest: false },
      });
    }

    // 创建数据库记录
    const release = await prisma.app_releases.create({
      data: {
        platform,
        version,
        version_code: versionCode,
        download_url: downloadUrl,
        file_size: BigInt(buffer.length),
        release_notes: releaseNotes || null,
        is_latest: setAsLatest,
        is_force_update: isForceUpdate,
        is_active: true,
        download_count: 0,
      },
    });

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
  await verifyAdminWithoutDb();

  try {
    await prisma.app_releases.update({
      where: { id },
      data: {
        ...(data.release_notes !== undefined && { release_notes: data.release_notes }),
        ...(data.is_force_update !== undefined && { is_force_update: data.is_force_update }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      },
    });

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
  await verifyAdminWithoutDb();

  try {
    // 获取当前版本信息
    const release = await prisma.app_releases.findUnique({
      where: { id },
    });

    if (!release) {
      return { success: false, message: '版本不存在' };
    }

    // 将同平台的其他版本设为非最新
    await prisma.app_releases.updateMany({
      where: { platform: release.platform, is_latest: true },
      data: { is_latest: false },
    });

    // 设置当前版本为最新
    await prisma.app_releases.update({
      where: { id },
      data: { is_latest: true },
    });

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
  await verifyAdminWithoutDb();

  try {
    const release = await prisma.app_releases.findUnique({
      where: { id },
    });

    if (!release) {
      return { success: false, message: '版本不存在' };
    }

    // 从 R2 删除文件
    const key = release.download_url.split('/').slice(-2).join('/'); // app_releases/filename.apk
    await deleteApk(key);

    // 删除数据库记录
    await prisma.app_releases.delete({
      where: { id },
    });

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
  try {
    await prisma.app_releases.update({
      where: { id },
      data: { download_count: { increment: 1 } },
    });
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
  try {
    await prisma.app_releases.updateMany({
      where: { platform, version },
      data: { download_count: { increment: 1 } },
    });
  } catch (error) {
    console.error('增加下载计数失败:', error);
  }
}