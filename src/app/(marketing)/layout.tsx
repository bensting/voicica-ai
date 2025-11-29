import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PWAInstallButton from "@/components/layout/PWAInstallButton";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <PWAInstallButton />
    </>
  );
}