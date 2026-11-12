/**
 * Offer calculation utilities for Zukas Kitchen
 * Validates requirements and computes exact discount and freebie status.
 */

export const calculateOfferDiscount = (activeOffer, items = []) => {
  if (!activeOffer || !activeOffer.couponCode) {
    return {
      applicable: false,
      discount: 0,
      isFreebie: false,
      cleanOfferName: "",
      reason: "No active offer",
    };
  }

  const cleanOfferName = String(activeOffer.prizeName || "")
    .replace(/10\s*%\s*OFF/gi, "₹10 OFF")
    .replace(/15\s*%\s*OFF/gi, "₹15 OFF")
    .replace(/%\s*OFF/gi, " OFF")
    .replace(/ON ANY ORDER/gi, "ON ANY PIZZA")
    .replace(/On Any Order/gi, "On Any Pizza")
    .replace(/On Pizza Orders/gi, "On Any Pizza");

  const safeItems = Array.isArray(items) ? items : [];
  const pizzaItems = safeItems.filter(
    (it) =>
      !it.isBurger &&
      it.category !== "burger" &&
      !String(it.name || "").toLowerCase().includes("burger")
  );

  const totalPizzaCount = pizzaItems.reduce(
    (acc, it) => acc + Math.max(1, Number(it.quantity) || 1),
    0
  );
  const mediumPizzaCount = pizzaItems
    .filter((it) => it.size === "medium")
    .reduce((acc, it) => acc + Math.max(1, Number(it.quantity) || 1), 0);

  // Offers only apply to Pizza orders
  if (totalPizzaCount === 0) {
    return {
      applicable: false,
      discount: 0,
      isFreebie: false,
      cleanOfferName,
      reason: "Coupons valid on Pizza orders only (not burger-only orders)",
      requirementNote: "Add at least 1 Pizza to use this coupon.",
    };
  }

  const nameUpper = cleanOfferName.toUpperCase();
  const prizeId = String(activeOffer.prizeId || "").toLowerCase();

  // 1. ₹25 OFF ON ORDER 2 MEDIUM (8 inch) PIZZA
  if (prizeId.includes("25-off") || nameUpper.includes("25 OFF")) {
    if (mediumPizzaCount >= 2) {
      return {
        applicable: true,
        discount: 25,
        isFreebie: false,
        cleanOfferName,
      };
    }
    return {
      applicable: false,
      discount: 0,
      isFreebie: false,
      cleanOfferName,
      reason: "Requires at least 2 Medium (8 inch) pizzas",
      requirementNote: `Requires 2 Medium pizzas (you have ${mediumPizzaCount}). Add ${
        2 - mediumPizzaCount
      } more Medium pizza to apply ₹25 OFF!`,
    };
  }

  // 2. ₹30 OFF ON ORDER 3 MEDIUM (8 inch) PIZZA
  if (prizeId.includes("30-off") || nameUpper.includes("30 OFF")) {
    if (mediumPizzaCount >= 3) {
      return {
        applicable: true,
        discount: 30,
        isFreebie: false,
        cleanOfferName,
      };
    }
    return {
      applicable: false,
      discount: 0,
      isFreebie: false,
      cleanOfferName,
      reason: "Requires at least 3 Medium (8 inch) pizzas",
      requirementNote: `Requires 3 Medium pizzas (you have ${mediumPizzaCount}). Add ${
        3 - mediumPizzaCount
      } more Medium pizza to apply ₹30 OFF!`,
    };
  }

  // 3. ₹20 OFF ON ANY MEDIUM (8 inch) PIZZA
  if (prizeId.includes("20-off") || nameUpper.includes("20 OFF")) {
    if (mediumPizzaCount >= 1) {
      return {
        applicable: true,
        discount: 20,
        isFreebie: false,
        cleanOfferName,
      };
    }
    return {
      applicable: false,
      discount: 0,
      isFreebie: false,
      cleanOfferName,
      reason: "Requires at least 1 Medium (8 inch) pizza",
      requirementNote: "Requires at least 1 Medium (8 inch) pizza.",
    };
  }

  // 4. ₹15 OFF ON ANY PIZZA
  if (prizeId.includes("15-off") || nameUpper.includes("15 OFF")) {
    if (totalPizzaCount >= 1) {
      return {
        applicable: true,
        discount: 15,
        isFreebie: false,
        cleanOfferName,
      };
    }
    return {
      applicable: false,
      discount: 0,
      isFreebie: false,
      cleanOfferName,
      requirementNote: "Add at least 1 Pizza to use this coupon.",
    };
  }

  // 5. ₹10 OFF ON ANY PIZZA
  if (prizeId.includes("10-off") || nameUpper.includes("10 OFF")) {
    if (totalPizzaCount >= 1) {
      return {
        applicable: true,
        discount: 10,
        isFreebie: false,
        cleanOfferName,
      };
    }
    return {
      applicable: false,
      discount: 0,
      isFreebie: false,
      cleanOfferName,
      requirementNote: "Add at least 1 Pizza to use this coupon.",
    };
  }

  // 6. FREE CAMPA ON ANY PIZZA
  if (prizeId.includes("campa") || nameUpper.includes("CAMPA")) {
    if (totalPizzaCount >= 1) {
      return {
        applicable: true,
        discount: 0,
        isFreebie: true,
        freebieText: "Free 200ml Campa Drink included!",
        cleanOfferName,
      };
    }
    return {
      applicable: false,
      discount: 0,
      isFreebie: true,
      cleanOfferName,
      requirementNote: "Add at least 1 Pizza to claim your Free Campa Drink.",
    };
  }

  // Generic fallback if numeric value provided on prize
  if (typeof activeOffer.prizeValue === "number" && activeOffer.prizeValue > 0) {
    if (totalPizzaCount >= 1) {
      return {
        applicable: true,
        discount: activeOffer.prizeValue,
        isFreebie: false,
        cleanOfferName,
      };
    }
  }

  return { applicable: false, discount: 0, isFreebie: false, cleanOfferName };
};
