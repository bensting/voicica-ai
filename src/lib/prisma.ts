/**
 * Prisma Client 单例
 *
 * 在开发环境中防止热重载创建多个实例
 * 生产环境使用 Neon HTTP Driver（无二进制引擎，适合 Cloudflare Workers）
 */
import { PrismaClient } from '@/generated/prisma';
import { PrismaNeonHttp } from '@prisma/adapter-neon';

function createPrismaClient() {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // 开发环境：普通 TCP 连接（支持 hot reload 调试）
    return new PrismaClient({
      log: ['error', 'warn'],
      datasources: { db: { url: process.env.DATABASE_URL } },
    });
  }

  // 生产环境：Neon HTTP Driver（无二进制引擎，适合 Cloudflare Workers）
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, { arrayMode: false, fullResults: true });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
