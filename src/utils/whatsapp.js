import { config } from "../config/config";

/**
 * Generates a wa.me URL with a pre-filled, URL-encoded message for Zukas Kitchen WhatsApp ordering.
 * 
 * @param {object|null} prize 
 * @param {string|null} couponCode 
 * @param {string|null} userName 
 * @returns {string}
 */
export const getWhatsAppOrderLink = (prize = null, couponCode = null, userName = null) => {
  const number = config.whatsappNumber;

  let greeting = "Hi Zukas Kitchen! 🍕";
  if (userName && userName.trim().length > 0) {
    greeting = `Hi Zukas Kitchen! I'm ${userName.trim()} 🍕`;
  }

  let messageText = "";

  if (prize && prize.isWinningPrize && couponCode) {
    messageText = `${greeting}\n\nI won the Spin & Win offer 🎉\n\nOffer: ${prize.label}\nCoupon Code: ${couponCode}\n\nI'd like to place an order.`;
  } else {
    messageText = `${greeting}\n\nI'd like to place an order.`;
  }

  const encodedMessage = encodeURIComponent(messageText);
  return `https://wa.me/${number}?text=${encodedMessage}`;
};
