'use client';

import SettingsSidebar from '@/components/features/settings/SettingsSidebar';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Desktop (hidden on mobile) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-24">
              <SettingsSidebar />
            </div>
          </aside>

          {/* Mobile Menu (visible on mobile, hidden on desktop) */}
          <div className="lg:hidden">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 overflow-x-auto">
              <SettingsSidebar variant="horizontal" />
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}