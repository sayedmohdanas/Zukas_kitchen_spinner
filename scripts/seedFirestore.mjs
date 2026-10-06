import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Helper to locate Firebase service account JSON key file in root directory
const findServiceAccountKey = () => {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }

  const rootDir = process.cwd();
  const candidates = [
    path.join(rootDir, "serviceAccountKey.json"),
    path.join(rootDir, "firebase-service-account.json"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  // Look for any file matching *-service-account*.json or zukas-*.json in root
  try {
    const files = fs.readdirSync(rootDir);
    const keyFile = files.find(f => (f.includes("service-account") || f.includes("firebase-adminsdk")) && f.endsWith(".json"));
    if (keyFile) return path.join(rootDir, keyFile);
  } catch (e) {
    // Ignore read directory error
  }

  return null;
};

const serviceAccountPath = findServiceAccountKey();

if (!serviceAccountPath) {
  console.error("\n❌ Firebase Service Account JSON key missing!");
  console.error("==========================================================================");
  console.error("To seed Firestore securely using Firebase Admin SDK:");
  console.error("1. Go to Firebase Console → Project Settings → Service accounts tab");
  console.error("2. Click 'Generate new private key'");
  console.error("3. Save the downloaded JSON file as 'serviceAccountKey.json' in project root.");
  console.error("==========================================================================");
  process.exit(1);
}

console.log("🔒 Loading Firebase Admin Service Account Key from:", serviceAccountPath);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);

async function seedAdminData() {
  console.log("📌 Seeding campaign document: campaigns/spin_and_win");
  const campaignRef = db.collection("campaigns").doc("spin_and_win");
  await campaignRef.set({
    enabled: true,
    campaignName: "Spin & Win",
    spinDurationMs: 8500,
    repeatEnabled: true,
    repeatAfterDays: 2,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const seedPrizes = [
    {
      id: "25-off-2-medium-pizza",
      name: "₹25 OFF IN ORDER 2 MEDIUM PIZZA",
      weight: 10,
      enabled: true,
      couponPrefix: "ZUKAS25",
      isWinning: true,
    },
    {
      id: "10-off",
      name: "₹10 OFF",
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
      id: "15-off",
      name: "₹15 OFF",
      weight: 8,
      enabled: true,
      couponPrefix: "ZUKAS15",
      isWinning: true,
    },
    {
      id: "30-off",
      name: "₹30 OFF ON ORDER 3 ANY MEDIUM PIZZA",
      weight: 5,
      enabled: true,
      couponPrefix: "ZUKAS30",
      isWinning: true,
    },
    {
      id: "free-campa-10",
      name: "FREE CAMPA WORTH ₹10",
      weight: 60,
      enabled: true,
      couponPrefix: "ZUKASCAMPA",
      isWinning: true,
    }
  ];

  console.log(`📌 Seeding ${seedPrizes.length} prize documents in collection: prizes`);
  for (const prize of seedPrizes) {
    const { id, ...prizeData } = prize;
    const prizeRef = db.collection("prizes").doc(id);
    await prizeRef.set({
      ...prizeData,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`   ✓ Seeded prize: prizes/${id} (${prize.name} - Weight: ${prize.weight})`);
  }

  console.log("✅ Firestore database seeding via Firebase Admin SDK completed successfully!");
  process.exit(0);
}

seedAdminData().catch((err) => {
  console.error("❌ Admin Seeding Failed:", err.message);
  process.exit(1);
});
