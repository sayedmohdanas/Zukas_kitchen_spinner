import React from "react";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function SpinButton({
  onClick,
  isSpinning,
  disabled,
  hasSpun,
}) {
  return (
    <button
      type="button"
      className={`spin-cta-button ${isSpinning ? "is-spinning" : ""} ${
        hasSpun ? "has-spun-btn" : ""
      }`}
      onClick={onClick}
      disabled={disabled || isSpinning}
      aria-label={
        isSpinning
          ? "Spinning the wheel now"
          : hasSpun
          ? "Already Spun"
          : "Spin Now to Win Offers"
      }
    >
      <div className="btn-glow-effect" />
      <div className="btn-content-inner">
        {isSpinning ? (
          <>
            <Loader2 className="btn-spinner-icon" size={22} />
            <span>SPINNING...</span>
          </>
        ) : hasSpun ? (
          <>
            <Sparkles size={22} />
            <span>VIEW YOUR COUPON →</span>
          </>
        ) : (
          <>
            <Sparkles className="btn-sparkle-left" size={20} />
            <span>SPIN NOW</span>
            <ArrowRight className="btn-arrow-right" size={20} />
          </>
        )}
      </div>
    </button>
  );
}
