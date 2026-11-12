import React, { useState, useEffect } from "react";
import {
  X,
  MessageSquare,
  Check,
  AlertCircle,
  Plus,
  Minus,
  Navigation,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Banknote,
  QrCode,
} from "lucide-react";
import { getWhatsAppPizzaOrderLink } from "../utils/whatsapp";
import { calculateOfferDiscount } from "../utils/offers";
import { trackEvent } from "../utils/analytics";
import LocationPickerMap from "./LocationPickerMap";
import { pizzaMenuItems } from "../data/menuData";

export default function PizzaOrderModal({
  pizza,
  initialSize = "small",
  activeOffer,
  villagesList = [],
  onClose,
}) {
  // Array of items in the current order
  const [orderItems, setOrderItems] = useState([]);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Delivery details state with localStorage auto-fill
  const [customerName, setCustomerName] = useState(() => {
    try {
      return localStorage.getItem("zukas_customer_name") || "";
    } catch {
      return "";
    }
  });
  const [contactNumber, setContactNumber] = useState(() => {
    try {
      return localStorage.getItem("zukas_contact_number") || "";
    } catch {
      return "";
    }
  });
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    try {
      const saved = localStorage.getItem("zukas_delivery_address") || "";
      return saved === "[object Object]" ? "" : saved;
    } catch {
      return "";
    }
  });
  const [landmark, setLandmark] = useState(() => {
    try {
      return localStorage.getItem("zukas_landmark") || "";
    } catch {
      return "";
    }
  });
  const [isLocating, setIsLocating] = useState(false);
  const [locationUrl, setLocationUrl] = useState("");
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [locationSuccess, setLocationSuccess] = useState(false);

  // Payment Mode State
  const [paymentMethod, setPaymentMethod] = useState("cod"); // "cod" | "upi"
  const [cashChangeOption, setCashChangeOption] = useState("exact"); // "exact" | "500" | "200" | "custom"
  const [customCashChange, setCustomCashChange] = useState("");

  const extraCheesePrice = 25;

  // Sync initial pizza when modal opens
  useEffect(() => {
    if (pizza) {
      const isBurger =
        pizza.category === "burger" ||
        !pizza.prices?.medium ||
        pizza.prices?.small === pizza.prices?.medium;
      const finalSize = isBurger ? "regular" : initialSize;
      const basePrice =
        pizza.price ||
        pizza.prices?.[finalSize] ||
        pizza.prices?.regular ||
        pizza.prices?.small ||
        60;

      setOrderItems([
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          menuId: pizza.id,
          name: pizza.name,
          category: pizza.category || (isBurger ? "burger" : "pizza"),
          isBurger,
          image: pizza.image,
          isVeg: pizza.isVeg,
          description: pizza.description,
          prices: pizza.prices,
          size: finalSize,
          basePrice,
          hasExtraCheese: false,
          quantity: 1,
        },
      ]);
      setIsAddMenuOpen(false);
    }
  }, [pizza, initialSize]);

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

  // Order Calculations
  const totalItemsCount = orderItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const itemsSubtotal = orderItems.reduce((acc, it) => {
    const itemUnit = (Number(it.basePrice) || 0) + (it.hasExtraCheese ? extraCheesePrice : 0);
    return acc + itemUnit * (it.quantity || 1);
  }, 0);

  const offerEvaluation = calculateOfferDiscount(activeOffer, orderItems);
  const discountAmount = offerEvaluation.applicable ? offerEvaluation.discount : 0;
  const finalGrandTotal = Math.max(0, itemsSubtotal - discountAmount);

  // Item Action Handlers
  const handleItemQuantityChange = (itemId, delta) => {
    setOrderItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const newQty = Math.max(1, Math.min(20, (it.quantity || 1) + delta));
          return { ...it, quantity: newQty };
        }
        return it;
      })
    );
  };

  const handleItemSizeChange = (itemId, newSize) => {
    setOrderItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId && !it.isBurger) {
          const newBasePrice = it.prices?.[newSize] || it.basePrice;
          return { ...it, size: newSize, basePrice: newBasePrice };
        }
        return it;
      })
    );
  };

  const handleItemExtraCheeseToggle = (itemId) => {
    setOrderItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          return { ...it, hasExtraCheese: !it.hasExtraCheese };
        }
        return it;
      })
    );
  };

  const handleRemoveItem = (itemId) => {
    if (orderItems.length <= 1) {
      onClose();
      return;
    }
    setOrderItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const handleAddItemFromMenu = (menuItem, chosenSize = "small") => {
    const isBurger =
      menuItem.category === "burger" ||
      !menuItem.prices?.medium ||
      menuItem.prices?.small === menuItem.prices?.medium;
    const finalSize = isBurger ? "regular" : chosenSize;
    const itemPrice =
      menuItem.price ||
      menuItem.prices?.[finalSize] ||
      menuItem.prices?.regular ||
      menuItem.prices?.small ||
      60;

    // If identical item with same size exists, increment quantity
    const existingIndex = orderItems.findIndex(
      (it) => it.menuId === menuItem.id && it.size === finalSize
    );

    if (existingIndex >= 0) {
      setOrderItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex
            ? { ...it, quantity: Math.min(20, (it.quantity || 1) + 1) }
            : it
        )
      );
    } else {
      setOrderItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          menuId: menuItem.id,
          name: menuItem.name,
          category: menuItem.category || (isBurger ? "burger" : "pizza"),
          isBurger,
          image: menuItem.image,
          isVeg: menuItem.isVeg,
          description: menuItem.description,
          prices: menuItem.prices,
          size: finalSize,
          basePrice: itemPrice,
          hasExtraCheese: false,
          quantity: 1,
        },
      ]);
    }
    trackEvent("item_added_to_order", { item: menuItem.name, size: finalSize });
  };

  // Handle Dragging Marker on Interactive Map
  const handleLocationChange = (newCoords) => {
    const lat = newCoords.lat;
    const lng = newCoords.lng;
    const url = `https://www.google.com/maps?q=${lat},${lng}`;

    setLocationCoords({ lat, lng });
    setLocationUrl(url);
    setLocationSuccess(true);
    trackEvent("location_marker_dragged", { lat, lng });
  };

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

  const hasPizzaInOrder = orderItems.some(
    (it) => !it.isBurger && it.category !== "burger" && !String(it.name || "").toLowerCase().includes("burger")
  );

  const handleConfirmOrder = () => {
    try {
      if (customerName.trim()) localStorage.setItem("zukas_customer_name", customerName.trim());
      if (contactNumber.trim()) localStorage.setItem("zukas_contact_number", contactNumber.trim());
      if (deliveryAddress.trim() && deliveryAddress.trim() !== "[object Object]") {
        localStorage.setItem("zukas_delivery_address", deliveryAddress.trim());
      }
      if (landmark.trim()) localStorage.setItem("zukas_landmark", landmark.trim());
    } catch {
      // ignore
    }

    trackEvent("order_clicked", {
      source: "pizza_order_modal_multi",
      itemsCount: totalItemsCount,
      subtotal: itemsSubtotal,
      discount: discountAmount,
      totalPrice: finalGrandTotal,
      hasName: Boolean(customerName.trim()),
      hasContact: Boolean(contactNumber.trim()),
      hasAddress: Boolean(deliveryAddress.trim()),
      hasLocation: Boolean(locationUrl.trim()),
      paymentMethod,
      cashChangeOption,
    });

    const link = getWhatsAppPizzaOrderLink({
      items: orderItems,
      totalPrice: finalGrandTotal,
      customerName,
      contactNumber,
      deliveryAddress,
      landmark,
      locationUrl,
      paymentMethod,
      cashChangeOption,
      customCashChange,
      activeOffer,
    });

    window.open(link, "_blank");
    onClose();
  };

  const modalBadgeText =
    orderItems.length > 1
      ? `🛒 YOUR ORDER (${totalItemsCount} ${totalItemsCount === 1 ? "ITEM" : "ITEMS"})`
      : orderItems[0]?.isBurger
      ? "🍔 YOUR BURGER ORDER"
      : "🍕 YOUR PIZZA ORDER";

  const modalTitle =
    orderItems.length > 1
      ? `${totalItemsCount} Items Selected`
      : orderItems[0]?.name || pizza.name;

  return (
    <div className="pizza-order-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="pizza-order-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="order-modal-header">
          <div className="modal-header-title-group">
            <span className="modal-header-badge">{modalBadgeText}</span>
            <h3>{modalTitle}</h3>
          </div>
          <button type="button" className="close-order-modal-btn" onClick={onClose} aria-label="Close modal">
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="order-modal-body">
          {/* Active Offer Banner */}
          {activeOffer && activeOffer.couponCode && (
            hasPizzaInOrder ? (
              offerEvaluation.applicable ? (
                <div className="modal-active-offer-banner">
                  <Sparkles size={16} className="sparkle-gold" />
                  <span>
                    Applied Offer on Pizza: <strong>{offerEvaluation.cleanOfferName}</strong> (Code: <code>{activeOffer.couponCode}</code>) —{" "}
                    <strong style={{ color: "#198C09" }}>
                      {offerEvaluation.isFreebie ? offerEvaluation.freebieText : `Saved ₹${discountAmount}!`}
                    </strong>
                  </span>
                </div>
              ) : (
                <div className="modal-offer-excluded-banner">
                  <span>
                    ⚠️ <strong>Coupon Requirement:</strong> {offerEvaluation.requirementNote || "Valid on Pizza orders."}
                  </span>
                </div>
              )
            ) : (
              <div className="modal-offer-excluded-banner">
                <span>
                  ⚠️ <strong>Coupon not applied:</strong> Spin coupons do not work with only burger orders (valid on Pizza orders only).
                </span>
              </div>
            )
          )}

          {/* Section 1: Order Items List */}
          <div className="order-option-group">
            <div className="order-items-group-header">
              <label className="order-group-label" style={{ marginBottom: 0 }}>
                Selected Food Items ({orderItems.length}):
              </label>
              <span className="order-items-hint">Customize sizes, quantity & cheese below</span>
            </div>

            <div className="order-items-list">
              {orderItems.map((item, idx) => {
                const itemTotal = (item.basePrice + (item.hasExtraCheese ? extraCheesePrice : 0)) * (item.quantity || 1);

                return (
                  <div key={item.id} className="order-item-card">
                    <div className="order-item-card-top">
                      <div className="order-item-info">
                        <span className={`veg-tag ${item.isVeg ? "veg" : "non-veg"}`}>
                          <span className="dot" />
                        </span>
                        <div className="order-item-titles">
                          <h4 className="order-item-name">{item.name}</h4>
                          <span className="order-item-unit-price">
                            Base: ₹{item.basePrice}
                            {item.isBurger ? " (Regular)" : ` (${item.size === "small" ? "Small 6\"" : "Medium 8\""})`}
                          </span>
                        </div>
                      </div>

                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          className="order-item-remove-btn"
                          onClick={() => handleRemoveItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Size Selector for Pizzas */}
                    {!item.isBurger && item.prices && (
                      <div className="order-item-size-row">
                        <span className="size-row-label">Size:</span>
                        <div className="item-size-pill-group">
                          <button
                            type="button"
                            className={`item-size-pill ${item.size === "small" ? "active" : ""}`}
                            onClick={() => handleItemSizeChange(item.id, "small")}
                          >
                            Small (6") • ₹{item.prices?.small}
                          </button>
                          <button
                            type="button"
                            className={`item-size-pill ${item.size === "medium" ? "active" : ""}`}
                            onClick={() => handleItemSizeChange(item.id, "medium")}
                          >
                            Medium (8") • ₹{item.prices?.medium}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Extra Cheese Option */}
                    <div
                      className={`order-item-cheese-toggle ${item.hasExtraCheese ? "checked" : ""}`}
                      onClick={() => handleItemExtraCheeseToggle(item.id)}
                    >
                      <input
                        type="checkbox"
                        id={`cheese-${item.id}`}
                        checked={item.hasExtraCheese}
                        onChange={() => handleItemExtraCheeseToggle(item.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label htmlFor={`cheese-${item.id}`} className="cheese-toggle-label">
                        <span>🧀 Add Extra Cheese</span>
                        <span className="addon-tag">+₹{extraCheesePrice}</span>
                      </label>
                    </div>

                    {/* Bottom Row: Quantity Stepper & Subtotal */}
                    <div className="order-item-card-bottom">
                      <div className="item-qty-stepper">
                        <button
                          type="button"
                          className="qty-btn minus"
                          onClick={() => handleItemQuantityChange(item.id, -1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          type="button"
                          className="qty-btn plus"
                          onClick={() => handleItemQuantityChange(item.id, 1)}
                          disabled={item.quantity >= 20}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="order-item-subtotal">
                        <span className="subtotal-label">Subtotal:</span>
                        <span className="subtotal-amount">₹{itemTotal}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* + Add Another Pizza or Burger Button */}
            <div className="add-more-items-container">
              <button
                type="button"
                className={`add-more-toggle-btn ${isAddMenuOpen ? "active" : ""}`}
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              >
                <div className="add-btn-left">
                  <span className="plus-circle-badge">
                    <Plus size={16} />
                  </span>
                  <div className="add-btn-text">
                    <strong>+ Add More Items to Order</strong>
                    <span>Explore menu & combine in this single order</span>
                  </div>
                </div>
                {isAddMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {/* Expandable Quick Add Menu Tray */}
              {isAddMenuOpen && (
                <div className="quick-add-menu-tray">
                  <div className="quick-add-tray-header">
                    <span>Tap any item to add it to your order:</span>
                  </div>

                  <div className="quick-add-items-grid">
                    {pizzaMenuItems.map((menuItem) => {
                      const isItemBurger =
                        menuItem.category === "burger" ||
                        !menuItem.prices?.medium ||
                        menuItem.prices?.small === menuItem.prices?.medium;
                      const burgerPrice =
                        menuItem.price || menuItem.prices?.regular || menuItem.prices?.small || 60;

                      return (
                        <div key={menuItem.id} className="quick-add-card">
                          <div className="quick-add-card-header">
                            <span className={`veg-tag ${menuItem.isVeg ? "veg" : "non-veg"}`}>
                              <span className="dot" />
                            </span>
                            <span className="quick-add-name">{menuItem.name}</span>
                          </div>

                          <div className="quick-add-actions">
                            {isItemBurger ? (
                              <button
                                type="button"
                                className="quick-add-btn burger-add"
                                onClick={() => handleAddItemFromMenu(menuItem, "regular")}
                              >
                                <Plus size={14} />
                                <span>+ Add • ₹{burgerPrice}</span>
                              </button>
                            ) : (
                              <div className="quick-add-size-btns">
                                <button
                                  type="button"
                                  className="quick-add-btn pizza-add small"
                                  onClick={() => handleAddItemFromMenu(menuItem, "small")}
                                >
                                  <Plus size={13} />
                                  <span>Small • ₹{menuItem.prices?.small}</span>
                                </button>
                                <button
                                  type="button"
                                  className="quick-add-btn pizza-add medium"
                                  onClick={() => handleAddItemFromMenu(menuItem, "medium")}
                                >
                                  <Plus size={13} />
                                  <span>Medium • ₹{menuItem.prices?.medium}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Delivery Location & Address (Optional) */}
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

              {/* Contact Number Input (Optional) */}
              <div className="input-field-group">
                <label htmlFor="contact-number-input" className="input-sublabel">
                  Contact Number (optional):
                </label>
                <input
                  type="tel"
                  id="contact-number-input"
                  className="modal-text-input"
                  placeholder="e.g. 9876543210..."
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </div>

              {/* Delivery Address / Village / Locality Input (Optional) */}
              <div className="input-field-group">
                <label htmlFor="delivery-address-input" className="input-sublabel">
                  Delivery Address / Village (optional):
                </label>
                <input
                  type="text"
                  id="delivery-address-input"
                  list="villages-datalist"
                  className="modal-text-input"
                  placeholder="e.g. Village name, house number, area..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
                {villagesList && villagesList.length > 0 && (
                  <datalist id="villages-datalist">
                    {villagesList.map((village, idx) => {
                      const villageName = typeof village === "object" && village !== null ? (village.name || "") : String(village || "");
                      if (!villageName) return null;
                      return <option key={village?.id || idx} value={villageName} />;
                    })}
                  </datalist>
                )}
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

              {/* Location Feedback State Messages & Interactive Draggable Map */}
              {locationSuccess && locationCoords && (
                <div className="location-success-box">
                  <div className="success-header">
                    <Check size={16} />
                    <span>Location Captured! Drag pin to refine spot:</span>
                  </div>

                  {/* Interactive Draggable Google Map */}
                  <LocationPickerMap
                    coords={locationCoords}
                    onLocationChange={handleLocationChange}
                  />
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

          {/* Section 3: Payment Method Selection */}
          <div className="order-option-group payment-option-group">
            <label className="order-group-label">💳 Payment Method</label>

            <div className="payment-mode-grid">
              {/* Cash on Delivery Card */}
              <div
                className={`payment-mode-card ${paymentMethod === "cod" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("cod")}
                role="button"
                tabIndex={0}
              >
                <div className="payment-card-left">
                  <div className="payment-mode-icon-circle cash">
                    <Banknote size={20} />
                  </div>
                  <div className="payment-card-text">
                    <div className="payment-title">Cash on Delivery</div>
                    <div className="payment-desc">Pay cash when food arrives</div>
                  </div>
                </div>
                <div className={`payment-radio-circle ${paymentMethod === "cod" ? "checked" : ""}`}>
                  {paymentMethod === "cod" && <div className="radio-dot" />}
                </div>
              </div>

              {/* UPI on Delivery Card */}
              <div
                className={`payment-mode-card ${paymentMethod === "upi" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("upi")}
                role="button"
                tabIndex={0}
              >
                <div className="payment-card-left">
                  <div className="payment-mode-icon-circle upi">
                    <QrCode size={20} />
                  </div>
                  <div className="payment-card-text">
                    <div className="payment-title">UPI on Delivery</div>
                    <div className="payment-desc">Scan QR / GPay / PhonePe / Paytm</div>
                  </div>
                </div>
                <div className={`payment-radio-circle ${paymentMethod === "upi" ? "checked" : ""}`}>
                  {paymentMethod === "upi" && <div className="radio-dot" />}
                </div>
              </div>
            </div>

            {/* Cash on Delivery Change Requirement Box */}
            {paymentMethod === "cod" && (
              <div className="cash-change-container">
                <div className="cash-change-prompt">
                  <span className="cash-change-question">💵 Do you have exact cash change?</span>
                  <span className="cash-change-sub">Tells delivery boy whether to bring change note</span>
                </div>

                <div className="cash-change-pills">
                  <button
                    type="button"
                    className={`cash-pill-btn ${cashChangeOption === "exact" ? "active" : ""}`}
                    onClick={() => setCashChangeOption("exact")}
                  >
                    <span>✅ Exact Cash</span>
                  </button>

                  <button
                    type="button"
                    className={`cash-pill-btn ${cashChangeOption === "500" ? "active" : ""}`}
                    onClick={() => setCashChangeOption("500")}
                  >
                    <span>💵 Need change for ₹500</span>
                  </button>

                  <button
                    type="button"
                    className={`cash-pill-btn ${cashChangeOption === "200" ? "active" : ""}`}
                    onClick={() => setCashChangeOption("200")}
                  >
                    <span>💵 Need change for ₹200</span>
                  </button>

                  <button
                    type="button"
                    className={`cash-pill-btn ${cashChangeOption === "custom" ? "active" : ""}`}
                    onClick={() => setCashChangeOption("custom")}
                  >
                    <span>✏️ Other note</span>
                  </button>
                </div>

                {cashChangeOption === "custom" && (
                  <div className="custom-change-input-wrap">
                    <label htmlFor="custom-cash-input" className="input-sublabel">
                      Enter note amount you will give:
                    </label>
                    <div className="custom-cash-input-group">
                      <span className="currency-symbol">₹</span>
                      <input
                        type="number"
                        id="custom-cash-input"
                        className="modal-text-input custom-cash-field"
                        placeholder="e.g. 100, 50..."
                        value={customCashChange}
                        onChange={(e) => setCustomCashChange(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Change amount preview note */}
                {cashChangeOption === "500" && (
                  <div className="change-calculated-note">
                    🛵 <strong>Delivery Note:</strong> Delivery boy will bring <strong>₹{Math.max(0, 500 - finalGrandTotal)}</strong> change with him.
                  </div>
                )}
                {cashChangeOption === "200" && (
                  <div className="change-calculated-note">
                    🛵 <strong>Delivery Note:</strong> Delivery boy will bring <strong>₹{Math.max(0, 200 - finalGrandTotal)}</strong> change with him.
                  </div>
                )}
                {cashChangeOption === "custom" && Number(customCashChange) > finalGrandTotal && (
                  <div className="change-calculated-note">
                    🛵 <strong>Delivery Note:</strong> Delivery boy will bring <strong>₹{Number(customCashChange) - finalGrandTotal}</strong> change with him.
                  </div>
                )}
                {cashChangeOption === "exact" && (
                  <div className="change-calculated-note green-note">
                    ✅ <strong>Ready!</strong> Exact cash ensures faster delivery handover.
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "upi" && (
              <div className="upi-notice-box">
                <span className="upi-badge">ONLINE PAYMENT</span>
                <p>Delivery boy will bring the official <strong>Zukas Kitchen UPI QR Code</strong> for you to scan and pay on delivery (Google Pay, PhonePe, Paytm, or any UPI app).</p>
              </div>
            )}
          </div>

          {/* Section 4: Order Summary Breakdown */}
          <div className="order-summary-card">
            <h4 className="summary-title">Order Bill Summary ({totalItemsCount} items)</h4>

            <div className="summary-items-list">
              {orderItems.map((item, idx) => {
                const itemTotal = (item.basePrice + (item.hasExtraCheese ? extraCheesePrice : 0)) * (item.quantity || 1);
                return (
                  <div key={item.id} className="summary-row item-breakdown">
                    <span className="summary-item-name">
                      {idx + 1}. {item.name} {item.isBurger ? "(Regular)" : `(${item.size === "small" ? "Small" : "Medium"})`} × {item.quantity}
                      {item.hasExtraCheese && <small className="extra-cheese-subtext"> + Cheese</small>}
                    </span>
                    <span className="summary-item-price">₹{itemTotal}</span>
                  </div>
                );
              })}
            </div>

            {/* Delivery Details Summary Rows */}
            {customerName.trim() && (
              <div className="summary-row">
                <span>Name:</span>
                <span>{customerName.trim()}</span>
              </div>
            )}

            {contactNumber.trim() && (
              <div className="summary-row">
                <span>Contact:</span>
                <span>{contactNumber.trim()}</span>
              </div>
            )}

            {deliveryAddress.trim() && deliveryAddress.trim() !== "[object Object]" && (
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

            {/* Payment Mode in Summary */}
            <div className="summary-row highlight-addon">
              <span>Payment Mode:</span>
              <span className="green-text" style={{ fontWeight: 700 }}>
                {paymentMethod === "upi"
                  ? "📱 UPI on Delivery"
                  : cashChangeOption === "500"
                  ? "💵 Cash (Need ₹500 change)"
                  : cashChangeOption === "200"
                  ? "💵 Cash (Need ₹200 change)"
                  : cashChangeOption === "custom" && customCashChange
                  ? `💵 Cash (Need ₹${customCashChange} change)`
                  : "💵 Cash (Exact change)"}
              </span>
            </div>

            <div className="summary-divider" />
            {(orderItems.length > 1 || discountAmount > 0 || (offerEvaluation.isFreebie && offerEvaluation.applicable)) && (
              <>
                <div className="summary-row">
                  <span>Items Subtotal:</span>
                  <span>₹{itemsSubtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="summary-row highlight-addon">
                    <span>🎉 Offer Discount:</span>
                    <span className="green-text">-₹{discountAmount}</span>
                  </div>
                )}
                {offerEvaluation.isFreebie && offerEvaluation.applicable && (
                  <div className="summary-row highlight-addon">
                    <span>🎁 Free Reward:</span>
                    <span className="green-text">{offerEvaluation.freebieText}</span>
                  </div>
                )}
                <div className="summary-divider" />
              </>
            )}
            <div className="summary-row total-row">
              <span>GRAND TOTAL:</span>
              <span className="total-amount">₹{finalGrandTotal}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="order-modal-footer">
          <button type="button" className="confirm-whatsapp-order-btn" onClick={handleConfirmOrder}>
            <MessageSquare size={20} />
            <span>CONFIRM & ORDER {totalItemsCount} {totalItemsCount === 1 ? "ITEM" : "ITEMS"} ON WHATSAPP • ₹{finalGrandTotal}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
