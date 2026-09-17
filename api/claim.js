import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const EXPECTED_PROJECT_ID = "zukas-kitchen-spin-win";

/**
 * Safely initializes Firebase Admin SDK in Vercel Serverless runtime.
 */
function getAdminDb() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return getFirestore(existingApps[0]);
  }

  let credential = null;
  let projectId = EXPECTED_PROJECT_ID;

  const rawSa =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (rawSa) {
    try {
      let cleaned = rawSa.trim();
      if ((cleaned.startsWith("'") && cleaned.endsWith("'")) || (cleaned.startsWith('"') && cleaned.endsWith('"'))) {
        cleaned = cleaned.slice(1, -1);
      }
      const sa = JSON.parse(cleaned);
      if (sa.project_id) projectId = sa.project_id.trim();
      const clientEmail = sa.client_email ? sa.client_email.trim() : undefined;
      const privateKey = sa.private_key ? sa.private_key.replace(/\\n/g, "\n") : undefined;

      if (projectId && clientEmail && privateKey) {
        credential = cert({ projectId, clientEmail, privateKey });
      }
    } catch (e) {
      console.error("[Firebase Admin Claim] Parse error:", e.message);
    }
  }

  if (!credential && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL.trim();
      if (process.env.FIREBASE_PROJECT_ID) projectId = process.env.FIREBASE_PROJECT_ID.trim();
      credential = cert({ projectId, clientEmail, privateKey });
    } catch (e) {
      console.error("[Firebase Admin Claim] Cert error:", e.message);
    }
  }

  if (!credential) {
    try {
      const keyPath = path.resolve(process.cwd(), "serviceAccountKey.json");
      if (fs.existsSync(keyPath)) {
        const sa = JSON.parse(fs.readFileSync(keyPath, "utf8"));
        if (sa.project_id) projectId = sa.project_id.trim();
        const clientEmail = sa.client_email ? sa.client_email.trim() : undefined;
        const privateKey = sa.private_key ? sa.private_key.replace(/\\n/g, "\n") : undefined;
        if (projectId && clientEmail && privateKey) {
          credential = cert({ projectId, clientEmail, privateKey });
        }
      }
    } catch (err) {
      console.error("[Firebase Admin Claim] Local key fallback error:", err.message);
    }
  }

  if (!credential) {
    throw new Error("Server configuration error: Missing Firebase Admin credentials.");
  }

  process.env.GCLOUD_PROJECT = projectId;
  process.env.GOOGLE_CLOUD_PROJECT = projectId;
  process.env.GCP_PROJECT = projectId;

  const app = initializeApp({ credential, projectId });
  return getFirestore(app);
}

function normalizeMobile(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) {
    throw new Error("Please enter a valid 10-digit mobile number.");
  }
  return `+91${digits}`;
}

/**
 * Vercel Serverless Function handler for /api/claim
 * Attaches normalized mobile number to an existing spin record or returns existing active coupon if within cooldown.
 */
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed",
      message: "Only POST requests are permitted."
    });
  }

  try {
    const { spinId, mobile } = req.body || {};

    if (!spinId || typeof spinId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Invalid spin request. Spin ID is required.",
      });
    }

    const normalizedMobile = normalizeMobile(mobile);
    const db = getAdminDb();

    // Execute atomic transaction for coupon claim & mobile cooldown verification
    const result = await db.runTransaction(async (transaction) => {
      // 1. Read campaign config
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

      // 2. Query prior claimed spins for this mobile number
      const spinsRef = db.collection("spins");
      const existingSpinsQuery = spinsRef.where("mobile", "==", normalizedMobile);
      const existingSpinsSnap = await transaction.get(existingSpinsQuery);

      if (!existingSpinsSnap.empty) {
        let latestTimeMs = 0;
        let latestClaimedSpin = null;

        existingSpinsSnap.forEach((docSnap) => {
          // Ignore current spin if it already has this mobile
          if (docSnap.id === spinId) return;

          const d = docSnap.data();
          let ms = 0;
          const timeField = d.claimedAt || d.createdAt;
          if (timeField && typeof timeField.toMillis === "function") {
            ms = timeField.toMillis();
          } else if (timeField && timeField.seconds) {
            ms = timeField.seconds * 1000;
          } else if (typeof timeField === "number") {
            ms = timeField;
          } else if (timeField) {
            ms = new Date(timeField).getTime();
          }

          if (ms > latestTimeMs) {
            latestTimeMs = ms;
            latestClaimedSpin = {
              spinId: docSnap.id,
              ...d,
              timestampMs: ms,
            };
          }
        });

        if (latestClaimedSpin && latestTimeMs > 0) {
          const cooldownMs = (campaignConfig.repeatAfterDays || 2) * 24 * 60 * 60 * 1000;
          const nextEligibleTime = latestTimeMs + cooldownMs;
          const nowMs = Date.now();

          const isBlockedByCooldown = !campaignConfig.repeatEnabled || (nowMs < nextEligibleTime);

          if (isBlockedByCooldown) {
            const formattedDate = new Date(nextEligibleTime).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            });
            const availableAgainIso = campaignConfig.repeatEnabled ? new Date(nextEligibleTime).toISOString() : null;

            // Return existing active coupon info WITHOUT updating or claiming the new pending spin
            return {
              success: false,
              code: "EXISTING_COUPON",
              message: "You already have an active coupon!",
              existingCoupon: {
                spinId: latestClaimedSpin.spinId,
                couponCode: latestClaimedSpin.couponCode || null,
                prizeName: latestClaimedSpin.prizeName || latestClaimedSpin.prizeId || "Spin & Win Offer",
                name: latestClaimedSpin.name || null,
                claimedAt: new Date(latestTimeMs).toISOString(),
                availableAgainAt: availableAgainIso,
                availableAgainFormatted: campaignConfig.repeatEnabled ? formattedDate : null,
              },
            };
          }
        }
      }

      // 3. Read target spin document
      const spinDocRef = spinsRef.doc(spinId);
      const spinSnap = await transaction.get(spinDocRef);

      if (!spinSnap.exists) {
        throw new Error("Spin record not found. Please spin the wheel first.");
      }

      const spinData = spinSnap.data();

      // Check if spin already claimed by another mobile
      if (spinData.mobile && spinData.mobile !== normalizedMobile) {
        throw new Error("This coupon has already been claimed by a different mobile number.");
      }

      // Update spin document with mobile number and claim timestamp
      transaction.update(spinDocRef, {
        mobile: normalizedMobile,
        status: "claimed",
        claimedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        spinId: spinDocRef.id,
        mobile: normalizedMobile,
        couponCode: spinData.couponCode,
        prizeName: spinData.prizeName,
        name: spinData.name || null,
        message: "Coupon claimed successfully!",
      };
    });

    return res.status(200).json(result);

  } catch (err) {
    const errorMsg = err.message || "An error occurred while claiming your coupon.";
    return res.status(400).json({
      success: false,
      error: errorMsg,
      message: errorMsg,
    });
  }
}
