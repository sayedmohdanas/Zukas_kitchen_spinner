import { config } from "../config/config";

/**
 * Generates a wa.me URL with a pre-filled, URL-encoded message for Zukas Kitchen WhatsApp ordering.
 * 
 * @param {object|null} prize 
 * @param {string|null} couponCode 
 * @returns {string}
 */
export const getWhatsAppOrderLink = (prize = null, couponCode = null) => {
  const number = config.whatsappNumber;

  let messageText = "";

  if (prize && prize.isWinningPrize && couponCode) {
    messageText = `Hi Zukas Kitchen! 🍕\n\nI won the Spin & Win offer 🎉\n\nOffer: ${prize.label}\nCoupon Code: ${couponCode}\n\nI'd like to place an order.`;
  } else {
    messageText = `Hi Zukas Kitchen! 🍕\n\nI'd like to place an order.`;
  }

  const encodedMessage = encodeURIComponent(messageText);
  return `https://wa.me/${number}?text=${encodedMessage}`;
};
