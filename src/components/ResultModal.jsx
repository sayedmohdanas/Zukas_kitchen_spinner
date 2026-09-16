import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Copy, Check, MessageSquare, X, Gift, Frown, Sparkles } from "lucide-react";
import InstagramIcon from "./icons/InstagramIcon";
import { config } from "../config/config";
import { trackEvent } from "../utils/analytics";
import { getWhatsAppOrderLink } from "../utils/whatsapp";

export default function ResultModal({
  prize,
  couponCode,
  onClose,
}) {
  const [copied, setCopied] = useState(false);

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

        fire(0.25, {
          spread: 26,
          startVelocity: 55,
        });
        fire(0.2, {
          spread: 60,
        });
        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8,
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2,
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 45,
        });
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

  const handleWhatsAppOrder = () => {
    trackEvent("order_clicked", { source: "result_modal_whatsapp", prize: prize.label, couponCode });
    const link = getWhatsAppOrderLink(prize, couponCode);
    window.open(link, "_blank");
  };

  const handleInstagramClick = () => {
    trackEvent("instagram_clicked", { source: "result_modal" });
    window.open(config.instagramUrl, "_blank");
  };

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
            <div className="modal-badge-row">
              <span className="congrats-chip">
                <Sparkles size={16} />
                <span>OFFER UNLOCKED</span>
              </span>
            </div>

            <h2 id="modal-title" className="modal-headline-win">
              🎉 CONGRATULATIONS! 🎉
            </h2>
            <p className="modal-subtext">You just won an exclusive Zukas Kitchen reward!</p>

            {/* Prize Highlight Box */}
            <div className="prize-result-box" style={{ borderColor: prize.bgColor }}>
              <div className="prize-icon-bubble" style={{ backgroundColor: prize.bgColor }}>
                <Gift size={28} color={prize.textColor} />
              </div>
              <div className="prize-box-details">
                <span className="prize-box-label">{prize.label}</span>
                <span className="prize-box-sub">{prize.subLabel}</span>
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
                <p className="coupon-disclaimer">
                  Click below to order directly on WhatsApp with your coupon pre-filled!
                </p>
              </div>
            )}

            {/* CTAs */}
            <div className="modal-cta-group">
              <button
                type="button"
                className="modal-primary-order-btn"
                onClick={handleWhatsAppOrder}
              >
                <MessageSquare size={20} />
                <span>ORDER ON WHATSAPP</span>
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
                Close & Explore Menu
              </button>
            </div>
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
            <p className="modal-subtext">
              Don't worry! You can still check out our delicious pizzas and order directly on WhatsApp.
            </p>

            <div className="modal-cta-group">
              <button
                type="button"
                className="modal-primary-order-btn"
                onClick={handleWhatsAppOrder}
              >
                <MessageSquare size={20} />
                <span>ORDER ON WHATSAPP</span>
              </button>

              <button
                type="button"
                className="modal-instagram-btn"
                onClick={handleInstagramClick}
              >
                <Instagram size={18} />
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
