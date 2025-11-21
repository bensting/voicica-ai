'use server';

/**
 * 数据库管理 Server Actions
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { headers } from 'next/headers';
import { auth as adminAuth } from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-firebase';

const execAsync = promisify(exec);

// 管理员白名单
const ADMIN_EMAILS = ['admin@ai-voice-labs.com', 'bensting19@gmail.com'];

interface SyncResult {
  success: boolean;
  message: string;
  details?: {
    created?: number;
    updated?: number;
    deleted?: number;
    total?: number;
  };
}

interface TableStats {
  name: string;
  displayName: string;
  count: number;
  lastUpdated?: string;
}

/**
 * 验证管理员权限（不查询数据库，仅验证 Firebase token）
 * 用于数据库迁移等操作，此时数据库表可能还不存在
 */
async function verifyAdminWithoutDb(): Promise<void> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('未登录');
  }

  const token = authHeader.substring(7);

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken.email || !ADMIN_EMAILS.includes(decodedToken.email)) {
      throw new Error('无权限访问');
    }

    console.log('✅ [Admin] 管理员验证通过:', decodedToken.email);
  } catch (error) {
    console.error('❌ [Admin] 验证失败:', error);
    throw new Error('验证失败');
  }
}

/**
 * 验证管理员权限（需要数据库）
 */
async function verifyAdmin(): Promise<void> {
  const user = await getCurrentUser();
  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error('无权限访问');
  }
}

/**
 * 获取数据库表统计信息
 */
export async function getTableStats(): Promise<TableStats[]> {
  await verifyAdmin();

  const [
    usersCount,
    voicesCount,
    ttsRecordsCount,
    subscriptionsCount,
    creditHistoryCount,
  ] = await Promise.all([
    prisma.users.count(),
    prisma.voices.count(),
    prisma.tts_records.count(),
    prisma.user_subscriptions.count(),
    prisma.credit_history.count(),
  ]);

  return [
    { name: 'users', displayName: '用户', count: usersCount },
    { name: 'voices', displayName: '语音', count: voicesCount },
    { name: 'tts_records', displayName: 'TTS记录', count: ttsRecordsCount },
    { name: 'user_subscriptions', displayName: '订阅', count: subscriptionsCount },
    { name: 'credit_history', displayName: '积分记录', count: creditHistoryCount },
  ];
}

/**
 * 从后端 API 同步语音数据
 */
export async function syncVoicesFromApi(): Promise<SyncResult> {
  await verifyAdmin();

  try {
    // 从后端 API 获取所有语音
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/v1/voices`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const voices = await response.json();

    if (!Array.isArray(voices)) {
      throw new Error('API 返回数据格式错误');
    }

    let created = 0;
    let updated = 0;

    // 使用事务批量更新
    for (const voice of voices) {
      const existingVoice = await prisma.voices.findUnique({
        where: { name: voice.name },
      });

      if (existingVoice) {
        await prisma.voices.update({
          where: { name: voice.name },
          data: {
            provider: voice.provider,
            locale: voice.locale,
            country: voice.country,
            role: voice.role,
            gender: voice.gender,
            avatar_url: voice.avatar_url,
            voice_sample_url: voice.voice_sample_url,
            voice_sample_text: voice.voice_sample_text,
            tags: voice.tags || [],
            style_list: voice.style_list || [],
            is_active: voice.is_active ?? true,
            sort_order: voice.sort_order ?? 0,
            display_name: voice.display_name,
            updated_at: new Date(),
          },
        });
        updated++;
      } else {
        await prisma.voices.create({
          data: {
            name: voice.name,
            provider: voice.provider,
            locale: voice.locale,
            country: voice.country,
            role: voice.role,
            gender: voice.gender,
            avatar_url: voice.avatar_url,
            voice_sample_url: voice.voice_sample_url,
            voice_sample_text: voice.voice_sample_text,
            tags: voice.tags || [],
            style_list: voice.style_list || [],
            is_active: voice.is_active ?? true,
            sort_order: voice.sort_order ?? 0,
            display_name: voice.display_name,
          },
        });
        created++;
      }
    }

    return {
      success: true,
      message: `语音数据同步完成`,
      details: {
        created,
        updated,
        total: voices.length,
      },
    };
  } catch (error) {
    console.error('同步语音数据失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '同步失败',
    };
  }
}

/**
 * 同步订阅计划（从配置文件到数据库，如需要）
 * 注：订阅计划已迁移至配置文件，此方法主要用于数据备份或特殊需求
 */
export async function syncSubscriptionPlans(): Promise<SyncResult> {
  await verifyAdmin();

  try {
    // 从配置文件读取订阅计划
    const { getAllActivePlans } = await import('@/config/subscription');
    const plans = getAllActivePlans();

    // 这里可以实现将配置同步到数据库的逻辑
    // 目前订阅计划完全从配置文件读取，不需要数据库表

    return {
      success: true,
      message: `订阅计划配置验证完成，共 ${plans.length} 个计划`,
      details: {
        total: plans.length,
      },
    };
  } catch (error) {
    console.error('同步订阅计划失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '同步失败',
    };
  }
}

/**
 * 清理过期的匿名用户数据
 */
export async function cleanupExpiredAnonymousUsers(): Promise<SyncResult> {
  await verifyAdmin();

  try {
    const result = await prisma.anonymous_users.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });

    return {
      success: true,
      message: `清理完成`,
      details: {
        deleted: result.count,
      },
    };
  } catch (error) {
    console.error('清理匿名用户失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '清理失败',
    };
  }
}

/**
 * 重新计算用户积分（基于积分历史）
 */
export async function recalculateUserCredits(userId: string): Promise<SyncResult> {
  await verifyAdmin();

  try {
    // 计算用户所有积分变动的总和
    const creditHistory = await prisma.credit_history.aggregate({
      where: { user_id: userId },
      _sum: { amount: true },
    });

    const totalCredits = creditHistory._sum.amount || 0;

    // 更新用户积分
    await prisma.users.update({
      where: { user_id: userId },
      data: { credits: totalCredits },
    });

    return {
      success: true,
      message: `用户 ${userId} 积分已重新计算: ${totalCredits}`,
      details: {
        total: totalCredits,
      },
    };
  } catch (error) {
    console.error('重新计算积分失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '计算失败',
    };
  }
}

/**
 * 数据库迁移结果
 */
interface MigrationResult {
  success: boolean;
  message: string;
  output?: string;
  error?: string;
}

/**
 * 执行 Prisma db push（同步 schema 到数据库）
 * 这会根据 schema.prisma 创建/修改数据库表结构
 */
export async function runPrismaDbPush(): Promise<MigrationResult> {
  // 使用不依赖数据库的验证方式，因为数据库表可能还不存在
  await verifyAdminWithoutDb();

  try {
    console.log('🔄 开始执行 prisma db push...');

    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss', {
      cwd: process.cwd(),
      timeout: 120000, // 2分钟超时
    });

    console.log('✅ prisma db push 完成');
    console.log('stdout:', stdout);
    if (stderr) console.log('stderr:', stderr);

    return {
      success: true,
      message: '数据库表结构同步完成',
      output: stdout,
    };
  } catch (error) {
    console.error('❌ prisma db push 失败:', error);
    const err = error as { stdout?: string; stderr?: string; message?: string };
    return {
      success: false,
      message: '数据库迁移失败',
      output: err.stdout,
      error: err.stderr || err.message,
    };
  }
}

/**
 * 执行 Prisma generate（重新生成 Prisma Client）
 */
export async function runPrismaGenerate(): Promise<MigrationResult> {
  // 使用不依赖数据库的验证方式
  await verifyAdminWithoutDb();

  try {
    console.log('🔄 开始执行 prisma generate...');

    const { stdout } = await execAsync('npx prisma generate', {
      cwd: process.cwd(),
      timeout: 60000, // 1分钟超时
    });

    console.log('✅ prisma generate 完成');

    return {
      success: true,
      message: 'Prisma Client 重新生成完成',
      output: stdout,
    };
  } catch (error) {
    console.error('❌ prisma generate 失败:', error);
    const err = error as { stdout?: string; stderr?: string; message?: string };
    return {
      success: false,
      message: 'Prisma Client 生成失败',
      output: err.stdout,
      error: err.stderr || err.message,
    };
  }
}

/**
 * 获取数据库连接状态
 */
export async function checkDatabaseConnection(): Promise<MigrationResult> {
  // 使用不依赖数据库的验证方式
  await verifyAdminWithoutDb();

  try {
    // 尝试执行一个简单查询来检查连接
    await prisma.$queryRaw`SELECT 1`;

    return {
      success: true,
      message: '数据库连接正常',
    };
  } catch (error) {
    console.error('数据库连接失败:', error);
    return {
      success: false,
      message: '数据库连接失败',
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}
