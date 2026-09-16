import React from "react";
import { Sparkles, MessageSquare } from "lucide-react";
import InstagramIcon from "./icons/InstagramIcon";
import { config } from "../config/config";
import { trackEvent } from "../utils/analytics";
import { getWhatsAppOrderLink } from "../utils/whatsapp";

export default function FinalCTA({ onSpinClick }) {
  const handleSpinScroll = () => {
    trackEvent("spin_cta_click", { source: "final_cta" });
    if (onSpinClick) {
      onSpinClick();
    } else {
      const hero = document.getElementById("hero");
      if (hero) {
        hero.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleWhatsAppOrder = () => {
    trackEvent("order_clicked", { source: "final_cta_whatsapp" });
    window.open(getWhatsAppOrderLink(), "_blank");
  };

  const handleInstagramClick = () => {
    trackEvent("instagram_clicked", { source: "final_cta" });
    window.open(config.instagramUrl, "_blank");
  };

  return (
    <section className="final-cta-section">
      <div className="section-container">
        <div className="final-cta-box">
          <div className="cta-backdrop-glow" />

          <div className="final-cta-content text-center">
            <span className="final-badge">DON'T MISS OUT</span>
            <h2 className="final-headline">READY TO SPIN & ORDER?</h2>
            <p className="final-subhead">
              Your next delicious deal is just one spin away. Spin the wheel or order directly on WhatsApp!
            </p>

            <div className="final-btn-group">
              <button
                type="button"
                className="final-spin-btn"
                onClick={handleSpinScroll}
              >
                <Sparkles size={20} />
                <span>SPIN NOW</span>
              </button>

              <button
                type="button"
                className="final-order-btn"
                onClick={handleWhatsAppOrder}
              >
                <MessageSquare size={20} />
                <span>ORDER ON WHATSAPP</span>
              </button>

              <button
                type="button"
                className="final-instagram-btn"
                onClick={handleInstagramClick}
              >
                <InstagramIcon size={20} />
                <span>FOLLOW ON INSTAGRAM</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
