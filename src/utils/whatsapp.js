import { config } from "../config/config.js";
import { calculateOfferDiscount } from "./offers.js";

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
  if (finalOfferText) {
    finalOfferText = String(finalOfferText)
      .replace(/10\s*%\s*OFF/gi, "₹10 OFF")
      .replace(/15\s*%\s*OFF/gi, "₹15 OFF")
      .replace(/%\s*OFF/gi, " OFF")
      .replace(/ON ANY ORDER/gi, "ON ANY PIZZA")
      .replace(/On Any Order/gi, "On Any Pizza")
      .replace(/On Pizza Orders/gi, "On Any Pizza");
  }

  const isBurger = selectedPizza && String(selectedPizza).toLowerCase().includes("burger");
  let pizzaText = "";
  if (selectedPizza) {
    if (isBurger) {
      pizzaText = `\n\nI'd like to order:\nBurger: ${selectedPizza}`;
    } else {
      pizzaText = `\n\nI'd like to order:\nPizza: ${selectedPizza}`;
    }
    if (selectedSize) {
      pizzaText += `\nSize: ${selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)}`;
    }
    if (selectedPrice) {
      pizzaText += `\nPrice: ₹${selectedPrice}`;
    }
  }

  if (isWinning && finalOfferText && couponCode) {
    if (isBurger) {
      messageText = `${greeting}\n\nI have an active Spin & Win coupon: ${couponCode} (${finalOfferText})\n⚠️ *(Note: Coupons do not work with only burger orders. Valid on Pizza orders only.)*${pizzaText ? pizzaText : "\n\nI'd like to place an order."}`;
    } else {
      messageText = `${greeting}\n\nI have an active Spin & Win offer 🎉\n\nOffer: ${finalOfferText}\nCoupon Code: ${couponCode}${pizzaText ? pizzaText : "\n\nI'd like to place an order."}`;
    }
  } else {
    messageText = `${greeting}${pizzaText ? pizzaText : "\n\nI'd like to place an order."}`;
  }

  const encodedMessage = encodeURIComponent(messageText);
  return `https://wa.me/${number}?text=${encodedMessage}`;
};

/**
 * Generates a WhatsApp order link for single or multi-item orders (pizzas & burgers)
 * with accurate per-item calculation, quantities, extra cheese, discounts, delivery details, and total bill.
 */
export const getWhatsAppPizzaOrderLink = ({
  items = null,
  pizzaName,
  size,
  basePrice,
  hasExtraCheese,
  extraCheesePrice = 25,
  quantity = 1,
  totalPrice = null,
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
  const rawAddress = typeof deliveryAddress === "object" && deliveryAddress !== null
    ? (deliveryAddress.name || deliveryAddress.address || deliveryAddress.label || "")
    : String(deliveryAddress || "");
  const addressTrimmed = rawAddress.trim() === "[object Object]" ? "" : rawAddress.trim();
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

  // Multi-item formatting
  if (Array.isArray(items) && items.length > 0) {
    let hasBurger = false;
    let hasPizza = false;

    const formattedItems = items
      .map((it, idx) => {
        const isB = String(it.name || "").toLowerCase().includes("burger") || it.category === "burger";
        if (isB) hasBurger = true;
        else hasPizza = true;

        const sLabel = isB
          ? "Regular"
          : (it.size === "small"
              ? "Small (6 inch)"
              : (it.size === "medium" ? "Medium (8 inch)" : it.size));
        const safeItemQty = Math.max(1, Number(it.quantity) || 1);
        const itemBaseTotal = (Number(it.basePrice) || 0) * safeItemQty;
        const cheeseExtraTotal = it.hasExtraCheese ? extraCheesePrice * safeItemQty : 0;
        const itemTotal = itemBaseTotal + cheeseExtraTotal;

        const qtyPriceLine = safeItemQty > 1
          ? `Quantity: ${safeItemQty} × ₹${it.basePrice} = ₹${itemBaseTotal}`
          : `Quantity: 1 • ₹${it.basePrice}`;

        const cheeseLine = it.hasExtraCheese
          ? (safeItemQty > 1
              ? `\n   🧀 Extra Cheese: Yes (+₹${extraCheesePrice} × ${safeItemQty} = +₹${cheeseExtraTotal})`
              : `\n   🧀 Extra Cheese: Yes (+₹${extraCheesePrice})`)
          : "";

        const subtotalLine = it.hasExtraCheese
          ? `\n   💵 Item Subtotal: ₹${itemTotal}`
          : "";

        if (isB) {
          return `${idx + 1}. 🍔 *${it.name}*\n   ${qtyPriceLine}${cheeseLine}${subtotalLine}`;
        } else {
          return `${idx + 1}. 🍕 *${it.name}*\n   Size: ${sLabel}\n   ${qtyPriceLine}${cheeseLine}${subtotalLine}`;
        }
      })
      .join("\n\n");

    const emoji = hasBurger && hasPizza ? "🍕🍔" : (hasBurger ? "🍔" : "🍕");
    const greeting = nameTrimmed
      ? `Hi Zukas Kitchen! I'm ${nameTrimmed} ${emoji}`
      : `Hi Zukas Kitchen! ${emoji}`;

    // Compute exact items subtotal
    const itemsSubtotal = items.reduce((acc, it) => {
      const itemUnit = (Number(it.basePrice) || 0) + (it.hasExtraCheese ? extraCheesePrice : 0);
      return acc + itemUnit * Math.max(1, Number(it.quantity) || 1);
    }, 0);

    // Evaluate discount dynamically
    const offerEval = calculateOfferDiscount(activeOffer, items);
    const discountAmount = offerEval.applicable ? offerEval.discount : 0;
    const finalCalculatedTotal = Math.max(0, itemsSubtotal - discountAmount);

    let billBreakdown = "";
    const hasMultipleItems = items.length > 1;
    const hasCheese = items.some((it) => it.hasExtraCheese);
    const isFreebie = offerEval.isFreebie && offerEval.applicable;

    if (hasMultipleItems || hasCheese || discountAmount > 0 || isFreebie) {
      billBreakdown = `\n\n📦 *Items Subtotal:* ₹${itemsSubtotal}`;
      if (discountAmount > 0) {
        billBreakdown += `\n🎉 *Active Offer:* ${offerEval.cleanOfferName}\n🎟️ *Coupon Code:* ${activeOffer.couponCode}\n✨ *Discount Applied:* -₹${discountAmount}`;
      } else if (isFreebie) {
        billBreakdown += `\n🎉 *Active Offer:* ${offerEval.cleanOfferName}\n🎟️ *Coupon Code:* ${activeOffer.couponCode}\n🎁 *Free Reward:* ${offerEval.freebieText}`;
      } else if (activeOffer && activeOffer.couponCode) {
        billBreakdown += `\n🎟️ Coupon Code: ${activeOffer.couponCode} (${offerEval.cleanOfferName})\n⚠️ *(Note: ${offerEval.reason || "Valid on Pizza orders only"})*`;
      }
      billBreakdown += `\n💰 *Total Bill:* ₹${finalCalculatedTotal}`;
    } else {
      if (activeOffer && activeOffer.couponCode) {
        billBreakdown = `\n\n🎟️ Coupon Code: ${activeOffer.couponCode} (${offerEval.cleanOfferName})\n⚠️ *(Note: ${offerEval.reason || "Valid on Pizza orders only"})*\n💰 *Total Bill:* ₹${finalCalculatedTotal}`;
      } else {
        billBreakdown = `\n\n💰 *Total Bill:* ₹${finalCalculatedTotal}`;
      }
    }

    const messageText = `${greeting}\n\nI'd like to order:\n\n${formattedItems}${billBreakdown}${deliverySection}\n\nPlease confirm my order. Thank you!`;

    return `https://wa.me/${number}?text=${encodeURIComponent(messageText)}`;
  }

  // Single-item fallback
  const isBurger = String(pizzaName).toLowerCase().includes("burger");
  const sizeLabel = isBurger ? "Regular" : (size === "small" ? "Small (6 inch)" : (size === "medium" ? "Medium (8 inch)" : size));
  const safeQty = Math.max(1, Number(quantity) || 1);
  const baseNum = Number(basePrice) || 0;
  const itemBaseTotal = baseNum * safeQty;
  const cheeseExtraTotal = hasExtraCheese ? extraCheesePrice * safeQty : 0;
  const singleSubtotal = itemBaseTotal + cheeseExtraTotal;

  const virtualItem = {
    name: pizzaName,
    size,
    basePrice: baseNum,
    quantity: safeQty,
    hasExtraCheese: Boolean(hasExtraCheese),
    isBurger,
  };
  const offerEval = calculateOfferDiscount(activeOffer, [virtualItem]);
  const discountAmount = offerEval.applicable ? offerEval.discount : 0;
  const finalCalculatedTotal = Math.max(0, singleSubtotal - discountAmount);

  let greeting = isBurger ? "Hi Zukas Kitchen! 🍔" : "Hi Zukas Kitchen! 🍕";
  if (nameTrimmed) {
    greeting = `Hi Zukas Kitchen! I'm ${nameTrimmed} ${isBurger ? "🍔" : "🍕"}`;
  }

  const qtyPriceLine = safeQty > 1
    ? `Quantity: ${safeQty} × ₹${baseNum} = ₹${itemBaseTotal}`
    : `Quantity: 1 • ₹${baseNum}`;

  const cheeseText = hasExtraCheese
    ? (safeQty > 1
        ? `\nExtra Cheese: Yes (+₹${extraCheesePrice} × ${safeQty} = +₹${cheeseExtraTotal})`
        : `\nExtra Cheese: Yes (+₹${extraCheesePrice})`)
    : "";

  const itemDetails = isBurger
    ? `1. 🍔 *${pizzaName}*\n   ${qtyPriceLine}${cheeseText}`
    : `1. 🍕 *${pizzaName}*\n   Size: ${sizeLabel}\n   ${qtyPriceLine}${cheeseText}`;

  let billBreakdown = "";
  if (hasExtraCheese || discountAmount > 0 || offerEval.isFreebie) {
    billBreakdown = `\n\n📦 *Items Subtotal:* ₹${singleSubtotal}`;
    if (discountAmount > 0) {
      billBreakdown += `\n🎉 *Active Offer:* ${offerEval.cleanOfferName}\n🎟️ *Coupon Code:* ${activeOffer.couponCode}\n✨ *Discount Applied:* -₹${discountAmount}`;
    } else if (offerEval.isFreebie) {
      billBreakdown += `\n🎉 *Active Offer:* ${offerEval.cleanOfferName}\n🎟️ *Coupon Code:* ${activeOffer.couponCode}\n🎁 *Free Reward:* ${offerEval.freebieText}`;
    }
    billBreakdown += `\n💰 *Total Bill:* ₹${finalCalculatedTotal}`;
  } else {
    billBreakdown = `\n\n💰 *Total Bill:* ₹${finalCalculatedTotal}`;
  }

  const messageText = `${greeting}\n\nI'd like to order:\n\n${itemDetails}${billBreakdown}${deliverySection}\n\nPlease confirm my order. Thank you!`;

  return `https://wa.me/${number}?text=${encodeURIComponent(messageText)}`;
};
