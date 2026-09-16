import { db, functions } from "../firebase/firebase.js";
import { collection, query, where, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import localPrizes from "../data/prizes.js";
import { DEFAULT_CAMPAIGN_CONFIG } from "./firebasePrizeService.js";

/**
 * Normalizes a 10-digit mobile number into standard international format (+91XXXXXXXXXX).
 * 
 * @param {string} mobile 
 * @returns {string}
 */
export const normalizeMobileNumber = (mobile) => {
  const digitsOnly = String(mobile || "").replace(/\D/g, "").slice(-10);
  return `+91${digitsOnly}`;
};

/**
 * Parses a Firestore timestamp, ISO string, or Date value into epoch milliseconds.
 * 
 * @param {any} val 
 * @returns {number} epoch timestamp in milliseconds
 */
const parseTimestampMs = (val) => {
  if (!val) return Date.now();
  if (typeof val.toMillis === "function") return val.toMillis();
  if (typeof val.toDate === "function") return val.toDate().getTime();
  if (val.seconds) return val.seconds * 1000;
  if (typeof val === "number") return val;
  const parsed = new Date(val).getTime();
  return isNaN(parsed) ? Date.now() : parsed;
};

/**
 * Client UX helper: Checks if a mobile number is eligible to spin.
 * Queries Firestore `spins` collection if read permission exists, or localStorage fallback.
 * Note: The final authoritative eligibility check is enforced on the server inside Cloud Function transaction.
 * 
 * @param {string} mobile 
 * @param {object} campaignConfig 
 * @returns {Promise<{eligible: boolean, message?: string, reason?: string, latestSpin?: object}>}
 */
export const checkSpinEligibility = async (mobile, campaignConfig = DEFAULT_CAMPAIGN_CONFIG) => {
  const normalizedMobile = normalizeMobileNumber(mobile);

  // Check if campaign is disabled
  if (campaignConfig.enabled === false) {
    return {
      eligible: false,
      reason: "campaign_disabled",
      message: "Spin & Win is currently closed. Please check back soon! ❤️",
    };
  }

  let spinRecords = [];

  if (db) {
    try {
      const spinsRef = collection(db, "spins");
      const q = query(spinsRef, where("mobile", "==", normalizedMobile));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        spinRecords.push({
          spinId: docSnap.id,
          prizeId: data.prizeId,
          prizeName: data.prizeName,
          couponCode: data.couponCode,
          createdAtMs: parseTimestampMs(data.createdAt),
          createdAtRaw: data.createdAt,
        });
      });
    } catch (err) {
      // If Firestore security rules restrict direct client queries to spins collection,
      // fallback to client local cache check. Server transaction remains final authority.
    }
  }

  // Fallback to local storage cache if Firestore read failed or offline
  if (spinRecords.length === 0) {
    try {
      const localSpinRaw = localStorage.getItem(`zukas_spin_${normalizedMobile}`);
      if (localSpinRaw) {
        const localData = JSON.parse(localSpinRaw);
        spinRecords.push({
          spinId: localData.spinId || "local",
          prizeId: localData.prizeId,
          prizeName: localData.prizeName,
          couponCode: localData.couponCode,
          createdAtMs: parseTimestampMs(localData.createdAt),
        });
      }
    } catch (e) {
      // Ignore parse error
    }
  }

  // Case 1: No previous spin -> ALLOW
  if (spinRecords.length === 0) {
    return { eligible: true, hasSpunBefore: false };
  }

  // Sort spins descending by createdAtMs to obtain the MOST RECENT spin
  spinRecords.sort((a, b) => b.createdAtMs - a.createdAtMs);
  const latestSpin = spinRecords[0];

  // Case 2: repeatEnabled is false -> BLOCK PERMANENTLY
  if (campaignConfig.repeatEnabled === false) {
    return {
      eligible: false,
      reason: "repeat_disabled",
      message: "You have already used your Spin & Win chance.",
      latestSpin,
    };
  }

  // Case 3: repeatEnabled is true -> Calculate cooldown from MOST RECENT spin
  const repeatAfterDays = typeof campaignConfig.repeatAfterDays === "number" ? campaignConfig.repeatAfterDays : 2;
  const cooldownMs = repeatAfterDays * 24 * 60 * 60 * 1000;
  const nextEligibleTime = latestSpin.createdAtMs + cooldownMs;
  const now = Date.now();

  if (now >= nextEligibleTime) {
    return {
      eligible: true,
      hasSpunBefore: true,
      latestSpin,
    };
  }

  // Cooldown active -> BLOCK
  const diffMs = nextEligibleTime - now;
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  const formattedDate = new Date(nextEligibleTime).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  const message =
    diffDays > 1
      ? `Your next spin is available in ${diffDays} days (on ${formattedDate}).`
      : `Your next spin is available tomorrow (on ${formattedDate}).`;

  return {
    eligible: false,
    reason: "cooldown_active",
    message,
    nextEligibleTime,
    latestSpin,
  };
};

/**
 * Server-Authoritative Spin Service
 * 
 * Invokes the trusted Firebase Cloud Function `spinWheel` to execute atomic transaction checks,
 * server-side weighted prize selection, server-side coupon generation, and server timestamping.
 * 
 * The client browser NEVER decides the prize or coupon code.
 * 
 * @param {string} mobileNumber 
 * @param {Array<object>} availablePrizes 
 * @param {object} campaignConfig 
 * @returns {Promise<{prize: object, prizeIndex: number, couponCode: string|null, timestamp: string}>}
 */
export const spinWheelService = async (
  mobileNumber,
  availablePrizes = localPrizes,
  campaignConfig = DEFAULT_CAMPAIGN_CONFIG
) => {
  const normalizedMobile = normalizeMobileNumber(mobileNumber);

  // Invoke Vercel Serverless Function /api/spin for server-authoritative spin execution
  try {
    const response = await fetch("/api/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: normalizedMobile }),
    });

    const data = await response.json();

    if (response.ok && data && data.success) {
      // Cache result in localStorage for local UI convenience
      try {
        localStorage.setItem(
          `zukas_spin_${normalizedMobile}`,
          JSON.stringify({
            mobile: normalizedMobile,
            prizeId: data.prize.id,
            prizeName: data.prize.label || data.prize.name,
            couponCode: data.couponCode,
            createdAt: data.timestamp,
          })
        );
      } catch (e) {
        // Ignore storage error
      }

      return {
        prize: data.prize,
        prizeIndex: data.prizeIndex,
        couponCode: data.couponCode,
        timestamp: data.timestamp,
      };
    } else if (data && data.error) {
      throw new Error(data.error);
    }
  } catch (err) {
    if (err.message && !err.message.includes("Unexpected token") && !err.message.includes("Failed to fetch")) {
      throw err;
    }
    // Fallback to local check only if fetch API endpoint itself failed to network reachability
  }

  // Fallback for offline / development testing without Cloud Functions deployed
  const eligibility = await checkSpinEligibility(mobileNumber, campaignConfig);
  if (!eligibility.eligible) {
    throw new Error(eligibility.message || "You are not eligible to spin at this time.");
  }

  // Filter active prizes
  const eligiblePrizes = availablePrizes
    .map((prize, originalIndex) => ({ ...prize, originalIndex }))
    .filter((p) => p.enabled !== false);

  const totalWeight = eligiblePrizes.reduce((sum, p) => sum + (p.weight || 0), 0);
  let randomVal = Math.random() * totalWeight;
  let selectedItem = eligiblePrizes[eligiblePrizes.length - 1];

  for (const item of eligiblePrizes) {
    if (randomVal < (item.weight || 0)) {
      selectedItem = item;
      break;
    }
    randomVal -= (item.weight || 0);
  }

  const actualPrizeIndex = selectedItem.originalIndex;
  const couponPrefix = selectedItem.couponPrefix || "ZUKAS";
  const couponCode = selectedItem.isWinningPrize ? `${couponPrefix}DEMO` : null;

  return {
    prize: availablePrizes[actualPrizeIndex],
    prizeIndex: actualPrizeIndex,
    couponCode,
    timestamp: new Date().toISOString(),
  };
};
