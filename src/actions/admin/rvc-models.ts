'use server';

/**
 * RVC Voice Models 管理 Server Actions
 * 管理 AI Cover 功能的声音模型
 */
import prisma from '@/lib/prisma';
import { generateRvcModelUploadUrl, generateRvcModelZipUploadUrl, generateImageUploadUrl, deleteRvcModelFile } from '@/lib/services/r2-storage';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

export interface RvcVoiceModel {
  id: number;
  name: string;
  slug: string;
  category: string;
  avatar_url: string | null;
  sample_url: string | null;
  model_url: string;
  index_url: string | null;
  uses_count: number;
  is_builtin: boolean;
  builtin_name: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date | null;
}

interface ActionResult {
  success: boolean;
  message: string;
}

// 内置模型名称（RVC-v2 API 支持的）
const _BUILTIN_MODEL_NAMES = ['Obama', 'Trump', 'Sandy', 'Rogan'];

/**
 * 获取所有 RVC 声音模型列表
 */
export async function getRvcVoiceModels(params?: {
  category?: string;
  isActive?: boolean;
}): Promise<RvcVoiceModel[]> {
  await verifyAdminWithoutDb();

  const where: { category?: string; is_active?: boolean } = {};
  if (params?.category) where.category = params.category;
  if (params?.isActive !== undefined) where.is_active = params.isActive;

  const models = await prisma.rvc_voice_models.findMany({
    where,
    orderBy: [{ sort_order: 'asc' }, { uses_count: 'desc' }],
  });

  return models;
}

/**
 * 获取单个 RVC 声音模型
 */
export async function getRvcVoiceModel(id: number): Promise<RvcVoiceModel | null> {
  await verifyAdminWithoutDb();

  const model = await prisma.rvc_voice_models.findUnique({
    where: { id },
  });

  return model;
}

/**
 * 生成模型 ZIP 文件上传 URL
 * RVC-v2 API 要求模型以 ZIP 格式上传（包含 .pth 和可选的 .index 文件）
 */
export async function getRvcModelZipUploadUrl(params: {
  slug: string;
}): Promise<ActionResult & { uploadUrl?: string; publicUrl?: string; key?: string }> {
  await verifyAdminWithoutDb();

  try {
    const { slug } = params;

    if (!slug) {
      return { success: false, message: '缺少 slug 参数' };
    }

    const fileName = `${slug}.zip`;

    const { uploadUrl, publicUrl, key } = await generateRvcModelZipUploadUrl(fileName);

    return {
      success: true,
      message: '预签名 URL 生成成功',
      uploadUrl,
      publicUrl,
      key,
    };
  } catch (error) {
    console.error('生成 ZIP 预签名 URL 失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '生成预签名 URL 失败',
    };
  }
}

/**
 * 生成模型文件上传 URL
 * @deprecated 请使用 getRvcModelZipUploadUrl，RVC-v2 要求 ZIP 格式
 */
export async function getRvcModelUploadUrl(params: {
  slug: string;
  fileType: 'pth' | 'index';
}): Promise<ActionResult & { uploadUrl?: string; publicUrl?: string; key?: string }> {
  await verifyAdminWithoutDb();

  try {
    const { slug, fileType } = params;

    if (!slug) {
      return { success: false, message: '缺少 slug 参数' };
    }

    const ext = fileType === 'pth' ? 'pth' : 'index';
    const fileName = `${slug}.${ext}`;

    const { uploadUrl, publicUrl, key } = await generateRvcModelUploadUrl(fileName, fileType);

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
 * 生成头像上传 URL
 */
export async function getRvcAvatarUploadUrl(params: {
  slug: string;
}): Promise<ActionResult & { uploadUrl?: string; publicUrl?: string; key?: string }> {
  await verifyAdminWithoutDb();

  try {
    const { slug } = params;

    if (!slug) {
      return { success: false, message: '缺少 slug 参数' };
    }

    const fileName = `${slug}-${Date.now()}.jpg`;

    const { uploadUrl, publicUrl, key } = await generateImageUploadUrl(
      fileName,
      'image/jpeg',
      'rvc_avatars'
    );

    return {
      success: true,
      message: '预签名 URL 生成成功',
      uploadUrl,
      publicUrl,
      key,
    };
  } catch (error) {
    console.error('生成头像预签名 URL 失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '生成预签名 URL 失败',
    };
  }
}

/**
 * 创建 RVC 声音模型
 */
export async function createRvcVoiceModel(data: {
  name: string;
  slug: string;
  category: string;
  model_url: string;
  index_url?: string;
  avatar_url?: string;
  sample_url?: string;
  is_builtin?: boolean;
  builtin_name?: string;
  sort_order?: number;
}): Promise<ActionResult & { model?: RvcVoiceModel }> {
  await verifyAdminWithoutDb();

  try {
    // 检查 slug 是否已存在
    const existing = await prisma.rvc_voice_models.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return { success: false, message: `Slug "${data.slug}" 已存在` };
    }

    const model = await prisma.rvc_voice_models.create({
      data: {
        name: data.name,
        slug: data.slug,
        category: data.category,
        model_url: data.model_url,
        index_url: data.index_url || null,
        avatar_url: data.avatar_url || null,
        sample_url: data.sample_url || null,
        is_builtin: data.is_builtin || false,
        builtin_name: data.builtin_name || null,
        is_active: true,
        sort_order: data.sort_order || 0,
        uses_count: 0,
      },
    });

    console.log(`✅ RVC 模型创建成功: ${data.name}`);

    return {
      success: true,
      message: `模型 "${data.name}" 创建成功`,
      model,
    };
  } catch (error) {
    console.error('创建 RVC 模型失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '创建失败',
    };
  }
}

/**
 * 更新 RVC 声音模型
 */
export async function updateRvcVoiceModel(
  id: number,
  data: {
    name?: string;
    category?: string;
    model_url?: string;
    index_url?: string | null;
    avatar_url?: string | null;
    sample_url?: string | null;
    is_builtin?: boolean;
    builtin_name?: string | null;
    is_active?: boolean;
    sort_order?: number;
  }
): Promise<ActionResult> {
  await verifyAdminWithoutDb();

  try {
    await prisma.rvc_voice_models.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.model_url !== undefined && { model_url: data.model_url }),
        ...(data.index_url !== undefined && { index_url: data.index_url }),
        ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url }),
        ...(data.sample_url !== undefined && { sample_url: data.sample_url }),
        ...(data.is_builtin !== undefined && { is_builtin: data.is_builtin }),
        ...(data.builtin_name !== undefined && { builtin_name: data.builtin_name }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
        ...(data.sort_order !== undefined && { sort_order: data.sort_order }),
      },
    });

    return { success: true, message: '更新成功' };
  } catch (error) {
    console.error('更新 RVC 模型失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败',
    };
  }
}

/**
 * 删除 RVC 声音模型
 */
export async function deleteRvcVoiceModel(id: number): Promise<ActionResult> {
  await verifyAdminWithoutDb();

  try {
    const model = await prisma.rvc_voice_models.findUnique({
      where: { id },
    });

    if (!model) {
      return { success: false, message: '模型不存在' };
    }

    // 删除 R2 中的文件（如果是自定义模型）
    if (!model.is_builtin) {
      try {
        // 从 URL 提取 key
        const modelKey = model.model_url.split('/').slice(-2).join('/');
        await deleteRvcModelFile(modelKey);

        if (model.index_url) {
          const indexKey = model.index_url.split('/').slice(-2).join('/');
          await deleteRvcModelFile(indexKey);
        }
      } catch (e) {
        console.warn('删除 R2 文件失败（可能文件不存在）:', e);
      }
    }

    // 删除数据库记录
    await prisma.rvc_voice_models.delete({
      where: { id },
    });

    console.log(`✅ RVC 模型删除成功: ${model.name}`);

    return { success: true, message: `模型 "${model.name}" 已删除` };
  } catch (error) {
    console.error('删除 RVC 模型失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}

/**
 * 切换模型启用/禁用状态
 */
export async function toggleRvcVoiceModelActive(id: number): Promise<ActionResult> {
  await verifyAdminWithoutDb();

  try {
    const model = await prisma.rvc_voice_models.findUnique({
      where: { id },
    });

    if (!model) {
      return { success: false, message: '模型不存在' };
    }

    await prisma.rvc_voice_models.update({
      where: { id },
      data: { is_active: !model.is_active },
    });

    return {
      success: true,
      message: model.is_active ? '已禁用' : '已启用',
    };
  } catch (error) {
    console.error('切换状态失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '操作失败',
    };
  }
}

/**
 * 批量创建内置模型
 */
export async function createBuiltinModels(): Promise<ActionResult> {
  await verifyAdminWithoutDb();

  try {
    const builtinModels = [
      { name: 'Obama', slug: 'obama', builtin_name: 'Obama', category: 'celebrity' },
      { name: 'Trump', slug: 'trump', builtin_name: 'Trump', category: 'celebrity' },
      { name: 'Sandy', slug: 'sandy', builtin_name: 'Sandy', category: 'cartoon' },
      { name: 'Rogan', slug: 'rogan', builtin_name: 'Rogan', category: 'celebrity' },
    ];

    let created = 0;
    for (const model of builtinModels) {
      const existing = await prisma.rvc_voice_models.findUnique({
        where: { slug: model.slug },
      });

      if (!existing) {
        await prisma.rvc_voice_models.create({
          data: {
            name: model.name,
            slug: model.slug,
            category: model.category,
            model_url: '', // 内置模型不需要 URL
            is_builtin: true,
            builtin_name: model.builtin_name,
            is_active: true,
            sort_order: 0,
            uses_count: 0,
          },
        });
        created++;
      }
    }

    return {
      success: true,
      message: `成功创建 ${created} 个内置模型`,
    };
  } catch (error) {
    console.error('创建内置模型失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '创建失败',
    };
  }
}
