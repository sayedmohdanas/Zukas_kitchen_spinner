import { db } from "../firebase/firebase.js";
import { doc, getDoc, collection, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import localPrizes from "../data/prizes.js";

/**
 * Default fallback prize definitions matching the approved Zukas Kitchen 6-segment configuration.
 */
export const DEFAULT_PRIZES = localPrizes;

/**
 * Default fallback campaign configuration.
 */
export const DEFAULT_CAMPAIGN_CONFIG = {
  enabled: true,
  campaignName: "Spin & Win",
  spinDurationMs: 8500,
  repeatEnabled: true,
  repeatAfterDays: 2,
};

/**
 * Fetches the Spin & Win campaign configuration document from Firestore (`campaigns/spin_and_win`).
 * Supports repeatEnabled (boolean) and repeatAfterDays (number).
 * 
 * BACKWARD COMPATIBILITY RULE:
 * If repeatEnabled is not explicitly set in Firestore, it defaults to false (fail-safe).
 * 
 * @returns {Promise<{enabled: boolean, campaignName: string, spinDurationMs: number, repeatEnabled: boolean, repeatAfterDays: number, fromFirebase: boolean}>}
 */
export const fetchCampaignConfig = async () => {
  if (!db) {
    console.warn("Firestore not initialized. Using default campaign configuration.");
    return { ...DEFAULT_CAMPAIGN_CONFIG, fromFirebase: false };
  }

  try {
    const campaignDocRef = doc(db, "campaigns", "spin_and_win");
    const campaignSnap = await getDoc(campaignDocRef);

    if (campaignSnap.exists()) {
      const data = campaignSnap.data();
      return {
        enabled: data.enabled !== false,
        campaignName: data.campaignName || "Spin & Win",
        spinDurationMs: data.spinDurationMs || 8500,
        repeatEnabled: data.repeatEnabled !== undefined ? Boolean(data.repeatEnabled) : false,
        repeatAfterDays: typeof data.repeatAfterDays === "number" ? data.repeatAfterDays : 2,
        fromFirebase: true,
      };
    } else {
      console.info("Firestore campaign/spin_and_win document not found. Using default config.");
      return { ...DEFAULT_CAMPAIGN_CONFIG, fromFirebase: false };
    }
  } catch (err) {
    console.error("Error loading campaign config from Firestore:", err);
    throw err;
  }
};

/**
 * Fetches enabled prize documents from Firestore (`prizes` collection or `campaigns/spin_and_win/prizes`).
 * Merges visual presentation tokens (colors, labels) with Firestore probabilities & rules.
 * 
 * @returns {Promise<Array<object>>} Normalized prize objects array
 */
export const fetchPrizesFromFirestore = async () => {
  if (!db) {
    console.warn("Firestore not initialized. Using local prize fallback.");
    return DEFAULT_PRIZES;
  }

  try {
    // Attempt reading from top-level 'prizes' collection
    const prizesCollectionRef = collection(db, "prizes");
    let snapshot = await getDocs(prizesCollectionRef);

    // If top-level 'prizes' collection is empty, check subcollection 'campaigns/spin_and_win/prizes'
    if (snapshot.empty) {
      const subCollectionRef = collection(db, "campaigns", "spin_and_win", "prizes");
      snapshot = await getDocs(subCollectionRef);
    }

    if (snapshot.empty) {
      console.info("Firestore DB is connected but prizes collection is empty. Auto-seeding initial campaign config and 6 prizes...");
      try {
        await seedFirestoreDefaults();
        snapshot = await getDocs(prizesCollectionRef);
      } catch (seedErr) {
        console.warn("Auto-seeding skipped or failed (check Firestore write permissions):", seedErr.message);
        return DEFAULT_PRIZES;
      }
    }

    // Map & normalize prize documents
    const fetchedPrizes = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const prizeId = docSnap.id || data.id;

      // Find matching local prize for UI metadata (colors, badges)
      const localMatch = DEFAULT_PRIZES.find((p) => p.id === prizeId) || {};

      fetchedPrizes.push({
        id: prizeId,
        label: data.name || data.label || localMatch.label || "Discount Reward",
        wheelLabel: data.wheelLabel || localMatch.wheelLabel || data.name || data.label,
        subLabel: data.subLabel || localMatch.subLabel || "",
        type: data.type || localMatch.type || (data.isWinning ? "discount" : "no_win"),
        value: data.value !== undefined ? data.value : localMatch.value,
        weight: typeof data.weight === "number" ? data.weight : (localMatch.weight || 0),
        enabled: data.enabled !== false,
        couponPrefix: data.couponPrefix !== undefined ? data.couponPrefix : (localMatch.couponPrefix || "ZUKAS"),
        isWinningPrize: data.isWinning !== undefined ? Boolean(data.isWinning) : (data.isWinningPrize !== undefined ? Boolean(data.isWinningPrize) : Boolean(localMatch.isWinningPrize)),
        bgColor: data.bgColor || localMatch.bgColor || "#198C09",
        textColor: data.textColor || localMatch.textColor || "#FFFFFF",
        badge: data.badge || localMatch.badge || "OFFER",
        accentColor: data.accentColor || localMatch.accentColor || "#FFD700",
      });
    });

    // Sort fetchedPrizes to preserve exact canonical segment order matching DEFAULT_PRIZES
    fetchedPrizes.sort((a, b) => {
      const idxA = DEFAULT_PRIZES.findIndex((p) => p.id === a.id);
      const idxB = DEFAULT_PRIZES.findIndex((p) => p.id === b.id);
      return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
    });

    return fetchedPrizes;
  } catch (err) {
    console.error("Error fetching prizes from Firestore:", err);
    throw err;
  }
};

/**
 * Utility helper to seed Firestore with the initial approved campaign and prize documents.
 * Includes repeatEnabled: true and repeatAfterDays: 2.
 */
export const seedFirestoreDefaults = async () => {
  if (!db) {
    throw new Error("Cannot seed Firestore: db instance is null.");
  }

  // 1. Seed campaign document with configurable repeat settings
  const campaignRef = doc(db, "campaigns", "spin_and_win");
  await setDoc(campaignRef, {
    enabled: true,
    campaignName: "Spin & Win",
    spinDurationMs: 8500,
    repeatEnabled: true,
    repeatAfterDays: 2,
    updatedAt: serverTimestamp(),
  });

  // 2. Seed prize documents
  const seedPrizes = [
    {
      id: "25-off-combo",
      name: "₹25 OFF ON ORDER COMBO",
      weight: 10,
      enabled: true,
      couponPrefix: "ZUKAS25",
      isWinning: true,
    },
    {
      id: "10-percent",
      name: "10% OFF",
      weight: 55,
      enabled: true,
      couponPrefix: "ZUKAS10",
      isWinning: true,
    },
    {
      id: "20-off",
      name: "₹20 OFF",
      weight: 12,
      enabled: true,
      couponPrefix: "ZUKAS20",
      isWinning: true,
    },
    {
      id: "better-luck",
      name: "BETTER LUCK NEXT TIME",
      weight: 10,
      enabled: true,
      couponPrefix: null,
      isWinning: false,
    },
    {
      id: "15-percent",
      name: "15% OFF",
      weight: 8,
      enabled: true,
      couponPrefix: "ZUKAS15",
      isWinning: true,
    },
    {
      id: "30-off",
      name: "₹30 OFF",
      weight: 5,
      enabled: true,
      couponPrefix: "ZUKAS30",
      isWinning: true,
    },
  ];

  for (const prize of seedPrizes) {
    const prizeRef = doc(db, "prizes", prize.id);
    await setDoc(prizeRef, {
      ...prize,
      updatedAt: serverTimestamp(),
    });
  }

  return true;
};
