import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Copy, Check, MessageSquare, X, Gift, Frown, Sparkles, ShieldCheck, Ticket, Clock } from "lucide-react";
import InstagramIcon from "./icons/InstagramIcon";
import { config } from "../config/config";
import { trackEvent } from "../utils/analytics";
import { getWhatsAppOrderLink } from "../utils/whatsapp";
import { claimCouponService } from "../services/spinService";

export default function ResultModal({
  prize,
  couponCode,
  userName,
  spinId,
  isClaimed = false,
  claimedMobile = null,
  onClaimSuccess,
  onClose,
}) {
  const [copied, setCopied] = useState(false);
  const [copiedExisting, setCopiedExisting] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [existingCoupon, setExistingCoupon] = useState(null);
  const [localClaimed, setLocalClaimed] = useState(false);

  const effectiveIsClaimed = isClaimed || localClaimed;

  useEffect(() => {
    // Fire confetti for winning prize only
    if (prize && prize.isWinningPrize) {
      trackEvent("prize_won", { prizeId: prize.id, label: prize.label });
      try {
        const count = 200;
        const defaults = {
          origin: { y: 0.7 },
          zIndex: 9999,
        };

        function fire(particleRatio, opts) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
      } catch (e) {
        // Fallback if canvas-confetti fails
      }
    }
  }, [prize]);

  if (!prize) return null;

  const handleCopyCode = () => {
    if (couponCode) {
      trackEvent("coupon_copied", { code: couponCode });
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(couponCode).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        });
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = couponCode;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  const handleCopyExistingCode = () => {
    if (existingCoupon && existingCoupon.couponCode) {
      trackEvent("coupon_copied", { code: existingCoupon.couponCode });
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(existingCoupon.couponCode).then(() => {
          setCopiedExisting(true);
          setTimeout(() => setCopiedExisting(false), 2500);
        });
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = existingCoupon.couponCode;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopiedExisting(true);
        setTimeout(() => setCopiedExisting(false), 2500);
      }
    }
  };

  const handleClaim = async () => {
    setClaimError("");
    setIsClaiming(true);

    try {
      const res = await claimCouponService(spinId);
      if (res && res.code === "EXISTING_COUPON" && res.existingCoupon) {
        setExistingCoupon(res.existingCoupon);
      } else if (res && res.success) {
        setLocalClaimed(true);
        if (onClaimSuccess) {
          const cleanName = String(res.prizeName || prize?.label || "₹10 OFF")
            .replace(/10\s*%\s*OFF/gi, "₹10 OFF")
            .replace(/15\s*%\s*OFF/gi, "₹15 OFF")
            .replace(/%\s*OFF/gi, " OFF")
            .replace(/ON ANY ORDER/gi, "ON ANY PIZZA")
            .replace(/On Any Order/gi, "On Any Pizza")
            .replace(/On Pizza Orders/gi, "On Any Pizza");
          onClaimSuccess({
            couponCode: res.couponCode || couponCode,
            prizeName: cleanName,
          });
        }
      } else {
        setClaimError(res?.error || res?.message || "Could not claim coupon.");
      }
    } catch (err) {
      // Local fallback so user is never blocked
      setLocalClaimed(true);
      if (onClaimSuccess) {
        const cleanName = String(prize?.label || "₹10 OFF")
          .replace(/10\s*%\s*OFF/gi, "₹10 OFF")
          .replace(/15\s*%\s*OFF/gi, "₹15 OFF")
          .replace(/%\s*OFF/gi, " OFF")
          .replace(/ON ANY ORDER/gi, "ON ANY PIZZA")
          .replace(/On Any Order/gi, "On Any Pizza")
          .replace(/On Pizza Orders/gi, "On Any Pizza");
        onClaimSuccess({
          couponCode: couponCode,
          prizeName: cleanName,
        });
      }
    } finally {
      setIsClaiming(false);
    }
  };

  const handleExploreMenu = () => {
    if (!effectiveIsClaimed && onClaimSuccess) {
      const cleanName = String(prize?.label || "₹10 OFF")
        .replace(/10\s*%\s*OFF/gi, "₹10 OFF")
        .replace(/15\s*%\s*OFF/gi, "₹15 OFF")
        .replace(/%\s*OFF/gi, " OFF")
        .replace(/ON ANY ORDER/gi, "ON ANY PIZZA")
        .replace(/On Any Order/gi, "On Any Pizza")
        .replace(/On Pizza Orders/gi, "On Any Pizza");
      onClaimSuccess({
        couponCode: couponCode,
        prizeName: cleanName,
      });
      claimCouponService(spinId).catch(() => {});
    }
    trackEvent("explore_menu_clicked", { source: "result_modal" });
    onClose();
    setTimeout(() => {
      const menuEl = document.getElementById("menu");
      if (menuEl) menuEl.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleInstagramClick = () => {
    trackEvent("instagram_clicked", { source: "result_modal" });
    window.open(config.instagramUrl, "_blank");
  };

  const displayName = userName ? userName.trim() : "";

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div
        className="result-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {prize.isWinningPrize ? (
          /* WINNING MODAL CONTENT */
          <div className="modal-win-body">
            {existingCoupon ? (
              /* EXISTING COUPON RECOVERY STATE */
              <div className="existing-coupon-section">
                <div className="modal-badge-row">
                  <span className="congrats-chip" style={{ background: "rgba(255, 183, 3, 0.15)", color: "#B45309" }}>
                    <Ticket size={16} />
                    <span>ACTIVE COUPON RECOVERED</span>
                  </span>
                </div>

                <h2 id="modal-title" className="modal-headline-win" style={{ color: "#B45309" }}>
                  🎟️ YOU ALREADY HAVE A COUPON!
                </h2>

                <p className="modal-subtext" style={{ fontSize: "16px", fontWeight: "700", color: "#1E293B", marginBottom: "14px" }}>
                  Hi {existingCoupon.name || displayName || "there"}! 👋
                </p>

                {/* Prize Highlight Box for Existing Coupon */}
                <div className="prize-result-box" style={{ borderColor: "#FFB703", background: "rgba(255, 183, 3, 0.05)" }}>
                  <div className="prize-icon-bubble" style={{ backgroundColor: "#FFB703" }}>
                    <Gift size={28} color="#1E293B" />
                  </div>
                  <div className="prize-box-details">
                    <span className="prize-box-sub" style={{ textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>Your existing coupon:</span>
                    <span className="prize-box-label" style={{ fontSize: "22px" }}>{existingCoupon.prizeName}</span>
                  </div>
                </div>

                {/* Existing Coupon Code Section */}
                {existingCoupon.couponCode && (
                  <div className="coupon-code-container">
                    <span className="coupon-label-text">YOUR COUPON CODE</span>
                    <div className="coupon-code-box" style={{ borderColor: "#FFB703" }}>
                      <span className="code-text" style={{ color: "#B45309" }}>{existingCoupon.couponCode}</span>
                      <button
                        type="button"
                        className={`copy-code-btn ${copiedExisting ? "copied-state" : ""}`}
                        onClick={handleCopyExistingCode}
                        style={{ backgroundColor: "#FFB703", color: "#1E293B" }}
                      >
                        {copiedExisting ? (
                          <>
                            <Check size={16} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            <span>COPY CODE</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <p className="coupon-disclaimer" style={{ marginBottom: "16px", textAlign: "center", fontWeight: "600" }}>
                  Explore our menu to select your pizza and use this coupon!
                </p>

                <div className="modal-cta-group">
                  <button
                    type="button"
                    className="modal-primary-order-btn"
                    onClick={handleExploreMenu}
                  >
                    <MessageSquare size={20} />
                    <span>🍕 Select Pizza and Order</span>
                  </button>

                  <button
                    type="button"
                    className="modal-instagram-btn"
                    onClick={handleInstagramClick}
                  >
                    <InstagramIcon size={18} />
                    <span>FOLLOW US ON INSTAGRAM</span>
                  </button>

                  <button
                    type="button"
                    className="modal-secondary-close-btn"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>

                {existingCoupon.availableAgainFormatted && (
                  <div className="cooldown-timer-note" style={{ marginTop: "14px", fontSize: "13px", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <Clock size={14} />
                    <span>You can spin again after: <strong>{existingCoupon.availableAgainFormatted}</strong></span>
                  </div>
                )}
              </div>
            ) : (
              /* NORMAL CLAIM FLOW */
              <>
                <div className="modal-badge-row">
                  <span className="congrats-chip">
                    <Sparkles size={16} />
                    <span>OFFER UNLOCKED</span>
                  </span>
                </div>

                <h2 id="modal-title" className="modal-headline-win">
                  🎉 YOU WON {(prize.wheelLabel || prize.label).toUpperCase()}! 🎉
                </h2>
                
                {displayName && (
                  <p className="modal-subtext" style={{ fontSize: "16px", fontWeight: "700", color: "#1E293B", marginBottom: "14px" }}>
                    Hi {displayName}! 🎉
                  </p>
                )}

                {/* Prize Highlight Box */}
                <div className="prize-result-box" style={{ borderColor: prize.bgColor }}>
                  <div className="prize-icon-bubble" style={{ backgroundColor: prize.bgColor }}>
                    <Gift size={28} color={prize.textColor} />
                  </div>
                  <div className="prize-box-details">
                    <span className="prize-box-label">
                      {String(prize.label || "")
                        .replace(/10\s*%\s*OFF/gi, "₹10 OFF")
                        .replace(/15\s*%\s*OFF/gi, "₹15 OFF")
                        .replace(/%\s*OFF/gi, " OFF")
                        .replace(/ON ANY ORDER/gi, "ON ANY PIZZA")
                        .replace(/On Any Order/gi, "On Any Pizza")
                        .replace(/On Pizza Orders/gi, "On Any Pizza")}
                    </span>
                    <span className="prize-box-sub">
                      {String(prize.subLabel || "")
                        .replace(/10\s*%\s*OFF/gi, "₹10 OFF")
                        .replace(/15\s*%\s*OFF/gi, "₹15 OFF")
                        .replace(/%\s*OFF/gi, " OFF")
                        .replace(/ON ANY ORDER/gi, "ON ANY PIZZA")
                        .replace(/On Any Order/gi, "On Any Pizza")
                        .replace(/On Pizza Orders/gi, "On Any Pizza")}
                    </span>
                  </div>
                </div>

                {/* Coupon Code Section */}
                {couponCode && (
                  <div className="coupon-code-container">
                    <span className="coupon-label-text">YOUR EXCLUSIVE COUPON CODE</span>
                    <div className="coupon-code-box">
                      <span className="code-text">{couponCode}</span>
                      <button
                        type="button"
                        className={`copy-code-btn ${copied ? "copied-state" : ""}`}
                        onClick={handleCopyCode}
                      >
                        {copied ? (
                          <>
                            <Check size={16} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            <span>COPY CODE</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Claim Coupon Action / Success State */}
                {!effectiveIsClaimed ? (
                  <div className="claim-coupon-action-box">
                    <button
                      type="button"
                      className="modal-claim-coupon-btn"
                      onClick={handleClaim}
                      disabled={isClaiming}
                    >
                      <Ticket size={18} />
                      <span>{isClaiming ? "CLAIMING COUPON..." : "🎁 CLAIM COUPON"}</span>
                    </button>

                    {claimError && (
                      <div className="form-error-message" role="alert">
                        <span>⚠️ {claimError}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="coupon-claimed-success-box">
                    <div className="claimed-success-badge">
                      <ShieldCheck size={20} />
                      <span>COUPON CLAIMED SUCCESSFULLY{claimedMobile ? ` (${claimedMobile})` : ""}!</span>
                    </div>
                    <p className="coupon-disclaimer" style={{ margin: 0, textAlign: "center", marginBottom: "16px" }}>
                      Explore our menu to select your pizza and use this coupon!
                    </p>
                  </div>
                )}

                {/* CTAs */}
                <div className="modal-cta-group">
                  {effectiveIsClaimed && (
                    <button
                      type="button"
                      className="modal-primary-order-btn"
                      onClick={handleExploreMenu}
                    >
                      <MessageSquare size={20} />
                      <span>🍕 Select Pizza and Order</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="modal-instagram-btn"
                    onClick={handleInstagramClick}
                  >
                    <InstagramIcon size={18} />
                    <span>FOLLOW US ON INSTAGRAM</span>
                  </button>

                  <button
                    type="button"
                    className="modal-secondary-close-btn"
                    onClick={onClose}
                  >
                    Close & Explore Menu
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* NO WIN MODAL CONTENT */
          <div className="modal-nowin-body">
            <div className="no-win-icon-wrapper">
              <Frown size={48} className="no-win-frown" />
            </div>

            <h2 id="modal-title" className="modal-headline-nowin">
              😔 Better Luck Next Time
            </h2>
            {displayName && (
              <p className="modal-subtext" style={{ fontSize: "16px", fontWeight: "700", color: "#1E293B", marginBottom: "8px" }}>
                Hi {displayName}! 🍕
              </p>
            )}
            <p className="modal-subtext">
              Don't worry! You can still check out our delicious pizzas and order directly on WhatsApp.
            </p>

            <div className="modal-cta-group">
              <button
                type="button"
                className="modal-primary-order-btn"
                onClick={handleExploreMenu}
              >
                <MessageSquare size={20} />
                <span>🍕 Select Pizza and Order</span>
              </button>

              <button
                type="button"
                className="modal-instagram-btn"
                onClick={handleInstagramClick}
              >
                <InstagramIcon size={18} />
                <span>FOLLOW US ON INSTAGRAM</span>
              </button>

              <button
                type="button"
                className="modal-secondary-close-btn"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
