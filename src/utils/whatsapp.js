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

  if (isWinning && prizeLabel && couponCode) {
    messageText = `${greeting}\n\nI have an active Spin & Win offer 🎉\n\nOffer: ${prizeLabel}\nCoupon Code: ${couponCode}\n\nI'd like to place an order.`;
  } else {
    messageText = `${greeting}\n\nI'd like to place an order.`;
  }

  const encodedMessage = encodeURIComponent(messageText);
  return `https://wa.me/${number}?text=${encodedMessage}`;
};
