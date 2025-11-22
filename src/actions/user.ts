'use server';

/**
 * 用户模块 Server Actions
 */
import prisma from '@/lib/prisma';
import { getCurrentUser, getUserOrAnonymous } from '@/lib/auth-firebase';
import { uploadImage } from '@/lib/services/r2-storage';
import { v4 as uuidv4 } from 'uuid';
import type { UserProfile, CreditsInfo, CreditHistoryResponse } from '@/types/user';

/**
 * 获取当前用户资料
 *
 * 需要认证，首次登录自动注册
 */
export async function getCurrentUserProfile(): Promise<UserProfile> {
  const authUser = await getCurrentUser();

  // 查找或创建用户
  let user = await prisma.users.findUnique({
    where: { user_id: authUser.uid },
  });

  if (!user) {
    // 首次登录，自动创建用户
    user = await prisma.users.create({
      data: {
        user_id: authUser.uid,
        email: authUser.email || null,
        name: authUser.name || null,
        photo_url: authUser.picture || null,
        credits: 0,
        total_credits_used: 0,
      },
    });
    console.log(`新用户注册: ${authUser.uid}`);
  }

  return {
    id: user.id,
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    photo_url: user.photo_url,
    phone: user.phone,
    credits: user.credits,
    total_credits_used: user.total_credits_used,
    is_anonymous: false,
    expires_at: null,
  };
}

/**
 * 更新当前用户资料
 */
export async function updateUserProfile(data: {
  name?: string;
  photo_url?: string;
  phone?: string;
}): Promise<UserProfile> {
  const authUser = await getCurrentUser();

  console.log(`🔄 [User] 更新用户资料: ${authUser.uid}`, data);

  // 构建更新数据，只更新传入的字段
  const updateData: { name?: string; photo_url?: string; phone?: string; updated_at: Date } = {
    updated_at: new Date(),
  };

  // 只有当字段被明确传入时才更新（包括空字符串）
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.photo_url !== undefined) {
    updateData.photo_url = data.photo_url;
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone;
  }

  console.log(`📝 [User] 实际更新数据:`, updateData);

  // 先查询确认用户存在
  const existingUser = await prisma.users.findUnique({
    where: { user_id: authUser.uid },
  });
  console.log(`🔍 [User] 查询到现有用户:`, existingUser ? `id=${existingUser.id}, name=${existingUser.name}` : '未找到');

  if (!existingUser) {
    throw new Error(`用户不存在: ${authUser.uid}`);
  }

  const user = await prisma.users.update({
    where: { user_id: authUser.uid },
    data: updateData,
  });

  console.log(`✅ [User] 用户资料已更新: ${authUser.uid}, name=${user.name}, phone=${user.phone}, photo_url=${user.photo_url}`);

  return {
    id: user.id,
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    photo_url: user.photo_url,
    phone: user.phone,
    credits: user.credits,
    total_credits_used: user.total_credits_used,
    is_anonymous: false,
    expires_at: null,
  };
}

/**
 * 上传用户头像
 */
export async function uploadAvatar(formData: FormData): Promise<{
  success: boolean;
  message?: string;
  url?: string;
}> {
  try {
    const authUser = await getCurrentUser();
    const file = formData.get('file') as File;

    if (!file) {
      return {
        success: false,
        message: '请选择文件',
      };
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        message: '请选择有效的图片文件',
      };
    }

    // 验证文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        message: '文件大小不能超过 5MB',
      };
    }

    // 生成唯一文件名
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${authUser.uid}_${uuidv4()}.${ext}`;

    // 转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 R2
    const url = await uploadImage(buffer, fileName, file.type);

    // 更新用户头像 URL
    await prisma.users.update({
      where: { user_id: authUser.uid },
      data: {
        photo_url: url,
        updated_at: new Date(),
      },
    });

    console.log(`✅ [User] 头像已上传: ${authUser.uid}`);

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error('❌ [User] 上传头像失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '上传失败',
    };
  }
}

/**
 * 获取用户积分（仅积分信息）
 */
export async function getUserCredits(): Promise<{ credits: number; total_used: number }> {
  const authUser = await getCurrentUser();

  const user = await prisma.users.findUnique({
    where: { user_id: authUser.uid },
    select: { credits: true, total_credits_used: true },
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  return {
    credits: user.credits,
    total_used: user.total_credits_used,
  };
}

/**
 * 获取用户资料（统一接口，支持正式用户和匿名用户）
 */
export async function getUnifiedUserProfile(): Promise<UserProfile> {
  const unifiedUser = await getUserOrAnonymous();

  if (unifiedUser.is_anonymous) {
    // 匿名用户
    const anonUser = await prisma.anonymous_users.findUnique({
      where: { user_id: unifiedUser.user_id },
    });

    if (!anonUser) {
      throw new Error('匿名用户不存在');
    }

    return {
      id: anonUser.id,
      user_id: anonUser.user_id,
      email: null,
      name: null,
      photo_url: null,
      phone: null,
      credits: anonUser.credits,
      total_credits_used: anonUser.total_credits_used,
      is_anonymous: true,
      expires_at: anonUser.expires_at?.toISOString() || null,
    };
  } else {
    // 正式用户
    const user = await prisma.users.findUnique({
      where: { user_id: unifiedUser.user_id },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      id: user.id,
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      photo_url: user.photo_url,
      phone: user.phone,
      credits: user.credits,
      total_credits_used: user.total_credits_used,
      is_anonymous: false,
      expires_at: null,
    };
  }
}

/**
 * 获取积分余额（统一接口，支持正式用户和匿名用户）
 */
export async function getUnifiedCredits(): Promise<CreditsInfo> {
  const unifiedUser = await getUserOrAnonymous();

  if (unifiedUser.is_anonymous) {
    const anonUser = await prisma.anonymous_users.findUnique({
      where: { user_id: unifiedUser.user_id },
      select: {
        credits: true,
        total_credits_used: true,
        expires_at: true,
      },
    });

    if (!anonUser) {
      throw new Error('匿名用户不存在');
    }

    return {
      credits: anonUser.credits,
      total_used: anonUser.total_credits_used,
      is_anonymous: true,
      expires_at: anonUser.expires_at?.toISOString() || null,
    };
  } else {
    const user = await prisma.users.findUnique({
      where: { user_id: unifiedUser.user_id },
      select: {
        credits: true,
        total_credits_used: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      credits: user.credits,
      total_used: user.total_credits_used,
      is_anonymous: false,
      expires_at: null,
    };
  }
}

/**
 * 获取积分历史记录
 *
 * @param page - 页码（从1开始）
 * @param pageSize - 每页数量
 * @param productType - 可选，按产品类型筛选
 */
export async function getCreditHistory(
  page: number = 1,
  pageSize: number = 20,
  productType?: string
): Promise<CreditHistoryResponse> {
  const authUser = await getCurrentUser();

  const where = {
    user_id: authUser.uid,
    ...(productType && { product_type: productType }),
  };

  // 并行获取总数和数据
  const [total, items] = await Promise.all([
    prisma.credit_history.count({ where }),
    prisma.credit_history.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        amount: true,
        description: true,
        product_type: true,
        task_id: true,
        created_at: true,
      },
    }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      amount: item.amount,
      description: item.description,
      product_type: item.product_type,
      task_id: item.task_id,
      created_at: item.created_at.toISOString(),
    })),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}
