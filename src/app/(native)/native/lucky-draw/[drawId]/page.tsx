'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GradientButton from '@/components/native/common/GradientButton';
import LoginModal from '@/components/native/LoginModal';
import ClaimPrizeSheet, { type ClaimData, type ClaimStatus, type ShippingInfo } from '@/components/native/ClaimPrizeSheet';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getLuckyDrawStatus, createLuckyDrawCheckout, submitPrizeClaim, type LuckyDrawStatusResult } from '@/actions/lucky-draw';

import { CloseIcon } from '@/components/native/lucky-draw/icons';
import SellingState from '@/components/native/lucky-draw/SellingState';
import DrawingState from '@/components/native/lucky-draw/DrawingState';
import CompletedState from '@/components/native/lucky-draw/CompletedState';
import PaymentSheet from '@/components/native/lucky-draw/PaymentSheet';
import RulesSheet from '@/components/native/lucky-draw/RulesSheet';
import SuccessModal from '@/components/native/lucky-draw/SuccessModal';

export default function LuckyDrawDetailPage() {
  const router = useRouter();
  const goBack = useCallback(() => router.push('/native'), [router]);
  const params = useParams();
  const drawId = params.drawId as string;

  // Auth
  const { user } = useFirebaseAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Claim prize
  const [claimSheetOpen, setClaimSheetOpen] = useState(false);

  // Server data
  const [drawStatus, setDrawStatus] = useState<LuckyDrawStatusResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // Payment bottom sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [payMethod, setPayMethod] = useState<'crypto' | 'stripe'>('stripe');

  // Rules bottom sheet
  const [rulesOpen, setRulesOpen] = useState(false);

  // Success modal
  const [successInfo, setSuccessInfo] = useState<{ credits: number; draws: number } | null>(null);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const status = await getLuckyDrawStatus(drawId);
      setDrawStatus(status);
    } catch (error) {
      console.error('Failed to fetch draw status:', error);
    } finally {
      setLoading(false);
    }
  }, [drawId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const remainingSlots = drawStatus ? drawStatus.totalSlots - drawStatus.soldSlots : 0;

  // Handle purchase
  const handlePurchase = async () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    if (payMethod === 'crypto') {
      setToastMsg('Crypto payment coming soon!');
      return;
    }

    setPurchasing(true);
    try {
      const returnUrl = `/native/lucky-draw/${drawId}`;
      const result = await createLuckyDrawCheckout(
        drawId,
        qty,
        `${window.location.origin}/native/payment/success?return_url=${encodeURIComponent(returnUrl)}`,
        `${window.location.origin}${returnUrl}`,
      );
      window.location.href = result.checkout_url;
    } catch (error) {
      console.error('Checkout failed:', error);
      setToastMsg(error instanceof Error ? error.message : 'Purchase failed');
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0a0a1a] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!drawStatus) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0a0a1a] flex items-center justify-center">
        <p className="text-gray-400">Lucky Draw not found</p>
      </div>
    );
  }

  const {
    prize, prizeImageUrl, totalSlots, creditsPerPurchase, stripePriceCents, cryptoPriceCents,
    contractAddress, chainName, blockExplorerUrl, soldSlots, myEntries, recentEntries,
    status: currentStatus, drawResult, claim,
  } = drawStatus;

  const mySlots = myEntries.map((e) => e.slotNumber);
  const openBuySheet = () => { setQty(1); setSheetOpen(true); };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a1a] flex flex-col overflow-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-transparent to-transparent pointer-events-none" />

      {/* Top Bar */}
      <div
        className="relative z-20 flex items-center px-4 py-2"
        style={{ marginTop: 'var(--safe-area-inset-top, 0px)' }}
      >
        <button
          onClick={goBack}
          className="w-10 h-10 flex items-center justify-center bg-gray-800/50 rounded-full text-gray-300 hover:text-white transition-colors"
        >
          <CloseIcon />
        </button>
        <h1 className="flex-1 text-center text-white font-bold text-lg pr-10">Lucky Draw</h1>
      </div>

      {/* Scrollable Content */}
      <div className="relative z-10 flex-1 overflow-y-auto pb-28">
        {currentStatus === 'drawing' ? (
          <DrawingState
            prize={prize}
            prizeImageUrl={prizeImageUrl}
            totalSlots={totalSlots}
            chainName={chainName}
            mySlots={mySlots}
          />
        ) : currentStatus === 'completed' && drawResult ? (
          <CompletedState
            prize={prize}
            prizeImageUrl={prizeImageUrl}
            totalSlots={totalSlots}
            soldSlots={soldSlots}
            creditsPerPurchase={creditsPerPurchase}
            chainName={chainName}
            myEntryCount={myEntries.length}
            mySlots={mySlots}
            drawResult={drawResult}
            recentEntries={recentEntries}
            onOpenRules={() => setRulesOpen(true)}
          />
        ) : (
          <SellingState
            prize={prize}
            prizeImageUrl={prizeImageUrl}
            totalSlots={totalSlots}
            soldSlots={soldSlots}
            creditsPerPurchase={creditsPerPurchase}
            cryptoPriceCents={cryptoPriceCents}
            stripePriceCents={stripePriceCents}
            chainName={chainName}
            contractAddress={contractAddress}
            blockExplorerUrl={blockExplorerUrl}
            myEntries={myEntries}
            recentEntries={recentEntries}
            onBuyMore={openBuySheet}
            onOpenRules={() => setRulesOpen(true)}
          />
        )}
      </div>

      {/* Bottom CTA */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 px-4 py-4 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a] to-transparent"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {currentStatus === 'completed' ? (
          drawResult?.isMe ? (
            <GradientButton onClick={() => setClaimSheetOpen(true)}>
              {claim?.status === 'info_submitted' ? 'Claim Processing...' :
               claim?.status === 'shipped' ? 'Track Shipment' :
               claim?.status === 'delivered' ? 'Prize Delivered' :
               'Claim Prize'}
            </GradientButton>
          ) : (
            <GradientButton onClick={goBack}>Join Next Round</GradientButton>
          )
        ) : currentStatus === 'drawing' ? (
          <GradientButton disabled>
            Drawing in Progress...
          </GradientButton>
        ) : remainingSlots <= 0 ? (
          <GradientButton disabled>
            All Slots Taken
          </GradientButton>
        ) : (
          <GradientButton onClick={openBuySheet}>
            TRY MY LUCK — Free
          </GradientButton>
        )}
      </div>

      {/* Overlays */}
      <PaymentSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        qty={qty}
        setQty={setQty}
        payMethod={payMethod}
        setPayMethod={setPayMethod}
        remainingSlots={remainingSlots}
        creditsPerPurchase={creditsPerPurchase}
        stripePriceCents={stripePriceCents}
        cryptoPriceCents={cryptoPriceCents}
        totalSlots={totalSlots}
        purchasing={purchasing}
        onPurchase={handlePurchase}
      />

      <RulesSheet
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        prize={prize}
        totalSlots={totalSlots}
        creditsPerPurchase={creditsPerPurchase}
        stripePriceCents={stripePriceCents}
        cryptoPriceCents={cryptoPriceCents}
        chainName={chainName}
      />

      <SuccessModal
        info={successInfo}
        onClose={() => setSuccessInfo(null)}
      />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10002] bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => setIsLoginModalOpen(false)}
      />

      {/* Claim Prize Sheet */}
      {claimSheetOpen && (
        <ClaimPrizeSheet
          prize={prize}
          claimData={{
            status: (claim?.status as ClaimStatus) || 'unclaimed',
            ...(claim?.fullName && {
              shippingInfo: {
                fullName: claim.fullName,
                phone: '',
                email: '',
                country: '',
                address: '',
                zipCode: '',
              },
            }),
            ...(claim?.carrier && {
              tracking: {
                carrier: claim.carrier,
                trackingNumber: claim.trackingNumber ?? '',
                trackingUrl: claim.trackingUrl ?? '',
                shippedAt: claim.shippedAt ?? '',
              },
            }),
          }}
          onClose={() => setClaimSheetOpen(false)}
          onSubmit={async (info: ShippingInfo) => {
            try {
              await submitPrizeClaim(drawId, {
                fullName: info.fullName,
                phone: info.phone,
                email: info.email,
                country: info.country,
                address: info.address,
                zipCode: info.zipCode,
                telegram: info.telegram,
              });
              setClaimSheetOpen(false);
              fetchStatus();
            } catch (error) {
              console.error('Failed to submit claim:', error);
              setToastMsg(error instanceof Error ? error.message : 'Claim failed');
            }
          }}
        />
      )}
    </div>
  );
}
