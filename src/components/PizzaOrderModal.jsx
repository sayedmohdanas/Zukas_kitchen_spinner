import React, { useState, useEffect } from "react";
import { X, MessageSquare, Check, MapPin, Navigation, ExternalLink, AlertCircle, Trash2 } from "lucide-react";
import { getWhatsAppPizzaOrderLink } from "../utils/whatsapp";
import { trackEvent } from "../utils/analytics";

export default function PizzaOrderModal({ pizza, initialSize = "small", onClose }) {
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [hasExtraCheese, setHasExtraCheese] = useState(false);

  // Delivery details state (optional)
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationUrl, setLocationUrl] = useState("");
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [locationSuccess, setLocationSuccess] = useState(false);

  // Sync size when modal opens or initialSize changes
  useEffect(() => {
    setSelectedSize(initialSize);
  }, [initialSize]);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  if (!pizza) return null;

  const basePrice = pizza.prices[selectedSize];
  const extraCheesePrice = 25;
  const totalPrice = basePrice + (hasExtraCheese ? extraCheesePrice : 0);
  const sizeLabel = selectedSize === "small" ? "Small" : "Medium";

  // Remove / Unselect Location
  const handleRemoveLocation = () => {
    setLocationSuccess(false);
    setLocationCoords(null);
    setLocationUrl("");
    setLocationError("");
    trackEvent("location_removed", {});
  };

  // Request Browser Geolocation (Optional)
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser. You can enter address manually or proceed.");
      return;
    }

    setIsLocating(true);
    setLocationError("");
    setLocationSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const url = `https://www.google.com/maps?q=${lat},${lng}`;

        setLocationCoords({ lat, lng });
        setLocationUrl(url);
        setLocationSuccess(true);
        setIsLocating(false);
        trackEvent("location_captured", { lat, lng });
      },
      (error) => {
        setIsLocating(false);
        let errMessage = "Could not get location. You can still place your order directly!";
        if (error.code === error.PERMISSION_DENIED) {
          errMessage = "Location permission denied. You can enter address manually or proceed.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errMessage = "Location unavailable. You can enter address manually or proceed.";
        } else if (error.code === error.TIMEOUT) {
          errMessage = "Location request timed out. You can enter address manually or proceed.";
        }
        setLocationError(errMessage);
        trackEvent("location_error", { code: error.code });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleConfirmOrder = () => {
    trackEvent("order_clicked", {
      source: "pizza_order_modal",
      pizza: pizza.name,
      size: sizeLabel,
      extraCheese: hasExtraCheese,
      totalPrice,
      hasName: Boolean(customerName.trim()),
      hasAddress: Boolean(deliveryAddress.trim()),
      hasLocation: Boolean(locationUrl.trim()),
    });

    const link = getWhatsAppPizzaOrderLink({
      pizzaName: pizza.name,
      size: selectedSize,
      basePrice,
      hasExtraCheese,
      extraCheesePrice,
      totalPrice,
      customerName,
      deliveryAddress,
      landmark,
      locationUrl,
    });

    window.open(link, "_blank");
    onClose();
  };

  return (
    <div className="pizza-order-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="pizza-order-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="order-modal-header">
          <div className="modal-header-title-group">
            <span className="modal-header-badge">🍕 YOUR PIZZA ORDER</span>
            <h3>{pizza.name}</h3>
          </div>
          <button type="button" className="close-order-modal-btn" onClick={onClose} aria-label="Close modal">
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="order-modal-body">
          {/* Pizza Preview Thumbnail */}
          {pizza.image && (
            <div className="order-modal-img-container">
              <div className="order-modal-img-box">
                <img src={pizza.image} alt={pizza.name} className="order-modal-img" loading="lazy" decoding="async" />
              </div>
              <div className="order-modal-info-bar">
                <span className={`veg-tag ${pizza.isVeg ? "veg" : "non-veg"}`}>
                  <span className="dot" />
                </span>
                <span className="modal-pizza-desc">{pizza.description}</span>
              </div>
            </div>
          )}

          {/* Section 1: Select Size */}
          <div className="order-option-group">
            <label className="order-group-label">Select Size:</label>
            <div className="modal-size-grid">
              <button
                type="button"
                className={`modal-size-card ${selectedSize === "small" ? "selected" : ""}`}
                onClick={() => setSelectedSize("small")}
              >
                <div className="size-card-info">
                  <span className="size-card-name">Small</span>
                  <span className="size-card-desc">Personal Size</span>
                </div>
                <span className="size-card-price">₹{pizza.prices.small}</span>
                {selectedSize === "small" && <Check size={18} className="size-check-icon" />}
              </button>

              <button
                type="button"
                className={`modal-size-card ${selectedSize === "medium" ? "selected" : ""}`}
                onClick={() => setSelectedSize("medium")}
              >
                <div className="size-card-info">
                  <span className="size-card-name">Medium</span>
                  <span className="size-card-desc">Sharing Size</span>
                </div>
                <span className="size-card-price">₹{pizza.prices.medium}</span>
                {selectedSize === "medium" && <Check size={18} className="size-check-icon" />}
              </button>
            </div>
          </div>

          {/* Section 2: Customize Your Pizza (Extra Cheese) */}
          <div className="order-option-group">
            <label className="order-group-label">🧀 Customize Your Pizza</label>
            <div
              className={`extra-cheese-toggle-card ${hasExtraCheese ? "checked" : ""}`}
              onClick={() => setHasExtraCheese(!hasExtraCheese)}
            >
              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="extra-cheese-check"
                  checked={hasExtraCheese}
                  onChange={(e) => setHasExtraCheese(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                />
                <label htmlFor="extra-cheese-check" className="custom-checkbox-label">
                  <strong>Add Extra Cheese</strong>
                  <span className="addon-price-tag">+₹{extraCheesePrice}</span>
                </label>
              </div>
              <p className="extra-cheese-help">Loaded with extra gooey mozzarella cheese topping</p>
            </div>
          </div>

          {/* Section 3: Delivery Location & Address (Optional) */}
          <div className="order-option-group">
            <label className="order-group-label">📍 Delivery Details (Optional)</label>

            <div className="delivery-inputs-container">
              {/* Customer Name Input (Optional) */}
              <div className="input-field-group">
                <label htmlFor="customer-name-input" className="input-sublabel">
                  Your Name (optional):
                </label>
                <input
                  type="text"
                  id="customer-name-input"
                  className="modal-text-input"
                  placeholder="Enter your name..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              {/* Manual Address Input */}
              <div className="input-field-group">
                <label htmlFor="delivery-address-input" className="input-sublabel">
                  Delivery Address (optional):
                </label>
                <textarea
                  id="delivery-address-input"
                  rows={2}
                  className="modal-textarea"
                  placeholder="Enter house/flat number, street, area..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>

              {/* Landmark Input */}
              <div className="input-field-group">
                <label htmlFor="landmark-input" className="input-sublabel">
                  Nearby Landmark (optional):
                </label>
                <input
                  type="text"
                  id="landmark-input"
                  className="modal-text-input"
                  placeholder="e.g. Near main park, behind temple..."
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                />
              </div>

              {/* Single Location Toggle Button */}
              <div className="location-btn-row">
                {!locationSuccess ? (
                  <button
                    type="button"
                    className="use-location-btn"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                  >
                    <Navigation size={16} className={isLocating ? "animate-spin" : ""} />
                    <span>{isLocating ? "Fetching location..." : "📍 SHARE MY CURRENT LOCATION"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="use-location-btn remove-state"
                    onClick={handleRemoveLocation}
                  >
                    <X size={16} />
                    <span>REMOVE / UNSELECT LOCATION</span>
                  </button>
                )}
              </div>

              {/* Location Feedback State Messages */}
              {locationSuccess && locationCoords && (
                <div className="location-success-box">
                  <div className="success-header">
                    <Check size={16} />
                    <span>Location captured successfully!</span>
                  </div>
                  <a
                    href={locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="location-preview-link"
                  >
                    <span>Google Maps Link ({locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)})</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}

              {locationError && (
                <div className="location-error-box">
                  <AlertCircle size={16} />
                  <span>{locationError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Order Summary Breakdown */}
          <div className="order-summary-card">
            <h4 className="summary-title">Order Summary</h4>
            <div className="summary-row">
              <span>Pizza:</span>
              <strong>{pizza.name}</strong>
            </div>
            <div className="summary-row">
              <span>Size:</span>
              <strong>{sizeLabel}</strong>
            </div>
            <div className="summary-row">
              <span>Pizza Price:</span>
              <span>₹{basePrice}</span>
            </div>
            {hasExtraCheese ? (
              <div className="summary-row highlight-addon">
                <span>Extra Cheese:</span>
                <span className="green-text">+₹{extraCheesePrice}</span>
              </div>
            ) : (
              <div className="summary-row muted">
                <span>Extra Cheese:</span>
                <span>No</span>
              </div>
            )}

            {/* Delivery Details Summary Rows */}
            {customerName.trim() && (
              <div className="summary-row">
                <span>Name:</span>
                <span>{customerName.trim()}</span>
              </div>
            )}

            {deliveryAddress.trim() && (
              <div className="summary-row">
                <span>Address:</span>
                <span className="summary-address-text">{deliveryAddress.trim()}</span>
              </div>
            )}

            {landmark.trim() && (
              <div className="summary-row">
                <span>Landmark:</span>
                <span>{landmark.trim()}</span>
              </div>
            )}

            {locationSuccess && (
              <div className="summary-row highlight-addon">
                <span>GPS Location:</span>
                <span className="green-text">Captured ✓</span>
              </div>
            )}

            <div className="summary-divider" />
            <div className="summary-row total-row">
              <span>TOTAL:</span>
              <span className="total-amount">₹{totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="order-modal-footer">
          <button type="button" className="confirm-whatsapp-order-btn" onClick={handleConfirmOrder}>
            <MessageSquare size={20} />
            <span>CONFIRM & ORDER ON WHATSAPP • ₹{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
