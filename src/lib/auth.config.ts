/**
 * Auth.js 配置
 */
import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from './prisma';

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  // 启用调试模式查看详细日志
  debug: process.env.NODE_ENV === 'development',

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
    // 登录验证
    async signIn() {
      // 允许所有登录
      return true;
    },

    // 自定义 session
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        console.log('📝 [Session Callback] User ID:', user.id);

        // 获取应用用户信息
        const authUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { appUser: true },
        });

        console.log('📝 [Session Callback] Auth User:', {
          hasAppUser: !!authUser?.appUser,
          appUserId: authUser?.appUser?.user_id,
        });

        if (authUser?.appUser) {
          // 添加应用用户信息到 session
          const extendedUser = session.user as { appUserId?: string; credits?: number };
          extendedUser.appUserId = authUser.appUser.user_id;
          extendedUser.credits = authUser.appUser.credits;
        }
      }
      return session;
    },
  },

  events: {
    // 新用户创建后,关联应用用户
    async createUser({ user }) {
      if (!user.id || !user.email) return;

      // 查找或创建应用用户
      let appUser = await prisma.users.findFirst({
        where: { email: user.email },
      });

      if (!appUser) {
        // 创建应用用户
        appUser = await prisma.users.create({
          data: {
            user_id: user.id, // 使用 Auth.js User ID
            email: user.email,
            name: user.name ?? null,
            photo_url: user.image ?? null,
            credits: 1000, // 新用户初始积分
            total_credits_used: 0,
          },
        });
        console.log(`✅ 新用户注册: ${user.email}, 初始积分: 1000`);
      }

      // 关联 Auth.js User 和应用 User
      await prisma.user.update({
        where: { id: user.id },
        data: { appUserId: appUser.user_id },
      });

      console.log(`🔗 用户关联成功: Auth.js User ${user.id} -> App User ${appUser.user_id}`);
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'database',
    // Session 30 天过期
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    // 每次访问时更新 session 过期时间
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // 配置 cookies 确保持久化
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
