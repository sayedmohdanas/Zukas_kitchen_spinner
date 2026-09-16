import React, { useState, useEffect } from "react";
import { MessageSquare, Menu as MenuIcon, X, PhoneCall } from "lucide-react";
import InstagramIcon from "./icons/InstagramIcon";
import { config } from "../config/config";
import { trackEvent } from "../utils/analytics";
import { getWhatsAppOrderLink } from "../utils/whatsapp";
import zukasLogo from "../assets/zukasKirchenlogo.jpg";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const handleNavClick = (sectionId, label) => {
    trackEvent("nav_click", { label });
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleWhatsAppOrder = () => {
    trackEvent("order_clicked", { source: "navbar_whatsapp" });
    setMobileMenuOpen(false);
    window.open(getWhatsAppOrderLink(), "_blank");
  };

  const handleInstagramClick = () => {
    trackEvent("instagram_clicked", { source: "navbar_instagram" });
    setMobileMenuOpen(false);
    window.open(config.instagramUrl, "_blank");
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo / Emblem */}
        <a href="#hero" className="brand-logo" onClick={() => handleNavClick("hero", "Logo")}>
          <img src={zukasLogo} alt={config.brandName} className="navbar-logo-img" />
          <div className="logo-text-group">
            <span className="brand-name">{config.brandName}</span>
            <span className="brand-tagline">GOOD FOOD HAPPIER PEOPLE</span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          <button onClick={() => handleNavClick("hero", "Home")} className="nav-link">
            Home
          </button>
          <button onClick={() => handleNavClick("how-it-works", "How It Works")} className="nav-link">
            How It Works
          </button>
          <button onClick={() => handleNavClick("promo", "Offers")} className="nav-link">
            Offers
          </button>
          <button onClick={() => handleNavClick("why-zukas", "Why Us")} className="nav-link">
            Why Zukas
          </button>
          <button onClick={() => handleNavClick("footer", "Contact")} className="nav-link">
            Contact
          </button>
        </nav>

        {/* Header Actions */}
        <div className="navbar-actions">
          <button
            type="button"
            className="navbar-instagram-icon-btn"
            onClick={handleInstagramClick}
            aria-label="Follow us on Instagram"
            title="Follow us on Instagram"
          >
            <InstagramIcon size={18} />
          </button>

          <button
            type="button"
            className="navbar-order-btn"
            onClick={handleWhatsAppOrder}
            aria-label="Order on WhatsApp"
          >
            <MessageSquare size={18} />
            <span>ORDER ON WHATSAPP</span>
          </button>

          {/* Mobile Hamburger Icon */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
          >
            {mobileMenuOpen ? <X size={26} /> : <MenuIcon size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu - Rendered at root fixed level */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="brand-logo">
                <img src={zukasLogo} alt={config.brandName} className="navbar-logo-img" />
                <div className="logo-text-group">
                  <span className="brand-name">{config.brandName}</span>
                </div>
              </div>
              <button
                type="button"
                className="close-drawer-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mobile-nav-links">
              <button onClick={() => handleNavClick("hero", "Home")} className="mobile-nav-link">
                Home & Spin
              </button>
              <button onClick={() => handleNavClick("how-it-works", "How It Works")} className="mobile-nav-link">
                How It Works
              </button>
              <button onClick={() => handleNavClick("promo", "Offers")} className="mobile-nav-link">
                Offers & Menu
              </button>
              <button onClick={() => handleNavClick("why-zukas", "Why Us")} className="mobile-nav-link">
                Why Zukas Kitchen
              </button>
              <button onClick={() => handleNavClick("footer", "Contact")} className="mobile-nav-link">
                Contact & Rules
              </button>
            </div>

            <div className="mobile-drawer-footer">
              <button type="button" className="mobile-order-cta" onClick={handleWhatsAppOrder}>
                <MessageSquare size={20} />
                <span>ORDER ON WHATSAPP</span>
              </button>

              <button type="button" className="mobile-instagram-cta" onClick={handleInstagramClick}>
                <InstagramIcon size={18} />
                <span>FOLLOW ON INSTAGRAM</span>
              </button>

              <div className="mobile-contact-info">
                <PhoneCall size={14} />
                <span>{config.supportPhone}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
