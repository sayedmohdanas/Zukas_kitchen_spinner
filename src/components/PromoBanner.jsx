import React from "react";
import { Flame, Star, MessageSquare, Heart } from "lucide-react";
import InstagramIcon from "./icons/InstagramIcon";
import { config } from "../config/config";
import { trackEvent } from "../utils/analytics";
import { getWhatsAppOrderLink } from "../utils/whatsapp";

export default function PromoBanner() {
  const handleWhatsAppOrder = () => {
    trackEvent("order_clicked", { source: "promo_banner_whatsapp" });
    window.open(getWhatsAppOrderLink(), "_blank");
  };

  const handleInstagramClick = () => {
    trackEvent("instagram_clicked", { source: "promo_banner" });
    window.open(config.instagramUrl, "_blank");
  };

  return (
    <section id="promo" className="promo-banner-section">
      <div className="section-container">
        <div className="promo-card">
          <div className="promo-card-glow" />

          <div className="promo-content-grid">
            {/* Left Content */}
            <div className="promo-text-column">
              <div className="promo-tag">
                <Flame size={16} className="flame-icon" />
                <span>FRESHLY BAKED PERFECTION</span>
              </div>

              <h2 className="promo-title">
                Good Food Is Always a Good Idea <Heart size={28} className="heart-inline-icon" />
              </h2>

              <p className="promo-subtitle">
                Fresh ingredients. Delicious flavors. Made with love. Every pizza at Zukas Kitchen is hand-crafted with premium cheese, secret spices, and hot-from-the-oven goodness.
              </p>

              <div className="promo-highlights">
                <div className="highlight-pill">
                  <Star size={16} fill="#FFD700" color="#FFD700" />
                  <span>100% Mozzarella Cheese</span>
                </div>
                <div className="highlight-pill">
                  <Star size={16} fill="#FFD700" color="#FFD700" />
                  <span>Hand-tossed Dough</span>
                </div>
                <div className="highlight-pill">
                  <Star size={16} fill="#FFD700" color="#FFD700" />
                  <span>Secret Recipe Sauce</span>
                </div>
              </div>

              <div className="promo-btn-group">
                <button
                  type="button"
                  className="promo-order-cta"
                  onClick={handleWhatsAppOrder}
                >
                  <MessageSquare size={20} />
                  <span>ORDER ON WHATSAPP</span>
                </button>

                <button
                  type="button"
                  className="promo-instagram-cta"
                  onClick={handleInstagramClick}
                >
                  <InstagramIcon size={18} />
                  <span>FOLLOW US ON INSTAGRAM</span>
                </button>
              </div>
            </div>

            {/* Right Food Showcase Illustration Card */}
            <div className="promo-image-column">
              <div className="pizza-visual-card">
                <div className="pizza-illustration-badge">HOT & FRESH</div>
                <div className="pizza-graphic-wrapper">
                  <div className="pizza-disc-art">
                    <div className="crust-ring">
                      <div className="cheese-layer">
                        <div className="pepperoni-dot dot-1" />
                        <div className="pepperoni-dot dot-2" />
                        <div className="pepperoni-dot dot-3" />
                        <div className="pepperoni-dot dot-4" />
                        <div className="basil-leaf leaf-1" />
                        <div className="basil-leaf leaf-2" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pizza-card-caption">
                  <span className="caption-title">Zukas Special Artisan Pizza</span>
                  <span className="caption-desc">Loaded with cheese, herbs & fresh veggies</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
