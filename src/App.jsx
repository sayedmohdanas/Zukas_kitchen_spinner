import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import MenuSection from "./components/MenuSection";
import HowItWorks from "./components/HowItWorks";
import PromoBanner from "./components/PromoBanner";
import WhyZukas from "./components/WhyZukas";
import ReviewsSection from "./components/ReviewsSection";
import FinalCTA from "./components/FinalCTA";
import ResultModal from "./components/ResultModal";
import TermsModal from "./components/TermsModal";
import Footer from "./components/Footer";
import FloatingWhatsAppCTA from "./components/FloatingWhatsAppCTA";
import { spinWheelService } from "./services/spinService";
import { fetchCampaignConfig, fetchPrizesFromFirestore, fetchVillagesFromFirestore, DEFAULT_PRIZES, DEFAULT_CAMPAIGN_CONFIG } from "./services/firebasePrizeService";
import { trackEvent } from "./utils/analytics";

export default function App() {
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState(null);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [couponCode, setCouponCode] = useState(null);
  const [spinId, setSpinId] = useState(null);
  const [isClaimed, setIsClaimed] = useState(false);
  const [claimedMobile, setClaimedMobile] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeOffer, setActiveOffer] = useState(null);

  // Firebase integration state
  const [prizesList, setPrizesList] = useState(DEFAULT_PRIZES);
  const [villagesList, setVillagesList] = useState([]);
  const [campaignConfig, setCampaignConfig] = useState(DEFAULT_CAMPAIGN_CONFIG);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(true);

  // Fetch Firebase campaign configuration & prize definitions on mount
  useEffect(() => {
    trackEvent("page_view", { page: "home" });

    let isMounted = true;
    const loadFirebaseData = async () => {
      try {
        setIsLoadingCampaign(true);
        const [configData, prizesData, villagesData] = await Promise.all([
          fetchCampaignConfig(),
          fetchPrizesFromFirestore(),
          fetchVillagesFromFirestore(),
        ]);

        if (isMounted) {
          if (configData) setCampaignConfig(configData);
          if (prizesData && prizesData.length > 0) setPrizesList(prizesData);
          if (villagesData && villagesData.length > 0) setVillagesList(villagesData);
        }
      } catch (err) {
        console.warn("Could not load Firebase configuration, using default configuration:", err);
      } finally {
        if (isMounted) setIsLoadingCampaign(false);
      }
    };

    loadFirebaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartSpin = async () => {
    // Block if spinning or campaign is disabled
    if (isSpinning || !campaignConfig.enabled) return;

    if (hasSpun) {
      setShowResult(true);
      return;
    }

    // Name validation: Trimmed, min 2 chars, max 50 chars
    const trimmed = String(userName || "").trim();
    if (!trimmed || trimmed.length < 2) {
      setError("Please enter your name (at least 2 characters).");
      trackEvent("validation_error", { input: userName });
      return;
    }
    if (trimmed.length > 50) {
      setError("Name must be 50 characters or less.");
      trackEvent("validation_error", { input: userName });
      return;
    }

    setError("");
    setIsSpinning(true);
    trackEvent("spin_started", { name: trimmed });

    try {
      // Execute spin on server with name (mobile collected after win)
      const result = await spinWheelService(trimmed, null, prizesList, campaignConfig);
      setSpinId(result.spinId);
      setTargetIndex(result.prizeIndex);
      setSelectedPrize(result.prize);
      setCouponCode(result.couponCode);
    } catch (err) {
      setIsSpinning(false);
      setError(err.message || "An unexpected error occurred. Please try again.");
    }
  };

  const handleSpinComplete = () => {
    setIsSpinning(false);
    setHasSpun(true);
    setShowResult(true);
    trackEvent("spin_completed", { prize: selectedPrize?.label, name: userName });
  };

  const handleClaimSuccess = ({ mobile, couponCode: updatedCode, prizeName }) => {
    setIsClaimed(true);
    setClaimedMobile(mobile);
    if (updatedCode) {
      setCouponCode(updatedCode);
    }
    setActiveOffer({
      prizeName: prizeName || selectedPrize?.label,
      couponCode: updatedCode || couponCode,
    });
    trackEvent("coupon_claimed", { mobile, prize: selectedPrize?.label });
  };

  return (
    <div className="app-main-wrapper">
      {/* Navbar */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="main-content-body">
        {/* Hero Section with Form and Interactive Spinner */}
        <Hero
          userName={userName}
          setUserName={setUserName}
          error={error}
          setError={setError}
          isSpinning={isSpinning}
          hasSpun={hasSpun}
          targetIndex={targetIndex}
          onSpinClick={handleStartSpin}
          onSpinComplete={handleSpinComplete}
          sessionPrize={selectedPrize}
          sessionCoupon={couponCode}
          onOpenResultAgain={() => setShowResult(true)}
          campaignEnabled={campaignConfig.enabled}
          isLoadingCampaign={isLoadingCampaign}
          prizesList={prizesList}
          villagesList={villagesList}
        />

        {/* Zukas Kitchen Pizza Menu Section */}
        <MenuSection activeOffer={activeOffer} villagesList={villagesList} />

        {/* Customer Reviews Section */}
        <ReviewsSection villagesList={villagesList} />

        {/* How It Works Section */}
        <HowItWorks />

        {/* Promotional Food Banner */}
        <PromoBanner />

        {/* Why Zukas Kitchen Section */}
        <WhyZukas />

        {/* Final CTA Section */}
        <FinalCTA
          onSpinClick={() => {
            const heroEl = document.getElementById("hero");
            if (heroEl) heroEl.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </main>

      {/* Footer */}
      <Footer onOpenTerms={() => setShowTermsModal(true)} />

      {/* Floating Bottom WhatsApp CTA for Mobile */}
      <FloatingWhatsAppCTA isModalOpen={showResult || showTermsModal} />

      {/* Result Winner / No-Win Pop-up Modal */}
      {showResult && (
        <ResultModal
          prize={selectedPrize}
          couponCode={couponCode}
          userName={userName}
          spinId={spinId}
          isClaimed={isClaimed}
          claimedMobile={claimedMobile}
          onClaimSuccess={handleClaimSuccess}
          onExistingCouponRecovered={(coupon) => setActiveOffer({ prizeName: coupon.prizeName, couponCode: coupon.couponCode })}
          onClose={() => setShowResult(false)}
        />
      )}

      {/* Campaign Terms & Rules Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </div>
  );
}
