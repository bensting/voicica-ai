'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCredits } from '@/contexts/CreditsContext';
import { getCreditsGiftConfig } from '@/actions/admin/system-config';
import NativeBannerAd from '@/components/native/NativeBannerAd';
import TotalAssetsCard from '@/components/native/TotalAssetsCard';
import FeatureGrid from '@/components/native/FeatureGrid';
import ExploreSection from '@/components/native/ExploreSection';
import ClaimCreditsModal from '@/components/native/ClaimCreditsModal';

export default function HomeTab() {
  const { t } = useLanguage();
  const { credits, loading, refreshCredits } = useCredits();
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [giftConfig, setGiftConfig] = useState({ threshold: 5000, giftAmount: 10000 });

  useEffect(() => {
    getCreditsGiftConfig().then(setGiftConfig);
  }, []);

  useEffect(() => {
    if (!loading && credits < giftConfig.threshold) {
      setShowClaimModal(true);
    }
  }, [loading, credits, giftConfig.threshold]);

  return (
    <div className="pt-2 pb-20">
      <NativeBannerAd />
      <TotalAssetsCard claimThreshold={giftConfig.giftAmount} onClaim={() => setShowClaimModal(true)} />
      <div className="px-5 mt-5 mb-1">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
          {t('native.home.sectionCreativeTools')}
        </h2>
      </div>
      <FeatureGrid />
      <ExploreSection />

      {showClaimModal && (
        <ClaimCreditsModal
          giftAmount={giftConfig.giftAmount}
          onClaimed={() => { setShowClaimModal(false); refreshCredits(); }}
          onClose={() => setShowClaimModal(false)}
        />
      )}
    </div>
  );
}
