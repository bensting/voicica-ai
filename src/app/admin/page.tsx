/**
 * Admin Dashboard Overview
 */
export default function AdminPage() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
      <p className="text-gray-600">Welcome to the Admin Dashboard.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Database</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">D1</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">ORM</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">Drizzle</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Platform</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">Cloudflare</p>
        </div>
      </div>
    </div>
  );
}