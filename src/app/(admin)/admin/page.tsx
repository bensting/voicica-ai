import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

/**
 * 获取管理后台统计数据
 */
async function getAdminStats() {
  await verifyAdminWithoutDb();

  const now = new Date();

  const [
    // 用户统计
    totalUsers,
    anonymousUsers,
    activeSubscriptions,
    // 语音统计
    totalVoices,
    activeVoices,
    totalLocales,
    voicesWithSamples,
  ] = await Promise.all([
    // 用户统计
    prisma.users.count(),
    prisma.anonymous_users.count(),
    prisma.user_subscriptions.count({
      where: {
        status: 'active',
        end_date: { gt: now },
      },
    }),
    // 语音统计
    prisma.voices.count(),
    prisma.voices.count({ where: { is_active: true } }),
    prisma.voices.findMany({
      select: { locale: true },
      distinct: ['locale'],
    }),
    prisma.voices.count({
      where: {
        voice_sample_url: {
          path: ['default'],
          not: Prisma.DbNull,
        },
      },
    }),
  ]);

  return {
    // 用户统计
    totalUsers,
    anonymousUsers,
    activeSubscriptions,
    // 语音统计
    totalVoices,
    activeVoices,
    totalLocales: totalLocales.length,
    voicesWithSamples,
  };
}

/**
 * 管理后台首页
 */
export default async function AdminPage() {
  const stats = await getAdminStats();

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  };

  // 用户统计
  const userStats = [
    {
      title: '注册用户',
      value: stats.totalUsers,
      description: '平台注册用户总数',
      color: 'indigo',
      href: '/admin/users',
    },
    {
      title: '匿名用户',
      value: stats.anonymousUsers,
      description: '未注册的访客用户',
      color: 'orange',
      href: '/admin/users',
    },
    {
      title: '有效订阅',
      value: stats.activeSubscriptions,
      description: '当前有效的订阅数',
      color: 'pink',
      href: '/admin/subscriptions',
    },
  ];

  // 语音统计
  const voiceStats = [
    {
      title: '总语音数',
      value: stats.totalVoices,
      description: '数据库中的语音总数',
      color: 'purple',
      href: '/admin/voices',
    },
    {
      title: '已启用语音',
      value: stats.activeVoices,
      description: stats.totalVoices > 0
        ? `${Math.round((stats.activeVoices / stats.totalVoices) * 100)}% 的语音已启用`
        : '暂无语音',
      color: 'green',
      href: '/admin/voices?status=active',
    },
    {
      title: '支持语言',
      value: stats.totalLocales,
      description: '不同语言区域',
      color: 'blue',
      href: '/admin/voices',
    },
    {
      title: '有样本语音',
      value: stats.voicesWithSamples,
      description: stats.totalVoices > 0
        ? `${Math.round((stats.voicesWithSamples / stats.totalVoices) * 100)}% 已生成样本`
        : '暂无样本',
      color: 'teal',
      href: '/admin/voices',
    },
  ];

  const quickLinks = [
    {
      title: '语音管理',
      description: '管理语音启用状态、编辑信息',
      href: '/admin/voices',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
    },
    {
      title: 'Azure 同步',
      description: '从 Azure TTS 同步语音数据',
      href: '/admin/voices/sync',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      title: '数据库管理',
      description: '数据库表管理和维护',
      href: '/admin/database',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
  ];

  const StatCard = ({ card }: { card: typeof userStats[0] }) => {
    const colors = colorClasses[card.color];
    return (
      <Link
        href={card.href}
        className={`${colors.bg} ${colors.border} border rounded-xl p-4 hover:shadow-md transition-shadow`}
      >
        <div className={`text-3xl font-bold ${colors.text} mb-1`}>
          {card.value.toLocaleString()}
        </div>
        <div className="text-sm font-medium text-gray-900">{card.title}</div>
        <div className="text-xs text-gray-500 mt-1">{card.description}</div>
      </Link>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
        <p className="text-gray-600 mt-1">系统概览和数据统计</p>
      </div>

      {/* 用户统计 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">用户统计</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {userStats.map((card) => (
            <StatCard key={card.title} card={card} />
          ))}
        </div>
      </div>

      {/* 语音统计 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">语音统计</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {voiceStats.map((card) => (
            <StatCard key={card.title} card={card} />
          ))}
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷入口</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-purple-300 transition-all group flex items-start gap-4"
            >
              <div className="text-purple-600 group-hover:text-purple-700 transition-colors flex-shrink-0">
                {link.icon}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors">
                  {link.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}