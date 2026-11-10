import { config } from "../config/config.js";

/**
 * Generates a wa.me URL with a pre-filled, URL-encoded message for Zukas Kitchen WhatsApp ordering.
 * 
 * @param {object|string|null} prize 
 * @param {string|null} couponCode 
 * @param {string|null} userName 
 * @returns {string}
 */
export const getWhatsAppOrderLink = (prize = null, couponCode = null, userName = null, selectedPizza = null, selectedSize = null, selectedPrice = null) => {
  const number = config.whatsappNumber;

  let greeting = "Hi Zukas Kitchen! 🍕";
  if (userName && String(userName).trim().length > 0) {
    greeting = `Hi Zukas Kitchen! I'm ${String(userName).trim()} 🍕`;
  }

  let messageText = "";
  const isWinning = prize ? (typeof prize === "string" ? true : prize.isWinningPrize !== false) : false;
  const prizeLabel = typeof prize === "string" ? prize : (prize ? prize.label || prize.name : null);
  
  let finalOfferText = prizeLabel;
  if (prize && typeof prize !== "string" && prize.subLabel) {
    // Only append subLabel if it's not already part of the main label to avoid duplication
    if (prizeLabel && !prizeLabel.toLowerCase().includes(prize.subLabel.toLowerCase())) {
      finalOfferText = `${prizeLabel} (${prize.subLabel})`;
    }
  }

  let pizzaText = "";
  if (selectedPizza) {
    pizzaText = `\n\nI'd like to order:\nPizza: ${selectedPizza}`;
    if (selectedSize) {
      pizzaText += `\nSize: ${selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)}`;
    }
    if (selectedPrice) {
      pizzaText += `\nPrice: ₹${selectedPrice}`;
    }
  }

  if (isWinning && finalOfferText && couponCode) {
    messageText = `${greeting}\n\nI have an active Spin & Win offer 🎉\n\nOffer: ${finalOfferText}\nCoupon Code: ${couponCode}${pizzaText ? pizzaText : "\n\nI'd like to place an order."}`;
  } else {
    messageText = `${greeting}${pizzaText ? pizzaText : "\n\nI'd like to place an order."}`;
  }

  const encodedMessage = encodeURIComponent(messageText);
  return `https://wa.me/${number}?text=${encodedMessage}`;
};

/**
 * Generates a WhatsApp order link for single or multi-item orders (pizzas & burgers)
 * with sizes, quantities, extra cheese, delivery details, coupon offers, and total bill.
 */
export const getWhatsAppPizzaOrderLink = ({
  items = null,
  pizzaName,
  size,
  basePrice,
  hasExtraCheese,
  extraCheesePrice = 25,
  quantity = 1,
  totalPrice,
  customerName = "",
  contactNumber = "",
  deliveryAddress = "",
  landmark = "",
  locationUrl = "",
  activeOffer = null,
}) => {
  const number = config.whatsappNumber;
  const nameTrimmed = String(customerName || "").trim();

  let deliverySection = "";
  const addressTrimmed = String(deliveryAddress || "").trim();
  const contactTrimmed = String(contactNumber || "").trim();
  const landmarkTrimmed = String(landmark || "").trim();
  const urlTrimmed = String(locationUrl || "").trim();

  if (nameTrimmed || contactTrimmed || addressTrimmed || landmarkTrimmed || urlTrimmed) {
    deliverySection = "\n\n📍 Delivery Details:";
    if (nameTrimmed) deliverySection += `\nName: ${nameTrimmed}`;
    if (contactTrimmed) deliverySection += `\nContact: ${contactTrimmed}`;
    if (addressTrimmed) deliverySection += `\nAddress: ${addressTrimmed}`;
    if (landmarkTrimmed) deliverySection += `\nLandmark: ${landmarkTrimmed}`;
    if (urlTrimmed) deliverySection += `\nCurrent Location:\n${urlTrimmed}`;
  }

  // Spin promotional offers only apply to Pizza orders (Burgers are excluded)
  const hasPizzaInOrder = Array.isArray(items) && items.length > 0
    ? items.some((it) => !it.isBurger && it.category !== "burger" && !String(it.name || "").toLowerCase().includes("burger"))
    : !String(pizzaName || "").toLowerCase().includes("burger");

  let offerText = "";
  if (activeOffer && activeOffer.couponCode && hasPizzaInOrder) {
    const cleanOfferName = String(activeOffer.prizeName || "₹10 OFF")
      .replace(/10\s*%\s*OFF/gi, "₹10 OFF")
      .replace(/15\s*%\s*OFF/gi, "₹15 OFF");
    offerText = `\n\n🎉 Active Offer: ${cleanOfferName}\n🎟️ Coupon Code: ${activeOffer.couponCode}\n*(Applied on Pizza)*`;
  }

  // Multi-item formatting
  if (Array.isArray(items) && items.length > 0) {
    let hasBurger = false;
    let hasPizza = false;

    const formattedItems = items
      .map((it, idx) => {
        const isB = String(it.name || "").toLowerCase().includes("burger") || it.category === "burger";
        if (isB) hasBurger = true;
        else hasPizza = true;

        const sLabel = isB ? "Regular" : (it.size === "small" ? "Small (6 inch)" : (it.size === "medium" ? "Medium (8 inch)" : it.size));
        const safeItemQty = Math.max(1, Number(it.quantity) || 1);
        const cheeseText = it.hasExtraCheese ? `\n   🧀 Extra Cheese: Yes (+₹${extraCheesePrice * safeItemQty})` : "";
        const unitText = safeItemQty > 1 ? `₹${it.basePrice} each` : `₹${it.basePrice}`;

        if (isB) {
          return `${idx + 1}. 🍔 *${it.name}*\n   Quantity: ${safeItemQty} • ${unitText}${cheeseText}`;
        } else {
          return `${idx + 1}. 🍕 *${it.name}*\n   Size: ${sLabel}\n   Quantity: ${safeItemQty} • ${unitText}${cheeseText}`;
        }
      })
      .join("\n\n");

    const emoji = hasBurger && hasPizza ? "🍕🍔" : (hasBurger ? "🍔" : "🍕");
    const greeting = nameTrimmed
      ? `Hi Zukas Kitchen! I'm ${nameTrimmed} ${emoji}`
      : `Hi Zukas Kitchen! ${emoji}`;

    const messageText = `${greeting}\n\nI'd like to order:\n\n${formattedItems}\n\n💰 *Total Bill:* ₹${totalPrice}${deliverySection}${offerText}\n\nPlease confirm my order. Thank you!`;

    return `https://wa.me/${number}?text=${encodeURIComponent(messageText)}`;
  }

  // Single-item fallback
  const isBurger = String(pizzaName).toLowerCase().includes("burger");
  const sizeLabel = isBurger ? "Regular" : (size === "small" ? "Small" : (size === "medium" ? "Medium" : size));
  const safeQty = Math.max(1, Number(quantity) || 1);
  const extraCheeseText = hasExtraCheese
    ? (safeQty > 1 ? `Yes (+₹${extraCheesePrice * safeQty})` : `Yes (+₹${extraCheesePrice})`)
    : "No";

  let greeting = isBurger ? "Hi Zukas Kitchen! 🍔" : "Hi Zukas Kitchen! 🍕";
  if (nameTrimmed) {
    greeting = `Hi Zukas Kitchen! I'm ${nameTrimmed} ${isBurger ? "🍔" : "🍕"}`;
  }

  const qtyLine = safeQty > 1 ? `\nQuantity: ${safeQty}` : "";
  const priceLine = safeQty > 1 ? `₹${basePrice} each` : `₹${basePrice}`;

  const itemDetails = isBurger
    ? `Item: ${pizzaName}${qtyLine}\nPrice: ${priceLine}`
    : `Pizza: ${pizzaName}\nSize: ${sizeLabel}${qtyLine}\nPizza Price: ${priceLine}`;

  const messageText = `${greeting}\n\nI'd like to order:\n\n${itemDetails}\nExtra Cheese: ${extraCheeseText}\n\nTotal: ₹${totalPrice}${deliverySection}${offerText}\n\nPlease confirm my order. Thank you!`;

  return `https://wa.me/${number}?text=${encodeURIComponent(messageText)}`;
};



