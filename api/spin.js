import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin SDK safely for Vercel Serverless environment
if (getApps().length === 0) {
  let credential = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = cert(sa);
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON env var:", e);
    }
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    const formattedPrivateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formattedPrivateKey,
    });
  } else {
    // Local development fallback using local serviceAccountKey.json if present
    try {
      const keyPath = path.resolve(process.cwd(), "serviceAccountKey.json");
      if (fs.existsSync(keyPath)) {
        const sa = JSON.parse(fs.readFileSync(keyPath, "utf8"));
        credential = cert(sa);
      }
    } catch (err) {
      console.error("Local serviceAccountKey.json fallback error:", err);
    }
  }

  if (credential) {
    initializeApp({ credential });
  } else {
    initializeApp();
  }
}

const db = getFirestore();

// Server-approved 6 prizes with exact probability weights
const SERVER_PRIZES = [
  { id: "25-off-combo", label: "₹25 OFF ON ORDER COMBO", wheelLabel: "₹25 OFF", subLabel: "ON ORDER COMBO", type: "discount", value: 25, weight: 10, enabled: true, isWinningPrize: true, couponPrefix: "ZUKAS25", bgColor: "#198C09", textColor: "#FFFFFF", badge: "COMBO DEAL", accentColor: "#FFD700" },
  { id: "10-percent", label: "10% OFF", wheelLabel: "10% OFF", subLabel: "On Any Pizza", type: "discount_percentage", value: 10, weight: 55, enabled: true, isWinningPrize: true, couponPrefix: "ZUKAS10", bgColor: "#FF9F1C", textColor: "#1E293B", badge: "SAVINGS", accentColor: "#FFFFFF" },
  { id: "20-off", label: "₹20 OFF", wheelLabel: "₹20 OFF", subLabel: "Instant Savings", type: "discount", value: 20, weight: 12, enabled: true, isWinningPrize: true, couponPrefix: "ZUKAS20", bgColor: "#FFB703", textColor: "#1E293B", badge: "BONUS", accentColor: "#198C09" },
  { id: "better-luck", label: "BETTER LUCK NEXT TIME", wheelLabel: "BETTER LUCK", subLabel: "NEXT TIME", type: "no_win", value: null, weight: 10, enabled: true, isWinningPrize: false, couponPrefix: null, bgColor: "#334155", textColor: "#F8FAFC", badge: "TRY AGAIN", accentColor: "#94A3B8" },
  { id: "15-percent", label: "15% OFF", wheelLabel: "15% OFF", subLabel: "Super Saver", type: "discount_percentage", value: 15, weight: 8, enabled: true, isWinningPrize: true, couponPrefix: "ZUKAS15", bgColor: "#2A9D8F", textColor: "#FFFFFF", badge: "BIG DEAL", accentColor: "#FFD700" },
  { id: "30-off", label: "₹30 OFF", wheelLabel: "₹30 OFF", subLabel: "On 3rd order", type: "discount", value: 30, weight: 5, enabled: true, isWinningPrize: true, couponPrefix: "ZUKAS30", bgColor: "#F4A261", textColor: "#1E293B", badge: "YUMMY", accentColor: "#198C09" }
];

function normalizeMobile(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) {
    throw new Error("Please enter a valid 10-digit mobile number.");
  }
  return `+91${digits}`;
}

function generateServerCoupon(prize) {
  if (!prize || !prize.isWinningPrize || !prize.couponPrefix) return null;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prize.couponPrefix}${rand}`;
}

/**
 * Vercel Serverless Function handler for /api/spin
 */
export default async function handler(req, res) {
  // Enforce HTTP POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const { mobile } = req.body || {};
    const normalizedMobile = normalizeMobile(mobile);

    // Run within atomic Firestore transaction to prevent race conditions & double-spins
    const result = await db.runTransaction(async (transaction) => {
      // 1. Read campaigns/spin_and_win config
      const campaignRef = db.collection("campaigns").doc("spin_and_win");
      const campaignSnap = await transaction.get(campaignRef);

      let campaignConfig = {
        enabled: true,
        repeatEnabled: false,
        repeatAfterDays: 2,
      };

      if (campaignSnap.exists) {
        const data = campaignSnap.data();
        campaignConfig = {
          enabled: data.enabled !== false,
          repeatEnabled: Boolean(data.repeatEnabled),
          repeatAfterDays: typeof data.repeatAfterDays === "number" ? data.repeatAfterDays : 2,
        };
      }

      if (!campaignConfig.enabled) {
        throw new Error("Spin & Win is currently closed. Please check back soon! ❤️");
      }

      // 2. Query user's prior spins inside transaction
      const spinsRef = db.collection("spins");
      const existingSpinsQuery = spinsRef.where("mobile", "==", normalizedMobile);
      const existingSpinsSnap = await transaction.get(existingSpinsQuery);

      if (!existingSpinsSnap.empty) {
        let latestTimeMs = 0;
        existingSpinsSnap.forEach((docSnap) => {
          const d = docSnap.data();
          let ms = 0;
          if (d.createdAt && typeof d.createdAt.toMillis === "function") {
            ms = d.createdAt.toMillis();
          } else if (d.createdAt && d.createdAt.seconds) {
            ms = d.createdAt.seconds * 1000;
          } else if (typeof d.createdAt === "number") {
            ms = d.createdAt;
          } else if (d.createdAt) {
            ms = new Date(d.createdAt).getTime();
          }
          if (ms > latestTimeMs) latestTimeMs = ms;
        });

        if (!campaignConfig.repeatEnabled) {
          throw new Error("You have already used your Spin & Win chance.");
        }

        const cooldownMs = campaignConfig.repeatAfterDays * 24 * 60 * 60 * 1000;
        const nextEligibleTime = latestTimeMs + cooldownMs;
        const nowMs = Date.now();

        if (nowMs < nextEligibleTime) {
          const diffDays = Math.ceil((nextEligibleTime - nowMs) / (24 * 60 * 60 * 1000));
          const formattedDate = new Date(nextEligibleTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          const message = diffDays > 1
            ? `Your next spin is available in ${diffDays} days (on ${formattedDate}).`
            : `Your next spin is available tomorrow (on ${formattedDate}).`;

          throw new Error(message);
        }
      }

      // 3. Read active prizes from Firestore or fall back to SERVER_PRIZES
      const prizesRef = db.collection("prizes");
      const prizesSnap = await transaction.get(prizesRef);
      let activePrizes = [];

      if (!prizesSnap.empty) {
        prizesSnap.forEach((docSnap) => {
          const pData = docSnap.data();
          if (pData.enabled !== false) {
            const matchedServer = SERVER_PRIZES.find((p) => p.id === docSnap.id) || {};
            activePrizes.push({
              id: docSnap.id,
              label: pData.name || pData.label || matchedServer.label || "Discount",
              wheelLabel: pData.wheelLabel || matchedServer.wheelLabel || pData.name || pData.label,
              subLabel: pData.subLabel || matchedServer.subLabel || "",
              type: pData.type || matchedServer.type || (pData.isWinning ? "discount" : "no_win"),
              value: pData.value !== undefined ? pData.value : matchedServer.value,
              weight: typeof pData.weight === "number" ? pData.weight : (matchedServer.weight || 0),
              enabled: pData.enabled !== false,
              couponPrefix: pData.couponPrefix !== undefined ? pData.couponPrefix : matchedServer.couponPrefix,
              isWinningPrize: pData.isWinning !== undefined ? Boolean(pData.isWinning) : Boolean(matchedServer.isWinningPrize),
              bgColor: pData.bgColor || matchedServer.bgColor || "#198C09",
              textColor: pData.textColor || matchedServer.textColor || "#FFFFFF",
              badge: pData.badge || matchedServer.badge || "OFFER",
              accentColor: pData.accentColor || matchedServer.accentColor || "#FFD700",
            });
          }
        });
      }

      if (activePrizes.length === 0) {
        activePrizes = SERVER_PRIZES;
      }

      // 4. Server Weighted Prize Selection
      const totalWeight = activePrizes.reduce((sum, p) => sum + (p.weight || 0), 0);
      let rand = Math.random() * totalWeight;
      let selectedPrize = activePrizes[activePrizes.length - 1];

      for (const item of activePrizes) {
        if (rand < (item.weight || 0)) {
          selectedPrize = item;
          break;
        }
        rand -= (item.weight || 0);
      }

      let targetIndex = SERVER_PRIZES.findIndex((p) => p.id === selectedPrize.id);
      if (targetIndex === -1) targetIndex = 0;

      // 5. Server Coupon Generation
      const couponCode = generateServerCoupon(selectedPrize);

      // 6. Write new spin document in Firestore using trusted admin credentials and server timestamp
      const newSpinRef = spinsRef.doc();
      transaction.set(newSpinRef, {
        mobile: normalizedMobile,
        prizeId: selectedPrize.id,
        prizeName: selectedPrize.label || selectedPrize.name,
        couponCode,
        campaignId: "spin_and_win",
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        spinId: newSpinRef.id,
        prizeIndex: targetIndex,
        prize: selectedPrize,
        couponCode,
        timestamp: new Date().toISOString(),
      };
    });

    return res.status(200).json(result);

  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message || "An error occurred while processing your spin.",
    });
  }
}
