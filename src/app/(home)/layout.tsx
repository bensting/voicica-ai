import SeoNavbar from '@/components/sections/seo/SeoNavbar';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SeoNavbar />
      {children}
    </>
  );
}
