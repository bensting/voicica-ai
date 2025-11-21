import Link from 'next/link';

/**
 * 管理后台首页
 */
export default function AdminPage() {
  const modules = [
    {
      title: '数据库同步',
      description: '同步和管理数据库表数据',
      href: '/admin/database',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
    // 后续添加更多模块
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
        <p className="text-gray-600 mt-1">系统管理和数据维护</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-purple-300 transition-all group"
          >
            <div className="text-purple-600 mb-4 group-hover:text-purple-700 transition-colors">
              {module.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {module.title}
            </h3>
            <p className="text-gray-600 text-sm">{module.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
