'use client';

/**
 * API 配置测试页面
 * 用于诊断生产环境的 API 连接问题
 */

export default function APITestPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">API 配置诊断</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-lg mb-2">环境变量检查</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">API Base URL:</span>
                <span className={`font-mono ${apiBaseUrl?.includes('localhost') ? 'text-red-600' : 'text-green-600'}`}>
                  {apiBaseUrl || '❌ 未设置'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Firebase Project:</span>
                <span className="font-mono text-gray-800">
                  {firebaseProjectId || '❌ 未设置'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">当前域名:</span>
                <span className="font-mono text-gray-800">
                  {typeof window !== 'undefined' ? window.location.hostname : 'SSR'}
                </span>
              </div>
            </div>
          </div>

          {apiBaseUrl?.includes('localhost') && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h3 className="font-semibold text-red-800 mb-2">⚠️ 配置错误</h3>
              <p className="text-sm text-red-700">
                API Base URL 指向 localhost，这会导致手机浏览器无法连接后端。
              </p>
              <p className="text-sm text-red-700 mt-2">
                请在 Vercel 环境变量中设置：
                <code className="block mt-1 bg-red-100 p-2 rounded">
                  NEXT_PUBLIC_API_BASE_URL=https://api.ai-voice-labs.com
                </code>
              </p>
            </div>
          )}

          {apiBaseUrl && !apiBaseUrl.includes('localhost') && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ 配置正确</h3>
              <p className="text-sm text-green-700">
                API Base URL 已正确设置为生产环境地址
              </p>
            </div>
          )}

          <div className="pt-4">
            <h2 className="font-semibold text-lg mb-2">快速诊断</h2>
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`${apiBaseUrl}/health`);
                  const data = await response.json();
                  alert(`✅ 后端连接成功！\n${JSON.stringify(data, null, 2)}`);
                } catch (error) {
                  alert(`❌ 后端连接失败！\n错误: ${error}`);
                }
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              测试 API 连接
            </button>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="font-semibold text-blue-800 mb-2">📝 修复步骤</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>登录 Vercel Dashboard</li>
            <li>进入项目 Settings → Environment Variables</li>
            <li>添加或修改 NEXT_PUBLIC_API_BASE_URL=https://api.ai-voice-labs.com</li>
            <li>点击 Deployments → 最新部署 → Redeploy（重新部署）</li>
            <li>等待部署完成后，刷新此页面验证</li>
          </ol>
        </div>
      </div>
    </div>
  );
}