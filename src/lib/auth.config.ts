/**
 * Auth.js 配置 - 使用 JWT sessions (Edge Runtime 兼容)
 */
import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';
import { getDb, users } from './db';
import { eq } from 'drizzle-orm';

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Apple({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // JWT callback - 在 token 中存储用户信息
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;

        // 首次登录时创建/关联应用用户
        if (account && user.email) {
          const db = await getDb();

          // 查找或创建应用用户
          let appUser = await db.query.users.findFirst({
            where: eq(users.email, user.email),
          });

          if (!appUser) {
            const result = await db.insert(users).values({
              userId: user.id!,
              email: user.email,
              name: user.name ?? null,
              photoUrl: user.image ?? null,
              credits: 1000,
              totalCreditsUsed: 0,
            }).returning();

            appUser = result[0];
            console.log(`✅ 新用户注册: ${user.email}, 初始积分: 1000`);
          }

          token.appUserId = appUser.userId;
          token.credits = appUser.credits;
        }
      }

      return token;
    },

    // Session callback - 从 token 构建 session
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;

        // 获取最新的用户积分
        if (token.appUserId) {
          const db = await getDb();
          const appUser = await db.query.users.findFirst({
            where: eq(users.userId, token.appUserId as string),
          });

          if (appUser) {
            const extendedUser = session.user as { appUserId?: string; credits?: number };
            extendedUser.appUserId = appUser.userId;
            extendedUser.credits = appUser.credits;
          }
        }
      }

      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
  },
};