import SeoNavbar from '@/components/sections/seo/SeoNavbar';
import SimpleFooter from '@/components/layout/SimpleFooter';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SeoNavbar />
      {children}
      <SimpleFooter />
    </>
  );
}
