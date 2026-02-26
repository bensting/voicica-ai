'use server';

/**
 * RVC Voice Models 管理 Server Actions
 * 管理 AI Cover 功能的声音模型
 */
import { getDb } from '@/lib/db';
import { rvcVoiceModels } from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { generateRvcModelUploadUrl, generateRvcModelZipUploadUrl, generateImageUploadUrl, deleteRvcModelFile } from '@/lib/services/r2-storage';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

export interface RvcVoiceModel {
  id: number;
  name: string;
  slug: string;
  category: string;
  avatarUrl: string | null;
  sampleUrl: string | null;
  modelUrl: string;
  indexUrl: string | null;
  usesCount: number;
  isBuiltin: boolean;
  builtinName: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
}

interface ActionResult {
  success: boolean;
  message: string;
}

/**
 * 获取所有 RVC 声音模型列表
 */
export async function getRvcVoiceModels(params?: {
  category?: string;
  isActive?: boolean;
}): Promise<RvcVoiceModel[]> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  const conditions = [];
  if (params?.category) conditions.push(eq(rvcVoiceModels.category, params.category));
  if (params?.isActive !== undefined) conditions.push(eq(rvcVoiceModels.isActive, params.isActive));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const models = await db.select().from(rvcVoiceModels)
    .where(whereClause)
    .orderBy(asc(rvcVoiceModels.sortOrder), desc(rvcVoiceModels.usesCount));

  return models;
}

/**
 * 获取单个 RVC 声音模型
 */
export async function getRvcVoiceModel(id: number): Promise<RvcVoiceModel | null> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  const [model] = await db.select().from(rvcVoiceModels).where(eq(rvcVoiceModels.id, id)).limit(1);

  return model || null;
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
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    // 检查 slug 是否已存在
    const [existing] = await db.select().from(rvcVoiceModels).where(eq(rvcVoiceModels.slug, data.slug)).limit(1);

    if (existing) {
      return { success: false, message: `Slug "${data.slug}" 已存在` };
    }

    const [model] = await db.insert(rvcVoiceModels).values({
      name: data.name,
      slug: data.slug,
      category: data.category,
      modelUrl: data.model_url,
      indexUrl: data.index_url || null,
      avatarUrl: data.avatar_url || null,
      sampleUrl: data.sample_url || null,
      isBuiltin: data.is_builtin || false,
      builtinName: data.builtin_name || null,
      isActive: true,
      sortOrder: data.sort_order || 0,
      usesCount: 0,
    }).returning();

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
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    await db.update(rvcVoiceModels).set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.model_url !== undefined && { modelUrl: data.model_url }),
      ...(data.index_url !== undefined && { indexUrl: data.index_url }),
      ...(data.avatar_url !== undefined && { avatarUrl: data.avatar_url }),
      ...(data.sample_url !== undefined && { sampleUrl: data.sample_url }),
      ...(data.is_builtin !== undefined && { isBuiltin: data.is_builtin }),
      ...(data.builtin_name !== undefined && { builtinName: data.builtin_name }),
      ...(data.is_active !== undefined && { isActive: data.is_active }),
      ...(data.sort_order !== undefined && { sortOrder: data.sort_order }),
    }).where(eq(rvcVoiceModels.id, id));

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
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const [model] = await db.select().from(rvcVoiceModels).where(eq(rvcVoiceModels.id, id)).limit(1);

    if (!model) {
      return { success: false, message: '模型不存在' };
    }

    // 删除 R2 中的文件（如果是自定义模型）
    if (!model.isBuiltin) {
      try {
        // 从 URL 提取 key
        const modelKey = model.modelUrl.split('/').slice(-2).join('/');
        await deleteRvcModelFile(modelKey);

        if (model.indexUrl) {
          const indexKey = model.indexUrl.split('/').slice(-2).join('/');
          await deleteRvcModelFile(indexKey);
        }
      } catch (e) {
        console.warn('删除 R2 文件失败（可能文件不存在）:', e);
      }
    }

    // 删除数据库记录
    await db.delete(rvcVoiceModels).where(eq(rvcVoiceModels.id, id));

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
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const [model] = await db.select().from(rvcVoiceModels).where(eq(rvcVoiceModels.id, id)).limit(1);

    if (!model) {
      return { success: false, message: '模型不存在' };
    }

    await db.update(rvcVoiceModels).set({ isActive: !model.isActive }).where(eq(rvcVoiceModels.id, id));

    return {
      success: true,
      message: model.isActive ? '已禁用' : '已启用',
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
  const db = await getDb();
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
      const [existing] = await db.select().from(rvcVoiceModels).where(eq(rvcVoiceModels.slug, model.slug)).limit(1);

      if (!existing) {
        await db.insert(rvcVoiceModels).values({
          name: model.name,
          slug: model.slug,
          category: model.category,
          modelUrl: '', // 内置模型不需要 URL
          isBuiltin: true,
          builtinName: model.builtin_name,
          isActive: true,
          sortOrder: 0,
          usesCount: 0,
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
