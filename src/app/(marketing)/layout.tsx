import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PWAInstallButton from "@/components/layout/PWAInstallButton";
import AdsterraSocialBar from "@/components/ads/AdsterraSocialBar";

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
      {/* Adsterra Social Bar - 固定底部广告 */}
      <AdsterraSocialBar />
    </>
  );
}