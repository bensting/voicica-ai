'use server';

/**
 * 数据库管理 Server Actions
 */
import { getDb } from '@/lib/db';
import { users, voices, ttsRecords, userSubscriptions, creditHistory, anonymousUsers } from '@/db/schema';
import { eq, count, sum, lt, sql } from 'drizzle-orm';
import { verifyAdmin, verifyAdminWithoutDb } from '@/lib/auth-admin';

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
 * 获取数据库表统计信息
 */
export async function getTableStats(): Promise<TableStats[]> {
  const db = await getDb();
  await verifyAdmin();

  const [
    [{ total: usersCount }],
    [{ total: voicesCount }],
    [{ total: ttsRecordsCount }],
    [{ total: subscriptionsCount }],
    [{ total: creditHistoryCount }],
  ] = await Promise.all([
    db.select({ total: count() }).from(users),
    db.select({ total: count() }).from(voices),
    db.select({ total: count() }).from(ttsRecords),
    db.select({ total: count() }).from(userSubscriptions),
    db.select({ total: count() }).from(creditHistory),
  ]);

  return [
    { name: 'users', displayName: '用户', count: Number(usersCount) },
    { name: 'voices', displayName: '语音', count: Number(voicesCount) },
    { name: 'tts_records', displayName: 'TTS记录', count: Number(ttsRecordsCount) },
    { name: 'user_subscriptions', displayName: '订阅', count: Number(subscriptionsCount) },
    { name: 'credit_history', displayName: '积分记录', count: Number(creditHistoryCount) },
  ];
}

/**
 * 从后端 API 同步语音数据
 */
export async function syncVoicesFromApi(): Promise<SyncResult> {
  const db = await getDb();
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

    const voicesList = await response.json();

    if (!Array.isArray(voicesList)) {
      throw new Error('API 返回数据格式错误');
    }

    let created = 0;
    let updated = 0;

    // 使用事务批量更新
    for (const voice of voicesList) {
      const [existingVoice] = await db.select().from(voices).where(eq(voices.name, voice.name)).limit(1);

      if (existingVoice) {
        await db.update(voices).set({
          provider: voice.provider,
          locale: voice.locale,
          country: voice.country,
          role: voice.role,
          gender: voice.gender,
          avatarUrl: voice.avatar_url,
          voiceSampleUrl: voice.voice_sample_url,
          voiceSampleText: voice.voice_sample_text,
          tags: voice.tags || [],
          styleList: voice.style_list || [],
          isActive: voice.is_active ?? true,
          sortOrder: voice.sort_order ?? 0,
          displayName: voice.display_name,
        }).where(eq(voices.name, voice.name));
        updated++;
      } else {
        await db.insert(voices).values({
          name: voice.name,
          provider: voice.provider,
          locale: voice.locale,
          country: voice.country,
          role: voice.role,
          gender: voice.gender,
          avatarUrl: voice.avatar_url,
          voiceSampleUrl: voice.voice_sample_url,
          voiceSampleText: voice.voice_sample_text,
          tags: voice.tags || [],
          styleList: voice.style_list || [],
          isActive: voice.is_active ?? true,
          sortOrder: voice.sort_order ?? 0,
          displayName: voice.display_name,
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
        total: voicesList.length,
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
  const db = await getDb();
  await verifyAdmin();

  try {
    const result = await db.delete(anonymousUsers)
      .where(lt(anonymousUsers.expiresAt, new Date().toISOString()))
      .returning();

    return {
      success: true,
      message: `清理完成`,
      details: {
        deleted: result.length,
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
  const db = await getDb();
  await verifyAdmin();

  try {
    // 计算用户所有积分变动的总和
    const [{ total: totalCredits }] = await db.select({ total: sum(creditHistory.amount) })
      .from(creditHistory)
      .where(eq(creditHistory.userId, userId));

    const credits = Number(totalCredits) || 0;

    // 更新用户积分
    await db.update(users).set({ credits }).where(eq(users.userId, userId));

    return {
      success: true,
      message: `用户 ${userId} 积分已重新计算: ${credits}`,
      details: {
        total: credits,
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
 * 执行 Drizzle db push（同步 schema 到数据库）
 * 这会根据 schema.ts 创建/修改数据库表结构
 */
export async function runDrizzleDbPush(): Promise<MigrationResult> {
  // 使用不依赖数据库的验证方式，因为数据库表可能还不存在
  await verifyAdminWithoutDb();

  try {
    // Cloudflare Workers 环境不支持 child_process
    if (typeof globalThis.process === 'undefined' || !globalThis.process.versions?.node) {
      return {
        success: false,
        message: '当前运行环境不支持执行命令行操作（Cloudflare Workers），请在 Node.js 环境中执行 drizzle-kit push',
      };
    }

    console.log('🔄 开始执行 drizzle-kit push...');

    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const { stdout, stderr } = await execAsync('npx drizzle-kit push', {
      cwd: process.cwd(),
      timeout: 120000, // 2分钟超时
    });

    console.log('✅ drizzle-kit push 完成');
    console.log('stdout:', stdout);
    if (stderr) console.log('stderr:', stderr);

    return {
      success: true,
      message: '数据库表结构同步完成',
      output: stdout,
    };
  } catch (error) {
    console.error('❌ drizzle-kit push 失败:', error);
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
 * 执行 Drizzle generate（生成迁移文件）
 */
export async function runDrizzleGenerate(): Promise<MigrationResult> {
  // 使用不依赖数据库的验证方式
  await verifyAdminWithoutDb();

  try {
    // Cloudflare Workers 环境不支持 child_process
    if (typeof globalThis.process === 'undefined' || !globalThis.process.versions?.node) {
      return {
        success: false,
        message: '当前运行环境不支持执行命令行操作（Cloudflare Workers），请在 Node.js 环境中执行 drizzle-kit generate',
      };
    }

    console.log('🔄 开始执行 drizzle-kit generate...');

    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync('npx drizzle-kit generate', {
      cwd: process.cwd(),
      timeout: 60000, // 1分钟超时
    });

    console.log('✅ drizzle-kit generate 完成');

    return {
      success: true,
      message: 'Drizzle 迁移文件生成完成',
      output: stdout,
    };
  } catch (error) {
    console.error('❌ drizzle-kit generate 失败:', error);
    const err = error as { stdout?: string; stderr?: string; message?: string };
    return {
      success: false,
      message: 'Drizzle 迁移文件生成失败',
      output: err.stdout,
      error: err.stderr || err.message,
    };
  }
}

/**
 * 获取数据库连接状态
 */
export async function checkDatabaseConnection(): Promise<MigrationResult> {
  const db = await getDb();
  // 使用不依赖数据库的验证方式
  await verifyAdminWithoutDb();

  try {
    // 尝试执行一个简单查询来检查连接
    await db.all(sql`SELECT 1`);

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
