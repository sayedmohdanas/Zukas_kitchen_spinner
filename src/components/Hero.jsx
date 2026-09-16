import React from "react";
import Spinner from "./Spinner";
import MobileNumberForm from "./MobileNumberForm";
import SpinButton from "./SpinButton";
import { Sparkles, Pizza, ShieldCheck, Heart, Clock, Award } from "lucide-react";
import { config } from "../config/config";

export default function Hero({
  mobileNumber,
  setMobileNumber,
  error,
  setError,
  isSpinning,
  hasSpun,
  targetIndex,
  onSpinClick,
  onSpinComplete,
  sessionPrize,
  sessionCoupon,
  onOpenResultAgain,
  campaignEnabled = true,
  isLoadingCampaign = false,
  prizesList = [],
}) {
  return (
    <section id="hero" className="hero-section">
      <div className="hero-bg-shapes">
        <div className="hero-glow-blob green-blob" />
        <div className="hero-glow-blob yellow-blob" />
      </div>

      <div className="section-container hero-container">
        {/* Left Column: Copy & Form */}
        <div className="hero-text-column">
          <div className="hero-badge">
            <Sparkles size={16} className="sparkle-gold" />
            <span>EXCLUSIVE PROMOTIONAL EVENT</span>
          </div>

          <h1 className="hero-title">
            <span className="title-spin-highlight">SPIN & WIN</span>
            <span className="title-subhead">EXCITING OFFERS!</span>
          </h1>

          <p className="hero-description">
            Your next pizza might come with a surprise discount! 🎉 Enter your mobile number, spin the wheel, and unlock guaranteed delicious rewards instantly.
          </p>

          {/* Benefit Pills */}
          <div className="hero-benefits-row">
            <div className="benefit-pill">
              <Pizza size={16} className="benefit-icon" />
              <span>Delicious Food</span>
            </div>
            <div className="benefit-pill">
              <Clock size={16} className="benefit-icon" />
              <span>Fast Delivery</span>
            </div>
            <div className="benefit-pill">
              <Award size={16} className="benefit-icon" />
              <span>Fresh Ingredients</span>
            </div>
            <div className="benefit-pill">
              <Heart size={16} className="benefit-icon" />
              <span>Made with Love</span>
            </div>
          </div>

          {/* Form and Spin CTA Box */}
          <div className="hero-spin-card">
            {isLoadingCampaign ? (
              <div className="campaign-loading-box">
                <div className="loading-spinner" />
                <p>Loading campaign details...</p>
              </div>
            ) : !campaignEnabled ? (
              <div className="campaign-closed-box">
                <div className="closed-badge">CAMPAIGN PAUSED</div>
                <h3>Spin & Win is currently closed.</h3>
                <p>Please check back soon! ❤️</p>
              </div>
            ) : hasSpun ? (
              <div className="already-spun-card">
                <div className="already-spun-header">
                  <ShieldCheck size={24} className="spun-check-icon" />
                  <div>
                    <h3>You've Already Spun!</h3>
                    <p>Each customer gets 1 spin per campaign session.</p>
                  </div>
                </div>

                {sessionPrize && (
                  <div className="spun-summary-box">
                    <span className="summary-label">Your Winning Reward:</span>
                    <span className="summary-prize">{sessionPrize.label}</span>
                    {sessionCoupon && (
                      <div className="summary-code-badge">
                        <span>Coupon: </span>
                        <strong>{sessionCoupon}</strong>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  className="reopen-modal-btn"
                  onClick={onOpenResultAgain}
                >
                  VIEW YOUR OFFER MODAL AGAIN →
                </button>
              </div>
            ) : (
              <>
                <MobileNumberForm
                  mobileNumber={mobileNumber}
                  setMobileNumber={setMobileNumber}
                  error={error}
                  setError={setError}
                  disabled={isSpinning || !campaignEnabled}
                />

                <SpinButton
                  onClick={onSpinClick}
                  isSpinning={isSpinning}
                  disabled={isSpinning || !campaignEnabled}
                  hasSpun={hasSpun}
                />
              </>
            )}
          </div>
        </div>

        {/* Right Column: Wheel Showcase */}
        <div className="hero-spinner-column">
          <div className="wheel-stage-card">
            <Spinner
              prizesList={prizesList}
              targetIndex={targetIndex}
              selectedPrize={sessionPrize}
              isSpinning={isSpinning}
              onSpinComplete={onSpinComplete}
              disabled={isSpinning || hasSpun || !campaignEnabled}
            />

            <div className="wheel-sub-caption">
              <span>{campaignEnabled ? "👇 Tap SPIN NOW to test your luck!" : "🔒 Campaign is currently closed"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
