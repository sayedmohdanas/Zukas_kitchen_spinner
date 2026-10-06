import { config } from "../config/config.js";

/**
 * Generates a wa.me URL with a pre-filled, URL-encoded message for Zukas Kitchen WhatsApp ordering.
 * 
 * @param {object|string|null} prize 
 * @param {string|null} couponCode 
 * @param {string|null} userName 
 * @returns {string}
 */
export const getWhatsAppOrderLink = (prize = null, couponCode = null, userName = null) => {
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

  if (isWinning && finalOfferText && couponCode) {
    messageText = `${greeting}\n\nI have an active Spin & Win offer 🎉\n\nOffer: ${finalOfferText}\nCoupon Code: ${couponCode}\n\nI'd like to place an order.`;
  } else {
    messageText = `${greeting}\n\nI'd like to place an order.`;
  }

  const encodedMessage = encodeURIComponent(messageText);
  return `https://wa.me/${number}?text=${encodedMessage}`;
};

/**
 * Generates a WhatsApp order link for a detailed pizza order with size, price, extra cheese, delivery details, and total.
 */
export const getWhatsAppPizzaOrderLink = ({
  pizzaName,
  size,
  basePrice,
  hasExtraCheese,
  extraCheesePrice = 25,
  totalPrice,
  customerName = "",
  deliveryAddress = "",
  landmark = "",
  locationUrl = "",
}) => {
  const number = config.whatsappNumber;
  const sizeLabel = size === "small" ? "Small" : "Medium";
  const extraCheeseText = hasExtraCheese ? `Yes (+₹${extraCheesePrice})` : "No";

  let greeting = "Hi Zukas Kitchen! 🍕";
  const nameTrimmed = String(customerName || "").trim();
  if (nameTrimmed) {
    greeting = `Hi Zukas Kitchen! I'm ${nameTrimmed} 🍕`;
  }

  let deliverySection = "";
  const addressTrimmed = String(deliveryAddress || "").trim();
  const landmarkTrimmed = String(landmark || "").trim();
  const urlTrimmed = String(locationUrl || "").trim();

  if (nameTrimmed || addressTrimmed || landmarkTrimmed || urlTrimmed) {
    deliverySection = "\n\n📍 Delivery Details:";
    if (nameTrimmed) {
      deliverySection += `\nName: ${nameTrimmed}`;
    }
    if (addressTrimmed) {
      deliverySection += `\nAddress: ${addressTrimmed}`;
    }
    if (landmarkTrimmed) {
      deliverySection += `\nLandmark: ${landmarkTrimmed}`;
    }
    if (urlTrimmed) {
      deliverySection += `\nCurrent Location:\n${urlTrimmed}`;
    }
  }

  const messageText = `${greeting}\n\nI'd like to order:\n\nPizza: ${pizzaName}\nSize: ${sizeLabel}\nPizza Price: ₹${basePrice}\nExtra Cheese: ${extraCheeseText}\n\nTotal: ₹${totalPrice}${deliverySection}\n\nPlease confirm my order. Thank you!`;

  return `https://wa.me/${number}?text=${encodeURIComponent(messageText)}`;
};



