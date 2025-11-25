export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[calc(100vh-60px)] bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}