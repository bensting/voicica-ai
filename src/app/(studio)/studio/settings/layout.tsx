export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 pt-8 lg:pt-14">
      <div className="max-w-7xl mx-auto px-4 pt-1 pb-8">
        {children}
      </div>
    </div>
  );
}