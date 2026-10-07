import React, { useState } from "react";
import { MessageSquare, Clock, ZoomIn, X, ShoppingBag, Sparkles } from "lucide-react";
import { pizzaMenuItems, menuHeader } from "../data/menuData";
import { getWhatsAppOrderLink } from "../utils/whatsapp";
import { trackEvent } from "../utils/analytics";
import PizzaOrderModal from "./PizzaOrderModal";

export default function MenuSection({ activeOffer }) {
  const [activeTab, setActiveTab] = useState("cards"); // "cards" | "poster"
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [orderModalData, setOrderModalData] = useState(null); // { pizza, initialSize }

  const [selectedSizeMap, setSelectedSizeMap] = useState({
    "pizza-margherita": "small",
    "pizza-cheese-corn": "small",
    "pizza-veg-pizza": "small",
    "pizza-veg-cheese-corn": "small",
    "pizza-paneer-tikka": "small",
    "pizza-chicken-tikka": "small",
  });

  const handleSizeChange = (id, size) => {
    setSelectedSizeMap((prev) => ({
      ...prev,
      [id]: size,
    }));
  };

  const handleOpenOrderModal = (pizza, size) => {
    trackEvent("open_order_modal", { pizza: pizza.name, size });
    setOrderModalData({ pizza, initialSize: size });
  };

  const handleWhatsAppGeneralOrder = () => {
    trackEvent("order_clicked", { source: "menu_section_general" });
    window.open(getWhatsAppOrderLink(), "_blank");
  };

  const handlePosterClick = () => {
    trackEvent("menu_poster_view", { action: "open_lightbox" });
    setIsPosterModalOpen(true);
  };

  return (
    <section id="menu" className="menu-section">
      <div className="section-container">
        {/* Section Title Header */}
        <div className="menu-header text-center">
          <div className="menu-badge">
            <Sparkles size={16} className="sparkle-icon" />
            <span>ZUKAS KITCHEN MENU</span>
          </div>

          <h2 className="menu-title">Our Pizza Menu</h2>
          <p className="menu-subtitle">
            From Our Kitchen to You &bull; Freshly Baked & Delivered Hot
          </p>

          <div className="menu-info-bar">
            <div className="info-chip">
              <Clock size={16} className="chip-icon" />
              <span>Opening Time: <strong>{menuHeader.openingTime}</strong></span>
            </div>
            <div className="info-chip highlight-chip">
              <span>🔥 {menuHeader.tagline}</span>
            </div>
          </div>

          {/* Tab View Selector */}
          <div className="menu-tabs-container">
            <button
              type="button"
              className={`menu-tab-btn ${activeTab === "cards" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("cards");
                trackEvent("menu_tab_change", { tab: "cards" });
              }}
            >
              🍕 Menu Items
            </button>
            <button
              type="button"
              className={`menu-tab-btn ${activeTab === "poster" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("poster");
                trackEvent("menu_tab_change", { tab: "poster" });
              }}
            >
              🖼️ Official Menu Poster
            </button>
          </div>
        </div>

        {/* Tab 1: Interactive Menu Cards */}
        {activeTab === "cards" && (
          <div className="menu-cards-grid">
            {pizzaMenuItems.map((item) => {
              const currentSize = selectedSizeMap[item.id] || "small";
              const currentPrice = item.prices[currentSize];

              return (
                <div key={item.id} className="pizza-card">
                  {item.image && (
                    <div className="pizza-card-img-wrapper" onClick={() => handleOpenOrderModal(item, currentSize)}>
                      <img src={item.image} alt={item.name} className="pizza-card-img" loading="lazy" decoding="async" />
                    </div>
                  )}

                  <div className="pizza-card-header">
                    <div className="pizza-title-row">
                      <span className={`veg-tag ${item.isVeg ? "veg" : "non-veg"}`}>
                        <span className="dot" />
                      </span>
                      <h3 className="pizza-name">{item.name}</h3>
                    </div>
                    <p className="pizza-desc">{item.description}</p>
                  </div>

                  <div className="pizza-card-body">
                    {/* Size Selection Segmented Control */}
                    <div className="size-selector-label">Select Size:</div>
                    <div className="size-picker-group">
                      <button
                        type="button"
                        className={`size-picker-btn ${currentSize === "small" ? "active" : ""}`}
                        onClick={() => {
                          handleSizeChange(item.id, "small");
                          handleOpenOrderModal(item, "small");
                        }}
                      >
                        <span className="size-label">Small (6 inch)</span>
                        <span className="size-price">₹{item.prices.small}</span>
                      </button>

                      <button
                        type="button"
                        className={`size-picker-btn ${currentSize === "medium" ? "active" : ""}`}
                        onClick={() => {
                          handleSizeChange(item.id, "medium");
                          handleOpenOrderModal(item, "medium");
                        }}
                      >
                        <span className="size-label">Medium (8 inch)</span>
                        <span className="size-price">₹{item.prices.medium}</span>
                      </button>
                    </div>

                    {/* Order Action Button - Opens Order Modal */}
                    <button
                      type="button"
                      className="pizza-order-btn"
                      onClick={() => handleOpenOrderModal(item, currentSize)}
                    >
                      <MessageSquare size={16} />
                      <span>Order {currentSize === "small" ? "Small (6 inch)" : "Medium (8 inch)"} • ₹{currentPrice}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Menu Poster View */}
        {activeTab === "poster" && (
          <div className="poster-showcase-container">
            <div className="poster-card-wrapper" onClick={handlePosterClick}>
              <div className="poster-hover-overlay">
                <ZoomIn size={32} />
                <span>Tap to View Full Screen Poster</span>
              </div>
              <img
                src={menuHeader.posterImage}
                alt="Zukas Kitchen Menu Poster"
                className="menu-poster-img"
              />
            </div>
            <div className="poster-caption">
              <span>💡 Tap the menu poster image to expand and view in full high resolution.</span>
            </div>
          </div>
        )}

        {/* WhatsApp Order Footer CTA Banner */}
        <div className="menu-whatsapp-footer-banner">
          <div className="banner-left">
            <ShoppingBag size={28} className="shopping-bag-icon" />
            <div>
              <h4>Ready to enjoy delicious pizza?</h4>
              <p>Order directly on WhatsApp for fast delivery!</p>
            </div>
          </div>
          <button
            type="button"
            className="menu-general-whatsapp-btn"
            onClick={handleWhatsAppGeneralOrder}
          >
            <MessageSquare size={20} />
            <span>ORDER ON WHATSAPP</span>
          </button>
        </div>
      </div>

      {/* Lightbox Poster Modal */}
      {isPosterModalOpen && (
        <div
          className="poster-modal-overlay"
          onClick={() => setIsPosterModalOpen(false)}
        >
          <div className="poster-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="poster-modal-header">
              <h3>Zukas Kitchen Official Menu</h3>
              <button
                type="button"
                className="close-poster-btn"
                onClick={() => setIsPosterModalOpen(false)}
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="poster-modal-body">
              <img
                src={menuHeader.posterImage}
                alt="Zukas Kitchen Full Menu Poster"
                className="modal-poster-img"
              />
            </div>

            <div className="poster-modal-footer">
              <button
                type="button"
                className="modal-whatsapp-cta"
                onClick={() => {
                  setIsPosterModalOpen(false);
                  handleWhatsAppGeneralOrder();
                }}
              >
                <MessageSquare size={20} />
                <span>ORDER NOW ON WHATSAPP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pizza Customization & Ordering Modal */}
      {orderModalData && (
        <PizzaOrderModal
          pizza={orderModalData.pizza}
          initialSize={orderModalData.initialSize}
          activeOffer={activeOffer}
          onClose={() => setOrderModalData(null)}
        />
      )}
    </section>
  );
}
